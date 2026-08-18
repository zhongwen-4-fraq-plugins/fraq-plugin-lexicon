import { LexiconError } from '../errors';

export type LogicOperation = 'or' | 'and' | 'in';

export class LogicService {
  constructor(private readonly random: () => number = Math.random) {}

  resolve(operation: LogicOperation, values: string[]): string {
    if (values.length < 2 || values.some((value) => value === '')) {
      throw new LexiconError('逻辑词条至少需要两个非空参数。');
    }

    if (operation === 'in') {
      return String(values.slice(1).includes(values[0]));
    }

    const booleanValues = values.map(parseBoolean);
    if (booleanValues.every((value) => value !== undefined)) {
      const resolved = booleanValues as boolean[];
      return String(operation === 'or' ? resolved.some(Boolean) : resolved.every(Boolean));
    }

    if (operation === 'and') {
      return values.join('');
    }

    const index = Math.min(Math.floor(this.random() * values.length), values.length - 1);
    return values[Math.max(index, 0)];
  }
}

function parseBoolean(value: string): boolean | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === '是' || normalized === '真') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === '否' || normalized === '假') {
    return false;
  }
  return undefined;
}
