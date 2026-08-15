import { LexiconError } from '../errors';
import type { ApiActionHandler } from './api-action-registry';

export const nudgeAction: ApiActionHandler = async (parameters, context) => {
  ensureOnlyParameters(parameters, ['user_id', 'is_self']);
  const userId = readNumber(parameters.user_id, context.message.senderId, 'user_id');

  if (context.message.scene === 'group') {
    if (context.message.groupId === undefined) {
      throw new LexiconError('群戳一戳缺少群号。');
    }
    await context.client.send_group_nudge({
      group_id: context.message.groupId,
      user_id: userId,
    });
    return '';
  }

  if (context.message.scene === 'friend') {
    await context.client.send_friend_nudge({
      user_id: userId,
      is_self: readBoolean(parameters.is_self, false, 'is_self'),
    });
    return '';
  }

  throw new LexiconError('临时会话暂不支持戳一戳。');
};

function ensureOnlyParameters(parameters: Record<string, string>, allowed: string[]): void {
  const unknown = Object.keys(parameters).find((key) => !allowed.includes(key));
  if (unknown) {
    throw new LexiconError(`戳一戳不支持参数“${unknown}”。`);
  }
}

function readNumber(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new LexiconError(`参数“${name}”必须是正整数。`);
  }
  return parsed;
}

function readBoolean(value: string | undefined, fallback: boolean, name: string): boolean {
  if (value === undefined || value === '') {
    return fallback;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw new LexiconError(`参数“${name}”必须是 true 或 false。`);
}
