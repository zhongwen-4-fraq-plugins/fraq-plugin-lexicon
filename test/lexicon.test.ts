import type { MilkyClient } from '@fraqjs/fraq';

import { ApiActionRegistry } from '../src/actions/api-action-registry';
import { nudgeAction } from '../src/actions/nudge-action';
import { LexiconRepository } from '../src/data/lexicon-repository';
import type { MessageContext } from '../src/models/lexicon';
import { resolveCommandText } from '../src/parsers/command-prefix-parser';
import { parseManagementCommand } from '../src/parsers/management-command-parser';
import { findInnermostTerm, parseTemplateTerm } from '../src/parsers/template-parser';
import { LexiconService } from '../src/services/lexicon-service';
import { TemplateService } from '../src/services/template-service';

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const groupContext: MessageContext = {
  scene: 'group',
  peerId: 10001,
  senderId: 20002,
  groupId: 10001,
  groupRole: 'admin',
  originalText: '戳我',
};

test('管理命令可以解析添加和两种删除格式', () => {
  assert.deepEqual(parseManagementCommand('添加 默认 精确 问 戳我 答[api.戳一戳]戳啦'), {
    type: 'add',
    lexiconName: '默认',
    matchMode: 'exact',
    question: '戳我',
    answer: '[api.戳一戳]戳啦',
  });
  assert.deepEqual(parseManagementCommand('删除 默认 id 12'), {
    type: 'deleteById',
    lexiconName: '默认',
    entryId: 12,
  });
  assert.deepEqual(parseManagementCommand('删除 默认 问 戳我'), {
    type: 'deleteByQuestion',
    lexiconName: '默认',
    question: '戳我',
  });
});

test('命令文本继承 Fraq 路由激活方式', () => {
  assert.equal(resolveCommandText('/词库 创建 群 main', [{ type: 'prefix', prefix: '/' }]), '词库 创建 群 main');
  assert.equal(resolveCommandText('词库 创建 群 main', [{ type: 'prefix', prefix: '/' }]), undefined);
  assert.equal(resolveCommandText('词库 创建 群 main', [{ type: 'direct' }]), '词库 创建 群 main');
  assert.equal(
    resolveCommandText('/词库 创建 群 main', [{ type: 'direct' }, { type: 'prefix', prefix: '/' }]),
    '词库 创建 群 main',
  );
});
test('模板词条支持嵌套定位、参数和转义', () => {
  assert.deepEqual(findInnermostTerm('前[api.动作.value=[词库.默认]]后'), {
    start: 15,
    end: 21,
    content: '词库.默认',
  });
  assert.deepEqual(parseTemplateTerm('api.戳一戳.user_id=123.is_self=false'), {
    type: 'api',
    action: '戳一戳',
    parameters: { user_id: '123', is_self: 'false' },
  });
  assert.equal(findInnermostTerm('普通文本\\[不是词条\\]'), undefined);
});

test('匹配优先级遵循精确、作用域、长度和 ID', (context) => {
  const harness = createHarness(context);
  const global = harness.service.createLexicon('全局库', 'global', groupContext);
  const groupFuzzy = harness.service.createLexicon('群模糊', 'group', groupContext);
  harness.service.enableGlobalLexicon(global.name, groupContext, true);
  harness.repository.addEntry(global.id, 'exact', '戳我', '全局精确', 1);
  harness.repository.addEntry(groupFuzzy.id, 'fuzzy', '戳', '群模糊', 1);

  assert.equal(harness.service.matchMessage(groupContext)?.answer, '全局精确');

  const groupExact = harness.service.createLexicon('群精确', 'group', groupContext);
  harness.repository.addEntry(groupExact.id, 'exact', '戳我', '群精确', 1);
  assert.equal(harness.service.matchMessage(groupContext)?.answer, '群精确');

  const lengthContext = { ...groupContext, originalText: '今天请戳我一下' };
  const long = harness.service.createLexicon('长问题', 'group', groupContext);
  const short = harness.service.createLexicon('短问题', 'group', groupContext);
  harness.repository.addEntry(short.id, 'fuzzy', '戳', '短', 1);
  harness.repository.addEntry(long.id, 'fuzzy', '戳我一下', '长', 1);
  assert.equal(harness.service.matchMessage(lengthContext)?.answer, '长');
});

test('词库词条可以无固定深度地迭代解析', async (context) => {
  const harness = createHarness(context);
  const chainLength = 120;

  for (let index = 0; index < chainLength; index += 1) {
    const name = `链${index}`;
    const lexicon = harness.service.createLexicon(name, 'group', groupContext);
    const answer = index === chainLength - 1 ? '解析完成' : `[词库.链${index + 1}]`;
    harness.repository.addEntry(lexicon.id, 'exact', groupContext.originalText, answer, 1);
  }

  const first = harness.service.matchMessage(groupContext, '链0');
  assert.ok(first);
  assert.equal(await harness.template.render(first.answer, groupContext), '解析完成');
});

test('词库循环引用会返回明确错误', async (context) => {
  const harness = createHarness(context);
  const first = harness.service.createLexicon('循环一', 'group', groupContext);
  const second = harness.service.createLexicon('循环二', 'group', groupContext);
  harness.repository.addEntry(first.id, 'exact', groupContext.originalText, '[词库.循环二]', 1);
  harness.repository.addEntry(second.id, 'exact', groupContext.originalText, '[词库.循环一]', 1);

  await assert.rejects(() => harness.template.render('[词库.循环一]', groupContext), /循环引用/);
});

test('戳一戳动作按消息场景调用对应 API', async () => {
  const calls: Array<{ endpoint: string; params: unknown }> = [];
  const client = {
    async send_group_nudge(params: unknown) {
      calls.push({ endpoint: 'send_group_nudge', params });
      return {};
    },
    async send_friend_nudge(params: unknown) {
      calls.push({ endpoint: 'send_friend_nudge', params });
      return {};
    },
  } as unknown as MilkyClient;

  await nudgeAction({}, { client, message: groupContext });
  await nudgeAction(
    { is_self: 'true' },
    {
      client,
      message: { ...groupContext, scene: 'friend', groupId: undefined, groupRole: undefined },
    },
  );

  assert.deepEqual(calls, [
    { endpoint: 'send_group_nudge', params: { group_id: 10001, user_id: 20002 } },
    { endpoint: 'send_friend_nudge', params: { user_id: 20002, is_self: true } },
  ]);
});

function createHarness(context: test.TestContext): {
  repository: LexiconRepository;
  service: LexiconService;
  template: TemplateService;
} {
  const directory = mkdtempSync(join(tmpdir(), 'fraq-plugin-lexicon-'));
  const repository = new LexiconRepository(join(directory, 'test.sqlite'));
  const service = new LexiconService(repository);
  const actions = new ApiActionRegistry();
  const client = {} as MilkyClient;
  const template = new TemplateService(service, actions, client);

  context.after(() => {
    repository.close();
    rmSync(directory, { recursive: true, force: true });
  });
  return { repository, service, template };
}
