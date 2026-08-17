import { isMilkyEventName } from '../data/milky-event-definitions';
import { LexiconError } from '../errors';
import type { TemplateContext } from '../models/lexicon';
import { resolveTemplateValue } from '../parsers/template-value-parser';

export class MilkyEventValueService {
  resolve(path: string[], context: TemplateContext): string {
    if (path.length === 1 && isMilkyEventName(path[0])) {
      if (context.eventType !== path[0]) {
        throw new LexiconError(`当前事件不是“${path[0]}”。`);
      }
      return '';
    }

    return resolveTemplateValue(context.event, path, '事件字段');
  }
}
