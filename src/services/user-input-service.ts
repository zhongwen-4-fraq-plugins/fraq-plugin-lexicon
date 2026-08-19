import { LexiconError, UserInputTimeoutError } from '../errors';
import type { TemplateContext } from '../models/lexicon';
import { DEFAULT_USER_INPUT_TIMEOUT_MS, type UserInputRequest, userInputSessionKey } from '../models/user-input';

interface PendingUserInput {
  resolve(value: string): void;
  reject(error: unknown): void;
  timer: NodeJS.Timeout;
}

export class UserInputService {
  private readonly pending = new Map<string, PendingUserInput>();

  constructor(private readonly timeoutMs = DEFAULT_USER_INPUT_TIMEOUT_MS) {
    validateTimeout(timeoutMs);
  }

  request(context: TemplateContext, timeoutMs = this.timeoutMs): UserInputRequest {
    validateTimeout(timeoutMs);
    const key = this.requireSessionKey(context);
    if (this.pending.has(key)) {
      throw new LexiconError('当前用户已有等待中的输入请求。');
    }

    let pending: PendingUserInput;
    const promise = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.get(key) !== pending) {
          return;
        }
        this.pending.delete(key);
        reject(new UserInputTimeoutError());
      }, timeoutMs);
      timer.unref();
      pending = { resolve, reject, timer };
      this.pending.set(key, pending);
    });
    void promise.catch(() => {});

    return {
      promise,
      cancel: (error) => this.cancel(key, pending, error),
    };
  }

  submit(context: TemplateContext, value: string): boolean {
    const key = userInputSessionKey(context);
    if (!key) {
      return false;
    }
    const pending = this.pending.get(key);
    if (!pending) {
      return false;
    }
    this.pending.delete(key);
    clearTimeout(pending.timer);
    pending.resolve(value);
    return true;
  }

  private requireSessionKey(context: TemplateContext): string {
    const key = userInputSessionKey(context);
    if (!key) {
      throw new LexiconError('[逻辑.请求用户输入.<提示消息>] 只能用于可确定用户和会话的事件。');
    }
    return key;
  }

  private cancel(key: string, pending: PendingUserInput, error: unknown): void {
    if (this.pending.get(key) !== pending) {
      return;
    }
    this.pending.delete(key);
    clearTimeout(pending.timer);
    pending.reject(error);
  }
}

function validateTimeout(timeoutMs: number): void {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2_147_483_647) {
    throw new LexiconError('用户输入等待时间必须是有效的正整数毫秒数。');
  }
}
