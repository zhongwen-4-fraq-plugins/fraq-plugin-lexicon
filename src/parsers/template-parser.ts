import { LexiconError } from '../errors';
import { DEFAULT_USER_INPUT_TIMEOUT_MESSAGE } from '../models/user-input';
import { isEscaped } from './template-syntax';

export type TemplateTerm =
  | { type: 'api'; action: string; parameters: Record<string, string> }
  | { type: 'logic'; operation: 'or' | 'and' | 'in'; values: string[] }
  | { type: 'loopControl'; control: 'break' | 'continue' }
  | { type: 'requestInput'; prompt: string; timeoutSeconds?: number; timeoutMessage: string }
  | { type: 'event'; path: string[] }
  | { type: 'messageValue'; segmentType: string; path: string[] }
  | { type: 'messageBuild'; segmentType: string; content: string }
  | { type: 'jsonValue'; variableName: string; path: string[] }
  | { type: 'lexicon'; name: string }
  | { type: 'executionStop' }
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

export function isInsideLogicOrTerm(input: string, position: number): boolean {
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
    if (start === undefined || start >= position || position >= index) {
      continue;
    }
    if (input.slice(start + 1, index).startsWith('逻辑.or.')) {
      return true;
    }
  }

  return false;
}

export function parseTemplateTerm(content: string): TemplateTerm {
  const parts = splitEscaped(content, '.');
  const namespace = parts.shift();

  if (namespace === '变量') {
    return parseVariableTerm(parts);
  }

  const unescapedParts = parts.map(unescapePart);

  if (namespace === '词库') {
    if (unescapedParts.length === 1 && unescapedParts[0] === '拒绝执行') {
      return { type: 'executionStop' };
    }
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

  if (namespace === '逻辑') {
    const operation = unescapedParts.shift();
    if (operation === '请求用户输入') {
      return parseRequestInputTerm(unescapedParts);
    }
    if ((operation !== 'or' && operation !== 'and' && operation !== 'in') || unescapedParts.length < 2) {
      throw new LexiconError(
        '逻辑词条格式应为 [逻辑.<or|and|in>.<参数1>.<参数2>...] 或 [逻辑.请求用户输入.<提示消息>.<超时时间=秒>.<超时提示=文本>]。',
      );
    }
    return { type: 'logic', operation, values: unescapedParts };
  }

  if (namespace === '循环') {
    if (unescapedParts.length !== 1) {
      throw new LexiconError('循环控制词条格式应为 [循环.退出] 或 [循环.跳过]。');
    }
    if (unescapedParts[0] === '退出') {
      return { type: 'loopControl', control: 'break' };
    }
    if (unescapedParts[0] === '跳过') {
      return { type: 'loopControl', control: 'continue' };
    }
    throw new LexiconError(`不支持的循环控制操作：${unescapedParts[0] || '空'}。`);
  }

  if (namespace === 'event') {
    if (unescapedParts.length === 0 || unescapedParts.some((part) => !part)) {
      throw new LexiconError('事件词条格式应为 [event.<事件名或字段路径>]。');
    }
    return { type: 'event', path: unescapedParts };
  }

  if (namespace === '消息') {
    return parseMessageTerm(unescapedParts);
  }

  if (namespace === 'json') {
    return parseJsonTerm(unescapedParts);
  }

  throw new LexiconError(`不支持的词条命名空间：${namespace || '空'}。`);
}

function parseRequestInputTerm(parts: string[]): TemplateTerm {
  const promptParts = [...parts];
  let timeoutSeconds: number | undefined;
  let timeoutMessage = DEFAULT_USER_INPUT_TIMEOUT_MESSAGE;
  let hasTimeoutMessage = false;

  while (promptParts.length > 0) {
    const part = promptParts[promptParts.length - 1];
    if (part.startsWith('超时时间=')) {
      if (timeoutSeconds !== undefined) {
        throw new LexiconError('请求用户输入词条不能重复设置超时时间。');
      }
      const value = part.slice('超时时间='.length).trim();
      const seconds = Number(value);
      const timeoutMs = Math.round(seconds * 1000);
      if (
        !Number.isFinite(seconds) ||
        !Number.isSafeInteger(timeoutMs) ||
        timeoutMs <= 0 ||
        timeoutMs > 2_147_483_647
      ) {
        throw new LexiconError('请求用户输入的超时时间必须是有效的正数秒数。');
      }
      timeoutSeconds = seconds;
      promptParts.pop();
      continue;
    }
    if (part.startsWith('超时提示=')) {
      if (hasTimeoutMessage) {
        throw new LexiconError('请求用户输入词条不能重复设置超时提示。');
      }
      timeoutMessage = part.slice('超时提示='.length);
      if (!timeoutMessage.trim()) {
        throw new LexiconError('请求用户输入的超时提示不能为空。');
      }
      hasTimeoutMessage = true;
      promptParts.pop();
      continue;
    }
    break;
  }

  const prompt = promptParts.join('.');
  if (!prompt.trim()) {
    throw new LexiconError('请求用户输入词条格式应为 [逻辑.请求用户输入.<提示消息>.<超时时间=秒>.<超时提示=文本>]。');
  }
  return { type: 'requestInput', prompt, timeoutSeconds, timeoutMessage };
}

function parseMessageTerm(parts: string[]): TemplateTerm {
  const operation = parts.shift();

  if (operation === '读取') {
    const segmentType = parts.shift();
    if (!segmentType || parts.length === 0 || parts.some((part) => !part)) {
      throw new LexiconError('消息读取词条格式应为 [消息.读取.<消息段类型>.<字段路径>]。');
    }
    return { type: 'messageValue', segmentType, path: parts };
  }

  if (operation === '构建') {
    const segmentType = parts.shift();
    if (!segmentType || parts.length !== 1) {
      throw new LexiconError('消息构建词条格式应为 [消息.构建.<消息段类型>.<内容>]。');
    }
    return { type: 'messageBuild', segmentType, content: parts[0] };
  }

  throw new LexiconError(`不支持的消息操作：${operation || '空'}。`);
}

function parseJsonTerm(parts: string[]): TemplateTerm {
  const operation = parts.shift();
  if (operation !== '取值') {
    throw new LexiconError(`不支持的 JSON 操作：${operation || '空'}。`);
  }

  const variableName = parts.shift();
  if (!variableName || parts.length === 0 || parts.some((part) => !part)) {
    throw new LexiconError('JSON 取值词条格式应为 [json.取值.<变量名>.<字段路径>]。');
  }
  return { type: 'jsonValue', variableName: validateVariableName(variableName), path: parts };
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
  return unescapeTemplateText(input);
}

function validateVariableName(name: string): string {
  const normalizedName = unescapeTemplateText(name).trim();
  if (!normalizedName || /[\s[\]\\=]/.test(normalizedName)) {
    throw new LexiconError('变量名不能为空，且不能包含空白、方括号、反斜杠或等号。');
  }
  return normalizedName;
}
