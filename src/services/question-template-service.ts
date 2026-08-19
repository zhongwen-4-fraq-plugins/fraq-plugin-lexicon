import { isMilkyEventName } from '../data/milky-event-definitions';
import { CountedLoopControlSignal } from '../models/counted-loop';
import type { MatchMode, TemplateContext } from '../models/lexicon';
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
import { LogicService } from './logic-service';
import { MilkyEventValueService } from './milky-event-value-service';
import { replaceVariables } from './template-variable-scope';

type LogicMode = 'text' | 'condition' | 'loopCount';

interface QuestionState {
  hasMatchedEvent: boolean;
}

export class QuestionTemplateService {
  private readonly eventValueService = new MilkyEventValueService();
  private readonly segmentValueService = new IncomingSegmentValueService();
  private readonly logicService = new LogicService();
  private readonly countedLoopService = new CountedLoopService();

  match(question: string, matchMode: MatchMode, context: TemplateContext): ReadonlyMap<string, string> | undefined {
    if (!hasQuestionTemplate(question)) {
      return matchesText(question, matchMode, context.originalText) ? new Map() : undefined;
    }

    try {
      return this.matchTemplate(question, matchMode, context);
    } catch {
      return undefined;
    }
  }

  private matchTemplate(
    question: string,
    matchMode: MatchMode,
    context: TemplateContext,
  ): ReadonlyMap<string, string> | undefined {
    const variables = new Map<string, string>();
    const state: QuestionState = { hasMatchedEvent: false };
    const renderedQuestion = this.renderTemplate(question, context, variables, state, 'text', 0);
    if (renderedQuestion === undefined) {
      return undefined;
    }
    if (renderedQuestion === '') {
      return state.hasMatchedEvent ? variables : undefined;
    }
    return matchesText(renderedQuestion, matchMode, context.originalText) ? variables : undefined;
  }

  private renderTemplate(
    template: string,
    context: TemplateContext,
    variables: Map<string, string>,
    state: QuestionState,
    logicMode: LogicMode,
    loopDepth: number,
  ): string | undefined {
    let output = template;

    while (true) {
      const conditional = findConditionalBlock(output);
      const countedLoop = findCountedLoopBlock(output);
      const location = findInnermostTerm(output);
      const firstBlockStart = Math.min(
        conditional?.start ?? Number.POSITIVE_INFINITY,
        countedLoop?.start ?? Number.POSITIVE_INFINITY,
      );

      if (conditional && conditional.start === firstBlockStart && (!location || conditional.start <= location.start)) {
        const replacement = this.selectConditionalBranch(conditional.source, context, variables, state, loopDepth);
        if (replacement === undefined) {
          return undefined;
        }
        output = `${output.slice(0, conditional.start)}${replacement}${output.slice(conditional.end + 1)}`;
        continue;
      }

      if (countedLoop && countedLoop.start === firstBlockStart && (!location || countedLoop.start <= location.start)) {
        const replacement = this.renderCountedLoop(
          countedLoop.countExpression,
          countedLoop.body,
          context,
          variables,
          state,
          loopDepth,
        );
        if (replacement === undefined) {
          return undefined;
        }
        output = `${output.slice(0, countedLoop.start)}${replacement}${output.slice(countedLoop.end + 1)}`;
        continue;
      }

      if (!location) {
        return unescapeTemplateText(output);
      }

      const term = parseTemplateTerm(location.content);
      if (term.type === 'loopControl') {
        if (logicMode !== 'text' || loopDepth === 0) {
          return undefined;
        }
        throw new CountedLoopControlSignal(term.control, unescapeTemplateText(output.slice(0, location.start)));
      }
      let replacement: string;

      if (term.type === 'setVariable') {
        variables.set(term.name, term.value);
        replacement = '';
      } else if (term.type === 'getVariable') {
        const value = variables.get(term.name);
        if (value === undefined) {
          return undefined;
        }
        replacement = value;
      } else if (term.type === 'event') {
        if (term.path.length === 1 && isMilkyEventName(term.path[0])) {
          if (context.eventType !== term.path[0]) {
            if (logicMode === 'condition') {
              replacement = 'false';
            } else {
              return undefined;
            }
          } else {
            state.hasMatchedEvent = true;
            replacement = logicMode === 'condition' ? 'true' : '';
          }
        } else {
          try {
            replacement = this.eventValueService.resolve(term.path, context);
          } catch {
            return undefined;
          }
        }
      } else if (term.type === 'messageValue') {
        try {
          replacement = this.segmentValueService.resolve(term.segmentType, term.path, context);
        } catch {
          return undefined;
        }
      } else if (term.type === 'logic') {
        try {
          replacement =
            logicMode === 'condition'
              ? String(this.logicService.resolveCondition(term.operation, term.values))
              : this.logicService.resolveText(term.operation, term.values);
        } catch {
          return undefined;
        }
      } else if (term.type === 'requestInput') {
        return undefined;
      } else {
        replacement = escapeTemplateText(`[${location.content}]`);
      }

      output = `${output.slice(0, location.start)}${replacement}${output.slice(location.end + 1)}`;
    }
  }

  private renderCountedLoop(
    countExpression: string,
    body: string,
    context: TemplateContext,
    variables: Map<string, string>,
    state: QuestionState,
    loopDepth: number,
  ): string | undefined {
    const renderedCount = this.renderTemplate(countExpression, context, variables, state, 'loopCount', loopDepth);
    if (renderedCount === undefined) {
      return undefined;
    }
    const count = this.countedLoopService.parseCount(renderedCount);
    const output = this.countedLoopService.executeSync(count, () =>
      this.renderTemplate(body, context, variables, state, 'text', loopDepth + 1),
    );
    return output === undefined ? undefined : escapeTemplateText(output);
  }

  private selectConditionalBranch(
    source: string,
    context: TemplateContext,
    variables: Map<string, string>,
    state: QuestionState,
    loopDepth: number,
  ): string | undefined {
    for (const branch of parseConditionalBlock(source)) {
      if (!branch.condition) {
        return branch.content;
      }
      const conditionVariables = new Map(variables);
      const conditionState = { ...state };
      const result = this.renderTemplate(
        branch.condition,
        context,
        conditionVariables,
        conditionState,
        'condition',
        loopDepth,
      );
      if (result === undefined) {
        continue;
      }
      if (result === 'true') {
        replaceVariables(variables, conditionVariables);
        state.hasMatchedEvent = conditionState.hasMatchedEvent;
        return branch.content;
      }
    }
    return '';
  }
}

function hasQuestionTemplate(question: string): boolean {
  return /(^|[^\\])\[(?:event\.|消息\.取值\.|变量\.(?:创建|读取)\.|逻辑\.)/.test(question);
}

function matchesText(question: string, matchMode: MatchMode, originalText: string): boolean {
  return matchMode === 'exact' ? originalText === question : originalText.includes(question);
}
