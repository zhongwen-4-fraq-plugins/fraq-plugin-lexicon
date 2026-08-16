export type LexiconScopeType = 'global' | 'group';

export const DEFAULT_LEXICON_NAME = '默认';

export type MatchMode = 'exact' | 'fuzzy';

export interface Lexicon {
  id: number;
  name: string;
  scopeType: LexiconScopeType;
  scopeId: number;
  createdBy: number;
  createdAt: number;
}

export interface LexiconEntry {
  id: number;
  lexiconId: number;
  matchMode: MatchMode;
  question: string;
  answer: string;
  createdBy: number;
  createdAt: number;
}

export interface MatchedLexiconEntry extends LexiconEntry {
  lexiconName: string;
  scopeType: LexiconScopeType;
  scopeId: number;
}

export interface MessageContext {
  scene: 'friend' | 'group' | 'temp';
  peerId: number;
  senderId: number;
  groupId?: number;
  groupRole?: 'owner' | 'admin' | 'member';
  originalText: string;
}

export interface LexiconSelector {
  name: string;
  scopeType?: LexiconScopeType;
}
