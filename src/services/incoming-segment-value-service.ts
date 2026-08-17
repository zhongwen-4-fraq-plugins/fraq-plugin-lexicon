import { LexiconError } from '../errors';
import type { TemplateContext } from '../models/lexicon';
import { resolveTemplateValue } from '../parsers/template-value-parser';

export class IncomingSegmentValueService {
  resolve(segmentType: string, path: string[], context: TemplateContext): string {
    const segment = context.segments.find((candidate) => candidate.type === segmentType);
    if (!segment) {
      throw new LexiconError(`当前消息不存在“${segmentType}”消息段。`);
    }
    return resolveTemplateValue(segment.data, path, `消息段“${segmentType}”字段`);
  }
}
