import { LexiconError } from '../errors';
import type { MilkyApiDefinition } from '../models/milky-api';

const PARAMETER_ALIASES = {
  qq: 'user_id',
} as const;

export function normalizeApiParameters(
  parameters: Readonly<Record<string, string>>,
  definition: MilkyApiDefinition,
): Record<string, string> {
  const normalizedParameters = { ...parameters };

  for (const [alias, target] of Object.entries(PARAMETER_ALIASES)) {
    const aliasValue = normalizedParameters[alias];
    if (aliasValue === undefined || !(target in definition)) {
      continue;
    }
    if (normalizedParameters[target] !== undefined) {
      throw new LexiconError(`参数“${alias}”与“${target}”不能同时使用。`);
    }
    normalizedParameters[target] = aliasValue;
    delete normalizedParameters[alias];
  }

  return normalizedParameters;
}
