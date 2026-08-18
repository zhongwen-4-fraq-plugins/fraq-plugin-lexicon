import { LexiconError } from '../errors';

export type LogicOperation = 'or' | 'and' | 'in';

export class LogicService {
  constructor(private readonly random: () => number = Math.random) {}

  resolveText(operation: LogicOperation, values: string[]): string {
    validateValues(values);
    if (operation === 'and') {
      return values.join('');
    }
    if (operation === 'or') {
      const index = Math.min(Math.floor(this.random() * values.length), values.length - 1);
      return values[Math.max(index, 0)];
    }
    throw new LexiconError('[逻辑.in] 只能用作 [逻辑.如果] 或 [逻辑.否则如果] 的条件。');
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
