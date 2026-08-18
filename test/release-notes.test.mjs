import { buildReleaseNotes, isFlightdeckOnly } from '../.github/scripts/generate-release-notes.mjs';

import assert from 'node:assert/strict';
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
