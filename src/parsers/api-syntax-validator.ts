import type { ApiEndpointName } from '@fraqjs/fraq';

import { isMilkyApiEndpoint, MILKY_API_DEFINITIONS } from '../data/milky-api-definitions';
import { LexiconError } from '../errors';
import type { MilkyApiDefinition } from '../models/milky-api';

const PARAMETER_NAME_HINTS: Readonly<Record<string, string>> = {
  qq: 'user_id',
};

export interface ValidatedApiSyntax {
  endpoint: ApiEndpointName;
  definition: MilkyApiDefinition;
}

export function validateApiSyntax(
  endpointName: string,
  parameters: Readonly<Record<string, string>>,
): ValidatedApiSyntax {
  if (!isMilkyApiEndpoint(endpointName)) {
    throw new LexiconError(`没有这个 Milky API：“${endpointName}”。`);
  }

  const definition = MILKY_API_DEFINITIONS[endpointName];
  const parameterNames = Object.keys(definition);
  const unknownParameter = Object.keys(parameters).find((name) => !(name in definition));
  if (!unknownParameter) {
    return { endpoint: endpointName, definition };
  }

  const suggestion = suggestParameterName(unknownParameter, parameterNames);
  if (suggestion) {
    throw new LexiconError(`Milky API“${endpointName}”参数名错误：“${unknownParameter}”应当是“${suggestion}”。`);
  }
  if (parameterNames.length === 0) {
    throw new LexiconError(`Milky API“${endpointName}”参数名错误：该 API 不接受参数。`);
  }
  throw new LexiconError(
    `Milky API“${endpointName}”参数名错误：“${unknownParameter}”；可用参数：${parameterNames.join('、')}。`,
  );
}

function suggestParameterName(input: string, parameterNames: readonly string[]): string | undefined {
  const hintedName = PARAMETER_NAME_HINTS[input];
  if (hintedName && parameterNames.includes(hintedName)) {
    return hintedName;
  }

  const normalizedInput = normalizeParameterName(input);
  const normalizedMatch = parameterNames.find((name) => normalizeParameterName(name) === normalizedInput);
  if (normalizedMatch) {
    return normalizedMatch;
  }
  return parameterNames.length === 1 ? parameterNames[0] : undefined;
}

function normalizeParameterName(name: string): string {
  return name.replaceAll('_', '').toLowerCase();
}
