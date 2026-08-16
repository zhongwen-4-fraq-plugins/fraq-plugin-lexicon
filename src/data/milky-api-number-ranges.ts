import type { ApiNumberRange } from '../models/milky-api';

export const MILKY_API_NUMBER_RANGES = {
  group_id: { minimum: 10_001, maximum: 4_294_967_295 },
  message_seq: { minimum: 0, maximum: Number.MAX_SAFE_INTEGER },
} as const satisfies Readonly<Record<string, ApiNumberRange>>;
