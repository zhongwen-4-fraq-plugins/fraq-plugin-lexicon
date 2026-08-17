import { LexiconError } from '../errors';

export type TemplateTerm =
  | { type: 'api'; action: string; parameters: Record<string, string> }
  | { type: 'event'; path: string[] }
  | { type: 'incomingSegment'; segmentType: string; path: string[] }
  | { type: 'lexicon'; name: string }
  | { type: 'setVariable'; name: string; value: string }
  | { type: 'getVariable'; name: string };

export interface TermLocation {
  start: number;
  end: number;
  content: string;
}

export function findInnermostTerm(input: string): TermLocation | undefined {
  const openings: number[] = [];

  for (let index = 0; index < input.length; index += 1) {
    if (isEscaped(input, index)) {
      continue;
    }
    if (input[index] === '[') {
      openings.push(index);
      continue;
    }
    if (input[index] !== ']') {
      continue;
    }

    const start = openings.pop();
    if (start === undefined) {
      throw new LexiconError('词条存在未配对的右方括号。');
    }
    return {
      start,
      end: index,
      content: input.slice(start + 1, index),
    };
  }

  if (openings.length > 0) {
    throw new LexiconError('词条存在未闭合的左方括号。');
  }
  return undefined;
}

export function parseTemplateTerm(content: string): TemplateTerm {
  const parts = splitEscaped(content, '.');
  const namespace = parts.shift();

  if (namespace === '变量') {
    return parseVariableTerm(parts);
  }

  const unescapedParts = parts.map(unescapePart);

  if (namespace === '词库') {
    if (unescapedParts.length !== 1 || !unescapedParts[0]) {
      throw new LexiconError('词库词条格式应为 [词库.<词库名>]。');
    }
    return { type: 'lexicon', name: unescapedParts[0] };
  }

  if (namespace === 'api') {
    const action = unescapedParts.shift();
    if (!action) {
      throw new LexiconError('API 词条缺少动作名称。');
    }

    const parameters: Record<string, string> = {};
    for (const part of unescapedParts) {
      const [key, value] = splitParameter(part);
      if (key in parameters) {
        throw new LexiconError(`API 参数“${key}”重复。`);
      }
      parameters[key] = value;
    }
    return { type: 'api', action, parameters };
  }

  if (namespace === 'event') {
    if (unescapedParts.length === 0 || unescapedParts.some((part) => !part)) {
      throw new LexiconError('事件词条格式应为 [event.<事件名或字段路径>]。');
    }
    return { type: 'event', path: unescapedParts };
  }

  if (namespace === 'is') {
    const segmentType = unescapedParts.shift();
    if (!segmentType || unescapedParts.length === 0 || unescapedParts.some((part) => !part)) {
      throw new LexiconError('消息段词条格式应为 [is.<消息段类型>.<字段路径>]。');
    }
    return { type: 'incomingSegment', segmentType, path: unescapedParts };
  }

  throw new LexiconError(`不支持的词条命名空间：${namespace || '空'}。`);
}

function parseVariableTerm(parts: string[]): TemplateTerm {
  const operation = unescapePart(parts.shift() ?? '');
  if (operation === '读取') {
    if (parts.length !== 1) {
      throw new LexiconError('变量读取词条格式应为 [变量.读取.变量名]。');
    }
    return { type: 'getVariable', name: validateVariableName(parts[0]) };
  }

  if (operation === '创建') {
    if (parts.length !== 1) {
      throw new LexiconError('变量创建词条格式应为 [变量.创建.变量名] 或 [变量.创建.变量名=变量值]。');
    }
    const valueParts = splitEscaped(parts[0], '=');
    return {
      type: 'setVariable',
      name: validateVariableName(valueParts[0]),
      value: valueParts.slice(1).join('='),
    };
  }

  throw new LexiconError(`不支持的变量操作：${operation || '空'}。`);
}

export function unescapeTemplateText(input: string): string {
  return input.replace(/\\([\\[\].=])/g, '$1');
}

export function escapeTemplateText(input: string): string {
  return input.replace(/([\\[\].=])/g, '\\$1');
}

function splitParameter(input: string): [string, string] {
  for (let index = 0; index < input.length; index += 1) {
    if (input[index] === '=' && !isEscaped(input, index)) {
      const key = unescapePart(input.slice(0, index)).trim();
      const value = unescapePart(input.slice(index + 1));
      if (!key) {
        break;
      }
      return [key, value];
    }
  }
  throw new LexiconError(`API 参数“${input}”应使用 参数名=参数值 格式。`);
}

function splitEscaped(input: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === delimiter && !isEscaped(input, index)) {
      result.push(current);
      current = '';
      continue;
    }
    current += character;
  }
  result.push(current);
  return result;
}

function unescapePart(input: string): string {
  return input.replace(/\\([\\[\].=])/g, '$1');
}

function validateVariableName(name: string): string {
  const normalizedName = unescapeTemplateText(name).trim();
  if (!normalizedName || /[\s[\]\\=]/.test(normalizedName)) {
    throw new LexiconError('变量名不能为空，且不能包含空白、方括号、反斜杠或等号。');
  }
  return normalizedName;
}

function isEscaped(input: string, index: number): boolean {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && input[cursor] === '\\'; cursor -= 1) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
}
