export function replaceVariables(target: Map<string, string>, source: ReadonlyMap<string, string>): void {
  target.clear();
  for (const [name, value] of source) {
    target.set(name, value);
  }
}
