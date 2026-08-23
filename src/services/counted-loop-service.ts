import { LexiconError } from '../errors';
import { CountedLoopControlSignal } from '../models/counted-loop';
import { TemplateExecutionStopSignal } from '../models/template-execution';

const DEFAULT_MAX_LOOP_ITERATIONS = 10_000;

export class CountedLoopService {
  constructor(
    private readonly maxOutputLength = 65_536,
    private readonly maxIterations = DEFAULT_MAX_LOOP_ITERATIONS,
  ) {}

  parseCount(value: string): number {
    const normalizedValue = value.trim();
    const count = Number(normalizedValue);
    if (!/^\d+$/u.test(normalizedValue) || !Number.isSafeInteger(count) || count > this.maxIterations) {
      throw new LexiconError(`计次循环次数必须是 0 到 ${this.maxIterations} 之间的整数。`);
    }
    return count;
  }

  async execute(count: number, renderIteration: () => Promise<string>): Promise<string> {
    let output = '';
    for (let index = 0; index < count; index += 1) {
      try {
        output = this.append(output, await renderIteration());
      } catch (error) {
        if (!(error instanceof CountedLoopControlSignal)) {
          if (error instanceof TemplateExecutionStopSignal) {
            output = this.append(output, error.output);
            throw new TemplateExecutionStopSignal(output);
          }
          throw error;
        }
        output = this.append(output, error.output);
        if (error.control === 'break') {
          break;
        }
      }
    }
    return output;
  }

  executeSync(count: number, renderIteration: () => string | undefined): string | undefined {
    let output = '';
    for (let index = 0; index < count; index += 1) {
      try {
        const iterationOutput = renderIteration();
        if (iterationOutput === undefined) {
          return undefined;
        }
        output = this.append(output, iterationOutput);
      } catch (error) {
        if (!(error instanceof CountedLoopControlSignal)) {
          if (error instanceof TemplateExecutionStopSignal) {
            output = this.append(output, error.output);
            throw new TemplateExecutionStopSignal(output);
          }
          throw error;
        }
        output = this.append(output, error.output);
        if (error.control === 'break') {
          break;
        }
      }
    }
    return output;
  }

  private append(output: string, addition: string): string {
    const nextOutput = output + addition;
    if (nextOutput.length > this.maxOutputLength) {
      throw new LexiconError(`词条解析结果超过 ${this.maxOutputLength} 个字符。`);
    }
    return nextOutput;
  }
}
