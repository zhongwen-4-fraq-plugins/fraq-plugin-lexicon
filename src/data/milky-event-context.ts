import type { EventMap, milky } from '@fraqjs/fraq';

import type { MessageContext, MilkyEvent, TemplateContext } from '../models/lexicon';

export function createMessageContext(event: EventMap['message_receive'], originalText: string): MessageContext {
  const message = event.data;
  const replySegment = message.segments.find(
    (segment): segment is milky.IncomingReplySegment => segment.type === 'reply',
  );
  return {
    event,
    eventType: event.event_type,
    eventTime: event.time,
    selfId: event.self_id,
    scene: message.message_scene,
    peerId: message.peer_id,
    senderId: message.sender_id,
    messageSeq: message.message_seq,
    groupId:
      message.message_scene === 'group'
        ? message.peer_id
        : message.message_scene === 'temp'
          ? message.group?.group_id
          : undefined,
    groupRole: message.message_scene === 'group' ? message.group_member.role : undefined,
    originalText,
    segments: message.segments,
    mentionedUserIds: message.segments.flatMap((segment) => (segment.type === 'mention' ? [segment.data.user_id] : [])),
    reply: replySegment
      ? {
          messageSeq: replySegment.data.message_seq,
          senderId: replySegment.data.sender_id,
          segments: replySegment.data.segments,
        }
      : undefined,
  };
}

export function createEventContext(event: MilkyEvent): TemplateContext {
  if (event.event_type === 'message_receive') {
    return createMessageContext(event, eventTemplate(event.event_type));
  }

  const data = asRecord(event.data);
  const groupId = firstNumber(data.group_id);
  const senderId = firstNumber(
    data.sender_id,
    data.user_id,
    data.operator_id,
    data.initiator_id,
    data.invitor_id,
    data.friend_id,
  );
  const peerId = groupId ?? firstNumber(data.peer_id, data.user_id, data.sender_id, data.initiator_id, data.friend_id);
  const canReplyPrivately = event.event_type === 'friend_nudge' || event.event_type === 'friend_file_upload';

  return {
    event,
    eventType: event.event_type,
    eventTime: event.time,
    selfId: event.self_id,
    scene: groupId !== undefined ? 'group' : canReplyPrivately && peerId !== undefined ? 'friend' : undefined,
    peerId,
    senderId,
    messageSeq: firstNumber(data.message_seq),
    groupId,
    originalText: eventTemplate(event.event_type),
    segments: [],
    mentionedUserIds: [],
  };
}

export function extractMessageText(message: milky.IncomingMessage): string {
  return message.segments
    .filter((segment): segment is milky.IncomingTextSegment => segment.type === 'text')
    .map((segment) => segment.data.text)
    .join('');
}

export function eventTemplate(eventType: keyof EventMap): string {
  return `[event.${eventType}]`;
}

export function eventDataRecord(context: TemplateContext): Record<string, unknown> {
  return asRecord(context.event.data);
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function firstNumber(...values: unknown[]): number | undefined {
  return values.find((value): value is number => typeof value === 'number' && Number.isSafeInteger(value));
}
