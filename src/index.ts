import { definePlugin } from '@fraqjs/fraq';

import { ApiActionRegistry } from './actions/api-action-registry';
import { LexiconController } from './core/lexicon-controller';
import { MilkyEventController } from './core/milky-event-controller';
import { LexiconRepository } from './data/lexicon-repository';
import { createMessageContext, extractMessageText } from './data/milky-event-context';
import { MILKY_EVENT_NAMES } from './data/milky-event-definitions';
import { resolveCommandText } from './parsers/command-prefix-parser';
import { LexiconService } from './services/lexicon-service';
import { MilkyApiService } from './services/milky-api-service';
import { PermissionService } from './services/permission-service';
import { TemplateService } from './services/template-service';

import { join, resolve } from 'node:path';

export interface FraqPluginLexiconOptions {
  databasePath?: string;
  owners?: number[];
  maxOutputLength?: number;
}

export const FraqPluginLexicon = definePlugin({
  name: 'fraq-plugin-lexicon',
  apply(ctx, options: FraqPluginLexiconOptions = {}) {
    const databasePath = resolve(options.databasePath ?? join('data', 'fraq-plugin-lexicon.sqlite'));
    const repository = new LexiconRepository(databasePath);
    const lexiconService = new LexiconService(repository);
    lexiconService.ensureGlobalDefault(options.owners?.[0] ?? 0);
    const permissionService = new PermissionService(options.owners ?? []);
    const milkyApiService = new MilkyApiService();
    const actionRegistry = new ApiActionRegistry((name, parameters, context) =>
      milkyApiService.execute(name, parameters, context),
    );

    const templateService = new TemplateService(lexiconService, actionRegistry, ctx.client, {
      maxOutputLength: options.maxOutputLength,
    });
    const controller = new LexiconController(lexiconService, templateService, permissionService);
    const eventController = new MilkyEventController(lexiconService, templateService, ctx.client, ctx.logger);

    ctx.on('message_receive', async (event) => {
      const { self_id, data } = event;
      if (data.sender_id === self_id) {
        return;
      }

      const text = extractMessageText(data).trim();
      const messageContext = createMessageContext(event, text);
      const session = ctx.createSession(self_id, data);
      const activations = ctx.routeActivationResolver({ type: 'command', path: [], name: '词库' }, session);
      const commandText = resolveCommandText(text, activations);
      if (commandText === '词库' || commandText?.startsWith('词库 ')) {
        await controller.handleManagement(session, commandText.slice(2), messageContext);
      } else {
        await controller.handleMessage(session, messageContext);
      }
      await eventController.handle(event);
    });

    for (const eventName of MILKY_EVENT_NAMES) {
      if (eventName === 'message_receive') {
        continue;
      }
      ctx.on(eventName, (event) => eventController.handle(event));
    }
  },
});

export default FraqPluginLexicon;
