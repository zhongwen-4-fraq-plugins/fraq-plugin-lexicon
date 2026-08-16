import type { milky } from '@fraqjs/fraq';

import type { TemplateContext } from '../models/lexicon';
import { eventDataRecord } from './milky-event-context';

export function createApiEventDefaults(context: TemplateContext): Record<string, unknown> {
  const sourceSegments = context.reply?.segments ?? context.segments;
  const eventData = eventDataRecord(context);
  const preferredUserId =
    context.mentionedUserIds[0] ??
    context.reply?.senderId ??
    readNumber(eventData.user_id) ??
    readNumber(eventData.sender_id) ??
    readNumber(eventData.operator_id) ??
    readNumber(eventData.initiator_id) ??
    context.senderId;
  const preferredMessageSeq = context.reply?.messageSeq ?? context.messageSeq;
  const mediaSegment = sourceSegments.find(isMediaSegment);
  const fileSegment = sourceSegments.find((segment): segment is milky.IncomingFileSegment => segment.type === 'file');
  const forwardSegment = sourceSegments.find(
    (segment): segment is milky.IncomingForwardSegment => segment.type === 'forward',
  );
  const message = toOutgoingSegments(sourceSegments);
  const defaults: Record<string, unknown> = {
    ...definedEntries(eventData),
    no_cache: false,
    is_filtered: false,
    is_self: false,
    is_self_send: false,
    limit: 20,
    count: 1,
  };

  setDefined(defaults, 'user_id', preferredUserId);
  setDefined(defaults, 'message_scene', context.scene);
  setDefined(defaults, 'peer_id', context.peerId);
  setDefined(defaults, 'message_seq', preferredMessageSeq);
  setDefined(defaults, 'start_message_seq', preferredMessageSeq);

  if (context.groupId !== undefined) {
    defaults.group_id = context.groupId;
  }
  if (message.length > 0) {
    defaults.message = message;
    defaults.content = extractSegmentText(sourceSegments);
  }
  if (mediaSegment) {
    defaults.resource_id = mediaSegment.data.resource_id;
    defaults.uri = mediaSegment.data.temp_url;
    defaults.file_uri = mediaSegment.data.temp_url;
    if (mediaSegment.type === 'image') {
      defaults.image_uri = mediaSegment.data.temp_url;
    }
  }
  if (fileSegment) {
    defaults.file_id = fileSegment.data.file_id;
    defaults.file_name = fileSegment.data.file_name;
    if (fileSegment.data.file_hash) {
      defaults.file_hash = fileSegment.data.file_hash;
    }
  }
  if (forwardSegment) {
    defaults.forward_id = forwardSegment.data.forward_id;
  }

  return defaults;
}

function definedEntries(source: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(source).filter(([, value]) => value !== undefined));
}

function setDefined(target: Record<string, unknown>, name: string, value: unknown): void {
  if (value !== undefined) {
    target[name] = value;
  }
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) ? value : undefined;
}

function toOutgoingSegments(segments: milky.IncomingSegment[]): unknown[] {
  const outgoing: unknown[] = [];

  for (const segment of segments) {
    switch (segment.type) {
      case 'text':
        outgoing.push({ type: 'text', data: { text: segment.data.text } });
        break;
      case 'mention':
        outgoing.push({ type: 'mention', data: { user_id: segment.data.user_id } });
        break;
      case 'mention_all':
        outgoing.push({ type: 'mention_all', data: {} });
        break;
      case 'face':
        outgoing.push({ type: 'face', data: { face_id: segment.data.face_id, is_large: segment.data.is_large } });
        break;
      case 'reply':
        outgoing.push({ type: 'reply', data: { message_seq: segment.data.message_seq } });
        break;
      case 'image':
        outgoing.push({
          type: 'image',
          data: { uri: segment.data.temp_url, sub_type: segment.data.sub_type, summary: segment.data.summary },
        });
        break;
      case 'record':
        outgoing.push({ type: 'record', data: { uri: segment.data.temp_url } });
        break;
      case 'video':
        outgoing.push({ type: 'video', data: { uri: segment.data.temp_url } });
        break;
      case 'market_face':
        outgoing.push({
          type: 'image',
          data: { uri: segment.data.url, sub_type: 'sticker', summary: segment.data.summary },
        });
        break;
      case 'light_app':
        outgoing.push({ type: 'light_app', data: { json_payload: segment.data.json_payload } });
        break;
      case 'markdown':
        outgoing.push({ type: 'text', data: { text: segment.data.content } });
        break;
      case 'xml':
        outgoing.push({ type: 'text', data: { text: segment.data.xml_payload } });
        break;
    }
  }

  return outgoing;
}

function extractSegmentText(segments: milky.IncomingSegment[]): string {
  return segments
    .flatMap((segment) => {
      if (segment.type === 'text') {
        return [segment.data.text];
      }
      if (segment.type === 'markdown') {
        return [segment.data.content];
      }
      if (segment.type === 'xml') {
        return [segment.data.xml_payload];
      }
      return [];
    })
    .join('');
}

function isMediaSegment(
  segment: milky.IncomingSegment,
): segment is milky.IncomingImageSegment | milky.IncomingRecordSegment | milky.IncomingVideoSegment {
  return segment.type === 'image' || segment.type === 'record' || segment.type === 'video';
}
