import { definePlugin } from '@fraqjs/fraq';

import { ApiActionRegistry } from './actions/api-action-registry';
import { nudgeAction } from './actions/nudge-action';
import { extractText, LexiconController } from './core/lexicon-controller';
import { LexiconRepository } from './data/lexicon-repository';
import { stripCommandPrefix } from './parsers/command-prefix-parser';
import { LexiconService } from './services/lexicon-service';
import { PermissionService } from './services/permission-service';
import { TemplateService } from './services/template-service';

import { join, resolve } from 'node:path';

export interface FraqPluginLexiconOptions {
  databasePath?: string;
  owners?: number[];
  maxOutputLength?: number;
  prefix?: string;
}

export const FraqPluginLexicon = definePlugin({
  name: 'fraq-plugin-lexicon',
  apply(ctx, options: FraqPluginLexiconOptions = {}) {
    const databasePath = resolve(options.databasePath ?? join('data', 'fraq-plugin-lexicon.sqlite'));
    const repository = new LexiconRepository(databasePath);
    const lexiconService = new LexiconService(repository);
    const permissionService = new PermissionService(options.owners ?? []);
    const actionRegistry = new ApiActionRegistry();
    actionRegistry.register('戳一戳', nudgeAction);

    const templateService = new TemplateService(lexiconService, actionRegistry, ctx.client, {
      maxOutputLength: options.maxOutputLength,
    });
    const controller = new LexiconController(lexiconService, templateService, permissionService);

    ctx.on('message_receive', async ({ self_id, data }) => {
      if (data.sender_id === self_id) {
        return;
      }

      const text = extractText(data).trim();
      const session = ctx.createSession(self_id, data);
      const commandText = stripCommandPrefix(text, options.prefix ?? '');
      if (commandText === '词库' || commandText?.startsWith('词库 ')) {
        await controller.handleManagement(session, commandText.slice(2));
        return;
      }
      await controller.handleMessage(session);
    });
  },
});

export default FraqPluginLexicon;
