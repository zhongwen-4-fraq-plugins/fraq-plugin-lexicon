import { LexiconError } from '../errors';
import type { LexiconScopeType, MatchMode } from '../models/lexicon';

export type ManagementCommand =
  | { type: 'help' }
  | { type: 'list' }
  | { type: 'create'; scopeType: LexiconScopeType; name: string }
  | { type: 'deleteLexicon'; scopeType: LexiconScopeType; name: string }
  | { type: 'switch'; lexiconName: string }
  | { type: 'enable'; name: string }
  | { type: 'disable'; name: string }
  | { type: 'add'; lexiconName?: string; matchMode: MatchMode; question: string; answer: string }
  | { type: 'deleteById'; lexiconName?: string; entryId: number }
  | { type: 'deleteByQuestion'; lexiconName?: string; question: string };

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

  const switchMatch = /^切换\s+(\S+)$/.exec(command);
  if (switchMatch) {
    return { type: 'switch', lexiconName: switchMatch[1] };
  }

  const toggleMatch = /^(启用|禁用)\s+(\S+)$/.exec(command);
  if (toggleMatch) {
    return {
      type: toggleMatch[1] === '启用' ? 'enable' : 'disable',
      name: toggleMatch[2],
    };
  }

  const addWithNameMatch = /^添加\s+(\S+)\s+(精确|模糊)\s+问\s+([\s\S]+?)\s+答\s*([\s\S]+)$/.exec(command);
  const addDefaultMatch = /^添加\s+(精确|模糊)\s+问\s+([\s\S]+?)\s+答\s*([\s\S]+)$/.exec(command);
  if (addWithNameMatch) {
    return {
      type: 'add',
      lexiconName: addWithNameMatch[1],
      matchMode: addWithNameMatch[2] === '精确' ? 'exact' : 'fuzzy',
      question: addWithNameMatch[3].trim(),
      answer: addWithNameMatch[4],
    };
  }
  if (addDefaultMatch) {
    return {
      type: 'add',
      matchMode: addDefaultMatch[1] === '精确' ? 'exact' : 'fuzzy',
      question: addDefaultMatch[2].trim(),
      answer: addDefaultMatch[3],
    };
  }

  const deleteByIdWithNameMatch = /^删除\s+(\S+)\s+id\s+(\d+)$/.exec(command);
  const deleteByIdDefaultMatch = /^删除\s+id\s+(\d+)$/.exec(command);
  if (deleteByIdWithNameMatch) {
    return {
      type: 'deleteById',
      lexiconName: deleteByIdWithNameMatch[1],
      entryId: Number(deleteByIdWithNameMatch[2]),
    };
  }
  if (deleteByIdDefaultMatch) {
    return {
      type: 'deleteById',
      entryId: Number(deleteByIdDefaultMatch[1]),
    };
  }

  const deleteByQuestionWithNameMatch = /^删除\s+(\S+)\s+问\s+([\s\S]+)$/.exec(command);
  const deleteByQuestionDefaultMatch = /^删除\s+问\s+([\s\S]+)$/.exec(command);
  if (deleteByQuestionWithNameMatch) {
    return {
      type: 'deleteByQuestion',
      lexiconName: deleteByQuestionWithNameMatch[1],
      question: deleteByQuestionWithNameMatch[2].trim(),
    };
  }
  if (deleteByQuestionDefaultMatch) {
    return {
      type: 'deleteByQuestion',
      question: deleteByQuestionDefaultMatch[1].trim(),
    };
  }

  throw new LexiconError('无法识别词库命令，请发送“词库 帮助”查看用法。');
}
