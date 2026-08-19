import type { TemplateContext } from './lexicon';

export const DEFAULT_USER_INPUT_TIMEOUT_MS = 30_000;
export const DEFAULT_USER_INPUT_TIMEOUT_MESSAGE = '会话超时';

export interface UserInputRequest {
  promise: Promise<string>;
  cancel(error: unknown): void;
}

export function userInputSessionKey(context: TemplateContext): string | undefined {
  if (context.scene === undefined || context.peerId === undefined || context.senderId === undefined) {
    return undefined;
  }
  return `${context.selfId}:${context.scene}:${context.peerId}:${context.groupId ?? ''}:${context.senderId}`;
}
