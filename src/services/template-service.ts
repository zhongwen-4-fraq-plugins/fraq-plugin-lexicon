import type { MilkyClient } from '@fraqjs/fraq';

import type { ApiActionRegistry } from '../actions/api-action-registry';
import { LexiconError } from '../errors';
import type { MessageContext } from '../models/lexicon';
import { findInnermostTerm, parseTemplateTerm, unescapeTemplateText } from '../parsers/template-parser';
import type { LexiconService } from './lexicon-service';

export interface TemplateServiceOptions {
  maxOutputLength?: number;
}

export class TemplateService {
  private readonly maxOutputLength: number;

  constructor(
    private readonly lexiconService: LexiconService,
    private readonly actionRegistry: ApiActionRegistry,
    private readonly client: MilkyClient,
    options: TemplateServiceOptions = {},
  ) {
    this.maxOutputLength = options.maxOutputLength ?? 65_536;
  }

  async render(template: string, context: MessageContext): Promise<string> {
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

      const location = findInnermostTerm(output);
      if (!location) {
        return unescapeTemplateText(output);
      }

      const term = parseTemplateTerm(location.content);
      const replacement = await this.executeTerm(term, context);
      output = `${output.slice(0, location.start)}${replacement}${output.slice(location.end + 1)}`;
    }
  }

  private async executeTerm(term: ReturnType<typeof parseTemplateTerm>, context: MessageContext): Promise<string> {
    if (term.type === 'api') {
      return this.actionRegistry.execute(term.action, term.parameters, {
        client: this.client,
        message: context,
      });
    }

    const match = this.lexiconService.matchMessage(context, term.name);
    if (!match) {
      throw new LexiconError(`词库“${term.name}”没有匹配当前消息的词条。`);
    }
    return match.answer;
  }
}
