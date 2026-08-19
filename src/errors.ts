export class LexiconError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LexiconError';
  }
}

export class UserInputTimeoutError extends LexiconError {
  constructor() {
    super('等待用户输入超时。');
    this.name = 'UserInputTimeoutError';
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
