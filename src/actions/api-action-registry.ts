import type { MilkyClient } from '@fraqjs/fraq';

import { LexiconError } from '../errors';
import type { TemplateContext } from '../models/lexicon';

export interface ApiActionContext {
  client: MilkyClient;
  message: TemplateContext;
}

export type ApiActionHandler = (
  parameters: Record<string, string>,
  context: ApiActionContext,
) => string | Promise<string>;

export type ApiActionFallbackHandler = (
  name: string,
  parameters: Record<string, string>,
  context: ApiActionContext,
) => string | Promise<string>;

export class ApiActionRegistry {
  private readonly handlers = new Map<string, ApiActionHandler>();

  constructor(private readonly fallbackHandler?: ApiActionFallbackHandler) {}

  register(name: string, handler: ApiActionHandler): void {
    this.handlers.set(name, handler);
  }

  async execute(name: string, parameters: Record<string, string>, context: ApiActionContext): Promise<string> {
    const handler = this.handlers.get(name);
    if (handler) {
      return handler(parameters, context);
    }
    if (this.fallbackHandler) {
      return this.fallbackHandler(name, parameters, context);
    }
    throw new LexiconError(`不支持的 API 动作：${name}。`);
  }
}
