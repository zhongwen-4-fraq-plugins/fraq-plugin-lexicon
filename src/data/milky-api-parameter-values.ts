import type { MilkyApiParameterValues } from '../models/milky-api';

const MESSAGE_SCENES = ['friend', 'group', 'temp'] as const;
const GROUP_NOTIFICATION_TYPES = ['join_request', 'invited_join_request'] as const;

export const MILKY_API_PARAMETER_VALUES: MilkyApiParameterValues = {
  set_peer_pin: { message_scene: MESSAGE_SCENES },
  get_message: { message_scene: MESSAGE_SCENES },
  get_history_messages: { message_scene: MESSAGE_SCENES },
  mark_message_as_read: { message_scene: MESSAGE_SCENES },
  send_group_message_reaction: { reaction_type: ['face', 'emoji'] },
  accept_group_request: { notification_type: GROUP_NOTIFICATION_TYPES },
  reject_group_request: { notification_type: GROUP_NOTIFICATION_TYPES },
};
