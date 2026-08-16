import { isMilkyEventName } from '../data/milky-event-definitions';
import type { MatchMode, TemplateContext } from '../models/lexicon';
import {
  escapeTemplateText,
  findInnermostTerm,
  parseTemplateTerm,
  unescapeTemplateText,
} from '../parsers/template-parser';
import { MilkyEventValueService } from './milky-event-value-service';

export class QuestionTemplateService {
  private readonly eventValueService = new MilkyEventValueService();

  matches(question: string, matchMode: MatchMode, context: TemplateContext): boolean {
    if (!hasQuestionTemplate(question)) {
      return matchesText(question, matchMode, context.originalText);
    }

    try {
      return this.matchesTemplate(question, matchMode, context);
    } catch {
      return false;
    }
  }

  private matchesTemplate(question: string, matchMode: MatchMode, context: TemplateContext): boolean {
    let output = question;
    const variables = new Map<string, string>();
    let hasMatchedEvent = false;

    while (true) {
      const location = findInnermostTerm(output);
      if (!location) {
        const renderedQuestion = unescapeTemplateText(output);
        if (renderedQuestion === '') {
          return hasMatchedEvent;
        }
        return matchesText(renderedQuestion, matchMode, context.originalText);
      }

      const term = parseTemplateTerm(location.content);
      let replacement: string;

      if (term.type === 'setVariable') {
        variables.set(term.name, term.value);
        replacement = '';
      } else if (term.type === 'getVariable') {
        const value = variables.get(term.name);
        if (value === undefined) {
          return false;
        }
        replacement = value;
      } else if (term.type === 'event') {
        if (term.path.length === 1 && isMilkyEventName(term.path[0])) {
          if (context.eventType !== term.path[0]) {
            return false;
          }
          hasMatchedEvent = true;
          replacement = '';
        } else {
          try {
            replacement = this.eventValueService.resolve(term.path, context);
          } catch {
            return false;
          }
        }
      } else {
        replacement = escapeTemplateText(`[${location.content}]`);
      }

      output = `${output.slice(0, location.start)}${replacement}${output.slice(location.end + 1)}`;
    }
  }
}

function hasQuestionTemplate(question: string): boolean {
  return /(^|[^\\])\[(?:event\.|变量\.(?:创建|读取)\.|创建变量=|读取变量=)/.test(question);
}

function matchesText(question: string, matchMode: MatchMode, originalText: string): boolean {
  return matchMode === 'exact' ? originalText === question : originalText.includes(question);
}
