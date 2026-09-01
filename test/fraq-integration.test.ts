import { createMockContext, inseg } from '@fraqjs/plugin-mock';
import RandomPlugin from '@fraqjs/plugin-random';

import FraqPluginLexicon from '../src/index';

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('Fraq 1.1 可以安装插件并通过 mock 完成群消息回复', async () => {
  const dataPath = mkdtempSync(join(tmpdir(), 'fraq-plugin-lexicon-integration-'));
  const ownerId = 10001;
  const groupId = 12345;
  const ctx = createMockContext({ logHandler: () => {} });

  ctx.install(RandomPlugin);
  ctx.install(FraqPluginLexicon, { dataPath, owners: [ownerId] });

  try {
    await ctx.start();
    await ctx.mock.receiveGroup({ groupId, userId: ownerId, groupMember: { role: 'owner' } }, [
      inseg.text('词库 添加 精确 问 你好 答 世界'),
    ]);

    assert.deepEqual(ctx.mock.apiCalls.at(-1), {
      endpoint: 'send_group_message',
      params: {
        group_id: groupId,
        message: [{ type: 'text', data: { text: '已添加词条 1 到词库“默认”。' } }],
      },
    });

    ctx.mock.apiCalls.length = 0;
    await ctx.mock.receiveGroup({ groupId, userId: ownerId }, [inseg.text('你好')]);

    assert.deepEqual(ctx.mock.apiCalls, [
      {
        endpoint: 'send_group_message',
        params: {
          group_id: groupId,
          message: [{ type: 'text', data: { text: '世界' } }],
        },
      },
    ]);
  } finally {
    await ctx.stop();
    rmSync(dataPath, { recursive: true, force: true });
  }
});
