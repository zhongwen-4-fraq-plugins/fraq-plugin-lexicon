import { LexiconError } from '../errors';
import { escapeTemplateText } from '../parsers/template-parser';

export class MessageSegmentBuildService {
  build(segmentType: string, content: string): string {
    if (segmentType !== 'text') {
      throw new LexiconError(`暂不支持构建“${segmentType}”消息段。`);
    }

    return escapeTemplateText(
      JSON.stringify({
        type: 'text',
        data: { text: content },
      }),
    );
  }
}
