import { LexiconError } from '../errors';
import type { TemplateContext } from '../models/lexicon';
import { escapeTemplateText } from '../parsers/template-parser';

export class MilkyEventValueService {
  resolve(path: string[], context: TemplateContext): string {
    let value: unknown = context.event;

    for (const part of path) {
      if (!isContainer(value) || !Object.hasOwn(value, part)) {
        throw new LexiconError(`事件字段“${path.join('.')}”不存在。`);
      }
      value = value[part];
    }

    return serializeEventValue(value);
  }
}

function serializeEventValue(value: unknown): string {
  if (value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return escapeTemplateText(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return escapeTemplateText(JSON.stringify(value));
}

function isContainer(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
