import { LexiconError } from '../errors';
import { isEscaped } from './template-syntax';

const LOOP_OPEN_PREFIX = '[逻辑.计次循环.';
const LOOP_OPEN_WITHOUT_COUNT = '[逻辑.计次循环]';
const LOOP_END = '[逻辑.计次循环尾]';

export interface CountedLoopBlockLocation {
  start: number;
  end: number;
  countExpression: string;
  body: string;
}

export function findCountedLoopBlock(input: string): CountedLoopBlockLocation | undefined {
  let depth = 0;
  let start = -1;
  let openingEnd = -1;
  let countExpression = '';

  for (let index = 0; index < input.length; index += 1) {
    if (input[index] !== '[' || isEscaped(input, index)) {
      continue;
    }
    if (input.startsWith(LOOP_END, index)) {
      if (depth === 0) {
        throw new LexiconError('计次循环存在未配对的 [逻辑.计次循环尾]。');
      }
      depth -= 1;
      const end = index + LOOP_END.length - 1;
      if (depth === 0) {
        return {
          start,
          end,
          countExpression,
          body: input.slice(openingEnd + 1, index),
        };
      }
      index = end;
      continue;
    }
    if (input.startsWith(LOOP_OPEN_WITHOUT_COUNT, index)) {
      throw new LexiconError('计次循环格式应为 [逻辑.计次循环.<次数>]...[逻辑.计次循环尾]。');
    }
    if (!input.startsWith(LOOP_OPEN_PREFIX, index)) {
      continue;
    }

    const currentOpeningEnd = findTermEnd(input, index);
    const currentCountExpression = input.slice(index + LOOP_OPEN_PREFIX.length, currentOpeningEnd);
    if (!currentCountExpression.trim()) {
      throw new LexiconError('计次循环次数不能为空。');
    }
    if (depth === 0) {
      start = index;
      openingEnd = currentOpeningEnd;
      countExpression = currentCountExpression;
    }
    depth += 1;
    index = currentOpeningEnd;
  }

  if (depth > 0) {
    throw new LexiconError('计次循环缺少 [逻辑.计次循环尾]。');
  }
  return undefined;
}

function findTermEnd(input: string, start: number): number {
  let depth = 0;
  for (let index = start; index < input.length; index += 1) {
    if (isEscaped(input, index)) {
      continue;
    }
    if (input[index] === '[') {
      depth += 1;
      continue;
    }
    if (input[index] !== ']') {
      continue;
    }
    depth -= 1;
    if (depth === 0) {
      return index;
    }
  }
  throw new LexiconError('计次循环开始词条缺少右方括号。');
}
