import type { Logger, MilkyClient } from '@fraqjs/fraq';

import { createEventContext } from '../data/milky-event-context';
import { errorMessage } from '../errors';
import type { MilkyEvent, TemplateContext } from '../models/lexicon';
import type { LexiconService } from '../services/lexicon-service';
import type { TemplateService } from '../services/template-service';

export class MilkyEventController {
  constructor(
    private readonly lexiconService: LexiconService,
    private readonly templateService: TemplateService,
    private readonly client: MilkyClient,
    private readonly logger: Logger,
  ) {}

  async handle(event: MilkyEvent): Promise<void> {
    const context = createEventContext(event);
    if (event.event_type !== 'message_receive') {
      this.lexiconService.ensureEventDefaultLexicon(context);
    }
    const match = this.lexiconService.matchMessage(context);
    if (!match) {
      return;
    }

    let output: string;
    try {
      output = await this.templateService.render(match.answer, context, match.questionVariables, (prompt) =>
        this.sendText(prompt, context),
      );
    } catch (error) {
      await this.reportExecutionError(error, context);
      return;
    }

    if (!output) {
      return;
    }

    try {
      await this.sendText(output, context);
    } catch (error) {
      this.logger.error(`${context.originalText} 文本发送失败`, error);
    }
  }

  private async reportExecutionError(error: unknown, context: TemplateContext): Promise<void> {
    try {
      const sent = await this.trySendText(`事件词条执行失败：${errorMessage(error)}`, context);
      if (!sent) {
        this.logger.error(`${context.originalText} 执行失败`, error);
      }
    } catch (sendError) {
      this.logger.error(`${context.originalText} 执行失败，且错误提示发送失败`, sendError);
    }
  }

  private async sendText(text: string, context: TemplateContext): Promise<void> {
    if (!(await this.trySendText(text, context))) {
      this.logger.info(`${context.originalText} 已执行，但当前事件没有可发送文本的会话。`);
    }
  }

  private async trySendText(text: string, context: TemplateContext): Promise<boolean> {
    const message = [{ type: 'text' as const, data: { text } }];
    if (context.scene === 'group' && context.groupId !== undefined) {
      await this.client.send_group_message({ group_id: context.groupId, message });
      return true;
    }
    if (context.scene === 'friend' && context.peerId !== undefined) {
      await this.client.send_private_message({ user_id: context.peerId, message });
      return true;
    }
    return false;
  }
}
