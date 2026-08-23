import { LexiconError } from '../errors';

export type LogicOperation = 'or' | 'and' | 'in' | '等于' | '不等于';

export class LogicService {
  resolveText(operation: LogicOperation, values: string[]): string {
    if (values.length < 2) {
      throw new LexiconError('逻辑词条至少需要两个参数。');
    }

    if (operation === 'or') {
      const firstAvailableValue = values.find((value) => value !== '');
      if (firstAvailableValue === undefined) {
        throw new LexiconError('逻辑.or没有可用参数。');
      }
      return firstAvailableValue;
    }

    validateValues(values);
    if (operation === 'and') {
      return values.join('');
    }
    throw new LexiconError(`[逻辑.${operation}] 只能用作 [逻辑.判断] 或 [逻辑.否则判断] 的条件。`);
  }

  resolveCondition(operation: LogicOperation, values: string[]): boolean {
    if (operation === '等于' || operation === '不等于') {
      validateComparisonValues(operation, values);
      return operation === '等于' ? values[0] === values[1] : values[0] !== values[1];
    }

    validateValues(values);
    if (operation === 'in') {
      return values.slice(1).includes(values[0]);
    }
    const booleans = values.map((value) => parseStrictBoolean(operation, value));
    if (operation === 'or') {
      return booleans.some(Boolean);
    }
    return booleans.every(Boolean);
  }
}

export function isOptionalLogicValueError(error: unknown): boolean {
  if (!(error instanceof LexiconError)) {
    return false;
  }

  return (
    error.message.includes('尚未创建。') ||
    error.message.startsWith('当前消息不存在“') ||
    error.message.startsWith('事件字段“') ||
    error.message.startsWith('消息段“') ||
    error.message.startsWith('JSON 变量“')
  );
}

function validateValues(values: string[]): void {
  if (values.length < 2 || values.some((value) => value === '')) {
    throw new LexiconError('逻辑词条至少需要两个非空参数。');
  }
}

function validateComparisonValues(operation: '等于' | '不等于', values: string[]): void {
  if (values.length !== 2 || values.some((value) => value === '')) {
    throw new LexiconError(`逻辑.${operation}条件只接受两个非空参数。`);
  }
}

function parseStrictBoolean(operation: 'or' | 'and', value: string): boolean {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw new LexiconError(`逻辑.${operation}条件参数“${value}”只支持 true 或 false。`);
}
