import { LexiconError } from '../errors';
import { escapeTemplateText } from './template-parser';

export function resolveTemplateValue(root: unknown, path: readonly string[], label: string): string {
  let value = root;

  for (const part of path) {
    if (!isContainer(value) || !Object.hasOwn(value, part)) {
      throw new LexiconError(`${label}“${path.join('.')}”不存在。`);
    }
    value = value[part];
  }

  return serializeTemplateValue(value);
}

function serializeTemplateValue(value: unknown): string {
  if (value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return escapeTemplateText(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  const serialized = JSON.stringify(value);
  return serialized === undefined ? '' : escapeTemplateText(serialized);
}

function isContainer(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
