# fraq-plugin-lexicon

为 Fraq 提供多词库、精确与模糊匹配、SQLite 持久化和嵌套词条解析能力。

## 安装

```bash
pnpm add fraq-plugin-lexicon
```

```ts
import { Context } from '@fraqjs/fraq';
import FraqPluginLexicon from 'fraq-plugin-lexicon';

const ctx = Context.fromUrl('http://localhost:30001');

ctx.install(FraqPluginLexicon, {
  owners: [123456789],
  databasePath: 'data/fraq-plugin-lexicon.sqlite',
  userInputTimeoutMs: 30_000,
});
```

`owners` 是机器人主人的 QQ 号列表。默认数据库路径为 `data/fraq-plugin-lexicon.sqlite`。
`maxOutputLength` 可调整单次解析结果的最大字符数，默认值为 `65536`。
`userInputTimeoutMs` 可调整请求用户输入未指定词条级超时时间时的默认等待时间，默认值为 `30000` 毫秒。运行环境需要 Node.js 22.13 或更高版本。

## 文档

- [词库与词条用法](docs/lexicon-usage.md)
- [开发与维护](docs/development.md)
