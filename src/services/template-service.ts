import type { MilkyClient } from '@fraqjs/fraq';

import type { ApiActionRegistry } from '../actions/api-action-registry';
import { LexiconError } from '../errors';
import type { TemplateContext } from '../models/lexicon';
import { findConditionalBlock, parseConditionalBlock } from '../parsers/conditional-template-parser';
import {
  escapeTemplateText,
  findInnermostTerm,
  parseTemplateTerm,
  unescapeTemplateText,
} from '../parsers/template-parser';
import { isEscaped } from '../parsers/template-syntax';
import { IncomingSegmentValueService } from './incoming-segment-value-service';
import type { LexiconService } from './lexicon-service';
import { LogicService } from './logic-service';
import { MessageSegmentBuildService } from './message-segment-build-service';
import { MilkyEventValueService } from './milky-event-value-service';
import { replaceVariables } from './template-variable-scope';
import { UserInputService } from './user-input-service';

export interface TemplateServiceOptions {
  maxOutputLength?: number;
  userInputService?: UserInputService;
}

type LogicMode = 'text' | 'condition';
type RequestUserInput = (prompt: string) => Promise<void>;
type ExecutableTemplateTerm = Exclude<ReturnType<typeof parseTemplateTerm>, { type: 'requestInput' }>;

export class TemplateService {
  private readonly maxOutputLength: number;
  private readonly eventValueService = new MilkyEventValueService();
  private readonly segmentValueService = new IncomingSegmentValueService();
  private readonly segmentBuildService = new MessageSegmentBuildService();
  private readonly logicService = new LogicService();
  private readonly userInputService: UserInputService;

  constructor(
    private readonly lexiconService: LexiconService,
    private readonly actionRegistry: ApiActionRegistry,
    private readonly client: MilkyClient,
    options: TemplateServiceOptions = {},
  ) {
    this.maxOutputLength = options.maxOutputLength ?? 65_536;
    this.userInputService = options.userInputService ?? new UserInputService();
  }

  async render(
    template: string,
    context: TemplateContext,
    initialVariables: ReadonlyMap<string, string> = new Map(),
    requestUserInput?: RequestUserInput,
  ): Promise<string> {
    const variables = new Map(initialVariables);
    return this.renderInternal(template, context, variables, 'text', requestUserInput);
  }

  private async renderInternal(
    template: string,
    context: TemplateContext,
    variables: Map<string, string>,
    logicMode: LogicMode,
    requestUserInput?: RequestUserInput,
  ): Promise<string> {
    let output = template;
    const seenStates = new Set<string>();

    while (true) {
      if (output.length > this.maxOutputLength) {
        throw new LexiconError(`词条解析结果超过 ${this.maxOutputLength} 个字符。`);
      }
      if (seenStates.has(output)) {
        throw new LexiconError('检测到词条循环引用。');
      }
      seenStates.add(output);

      const conditional = findConditionalBlock(output);
      if (conditional) {
        const replacement = await this.selectConditionalBranch(
          conditional.source,
          context,
          variables,
          requestUserInput,
        );
        output = `${output.slice(0, conditional.start)}${replacement}${output.slice(conditional.end + 1)}`;
        continue;
      }

      const location = findInnermostTerm(output);
      if (!location) {
        return unescapeTemplateText(output);
      }

      const term = parseTemplateTerm(location.content);
      if (term.type === 'requestInput') {
        if (logicMode === 'condition') {
          throw new LexiconError('[逻辑.请求用户输入] 不能作为逻辑条件参数。');
        }
        if (!requestUserInput) {
          throw new LexiconError('[逻辑.请求用户输入] 只能在支持回复的词条执行中使用。');
        }

        const promptEnd = findPromptEnd(output, location.start);
        const prompt = unescapeTemplateText(output.slice(0, promptEnd));
        const request = this.userInputService.request(context);
        try {
          if (prompt) {
            await requestUserInput(prompt);
          }
        } catch (error) {
          request.cancel(error);
          throw error;
        }
        const input = await request.promise;
        output = `${output.slice(promptEnd, location.start)}${escapeTemplateText(input)}${output.slice(location.end + 1)}`;
        continue;
      }
      const replacement = await this.executeTerm(term, context, variables, logicMode);
      output = `${output.slice(0, location.start)}${replacement}${output.slice(location.end + 1)}`;
    }
  }

  private async selectConditionalBranch(
    source: string,
    context: TemplateContext,
    variables: Map<string, string>,
    requestUserInput?: RequestUserInput,
  ): Promise<string> {
    for (const branch of parseConditionalBlock(source)) {
      if (!branch.condition) {
        return branch.content;
      }
      const conditionVariables = new Map(variables);
      const result = await this.renderInternal(
        branch.condition,
        context,
        conditionVariables,
        'condition',
        requestUserInput,
      );
      if (result === 'true') {
        replaceVariables(variables, conditionVariables);
        return branch.content;
      }
    }
    return '';
  }

  private async executeTerm(
    term: ExecutableTemplateTerm,
    context: TemplateContext,
    variables: Map<string, string>,
    logicMode: LogicMode,
  ): Promise<string> {
    if (term.type === 'api') {
      return this.actionRegistry.execute(term.action, term.parameters, {
        client: this.client,
        message: context,
      });
    }

    if (term.type === 'event') {
      return this.eventValueService.resolve(term.path, context);
    }

    if (term.type === 'logic') {
      return logicMode === 'condition'
        ? String(this.logicService.resolveCondition(term.operation, term.values))
        : this.logicService.resolveText(term.operation, term.values);
    }

    if (term.type === 'messageValue') {
      return this.segmentValueService.resolve(term.segmentType, term.path, context);
    }

    if (term.type === 'messageBuild') {
      return this.segmentBuildService.build(term.segmentType, term.content);
    }

    if (term.type === 'setVariable') {
      variables.set(term.name, term.value);
      return '';
    }

    if (term.type === 'getVariable') {
      const value = variables.get(term.name);
      if (value === undefined) {
        throw new LexiconError(`变量“${term.name}”尚未创建。`);
      }
      return value;
    }

    const match = this.lexiconService.matchMessage(context, term.name);
    if (!match) {
      throw new LexiconError(`词库“${term.name}”没有匹配当前消息的词条。`);
    }
    for (const [name, value] of match.questionVariables ?? []) {
      variables.set(name, value);
    }
    return match.answer;
  }
}

function findPromptEnd(template: string, requestStart: number): number {
  const openings: number[] = [];
  for (let index = 0; index < requestStart; index += 1) {
    if (isEscaped(template, index)) {
      continue;
    }
    if (template[index] === '[') {
      openings.push(index);
    } else if (template[index] === ']') {
      openings.pop();
    }
  }
  return openings[0] ?? requestStart;
}
