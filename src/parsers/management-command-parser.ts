import { LexiconError } from '../errors';
import type { LexiconScopeType, MatchMode } from '../models/lexicon';

export type ManagementCommand =
  | { type: 'help' }
  | { type: 'list' }
  | { type: 'create'; scopeType: LexiconScopeType; name: string }
  | { type: 'deleteLexicon'; scopeType: LexiconScopeType; name: string }
  | { type: 'enable'; name: string }
  | { type: 'disable'; name: string }
  | { type: 'add'; lexiconName: string; matchMode: MatchMode; question: string; answer: string }
  | { type: 'deleteById'; lexiconName: string; entryId: number }
  | { type: 'deleteByQuestion'; lexiconName: string; question: string };

export function parseManagementCommand(input: string): ManagementCommand {
  const command = input.trim();
  if (!command || command === '帮助') {
    return { type: 'help' };
  }
  if (command === '列表') {
    return { type: 'list' };
  }

  const createMatch = /^(创建|删除库)\s+(全局|群)\s+(\S+)$/.exec(command);
  if (createMatch) {
    return {
      type: createMatch[1] === '创建' ? 'create' : 'deleteLexicon',
      scopeType: createMatch[2] === '全局' ? 'global' : 'group',
      name: createMatch[3],
    };
  }

  const toggleMatch = /^(启用|禁用)\s+(\S+)$/.exec(command);
  if (toggleMatch) {
    return {
      type: toggleMatch[1] === '启用' ? 'enable' : 'disable',
      name: toggleMatch[2],
    };
  }

  const addMatch = /^添加\s+(\S+)\s+(精确|模糊)\s+问\s+([\s\S]+?)\s+答\s*([\s\S]+)$/.exec(command);
  if (addMatch) {
    return {
      type: 'add',
      lexiconName: addMatch[1],
      matchMode: addMatch[2] === '精确' ? 'exact' : 'fuzzy',
      question: addMatch[3].trim(),
      answer: addMatch[4],
    };
  }

  const deleteByIdMatch = /^删除\s+(\S+)\s+id\s+(\d+)$/.exec(command);
  if (deleteByIdMatch) {
    return {
      type: 'deleteById',
      lexiconName: deleteByIdMatch[1],
      entryId: Number(deleteByIdMatch[2]),
    };
  }

  const deleteByQuestionMatch = /^删除\s+(\S+)\s+问\s+([\s\S]+)$/.exec(command);
  if (deleteByQuestionMatch) {
    return {
      type: 'deleteByQuestion',
      lexiconName: deleteByQuestionMatch[1],
      question: deleteByQuestionMatch[2].trim(),
    };
  }

  throw new LexiconError('无法识别词库命令，请发送“词库 帮助”查看用法。');
}
