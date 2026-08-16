import type { LexiconRepository } from '../data/lexicon-repository';
import { LexiconError } from '../errors';
import type {
  Lexicon,
  LexiconEntry,
  LexiconScopeType,
  LexiconSelector,
  MatchedLexiconEntry,
  MatchMode,
  MessageContext,
} from '../models/lexicon';
import { DEFAULT_LEXICON_NAME } from '../models/lexicon';

export class LexiconService {
  private readonly activeLexiconIds = new Map<string, number>();

  constructor(private readonly repository: LexiconRepository) {}

  ensureGlobalDefault(createdBy: number): Lexicon {
    return (
      this.repository.findLexicon(DEFAULT_LEXICON_NAME, 'global', 0) ??
      this.repository.createLexicon(DEFAULT_LEXICON_NAME, 'global', 0, createdBy)
    );
  }

  ensureDefaultLexicon(context: MessageContext): Lexicon {
    const defaultLexicon =
      context.groupId === undefined
        ? this.ensureGlobalDefault(context.senderId)
        : (this.repository.findLexicon(DEFAULT_LEXICON_NAME, 'group', context.groupId) ??
          this.repository.createLexicon(DEFAULT_LEXICON_NAME, 'group', context.groupId, context.senderId));
    const key = selectionKey(context);
    const activeLexicon = this.repository.getLexiconById(this.activeLexiconIds.get(key) ?? -1);
    if (activeLexicon && isLexiconInContext(activeLexicon, context)) {
      return activeLexicon;
    }
    this.activeLexiconIds.set(key, defaultLexicon.id);
    return defaultLexicon;
  }

  switchLexicon(rawName: string, context: MessageContext): Lexicon {
    const selector = parseLexiconSelector(rawName);
    const lexicon = this.findNamedLexicons(selector, context, false)[0];
    if (!lexicon) {
      throw new LexiconError(`没有找到可切换的词库“${selector.name}”。`);
    }
    this.activeLexiconIds.set(selectionKey(context), lexicon.id);
    return lexicon;
  }

  createLexicon(name: string, scopeType: LexiconScopeType, context: MessageContext): Lexicon {
    const normalizedName = validateLexiconName(name);
    const scopeId = this.scopeId(scopeType, context);
    if (this.repository.findLexicon(normalizedName, scopeType, scopeId)) {
      throw new LexiconError(`词库“${normalizedName}”已经存在。`);
    }
    return this.repository.createLexicon(normalizedName, scopeType, scopeId, context.senderId);
  }

  deleteLexicon(name: string, scopeType: LexiconScopeType, context: MessageContext): Lexicon {
    const lexicon = this.repository.findLexicon(validateLexiconName(name), scopeType, this.scopeId(scopeType, context));
    if (!lexicon) {
      throw new LexiconError(`没有找到${scopeLabel(scopeType)}词库“${name}”。`);
    }
    this.repository.deleteLexicon(lexicon.id);
    return lexicon;
  }

  addEntry(
    lexiconName: string | undefined,
    matchMode: MatchMode,
    question: string,
    answer: string,
    context: MessageContext,
  ): { lexicon: Lexicon; entry: LexiconEntry } {
    if (!question) {
      throw new LexiconError('问题内容不能为空。');
    }
    if (!answer) {
      throw new LexiconError('回答内容不能为空。');
    }
    const lexicon = this.resolveManageableLexicon(lexiconName, context);
    try {
      const entry = this.repository.addEntry(lexicon.id, matchMode, question, answer, context.senderId);
      return { lexicon, entry };
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new LexiconError('该词库中已经存在相同匹配方式和问题的词条。');
      }
      throw error;
    }
  }

  deleteEntryById(lexiconName: string | undefined, entryId: number, context: MessageContext): Lexicon {
    const lexicon = this.resolveManageableLexicon(lexiconName, context);
    if (!this.repository.deleteEntryById(lexicon.id, entryId)) {
      throw new LexiconError(`词库“${lexicon.name}”中没有 ID 为 ${entryId} 的词条。`);
    }
    return lexicon;
  }

  deleteEntriesByQuestion(
    lexiconName: string | undefined,
    question: string,
    context: MessageContext,
  ): { lexicon: Lexicon; count: number } {
    const lexicon = this.resolveManageableLexicon(lexiconName, context);
    const count = this.repository.deleteEntriesByQuestion(lexicon.id, question);
    if (count === 0) {
      throw new LexiconError(`词库“${lexicon.name}”中没有问题为“${question}”的词条。`);
    }
    return { lexicon, count };
  }

  enableGlobalLexicon(name: string, context: MessageContext, enabled: boolean): boolean {
    if (context.groupId === undefined) {
      throw new LexiconError('启用或禁用全局词库只能在群聊中执行。');
    }
    const lexicon = this.repository.findLexicon(validateLexiconName(name), 'global', 0);
    if (!lexicon) {
      throw new LexiconError(`没有找到全局词库“${name}”。`);
    }
    return this.repository.setGlobalLexiconEnabled(context.groupId, lexicon.id, context.senderId, enabled);
  }

  listLexicons(context: MessageContext): { group: Lexicon[]; global: Array<Lexicon & { enabled: boolean }> } {
    const group = context.groupId === undefined ? [] : this.repository.listGroupLexicons(context.groupId);
    const global = this.repository.listGlobalLexicons().map((lexicon) => ({
      ...lexicon,
      enabled: context.groupId === undefined || this.repository.isGlobalLexiconEnabled(context.groupId, lexicon.id),
    }));
    return { group, global };
  }

  resolveManageableLexicon(rawName: string | undefined, context: MessageContext): Lexicon {
    if (!rawName) {
      return this.ensureDefaultLexicon(context);
    }
    const selector = parseLexiconSelector(rawName);
    const candidates = this.findNamedLexicons(selector, context, false);
    const lexicon = candidates[0];
    if (!lexicon) {
      throw new LexiconError(`没有找到词库“${selector.name}”。`);
    }
    return lexicon;
  }

  matchMessage(context: MessageContext, rawName?: string): MatchedLexiconEntry | undefined {
    const lexicons = rawName
      ? this.findNamedLexicons(parseLexiconSelector(rawName), context, true)
      : this.availableLexicons(context);
    const matches = this.repository.findMatchingEntries(
      lexicons.map((lexicon) => lexicon.id),
      context.originalText,
    );
    return matches.sort(compareMatches)[0];
  }

  private availableLexicons(context: MessageContext): Lexicon[] {
    if (context.groupId === undefined) {
      return this.repository.listGlobalLexicons();
    }
    return [
      ...this.repository.listGroupLexicons(context.groupId),
      ...this.repository.listEnabledGlobalLexicons(context.groupId),
    ];
  }

  private findNamedLexicons(
    selector: LexiconSelector,
    context: MessageContext,
    requireEnabledGlobal: boolean,
  ): Lexicon[] {
    const lexicons: Lexicon[] = [];
    if (selector.scopeType !== 'global' && context.groupId !== undefined) {
      const groupLexicon = this.repository.findLexicon(selector.name, 'group', context.groupId);
      if (groupLexicon) {
        lexicons.push(groupLexicon);
      }
    }
    if (selector.scopeType !== 'group') {
      const globalLexicon = this.repository.findLexicon(selector.name, 'global', 0);
      const canUseGlobal =
        globalLexicon &&
        (!requireEnabledGlobal ||
          context.groupId === undefined ||
          this.repository.isGlobalLexiconEnabled(context.groupId, globalLexicon.id));
      if (globalLexicon && canUseGlobal) {
        lexicons.push(globalLexicon);
      }
    }
    return lexicons;
  }

  private scopeId(scopeType: LexiconScopeType, context: MessageContext): number {
    if (scopeType === 'global') {
      return 0;
    }
    if (context.groupId === undefined) {
      throw new LexiconError('群词库只能在群聊中管理。');
    }
    return context.groupId;
  }
}

export function parseLexiconSelector(rawName: string): LexiconSelector {
  if (rawName.startsWith('全局:')) {
    return { name: validateLexiconName(rawName.slice(3)), scopeType: 'global' };
  }
  if (rawName.startsWith('群:')) {
    return { name: validateLexiconName(rawName.slice(2)), scopeType: 'group' };
  }
  return { name: validateLexiconName(rawName) };
}

function validateLexiconName(name: string): string {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new LexiconError('词库名不能为空。');
  }
  if (/[\s.[\]\\]/.test(normalizedName)) {
    throw new LexiconError('词库名不能包含空白、点号、方括号或反斜杠。');
  }
  return normalizedName;
}

function compareMatches(left: MatchedLexiconEntry, right: MatchedLexiconEntry): number {
  const modeDifference = matchModePriority(left.matchMode) - matchModePriority(right.matchMode);
  if (modeDifference !== 0) {
    return modeDifference;
  }
  const scopeDifference = scopePriority(left.scopeType) - scopePriority(right.scopeType);
  if (scopeDifference !== 0) {
    return scopeDifference;
  }
  const lengthDifference = right.question.length - left.question.length;
  return lengthDifference !== 0 ? lengthDifference : left.id - right.id;
}

function matchModePriority(matchMode: MatchMode): number {
  return matchMode === 'exact' ? 0 : 1;
}

function scopePriority(scopeType: LexiconScopeType): number {
  return scopeType === 'group' ? 0 : 1;
}

function scopeLabel(scopeType: LexiconScopeType): string {
  return scopeType === 'group' ? '群' : '全局';
}

function selectionKey(context: MessageContext): string {
  return context.groupId === undefined ? `${context.scene}:${context.peerId}` : `group:${context.groupId}`;
}

function isLexiconInContext(lexicon: Lexicon, context: MessageContext): boolean {
  return lexicon.scopeType === 'global' || lexicon.scopeId === context.groupId;
}
