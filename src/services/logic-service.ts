import { LexiconError } from '../errors';

export type LogicOperation = 'or' | 'and' | 'in';

export class LogicService {
  constructor(private readonly random: () => number = Math.random) {}

  resolveText(operation: LogicOperation, values: string[]): string {
    if (values.length < 2) {
      throw new LexiconError('逻辑词条至少需要两个参数。');
    }

    if (operation === 'or') {
      const availableValues = values.filter((value) => value !== '');
      if (availableValues.length === 0) {
        throw new LexiconError('逻辑.or没有可用参数。');
      }
      const index = Math.min(Math.floor(this.random() * availableValues.length), availableValues.length - 1);
      return availableValues[Math.max(index, 0)];
    }

    validateValues(values);
    if (operation === 'and') {
      return values.join('');
    }
    throw new LexiconError('[逻辑.in] 只能用作 [逻辑.判断] 或 [逻辑.否则判断] 的条件。');
  }

  resolveCondition(operation: LogicOperation, values: string[]): boolean {
    validateValues(values);
    if (operation === 'in') {
      return values.slice(1).includes(values[0]);
    }
    const booleanValues = values.map((value) => parseBoolean(value));
    return operation === 'or' ? booleanValues.some(Boolean) : booleanValues.every(Boolean);
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

function parseBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === '是' || normalized === '真') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === '否' || normalized === '假') {
    return false;
  }
  throw new LexiconError(`逻辑条件参数“${value}”不是布尔值。`);
}
