import { LexiconError } from '../errors';
import type { Lexicon, LexiconScopeType, MessageContext } from '../models/lexicon';

export class PermissionService {
  private readonly owners: Set<number>;

  constructor(owners: number[]) {
    this.owners = new Set(owners);
  }

  assertCanCreate(scopeType: LexiconScopeType, context: MessageContext): void {
    if (scopeType === 'global') {
      this.assertOwner(context);
      return;
    }
    this.assertGroupManager(context);
  }

  assertCanManageLexicon(lexicon: Lexicon, context: MessageContext): void {
    if (lexicon.scopeType === 'global') {
      this.assertOwner(context);
      return;
    }
    if (context.groupId !== lexicon.scopeId) {
      throw new LexiconError('不能管理其他群的词库。');
    }
    this.assertGroupManager(context);
  }

  assertCanManageGroup(context: MessageContext): void {
    this.assertGroupManager(context);
  }

  private assertOwner(context: MessageContext): void {
    if (!this.owners.has(context.senderId)) {
      throw new LexiconError('该操作仅机器人主人可以执行。');
    }
  }

  private assertGroupManager(context: MessageContext): void {
    if (this.owners.has(context.senderId)) {
      return;
    }
    if (context.scene !== 'group' || !context.groupRole || context.groupRole === 'member') {
      throw new LexiconError('该操作仅群主、群管理员或机器人主人可以执行。');
    }
  }
}
