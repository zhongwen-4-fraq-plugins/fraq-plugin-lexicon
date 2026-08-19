import { findReleaseBase } from '../.github/scripts/find-release-base.mjs';
import { buildCommitRange, buildReleaseNotes, isFlightdeckOnly } from '../.github/scripts/generate-release-notes.mjs';

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

test('发布说明按 Git Emoji 分类并过滤 Flightdeck 文档', () => {
  const notes = buildReleaseNotes([
    { subject: '✨ 新增查询命令', files: ['src/core/controller.ts'] },
    { subject: '🐛 修复参数映射', files: ['src/services/api.ts'] },
    { subject: '🎨 优化回复格式', files: ['src/core/controller.ts'] },
    { subject: '📝 更新使用文档', files: ['README.md'] },
    { subject: '📝 记录发布验证', files: ['flightdeck/cockpit.md'] },
    { subject: '🔖 调整版本至 0.2.5', files: ['package.json'] },
    { subject: '🔖 调整版本至 0.2.4', files: ['package.json'] },
    { subject: '🔥 移除旧实现', files: ['src/legacy.ts'] },
  ]);

  assert.match(notes, /## :sparkles:新增\n\n- 新增查询命令/u);
  assert.match(notes, /## :bug: 修复\n\n- 修复参数映射/u);
  assert.match(notes, /## :art: 优化\n\n- 优化回复格式/u);
  assert.match(notes, /## :pencil: 文档\n\n- 更新使用文档/u);
  assert.match(notes, /## 其他：[\s\S]*- 调整版本至 0\.2\.5[\s\S]*- 🔥 移除旧实现/u);
  assert.doesNotMatch(notes, /记录发布验证/u);
  assert.doesNotMatch(notes, /调整版本至 0\.2\.4/u);
});

test('空分类不会出现在发布说明中', () => {
  const notes = buildReleaseNotes([{ subject: '🐛 修复问题', files: ['src/index.ts'] }]);

  assert.doesNotMatch(notes, /sparkles|art|pencil/u);
  assert.match(notes, /## :bug: 修复/u);
});

test('Flightdeck 提交仅在全部文件属于该目录时过滤', () => {
  assert.equal(isFlightdeckOnly(['flightdeck/cockpit.md', 'flightdeck/work/topic/index.md']), true);
  assert.equal(isFlightdeckOnly(['flightdeck/cockpit.md', 'README.md']), false);
});

test('失败发布标签会合并到下一个成功版本的提交范围', async () => {
  const candidates = [
    { tag: 'v0.3.0', sha: 'sha-030' },
    { tag: 'v0.2.9', sha: 'sha-029' },
  ];
  const result = await findReleaseBase(candidates, async (tag) => {
    if (tag === 'v0.3.0') {
      return [{ id: 2, head_branch: tag, head_sha: 'sha-030', conclusion: 'failure' }];
    }
    return [{ id: 1, head_branch: tag, head_sha: 'sha-029', conclusion: 'success' }];
  });

  assert.deepEqual(result, { baseTag: 'v0.2.9', failedTags: ['v0.3.0'] });
  assert.equal(buildCommitRange('v0.3.1', result.baseTag), 'v0.2.9..v0.3.1');
});

test('历史标签都未成功时从当前标签的全部历史生成说明', async () => {
  const result = await findReleaseBase([{ tag: 'v0.3.0', sha: 'sha-030' }], async () => []);

  assert.deepEqual(result, { baseTag: '', failedTags: ['v0.3.0'] });
  assert.equal(buildCommitRange('v0.3.1', result.baseTag), 'v0.3.1');
});

test('GitHub Release 等待 npm 发布成功后执行', () => {
  const workflow = readFileSync(new URL('../.github/workflows/publish.yml', import.meta.url), 'utf8');
  const publishStep = workflow.indexOf('run: npm publish');
  const historyJob = workflow.indexOf('\n  release_base:');
  const releaseJob = workflow.indexOf('\n  release:');

  assert.ok(publishStep >= 0);
  assert.ok(historyJob > publishStep);
  assert.ok(releaseJob > historyJob);
  assert.match(workflow.slice(historyJob, releaseJob), /needs: publish/u);
  assert.match(workflow.slice(historyJob, releaseJob), /actions: read/u);
  assert.match(workflow.slice(releaseJob), /needs: release_base/u);
  assert.match(workflow.slice(releaseJob), /generate-release-notes\.mjs "\$RELEASE_TAG" "\$RELEASE_BASE_TAG"/u);
  assert.equal(existsSync(new URL('../.github/workflows/release.yml', import.meta.url)), false);
});
