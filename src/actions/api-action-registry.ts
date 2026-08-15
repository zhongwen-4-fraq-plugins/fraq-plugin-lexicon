import type { MilkyClient } from '@fraqjs/fraq';

import { LexiconError } from '../errors';
import type { MessageContext } from '../models/lexicon';

export interface ApiActionContext {
  client: MilkyClient;
  message: MessageContext;
}

export type ApiActionHandler = (
  parameters: Record<string, string>,
  context: ApiActionContext,
) => string | Promise<string>;

export class ApiActionRegistry {
  private readonly handlers = new Map<string, ApiActionHandler>();

  register(name: string, handler: ApiActionHandler): void {
    this.handlers.set(name, handler);
  }

  async execute(name: string, parameters: Record<string, string>, context: ApiActionContext): Promise<string> {
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new LexiconError(`不支持的 API 动作：${name}。`);
    }
    return handler(parameters, context);
  }
}
