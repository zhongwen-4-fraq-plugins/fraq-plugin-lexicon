import type { Session } from '@fraqjs/fraq';

import { errorMessage, UserInputTimeoutError } from '../errors';
import type { Lexicon, LexiconEntry, MessageContext } from '../models/lexicon';
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

  async handleManagement(session: Session, commandText: string, context: MessageContext): Promise<void> {
    try {
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
          const lexicon = this.resolveManageableLexicon(command.lexiconName, context);
          const entry = this.lexiconService.addEntry(
            lexicon,
            command.matchMode,
            command.question,
            command.answer,
            context.senderId,
          );
          await session.reply(`已添加词条 ${entry.id} 到词库“${lexicon.name}”。`);
          return;
        }
        case 'query': {
          const lexicon = this.resolveManageableLexicon(command.lexiconName, context);
          const entry = this.lexiconService.getLexiconEntry(lexicon, command.entryId);
          await session.reply(formatEntry(lexicon, entry));
          return;
        }
        case 'update': {
          const lexicon = this.resolveManageableLexicon(command.lexiconName, context);
          const entry = this.lexiconService.updateEntry(lexicon, command.entryId, command.question, command.answer);
          await session.reply(`已修改词库“${lexicon.name}”中的词条 ${entry.id}。\n${formatEntry(lexicon, entry)}`);
          return;
        }
        case 'deleteById': {
          const lexicon = this.resolveManageableLexicon(command.lexiconName, context);
          this.lexiconService.deleteEntryById(lexicon, command.entryId);
          await session.reply(`已从词库“${lexicon.name}”删除词条 ${command.entryId}。`);
          return;
        }
        case 'deleteByQuestion': {
          const lexicon = this.resolveManageableLexicon(command.lexiconName, context);
          const count = this.lexiconService.deleteEntriesByQuestion(lexicon, command.question);
          await session.reply(`已从词库“${lexicon.name}”删除 ${count} 个词条。`);
          return;
        }
      }
    } catch (error) {
      await session.reply(`词库操作失败：${errorMessage(error)}`);
    }
  }

  async handleMessage(session: Session, context: MessageContext): Promise<void> {
    if (!context.originalText) {
      return;
    }

    const match = this.lexiconService.matchMessage(context);
    if (!match) {
      return;
    }

    try {
      const reply = await this.templateService.render(
        match.answer,
        context,
        match.questionVariables,
        async (prompt) => {
          await session.reply(prompt);
        },
      );
      if (reply) {
        await session.reply(reply);
      }
    } catch (error) {
      if (error instanceof UserInputTimeoutError) {
        return;
      }
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

  private resolveManageableLexicon(name: string | undefined, context: MessageContext): Lexicon {
    const lexicon = this.lexiconService.resolveManageableLexicon(name, context);
    this.permissionService.assertCanManageLexicon(lexicon, context);
    return lexicon;
  }
}

function scopeLabel(scopeType: 'global' | 'group'): string {
  return scopeType === 'global' ? '全局' : '群';
}

function formatEntry(lexicon: Lexicon, entry: LexiconEntry): string {
  return [
    `词条 ${entry.id}：`,
    `词库：${lexicon.name}（${scopeLabel(lexicon.scopeType)}）`,
    `匹配：${entry.matchMode === 'exact' ? '精确' : '模糊'}`,
    `问：${entry.question}`,
    `答：${entry.answer}`,
  ].join('\n');
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
    '词库 查询 <词条ID>（当前词库）',
    '词库 查询 <词库名> <词条ID>',
    '词库 修改 <词条ID> [问 <新问题>] 答 <新回答>（当前词库）',
    '词库 修改 <词库名> <词条ID> [问 <新问题>] 答 <新回答>',
    '词库 添加 <精确|模糊> 问 <内容> 答 <内容>（当前词库）',
    '词库 添加 <词库名> <精确|模糊> 问 <内容> 答 <内容>',
    '词库 删除 id <词条ID>（当前词库）',
    '词库 删除 问 <内容>（当前词库）',
    '词库 删除 <词库名> id <词条ID>',
    '词库 删除 <词库名> 问 <内容>',
    '',
    '词条：',
    '[api.<英文 API 端点>.<参数名>=<参数值>]',
    '支持 user_id 的 API 可使用 qq 作为参数简写。',
    '[api.send_group_nudge] 会从当前事件读取群号和目标 QQ。',
    '群请求、消息反应、文件和撤回事件会自动转换对应 API 参数。',
    '缺少必填参数或枚举值错误时会直接返回参数说明。',
    'group_id 范围为 10001..4294967295，message_seq 范围为 0..9007199254740991。',
    '[event.<事件名>] 可作为问题匹配 Milky 事件，例如 [event.group_nudge]。',
    '[event.<字段路径>] 可在回答中读取事件字段，例如 [event.data.user_id]。',
    '[消息.取值.<消息段类型>.<字段路径>] 读取当前消息的首个同类型消息段，例如 [消息.取值.mention.user_id]。',
    '[消息.构建.text.<内容>] 构建文本消息段，可嵌套到 API 的 message 参数。',
    '[逻辑.or.<文本1>.<文本2>...] 在条件外随机选择一项。',
    '[逻辑.and.<文本1>.<文本2>...] 在条件外依次拼接。',
    '[逻辑.请求用户输入.<提示消息>] 发送提示并等待同一用户在同一会话中的下一条消息。',
    '[逻辑.如果][逻辑.<or|and|in>.<参数...>]内容[逻辑.否则]内容[逻辑.如果.结束] 执行条件分支。',
    '[逻辑.否则如果] 和 [逻辑.否则] 可省略；条件块支持无限嵌套。',
    '事件、消息段与变量词条在问题和回答中都可使用，并支持互相嵌套。问题创建的变量可在对应回答中读取。',
    '[变量.创建.A=内容] 与 [变量.读取.A] 也可嵌套在 API 参数和返回值中。',
    '[词库.<词库名>] 使用当前消息匹配指定词库，并继续解析其回答。',
    '同名词库可使用 全局:<名称> 或 群:<名称> 明确指定作用域。',
  ].join('\n');
}
