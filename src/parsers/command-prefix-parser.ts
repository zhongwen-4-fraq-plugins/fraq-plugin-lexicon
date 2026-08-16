export function stripCommandPrefix(input: string, prefix: string): string | undefined {
  const text = input.trim();
  const normalizedPrefix = prefix.trim();
  if (!normalizedPrefix) {
    return text;
  }
  if (!text.startsWith(normalizedPrefix)) {
    return undefined;
  }
  return text.slice(normalizedPrefix.length).trim();
}
