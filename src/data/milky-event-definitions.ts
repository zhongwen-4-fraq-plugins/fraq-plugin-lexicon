import type { EventMap } from '@fraqjs/fraq';

export const MILKY_EVENT_DEFINITIONS = {
  bot_offline: true,
  message_receive: true,
  message_recall: true,
  peer_pin_change: true,
  friend_request: true,
  group_join_request: true,
  group_invited_join_request: true,
  group_invitation: true,
  friend_nudge: true,
  friend_file_upload: true,
  group_admin_change: true,
  group_essence_message_change: true,
  group_member_increase: true,
  group_member_decrease: true,
  group_disband: true,
  group_name_change: true,
  group_message_reaction: true,
  group_mute: true,
  group_whole_mute: true,
  group_nudge: true,
  group_file_upload: true,
} as const satisfies Readonly<Record<keyof EventMap, true>>;

export const MILKY_EVENT_NAMES = Object.keys(MILKY_EVENT_DEFINITIONS) as Array<keyof EventMap>;
