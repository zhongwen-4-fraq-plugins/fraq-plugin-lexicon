import type { MilkyClient } from '@fraqjs/fraq';

import type { ApiActionRegistry } from '../actions/api-action-registry';
import { LexiconError, UserInputTimeoutError } from '../errors';
import { CountedLoopControlSignal } from '../models/counted-loop';
import type { TemplateContext } from '../models/lexicon';
import { findConditionalBlock, parseConditionalBlock } from '../parsers/conditional-template-parser';
import { findCountedLoopBlock } from '../parsers/counted-loop-parser';
import {
  escapeTemplateText,
  findInnermostTerm,
  parseTemplateTerm,
  unescapeTemplateText,
} from '../parsers/template-parser';
import { CountedLoopService } from './counted-loop-service';
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

type LogicMode = 'text' | 'condition' | 'loopCount';
type RequestUserInput = (prompt: string) => Promise<void>;
type ExecutableTemplateTerm = Exclude<
  ReturnType<typeof parseTemplateTerm>,
  { type: 'requestInput'; prompt: string } | { type: 'loopControl'; control: 'break' | 'continue' }
>;

export class TemplateService {
  private readonly maxOutputLength: number;
  private readonly eventValueService = new MilkyEventValueService();
  private readonly segmentValueService = new IncomingSegmentValueService();
  private readonly segmentBuildService = new MessageSegmentBuildService();
  private readonly logicService = new LogicService();
  private readonly countedLoopService: CountedLoopService;
  private readonly userInputService: UserInputService;

  constructor(
    private readonly lexiconService: LexiconService,
    private readonly actionRegistry: ApiActionRegistry,
    private readonly client: MilkyClient,
    options: TemplateServiceOptions = {},
  ) {
    this.maxOutputLength = options.maxOutputLength ?? 65_536;
    this.countedLoopService = new CountedLoopService(this.maxOutputLength);
    this.userInputService = options.userInputService ?? new UserInputService();
  }

  async render(
    template: string,
    context: TemplateContext,
    initialVariables: ReadonlyMap<string, string> = new Map(),
    requestUserInput?: RequestUserInput,
  ): Promise<string> {
    const variables = new Map(initialVariables);
    return this.renderInternal(template, context, variables, 'text', requestUserInput, 0);
  }

  private async renderInternal(
    template: string,
    context: TemplateContext,
    variables: Map<string, string>,
    logicMode: LogicMode,
    requestUserInput: RequestUserInput | undefined,
    loopDepth: number,
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
      const countedLoop = findCountedLoopBlock(output);
      const location = findInnermostTerm(output);
      const firstBlockStart = Math.min(
        conditional?.start ?? Number.POSITIVE_INFINITY,
        countedLoop?.start ?? Number.POSITIVE_INFINITY,
      );

      if (conditional && conditional.start === firstBlockStart && (!location || conditional.start <= location.start)) {
        const replacement = await this.selectConditionalBranch(
          conditional.source,
          context,
          variables,
          requestUserInput,
          loopDepth,
        );
        output = `${output.slice(0, conditional.start)}${replacement}${output.slice(conditional.end + 1)}`;
        continue;
      }

      if (countedLoop && countedLoop.start === firstBlockStart && (!location || countedLoop.start <= location.start)) {
        const replacement = await this.renderCountedLoop(
          countedLoop.countExpression,
          countedLoop.body,
          context,
          variables,
          requestUserInput,
          loopDepth,
        );
        output = `${output.slice(0, countedLoop.start)}${replacement}${output.slice(countedLoop.end + 1)}`;
        continue;
      }

      if (!location) {
        return unescapeTemplateText(output);
      }

      const term = parseTemplateTerm(location.content);
      if (term.type === 'loopControl') {
        if (logicMode !== 'text' || loopDepth === 0) {
          throw new LexiconError('[循环.退出] 和 [循环.跳过] 只能用在计次循环内容中。');
        }
        throw new CountedLoopControlSignal(term.control, unescapeTemplateText(output.slice(0, location.start)));
      }
      if (term.type === 'requestInput') {
        if (logicMode === 'condition') {
          throw new LexiconError('[逻辑.请求用户输入.<提示消息>] 不能作为逻辑条件参数。');
        }
        if (!requestUserInput) {
          throw new LexiconError('[逻辑.请求用户输入.<提示消息>] 只能在支持回复的词条执行中使用。');
        }

        const timeoutMs = term.timeoutSeconds === undefined ? undefined : Math.round(term.timeoutSeconds * 1000);
        const request = this.userInputService.request(context, timeoutMs);
        try {
          await requestUserInput(term.prompt);
        } catch (error) {
          request.cancel(error);
          throw error;
        }
        let input: string;
        try {
          input = await request.promise;
        } catch (error) {
          if (error instanceof UserInputTimeoutError) {
            await requestUserInput(term.timeoutMessage);
          }
          throw error;
        }
        output = `${output.slice(0, location.start)}${escapeTemplateText(input)}${output.slice(location.end + 1)}`;
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
    requestUserInput: RequestUserInput | undefined,
    loopDepth: number,
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
        loopDepth,
      );
      if (result === 'true') {
        replaceVariables(variables, conditionVariables);
        return branch.content;
      }
    }
    return '';
  }

  private async renderCountedLoop(
    countExpression: string,
    body: string,
    context: TemplateContext,
    variables: Map<string, string>,
    requestUserInput: RequestUserInput | undefined,
    loopDepth: number,
  ): Promise<string> {
    const renderedCount = await this.renderInternal(
      countExpression,
      context,
      variables,
      'loopCount',
      requestUserInput,
      loopDepth,
    );
    const count = this.countedLoopService.parseCount(renderedCount);
    const output = await this.countedLoopService.execute(count, () =>
      this.renderInternal(body, context, variables, 'text', requestUserInput, loopDepth + 1),
    );
    return escapeTemplateText(output);
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
