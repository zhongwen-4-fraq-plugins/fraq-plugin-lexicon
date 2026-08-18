import { type EventMap, Logger, type MilkyClient } from '@fraqjs/fraq';

import { ApiActionRegistry } from '../src/actions/api-action-registry';
import { MilkyEventController } from '../src/core/milky-event-controller';
import { LexiconRepository } from '../src/data/lexicon-repository';
import { MILKY_API_ENDPOINTS } from '../src/data/milky-api-definitions';
import { createEventContext } from '../src/data/milky-event-context';
import { MILKY_EVENT_NAMES } from '../src/data/milky-event-definitions';
import type { MessageContext } from '../src/models/lexicon';
import { resolveCommandText } from '../src/parsers/command-prefix-parser';
import { findConditionalBlock, parseConditionalBlock } from '../src/parsers/conditional-template-parser';
import { parseManagementCommand } from '../src/parsers/management-command-parser';
import { findInnermostTerm, parseTemplateTerm } from '../src/parsers/template-parser';
import { LexiconService } from '../src/services/lexicon-service';
import { LogicService } from '../src/services/logic-service';
import { MilkyApiService } from '../src/services/milky-api-service';
import { TemplateService } from '../src/services/template-service';

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const groupMessageEvent = {
  event_type: 'message_receive',
  time: 1_700_000_000,
  self_id: 30003,
  data: {
    message_scene: 'group',
    peer_id: 10001,
    sender_id: 20002,
    message_seq: 30003,
    time: 1_700_000_000,
    segments: [{ type: 'text', data: { text: '戳我' } }],
    group: {},
    group_member: { role: 'admin' },
  },
} as EventMap['message_receive'];

const groupNudgeEvent: EventMap['group_nudge'] = {
  event_type: 'group_nudge',
  time: 1_700_000_001,
  self_id: 30003,
  data: {
    group_id: 10001,
    sender_id: 20002,
    receiver_id: 30003,
    display_action: '戳了戳',
    display_suffix: '测试[] .= \\',
    display_action_img_url: '',
  },
};

const groupJoinRequestEvent: EventMap['group_join_request'] = {
  event_type: 'group_join_request',
  time: 1_700_000_002,
  self_id: 30003,
  data: {
    group_id: 10001,
    notification_seq: 40004,
    is_filtered: true,
    initiator_id: 20002,
    comment: '申请入群',
  },
};

const groupReactionEvent: EventMap['group_message_reaction'] = {
  event_type: 'group_message_reaction',
  time: 1_700_000_003,
  self_id: 30003,
  data: {
    group_id: 10001,
    user_id: 20002,
    message_seq: 50005,
    face_id: '66',
    reaction_type: 'face',
    is_add: false,
  },
};

const friendFileUploadEvent: EventMap['friend_file_upload'] = {
  event_type: 'friend_file_upload',
  time: 1_700_000_004,
  self_id: 30003,
  data: {
    user_id: 20002,
    file_id: 'file-id',
    file_name: '测试.txt',
    file_size: 1024,
    file_hash: 'file-hash',
    is_self: true,
  },
};

const groupRecallEvent: EventMap['message_recall'] = {
  event_type: 'message_recall',
  time: 1_700_000_005,
  self_id: 30003,
  data: {
    message_scene: 'group',
    peer_id: 10001,
    message_seq: 60006,
    sender_id: 20002,
    operator_id: 70007,
    display_suffix: '',
  },
};

const groupContext: MessageContext = {
  event: groupMessageEvent,
  eventType: 'message_receive',
  eventTime: groupMessageEvent.time,
  selfId: groupMessageEvent.self_id,
  scene: 'group',
  peerId: 10001,
  senderId: 20002,
  messageSeq: 30003,
  groupId: 10001,
  groupRole: 'admin',
  originalText: '戳我',
  segments: [{ type: 'text', data: { text: '戳我' } }],
  mentionedUserIds: [],
};

test('管理命令可以解析查询、修改、添加和两种删除格式', () => {
  assert.deepEqual(parseManagementCommand('添加 默认 精确 问 戳我 答[api.send_group_nudge]戳啦'), {
    type: 'add',
    lexiconName: '默认',
    matchMode: 'exact',
    question: '戳我',
    answer: '[api.send_group_nudge]戳啦',
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
  assert.deepEqual(parseManagementCommand('添加 精确 问 戳我 答 戳啦'), {
    type: 'add',
    matchMode: 'exact',
    question: '戳我',
    answer: '戳啦',
  });
  assert.deepEqual(parseManagementCommand('删除 id 12'), {
    type: 'deleteById',
    entryId: 12,
  });
  assert.deepEqual(parseManagementCommand('切换 其他'), {
    type: 'switch',
    lexiconName: '其他',
  });
  assert.deepEqual(parseManagementCommand('查询 12'), {
    type: 'query',
    entryId: 12,
  });
  assert.deepEqual(parseManagementCommand('查询 其他 12'), {
    type: 'query',
    lexiconName: '其他',
    entryId: 12,
  });
  assert.deepEqual(parseManagementCommand('修改 12 答 新回答'), {
    type: 'update',
    entryId: 12,
    question: undefined,
    answer: '新回答',
  });
  assert.deepEqual(parseManagementCommand('修改 12 问 新问题 答 新回答'), {
    type: 'update',
    entryId: 12,
    question: '新问题',
    answer: '新回答',
  });
  assert.deepEqual(parseManagementCommand('修改 其他 12 答 指定回答'), {
    type: 'update',
    lexiconName: '其他',
    entryId: 12,
    question: undefined,
    answer: '指定回答',
  });
  assert.deepEqual(parseManagementCommand('修改 其他 12 问 指定问题 答 指定回答'), {
    type: 'update',
    lexiconName: '其他',
    entryId: 12,
    question: '指定问题',
    answer: '指定回答',
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
  assert.deepEqual(parseTemplateTerm('api.send_friend_nudge.user_id=123.is_self=false'), {
    type: 'api',
    action: 'send_friend_nudge',
    parameters: { user_id: '123', is_self: 'false' },
  });
  assert.throws(() => parseTemplateTerm('变量旧.创建.A'), /不支持的词条命名空间/);
  assert.deepEqual(parseTemplateTerm('变量.创建.A'), {
    type: 'setVariable',
    name: 'A',
    value: '',
  });
  assert.deepEqual(parseTemplateTerm('变量.创建.A=内容'), {
    type: 'setVariable',
    name: 'A',
    value: '内容',
  });
  assert.deepEqual(parseTemplateTerm('变量.读取.A'), {
    type: 'getVariable',
    name: 'A',
  });
  assert.deepEqual(parseTemplateTerm('event.data.group_id'), {
    type: 'event',
    path: ['data', 'group_id'],
  });
  assert.deepEqual(parseTemplateTerm('消息.取值.mention.user_id'), {
    type: 'messageValue',
    segmentType: 'mention',
    path: ['user_id'],
  });
  assert.deepEqual(parseTemplateTerm('消息.构建.text.内容'), {
    type: 'messageBuild',
    segmentType: 'text',
    content: '内容',
  });
  assert.deepEqual(parseTemplateTerm('逻辑.or.文本1.文本2'), {
    type: 'logic',
    operation: 'or',
    values: ['文本1', '文本2'],
  });
  assert.deepEqual(parseTemplateTerm('逻辑.in.A.B.A'), {
    type: 'logic',
    operation: 'in',
    values: ['A', 'B', 'A'],
  });
  assert.throws(() => parseTemplateTerm('逻辑.or.唯一参数'), /逻辑词条格式/);
  assert.throws(() => parseTemplateTerm('消息.取值.mention'), /消息取值词条格式/);
  assert.throws(() => parseTemplateTerm('消息.构建.text.内容.多余'), /消息构建词条格式/);
  assert.throws(() => parseTemplateTerm('is.mention.user_id'), /不支持的词条命名空间/);
  assert.equal(findInnermostTerm('普通文本\\[不是词条\\]'), undefined);
});

test('逻辑条件块支持否则如果、否则和嵌套配对', () => {
  const source =
    '[逻辑.如果][逻辑.or.true.false]主分支[逻辑.否则如果][逻辑.in.B.A.B]次分支[逻辑.否则]兜底[逻辑.如果.结束]';

  assert.deepEqual(parseConditionalBlock(source), [
    { condition: '[逻辑.or.true.false]', content: '主分支' },
    { condition: '[逻辑.in.B.A.B]', content: '次分支' },
    { content: '兜底' },
  ]);
  assert.equal(findConditionalBlock(`前${source}后`)?.source, source);
  assert.throws(() => findConditionalBlock('[逻辑.否则]'), /缺少对应/);
  assert.throws(() => findConditionalBlock('[逻辑.如果][逻辑.or.true.false]内容'), /缺少.*结束/);
});

test('事件列表覆盖全部 Milky 事件', () => {
  assert.equal(MILKY_EVENT_NAMES.length, 21);
  assert.ok(MILKY_EVENT_NAMES.includes('bot_offline'));
  assert.ok(MILKY_EVENT_NAMES.includes('message_receive'));
  assert.ok(MILKY_EVENT_NAMES.includes('group_file_upload'));
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

test('默认词库会自动创建并支持切换管理目标', (context) => {
  const harness = createHarness(context);
  const friendContext = { ...groupContext, scene: 'friend' as const, groupId: undefined, groupRole: undefined };

  const globalDefault = harness.service.ensureGlobalDefault(1);
  assert.equal(globalDefault.name, '默认');
  assert.equal(harness.service.ensureDefaultLexicon(friendContext).id, globalDefault.id);

  const groupDefault = harness.service.ensureDefaultLexicon(groupContext);
  assert.equal(groupDefault.name, '默认');
  assert.equal(
    harness.service.addEntry(undefined, 'exact', '默认问题', '默认回答', groupContext).lexicon.id,
    groupDefault.id,
  );

  const other = harness.service.createLexicon('其他', 'group', groupContext);
  harness.service.switchLexicon(other.name, groupContext);
  const switchedEntry = harness.service.addEntry(undefined, 'exact', '其他问题', '其他回答', groupContext);

  assert.equal(switchedEntry.lexicon.id, other.id);
  assert.equal(harness.service.resolveManageableLexicon(undefined, groupContext).id, other.id);
});

test('词条查询默认使用当前词库并校验指定词库', (context) => {
  const harness = createHarness(context);
  const defaultLexicon = harness.service.ensureDefaultLexicon(groupContext);
  const defaultEntry = harness.service.addEntry(undefined, 'exact', '默认问题', '默认回答', groupContext).entry;
  const other = harness.service.createLexicon('其他', 'group', groupContext);
  const otherEntry = harness.service.addEntry(other.name, 'fuzzy', '其他问题', '其他回答', groupContext).entry;

  assert.equal(harness.service.getLexiconEntry(defaultLexicon, defaultEntry.id).answer, '默认回答');
  assert.equal(harness.service.getLexiconEntry(other, otherEntry.id).matchMode, 'fuzzy');
  assert.throws(() => harness.service.getLexiconEntry(defaultLexicon, otherEntry.id), /没有 ID/);

  harness.service.switchLexicon(other.name, groupContext);
  const currentLexicon = harness.service.resolveManageableLexicon(undefined, groupContext);
  assert.equal(harness.service.getLexiconEntry(currentLexicon, otherEntry.id).question, '其他问题');
});

test('词条修改支持保留问题或同时更新问答', (context) => {
  const harness = createHarness(context);
  const defaultLexicon = harness.service.ensureDefaultLexicon(groupContext);
  const first = harness.service.addEntry(undefined, 'exact', '原问题', '原回答', groupContext).entry;
  const second = harness.service.addEntry(undefined, 'exact', '保留问题', '第二回答', groupContext).entry;
  const other = harness.service.createLexicon('其他', 'group', groupContext);
  const otherEntry = harness.service.addEntry(other.name, 'fuzzy', '其他问题', '其他回答', groupContext).entry;

  const answerOnly = harness.service.updateEntry(defaultLexicon, first.id, undefined, '新回答');
  assert.equal(answerOnly.question, '原问题');
  assert.equal(answerOnly.answer, '新回答');
  assert.equal(answerOnly.matchMode, 'exact');

  const questionAndAnswer = harness.service.updateEntry(other, otherEntry.id, '新问题', '新指定回答');
  assert.equal(questionAndAnswer.question, '新问题');
  assert.equal(questionAndAnswer.answer, '新指定回答');
  assert.equal(questionAndAnswer.matchMode, 'fuzzy');

  assert.throws(() => harness.service.updateEntry(defaultLexicon, otherEntry.id, undefined, '错误回答'), /没有 ID/);
  assert.throws(() => harness.service.updateEntry(defaultLexicon, second.id, '原问题', '冲突回答'), /已经存在/);
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

test('嵌套词库问题创建的变量会传递到外层回答', async (context) => {
  const harness = createHarness(context);
  const lexicon = harness.service.createLexicon('嵌套变量', 'group', groupContext);
  harness.repository.addEntry(lexicon.id, 'exact', '[变量.创建.来源=嵌套词库]戳我', '已命中', 1);

  const output = await harness.template.render('[词库.嵌套变量][变量.读取.来源]', groupContext);

  assert.equal(output, '已命中嵌套词库');
});

test('词库循环引用会返回明确错误', async (context) => {
  const harness = createHarness(context);
  const first = harness.service.createLexicon('循环一', 'group', groupContext);
  const second = harness.service.createLexicon('循环二', 'group', groupContext);
  harness.repository.addEntry(first.id, 'exact', groupContext.originalText, '[词库.循环二]', 1);
  harness.repository.addEntry(second.id, 'exact', groupContext.originalText, '[词库.循环一]', 1);

  await assert.rejects(() => harness.template.render('[词库.循环一]', groupContext), /循环引用/);
});

test('变量词条支持创建、读取和无限嵌套解析', async (context) => {
  const harness = createHarness(context);
  const lexicon = harness.service.createLexicon('变量词库', 'group', groupContext);
  harness.repository.addEntry(lexicon.id, 'exact', groupContext.originalText, '最终内容', 1);

  const output = await harness.template.render(
    '[变量.创建.A=[变量.创建.B=[词库.变量词库]][变量.读取.B]][变量.读取.A]',
    groupContext,
  );

  assert.equal(output, '最终内容');
});

test('逻辑词条显式区分文本操作和条件运算', () => {
  const chooseFirst = new LogicService(() => 0);
  const chooseLast = new LogicService(() => 0.999999);

  assert.equal(chooseFirst.resolveText('or', ['true', 'false']), 'true');
  assert.equal(chooseLast.resolveText('or', ['true', 'false']), 'false');
  assert.equal(chooseFirst.resolveText('and', ['文本1', '文本2']), '文本1文本2');
  assert.throws(() => chooseFirst.resolveText('in', ['A', 'A']), /只能用作/);

  assert.equal(chooseFirst.resolveCondition('or', ['false', 'true']), true);
  assert.equal(chooseFirst.resolveCondition('and', ['true', '1', '是']), true);
  assert.equal(chooseFirst.resolveCondition('and', ['true', '否']), false);
  assert.equal(chooseFirst.resolveCondition('in', ['A', 'B', 'A']), true);
  assert.equal(chooseFirst.resolveCondition('in', ['A', 'B', 'C']), false);
  assert.throws(() => chooseFirst.resolveCondition('or', ['文本1', 'true']), /不是布尔值/);
  assert.throws(() => chooseFirst.resolveText('or', ['唯一参数']), /至少需要两个/);
});

test('逻辑条件支持问题、回答、可选分支和无限嵌套', async (context) => {
  const harness = createHarness(context);
  const lexicon = harness.service.createLexicon('逻辑模板', 'group', groupContext);
  harness.repository.addEntry(
    lexicon.id,
    'exact',
    '[逻辑.如果][逻辑.and.true.true]戳我[逻辑.否则]其他[逻辑.如果.结束]',
    '[逻辑.如果][逻辑.and.[逻辑.or.false.true].true]通过[逻辑.否则]失败[逻辑.如果.结束]',
    1,
  );

  const match = harness.service.matchMessage(groupContext);
  assert.ok(match);
  assert.equal(await harness.template.render(match.answer, groupContext), '通过');
  assert.ok(['文本1', '文本2'].includes(await harness.template.render('[逻辑.or.文本1.文本2]', groupContext)));
  assert.equal(
    await harness.template.render(
      '[逻辑.如果][逻辑.and.true.false]主分支[逻辑.否则如果][逻辑.in.B.A.B]次分支[逻辑.否则]兜底[逻辑.如果.结束]',
      groupContext,
    ),
    '次分支',
  );
  assert.equal(
    await harness.template.render(
      '[逻辑.如果][逻辑.or.true.false]外[逻辑.如果][逻辑.in.A.A]内[逻辑.如果.结束][逻辑.否则]错误[逻辑.如果.结束]',
      groupContext,
    ),
    '外内',
  );
  assert.equal(
    await harness.template.render(
      '[变量.创建.A=原][逻辑.如果][逻辑.in.[变量.创建.A=新][变量.读取.A].其他]错误[逻辑.否则][变量.读取.A][逻辑.如果.结束]',
      groupContext,
    ),
    '原',
  );
  assert.equal(
    await harness.template.render('[逻辑.如果][逻辑.and.true.false]不会输出[逻辑.如果.结束]', groupContext),
    '',
  );
  await assert.rejects(() => harness.template.render('[逻辑.in.A.A]', groupContext), /只能用作/);
});

test('变量和事件词条在问题与回答中都可使用', async (context) => {
  const harness = createHarness(context);
  const lexicon = harness.service.createLexicon('问答模板', 'group', groupContext);
  harness.repository.addEntry(
    lexicon.id,
    'exact',
    '[event.message_receive][变量.创建.Q=戳我][变量.创建.A=[event.data.sender_id]][变量.读取.Q]',
    '[event.message_receive][变量.读取.A]',
    1,
  );
  harness.repository.addEntry(lexicon.id, 'exact', '[event.data.sender_id]', '动态问题', 1);
  harness.repository.addEntry(lexicon.id, 'exact', '[event.group_nudge]', '[event.group_nudge]事件回答', 1);
  harness.repository.addEntry(lexicon.id, 'exact', '[api.send_group_nudge]', '字面 API 问题', 1);
  harness.repository.addEntry(lexicon.id, 'exact', '[普通文本', '普通方括号问题', 1);

  const messageMatch = harness.service.matchMessage(groupContext);
  assert.ok(messageMatch);
  assert.equal(
    await harness.template.render(messageMatch.answer, groupContext, messageMatch.questionVariables),
    '20002',
  );

  const senderContext = { ...groupContext, originalText: '20002' };
  assert.equal(harness.service.matchMessage(senderContext)?.answer, '动态问题');

  const eventContext = createEventContext(groupNudgeEvent);
  const eventMatch = harness.service.matchMessage(eventContext);
  assert.ok(eventMatch);
  assert.equal(await harness.template.render(eventMatch.answer, eventContext), '事件回答');

  const wrongEventContext = { ...groupContext, originalText: '[event.group_nudge]' };
  assert.notEqual(harness.service.matchMessage(wrongEventContext)?.answer, '[event.group_nudge]事件回答');
  assert.equal(
    harness.service.matchMessage({ ...groupContext, originalText: '[api.send_group_nudge]' })?.answer,
    '字面 API 问题',
  );
  assert.equal(harness.service.matchMessage({ ...groupContext, originalText: '[普通文本' })?.answer, '普通方括号问题');
});

test('事件字段支持路径、数组、变量和模板转义', async (context) => {
  const harness = createHarness(context);
  const eventContext = createEventContext(groupNudgeEvent);

  assert.equal(
    await harness.template.render(
      '[变量.创建.QQ=[event.data.sender_id]][变量.读取.QQ]-[event.event_type]',
      eventContext,
    ),
    '20002-group_nudge',
  );
  assert.equal(await harness.template.render('[event.data.segments.0.data.text]', groupContext), '戳我');
  assert.equal(await harness.template.render('[event.data.display_suffix]', eventContext), '测试[] .= \\');
  await assert.rejects(() => harness.template.render('[event.data.not_exists]', eventContext), /不存在/);
});

test('消息段词条支持问题、回答、嵌套路径和 API 参数', async (context) => {
  const harness = createHarness(context);
  const segmentContext: MessageContext = {
    ...groupContext,
    originalText: '40004',
    segments: [
      { type: 'text', data: { text: '40004' } },
      { type: 'mention', data: { user_id: 40004, name: '目标成员' } },
      {
        type: 'reply',
        data: {
          message_seq: 50005,
          sender_id: 60006,
          time: 1_700_000_000,
          segments: [{ type: 'text', data: { text: '回复内容' } }],
        },
      },
    ],
    mentionedUserIds: [40004],
  };
  const lexicon = harness.service.createLexicon('消息段模板', 'group', segmentContext);
  harness.repository.addEntry(
    lexicon.id,
    'exact',
    '[变量.创建.Q=[消息.取值.mention.user_id]][变量.读取.Q]',
    '[消息.取值.reply.segments.0.data.text]-[消息.取值.mention.user_id]',
    1,
  );

  const match = harness.service.matchMessage(segmentContext);
  assert.ok(match);
  assert.equal(await harness.template.render(match.answer, segmentContext, match.questionVariables), '回复内容-40004');
  await assert.rejects(
    () => harness.template.render('[消息.取值.image.resource_id]', segmentContext),
    /不存在“image”消息段/,
  );

  const calls: Array<{ endpoint: string; params: Record<string, unknown> }> = [];
  const client = new Proxy(
    {},
    {
      get(_target, property) {
        return async (params: Record<string, unknown>) => {
          calls.push({ endpoint: String(property), params });
          return {};
        };
      },
    },
  ) as MilkyClient;
  const apiService = new MilkyApiService();
  const actions = new ApiActionRegistry((name, parameters, apiContext) =>
    apiService.execute(name, parameters, apiContext),
  );
  const template = new TemplateService(harness.service, actions, client);

  await template.render('[api.get_group_member_info.user_id=[消息.取值.mention.user_id]]', segmentContext);

  assert.deepEqual(calls, [
    {
      endpoint: 'get_group_member_info',
      params: { group_id: 10001, user_id: 40004, no_cache: false },
    },
  ]);
});

test('消息构建词条支持文本、变量嵌套和 API 消息参数', async (context) => {
  const harness = createHarness(context);
  const segmentContext: MessageContext = {
    ...groupContext,
    originalText: '构建消息',
  };
  const template = harness.template;

  assert.deepEqual(JSON.parse(await template.render('[消息.构建.text.内容]', segmentContext)), {
    type: 'text',
    data: { text: '内容' },
  });
  assert.deepEqual(
    JSON.parse(await template.render('[变量.创建.A=动态内容][消息.构建.text.[变量.读取.A]]', segmentContext)),
    { type: 'text', data: { text: '动态内容' } },
  );
  await assert.rejects(() => template.render('[消息.构建.image.内容]', segmentContext), /暂不支持构建“image”消息段/);

  const calls: Array<{ endpoint: string; params: Record<string, unknown> }> = [];
  const client = new Proxy(
    {},
    {
      get(_target, property) {
        return async (params: Record<string, unknown>) => {
          calls.push({ endpoint: String(property), params });
          return {};
        };
      },
    },
  ) as MilkyClient;
  const apiService = new MilkyApiService();
  const actions = new ApiActionRegistry((name, parameters, apiContext) =>
    apiService.execute(name, parameters, apiContext),
  );
  const apiTemplate = new TemplateService(harness.service, actions, client);

  await apiTemplate.render('[api.send_group_message.message=[消息.构建.text.内容]]', segmentContext);

  assert.deepEqual(calls, [
    {
      endpoint: 'send_group_message',
      params: {
        group_id: 10001,
        message: [{ type: 'text', data: { text: '内容' } }],
      },
    },
  ]);
});

test('事件字段自动补充 API 参数且显式参数优先', async () => {
  const calls: Array<{ endpoint: string; params: Record<string, unknown> }> = [];
  const client = new Proxy(
    {},
    {
      get(_target, property) {
        return async (params: Record<string, unknown>) => {
          calls.push({ endpoint: String(property), params });
          return {};
        };
      },
    },
  ) as MilkyClient;
  const apiService = new MilkyApiService();
  const eventContext = createEventContext(groupNudgeEvent);

  await apiService.execute('send_group_nudge', {}, { client, message: eventContext });
  await apiService.execute('send_group_nudge', { user_id: '90009' }, { client, message: eventContext });

  assert.deepEqual(calls, [
    { endpoint: 'send_group_nudge', params: { group_id: 10001, user_id: 20002 } },
    { endpoint: 'send_group_nudge', params: { group_id: 10001, user_id: 90009 } },
  ]);
});

test('API 参数 qq 可作为 user_id 简写', async () => {
  const calls: Array<{ endpoint: string; params: Record<string, unknown> }> = [];
  const client = new Proxy(
    {},
    {
      get(_target, property) {
        return async (params: Record<string, unknown>) => {
          calls.push({ endpoint: String(property), params });
          return {};
        };
      },
    },
  ) as MilkyClient;
  const apiService = new MilkyApiService();

  await apiService.execute('get_group_member_info', { qq: '90009' }, { client, message: groupContext });

  assert.deepEqual(calls, [
    {
      endpoint: 'get_group_member_info',
      params: { group_id: 10001, user_id: 90009, no_cache: false },
    },
  ]);
  await assert.rejects(
    () =>
      apiService.execute('get_group_member_info', { qq: '90009', user_id: '80008' }, { client, message: groupContext }),
    /不能同时使用/,
  );
  await assert.rejects(
    () => apiService.execute('get_group_info', { qq: '90009' }, { client, message: groupContext }),
    /不支持参数“qq”/,
  );
});

test('API 事件默认值保留原值并转换协议参数', async () => {
  const calls: Array<{ endpoint: string; params: Record<string, unknown> }> = [];
  const client = new Proxy(
    {},
    {
      get(_target, property) {
        return async (params: Record<string, unknown>) => {
          calls.push({ endpoint: String(property), params });
          return {};
        };
      },
    },
  ) as MilkyClient;
  const apiService = new MilkyApiService();

  await apiService.execute('accept_group_request', {}, { client, message: createEventContext(groupJoinRequestEvent) });
  await apiService.execute(
    'send_group_message_reaction',
    {},
    {
      client,
      message: createEventContext(groupReactionEvent),
    },
  );
  await apiService.execute(
    'get_private_file_download_url',
    {},
    {
      client,
      message: createEventContext(friendFileUploadEvent),
    },
  );
  await apiService.execute('recall_group_message', {}, { client, message: createEventContext(groupRecallEvent) });

  assert.deepEqual(calls, [
    {
      endpoint: 'accept_group_request',
      params: { notification_seq: 40004, notification_type: 'join_request', group_id: 10001, is_filtered: true },
    },
    {
      endpoint: 'send_group_message_reaction',
      params: { group_id: 10001, message_seq: 50005, reaction: '66', reaction_type: 'face', is_add: false },
    },
    {
      endpoint: 'get_private_file_download_url',
      params: { user_id: 20002, file_id: 'file-id', file_hash: 'file-hash', is_self_send: true },
    },
    {
      endpoint: 'recall_group_message',
      params: { group_id: 10001, message_seq: 60006 },
    },
  ]);
});

test('API 调用前校验必填参数、枚举值和可选参数', async () => {
  const calls: Array<{ endpoint: string; params: Record<string, unknown> }> = [];
  const client = new Proxy(
    {},
    {
      get(_target, property) {
        return async (params: Record<string, unknown>) => {
          calls.push({ endpoint: String(property), params });
          return {};
        };
      },
    },
  ) as MilkyClient;
  const apiService = new MilkyApiService();

  await assert.rejects(
    () => apiService.execute('get_cookies', {}, { client, message: groupContext }),
    /缺少必填参数：domain/,
  );
  await assert.rejects(
    () => apiService.execute('get_message', { message_scene: 'channel' }, { client, message: groupContext }),
    /必须是以下值之一：friend、group、temp/,
  );
  await assert.rejects(
    () => apiService.execute('get_group_info', { group_id: '10000' }, { client, message: groupContext }),
    /group_id”必须是 10001 到 4294967295 之间的整数/,
  );
  await assert.rejects(
    () => apiService.execute('recall_group_message', { message_seq: '-1' }, { client, message: groupContext }),
    /message_seq”必须是 0 到 9007199254740991 之间的整数/,
  );
  await assert.rejects(
    () => apiService.execute('get_group_info', {}, { client, message: { ...groupContext, groupId: 10_000 } }),
    /group_id”必须是 10001 到 4294967295 之间的整数/,
  );
  await assert.rejects(
    () => apiService.execute('recall_group_message', {}, { client, message: { ...groupContext, messageSeq: -1 } }),
    /message_seq”必须是 0 到 9007199254740991 之间的整数/,
  );
  await apiService.execute('recall_group_message', { message_seq: '0' }, { client, message: groupContext });
  await apiService.execute('set_group_member_admin', {}, { client, message: groupContext });

  assert.deepEqual(calls, [
    { endpoint: 'recall_group_message', params: { group_id: 10001, message_seq: 0 } },
    { endpoint: 'set_group_member_admin', params: { group_id: 10001, user_id: 20002 } },
  ]);
});

test('事件模板匹配词库并向事件会话发送文本', async (context) => {
  const harness = createHarness(context);
  const eventContext = createEventContext(groupNudgeEvent);
  const lexicon = harness.service.ensureEventDefaultLexicon(eventContext);
  harness.repository.addEntry(
    lexicon.id,
    'exact',
    '[event.group_nudge][变量.创建.sender=[event.data.sender_id]]',
    '收到[变量.读取.sender]',
    1,
  );

  const calls: unknown[] = [];
  const client = {
    async send_group_message(params: unknown) {
      calls.push(params);
      return {};
    },
  } as MilkyClient;
  const template = new TemplateService(harness.service, new ApiActionRegistry(), client);
  const controller = new MilkyEventController(harness.service, template, client, new Logger(() => {}, 'test'));

  assert.equal(harness.service.matchMessage(eventContext)?.answer, '收到[变量.读取.sender]');
  await controller.handle(groupNudgeEvent);

  assert.deepEqual(calls, [
    {
      group_id: 10001,
      message: [{ type: 'text', data: { text: '收到20002' } }],
    },
  ]);
});

test('英文 Milky API 覆盖全部端点并使用事件默认参数', async (context) => {
  assert.equal(MILKY_API_ENDPOINTS.size, 65);
  assert.ok(MILKY_API_ENDPOINTS.has('get_login_info'));
  assert.ok(MILKY_API_ENDPOINTS.has('delete_group_folder'));

  const calls: Array<{ endpoint: string; params: Record<string, unknown> }> = [];
  const client = new Proxy(
    {},
    {
      get(_target, property) {
        return async (params: Record<string, unknown>) => {
          calls.push({ endpoint: String(property), params });
          return { endpoint: property, params };
        };
      },
    },
  ) as MilkyClient;
  const apiService = new MilkyApiService();
  const actions = new ApiActionRegistry((name, parameters, apiContext) =>
    apiService.execute(name, parameters, apiContext),
  );
  const harness = createHarness(context);
  const template = new TemplateService(harness.service, actions, client);
  const apiContext: MessageContext = {
    ...groupContext,
    mentionedUserIds: [40004],
    reply: {
      messageSeq: 50005,
      senderId: 60006,
      segments: [{ type: 'text', data: { text: '回复内容' } }],
    },
  };

  const result = await template.render('[变量.创建.R=[api.send_group_message]][变量.读取.R]', apiContext);
  await apiService.execute('send_group_nudge', {}, { client, message: apiContext });
  await apiService.execute('recall_group_message', {}, { client, message: apiContext });
  await apiService.execute('recall_group_message', { message_seq: '70007' }, { client, message: apiContext });
  await template.render('[变量.创建.U=90009][变量.创建.R=[api.send_group_nudge.user_id=[变量.读取.U]]]', apiContext);

  assert.deepEqual(JSON.parse(result), {
    endpoint: 'send_group_message',
    params: {
      group_id: 10001,
      message: [{ type: 'text', data: { text: '回复内容' } }],
    },
  });
  assert.deepEqual(calls[1], {
    endpoint: 'send_group_nudge',
    params: { group_id: 10001, user_id: 40004 },
  });
  assert.deepEqual(calls[2], {
    endpoint: 'recall_group_message',
    params: { group_id: 10001, message_seq: 50005 },
  });
  assert.deepEqual(calls[3], {
    endpoint: 'recall_group_message',
    params: { group_id: 10001, message_seq: 70007 },
  });
  assert.deepEqual(calls[4], {
    endpoint: 'send_group_nudge',
    params: { group_id: 10001, user_id: 90009 },
  });
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
