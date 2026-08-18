import type { MilkyClient } from '@fraqjs/fraq';

import type { ApiActionRegistry } from '../actions/api-action-registry';
import { LexiconError } from '../errors';
import type { TemplateContext } from '../models/lexicon';
import { findConditionalBlock, parseConditionalBlock } from '../parsers/conditional-template-parser';
import { findInnermostTerm, parseTemplateTerm, unescapeTemplateText } from '../parsers/template-parser';
import { IncomingSegmentValueService } from './incoming-segment-value-service';
import type { LexiconService } from './lexicon-service';
import { LogicService } from './logic-service';
import { MessageSegmentBuildService } from './message-segment-build-service';
import { MilkyEventValueService } from './milky-event-value-service';

export interface TemplateServiceOptions {
  maxOutputLength?: number;
}

type LogicMode = 'text' | 'condition';

export class TemplateService {
  private readonly maxOutputLength: number;
  private readonly eventValueService = new MilkyEventValueService();
  private readonly segmentValueService = new IncomingSegmentValueService();
  private readonly segmentBuildService = new MessageSegmentBuildService();
  private readonly logicService = new LogicService();

  constructor(
    private readonly lexiconService: LexiconService,
    private readonly actionRegistry: ApiActionRegistry,
    private readonly client: MilkyClient,
    options: TemplateServiceOptions = {},
  ) {
    this.maxOutputLength = options.maxOutputLength ?? 65_536;
  }

  async render(
    template: string,
    context: TemplateContext,
    initialVariables: ReadonlyMap<string, string> = new Map(),
  ): Promise<string> {
    const variables = new Map(initialVariables);
    return this.renderInternal(template, context, variables, 'text');
  }

  private async renderInternal(
    template: string,
    context: TemplateContext,
    variables: Map<string, string>,
    logicMode: LogicMode,
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
        const replacement = await this.selectConditionalBranch(conditional.source, context, variables);
        output = `${output.slice(0, conditional.start)}${replacement}${output.slice(conditional.end + 1)}`;
        continue;
      }

      const location = findInnermostTerm(output);
      if (!location) {
        return unescapeTemplateText(output);
      }

      const term = parseTemplateTerm(location.content);
      const replacement = await this.executeTerm(term, context, variables, logicMode);
      output = `${output.slice(0, location.start)}${replacement}${output.slice(location.end + 1)}`;
    }
  }

  private async selectConditionalBranch(
    source: string,
    context: TemplateContext,
    variables: Map<string, string>,
  ): Promise<string> {
    for (const branch of parseConditionalBlock(source)) {
      if (!branch.condition) {
        return branch.content;
      }
      const conditionVariables = new Map(variables);
      const result = await this.renderInternal(branch.condition, context, conditionVariables, 'condition');
      if (result === 'true') {
        replaceVariables(variables, conditionVariables);
        return branch.content;
      }
    }
    return '';
  }

  private async executeTerm(
    term: ReturnType<typeof parseTemplateTerm>,
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

function replaceVariables(target: Map<string, string>, source: ReadonlyMap<string, string>): void {
  target.clear();
  for (const [name, value] of source) {
    target.set(name, value);
  }
}
