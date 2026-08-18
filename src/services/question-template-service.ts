import { isMilkyEventName } from '../data/milky-event-definitions';
import type { MatchMode, TemplateContext } from '../models/lexicon';
import {
  escapeTemplateText,
  findInnermostTerm,
  parseTemplateTerm,
  unescapeTemplateText,
} from '../parsers/template-parser';
import { IncomingSegmentValueService } from './incoming-segment-value-service';
import { LogicService } from './logic-service';
import { MilkyEventValueService } from './milky-event-value-service';

export class QuestionTemplateService {
  private readonly eventValueService = new MilkyEventValueService();
  private readonly segmentValueService = new IncomingSegmentValueService();
  private readonly logicService = new LogicService();

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
    let output = question;
    const variables = new Map<string, string>();
    let hasMatchedEvent = false;

    while (true) {
      const location = findInnermostTerm(output);
      if (!location) {
        const renderedQuestion = unescapeTemplateText(output);
        if (renderedQuestion === '') {
          return hasMatchedEvent ? variables : undefined;
        }
        return matchesText(renderedQuestion, matchMode, context.originalText) ? variables : undefined;
      }

      const term = parseTemplateTerm(location.content);
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
            return undefined;
          }
          hasMatchedEvent = true;
          replacement = '';
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
          replacement = this.logicService.resolve(term.operation, term.values);
        } catch {
          return undefined;
        }
      } else {
        replacement = escapeTemplateText(`[${location.content}]`);
      }

      output = `${output.slice(0, location.start)}${replacement}${output.slice(location.end + 1)}`;
    }
  }
}

function hasQuestionTemplate(question: string): boolean {
  return /(^|[^\\])\[(?:event\.|消息\.取值\.|变量\.(?:创建|读取)\.|逻辑\.)/.test(question);
}

function matchesText(question: string, matchMode: MatchMode, originalText: string): boolean {
  return matchMode === 'exact' ? originalText === question : originalText.includes(question);
}
