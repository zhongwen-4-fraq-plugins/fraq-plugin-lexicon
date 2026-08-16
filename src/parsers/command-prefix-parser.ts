import type { RouteActivation } from '@fraqjs/fraq';

export function resolveCommandText(input: string, activations: readonly RouteActivation[]): string | undefined {
  const text = input.trim();
  let supportsDirectActivation = false;

  for (const activation of activations) {
    if (activation.type === 'direct') {
      supportsDirectActivation = true;
      continue;
    }
    if (activation.type === 'prefix' && text.startsWith(activation.prefix)) {
      return text.slice(activation.prefix.length).trim();
    }
  }

  if (supportsDirectActivation) {
    return text;
  }

  return undefined;
}
