export class LexiconError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LexiconError';
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
