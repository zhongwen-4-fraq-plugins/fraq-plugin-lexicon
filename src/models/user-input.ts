import type { TemplateContext } from './lexicon';

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
