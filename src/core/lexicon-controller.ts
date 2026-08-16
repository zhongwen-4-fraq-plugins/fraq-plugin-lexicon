import type { milky, Session } from '@fraqjs/fraq';

import { errorMessage } from '../errors';
import type { MessageContext } from '../models/lexicon';
import { parseManagementCommand } from '../parsers/management-command-parser';
import type { LexiconService } from '../services/lexicon-service';
import type { PermissionService } from '../services/permission-service';
import type { TemplateService } from '../services/template-service';

export class LexiconController {
  constructor(
    private readonly lexiconService: LexiconService,
    private readonly templateService: TemplateService,
    private readonly permissionService: PermissionService,
  ) {}

  async handleManagement(session: Session, commandText: string): Promise<void> {
    const context = createMessageContext(session.raw, extractText(session.raw));

    try {
      this.lexiconService.ensureDefaultLexicon(context);
      const command = parseManagementCommand(commandText);
      switch (command.type) {
        case 'help':
          await session.reply(helpText());
          return;
        case 'list':
          await session.reply(this.listLexicons(context));
          return;
        case 'create': {
          this.permissionService.assertCanCreate(command.scopeType, context);
          const lexicon = this.lexiconService.createLexicon(command.name, command.scopeType, context);
          await session.reply(`已创建${scopeLabel(lexicon.scopeType)}词库“${lexicon.name}”（ID: ${lexicon.id}）。`);
          return;
        }
        case 'deleteLexicon': {
          this.permissionService.assertCanCreate(command.scopeType, context);
          const lexicon = this.lexiconService.deleteLexicon(command.name, command.scopeType, context);
          await session.reply(`已删除${scopeLabel(lexicon.scopeType)}词库“${lexicon.name}”。`);
          return;
        }
        case 'switch': {
          const lexicon = this.lexiconService.switchLexicon(command.lexiconName, context);
          await session.reply(`已切换当前管理词库为“${lexicon.name}”（${scopeLabel(lexicon.scopeType)}）。`);
          return;
        }
        case 'enable':
        case 'disable': {
          this.permissionService.assertCanManageGroup(context);
          const enabled = command.type === 'enable';
          const changed = this.lexiconService.enableGlobalLexicon(command.name, context, enabled);
          await session.reply(
            changed
              ? `已${enabled ? '启用' : '禁用'}全局词库“${command.name}”。`
              : `全局词库“${command.name}”已经${enabled ? '启用' : '禁用'}。`,
          );
          return;
        }
        case 'add': {
          const lexicon = this.lexiconService.resolveManageableLexicon(command.lexiconName, context);
          this.permissionService.assertCanManageLexicon(lexicon, context);
          const result = this.lexiconService.addEntry(
            command.lexiconName,
            command.matchMode,
            command.question,
            command.answer,
            context,
          );
          await session.reply(`已添加词条 ${result.entry.id} 到词库“${result.lexicon.name}”。`);
          return;
        }
        case 'deleteById': {
          const lexicon = this.lexiconService.resolveManageableLexicon(command.lexiconName, context);
          this.permissionService.assertCanManageLexicon(lexicon, context);
          this.lexiconService.deleteEntryById(command.lexiconName, command.entryId, context);
          await session.reply(`已从词库“${lexicon.name}”删除词条 ${command.entryId}。`);
          return;
        }
        case 'deleteByQuestion': {
          const lexicon = this.lexiconService.resolveManageableLexicon(command.lexiconName, context);
          this.permissionService.assertCanManageLexicon(lexicon, context);
          const result = this.lexiconService.deleteEntriesByQuestion(command.lexiconName, command.question, context);
          await session.reply(`已从词库“${result.lexicon.name}”删除 ${result.count} 个词条。`);
        }
      }
    } catch (error) {
      await session.reply(`词库操作失败：${errorMessage(error)}`);
    }
  }

  async handleMessage(session: Session): Promise<void> {
    const text = extractText(session.raw).trim();
    if (!text) {
      return;
    }

    const context = createMessageContext(session.raw, text);
    this.lexiconService.ensureDefaultLexicon(context);
    const match = this.lexiconService.matchMessage(context);
    if (!match) {
      return;
    }

    try {
      const reply = await this.templateService.render(match.answer, context);
      if (reply) {
        await session.reply(reply);
      }
    } catch (error) {
      await session.reply(`词条执行失败：${errorMessage(error)}`);
    }
  }

  private listLexicons(context: MessageContext): string {
    const lexicons = this.lexiconService.listLexicons(context);
    const lines = ['词库列表：'];

    if (context.groupId !== undefined) {
      lines.push('群词库：');
      lines.push(
        ...(lexicons.group.length > 0 ? lexicons.group.map((item) => `- ${item.name}（ID: ${item.id}）`) : ['- 无']),
      );
    }

    lines.push('全局词库：');
    lines.push(
      ...(lexicons.global.length > 0
        ? lexicons.global.map(
            (item) =>
              `- ${item.name}（ID: ${item.id}${context.groupId === undefined ? '' : `，${item.enabled ? '已启用' : '未启用'}`}）`,
          )
        : ['- 无']),
    );
    return lines.join('\n');
  }
}

export function extractText(message: milky.IncomingMessage): string {
  return message.segments
    .filter((segment): segment is milky.IncomingTextSegment => segment.type === 'text')
    .map((segment) => segment.data.text)
    .join('');
}

function createMessageContext(message: milky.IncomingMessage, originalText: string): MessageContext {
  return {
    scene: message.message_scene,
    peerId: message.peer_id,
    senderId: message.sender_id,
    groupId:
      message.message_scene === 'group'
        ? message.peer_id
        : message.message_scene === 'temp'
          ? message.group?.group_id
          : undefined,
    groupRole: message.message_scene === 'group' ? message.group_member.role : undefined,
    originalText,
  };
}

function scopeLabel(scopeType: 'global' | 'group'): string {
  return scopeType === 'global' ? '全局' : '群';
}

function helpText(): string {
  return [
    '词库命令：',
    '词库 创建 <全局|群> <词库名>',
    '词库 删除库 <全局|群> <词库名>',
    '词库 启用 <全局词库名>',
    '词库 禁用 <全局词库名>',
    '词库 切换 <词库名>',
    '词库 列表',
    '词库 添加 <精确|模糊> 问 <内容> 答 <内容>（默认词库）',
    '词库 添加 <词库名> <精确|模糊> 问 <内容> 答 <内容>',
    '词库 删除 id <词条ID>（默认词库）',
    '词库 删除 问 <内容>（默认词库）',
    '词库 删除 <词库名> id <词条ID>',
    '词库 删除 <词库名> 问 <内容>',
    '',
    '词条：',
    '[api.戳一戳] 或 [api.戳一戳.user_id=QQ号]',
    '[词库.<词库名>] 使用当前消息匹配指定词库，并继续解析其回答。',
    '同名词库可使用 全局:<名称> 或 群:<名称> 明确指定作用域。',
  ].join('\n');
}
