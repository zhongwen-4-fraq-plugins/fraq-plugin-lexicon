import type { EventMap, milky } from '@fraqjs/fraq';

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
  questionVariables?: ReadonlyMap<string, string>;
}

export type MilkyEvent = EventMap[keyof EventMap];

export interface TemplateContext {
  event: MilkyEvent;
  eventType: keyof EventMap;
  eventTime: number;
  selfId: number;
  scene?: 'friend' | 'group' | 'temp';
  peerId?: number;
  senderId?: number;
  messageSeq?: number;
  groupId?: number;
  groupRole?: 'owner' | 'admin' | 'member';
  originalText: string;
  segments: milky.IncomingSegment[];
  mentionedUserIds: number[];
  reply?: {
    messageSeq: number;
    senderId: number;
    segments: milky.IncomingSegment[];
  };
}

export interface MessageContext extends TemplateContext {
  event: EventMap['message_receive'];
  eventType: 'message_receive';
  scene: 'friend' | 'group' | 'temp';
  peerId: number;
  senderId: number;
  messageSeq: number;
}

export interface LexiconSelector {
  name: string;
  scopeType?: LexiconScopeType;
}
