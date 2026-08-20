import { LexiconError } from '../errors';
import { unescapeTemplateText } from '../parsers/template-parser';
import { resolveTemplateValue } from '../parsers/template-value-parser';

export class JsonVariableValueService {
  resolve(variableName: string, path: readonly string[], variables: ReadonlyMap<string, string>): string {
    const value = variables.get(variableName);
    if (value === undefined) {
      throw new LexiconError(`变量“${variableName}”尚未创建。`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(unescapeTemplateText(value));
    } catch {
      throw new LexiconError(`变量“${variableName}”不是有效的 JSON。`);
    }

    return resolveTemplateValue(parsed, path, `JSON 变量“${variableName}”的字段`);
  }
}
