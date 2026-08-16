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
});
```

`owners` 是机器人主人的 QQ 号列表。默认数据库路径为 `data/fraq-plugin-lexicon.sqlite`。
`maxOutputLength` 可调整单次解析结果的最大字符数，默认值为 `65536`。运行环境需要 Node.js 22.13 或更高版本。

## 词库作用域

- 群词库只属于创建它的群，同一个群可以创建多个群词库，创建后自动生效。
- 全局词库由机器人主人创建，每个群需要由群主、管理员或机器人主人手动启用。
- 私聊使用全部全局词库。
- 同名词库默认优先解析群词库，可使用 `群:<名称>` 或 `全局:<名称>` 明确指定。

## 管理命令

```text
词库 创建 群 <词库名>
词库 创建 全局 <词库名>
词库 删除库 群 <词库名>
词库 删除库 全局 <词库名>
词库 启用 <全局词库名>
词库 禁用 <全局词库名>
词库 列表

词库 切换 <词库名>

词库 添加 <精确|模糊> 问 <内容> 答 <内容>
词库 删除 id <词条ID>
词库 删除 问 <内容>

词库 添加 <词库名> <精确|模糊> 问 <内容> 答 <内容>
词库 删除 <词库名> id <词条ID>
词库 删除 <词库名> 问 <内容>
```

群词库由群主、群管理员和机器人主人管理；全局词库仅机器人主人可以管理。

插件首次启动时会创建全局“默认”词库；每个群首次使用插件时会创建该群的“默认”词库。
不指定词库名的添加和删除命令使用当前管理词库，初始为“默认”，可使用“词库 切换 <词库名>”切换。

## 匹配顺序

多个词条同时命中时依次比较：

1. 精确匹配优先于模糊匹配。
2. 群词库优先于全局词库。
3. 问题文本更长的词条优先。
4. ID 更小的词条优先。

模糊匹配表示用户消息中包含词条的问题文本。

## 词条语法

### API 词条

```text
词库 添加 默认 精确 问 戳我 答 [api.戳一戳]戳啦
```

用户发送“戳我”后，插件会先戳发送者，再回复“戳啦”。也可以指定目标：

```text
[api.戳一戳.user_id=123456789]
```

好友场景还可以使用 `is_self=true`。第一版仅注册了“戳一戳”API 动作，后续可以继续增加其他动作。

### 词库词条

```text
[词库.<词库名>]
```

词库词条会使用用户的原始消息，在指定词库中执行完整匹配，并继续解析命中的回答：

```text
词库 添加 入口 精确 问 戳我 答 [词库.动作库]
词库 添加 动作库 精确 问 戳我 答 [api.戳一戳]戳啦
```

解析器不设置固定嵌套深度，使用迭代方式持续解析；检测到直接或间接循环引用时会停止并回复详细错误。

### 变量词条

```text
[创建变量=A]
[创建变量=A=变量内容]
[读取变量=A]
```

变量只在当前回答的模板解析过程中生效。变量内容可以继续包含词条，读取变量后会继续参与嵌套解析；变量未创建时读取会返回错误。

需要输出字面量方括号、点号或等号时，可以使用反斜杠转义，例如 `\[普通文本\]`。

## 开发

```bash
pnpm test
pnpm check
pnpm build
```

## Trusted Publisher 发布

工作流文件为 `.github/workflows/publish.yml`，在 GitHub Release 发布时自动运行测试、检查、构建和 `npm publish`。

在 npm 包设置的 **Trusted Publisher** 中填写：

- Provider：GitHub Actions
- Organization or user：`zhongwen-4-fraq-plugins`
- Repository：`fraq-plugin-lexicon`
- Workflow filename：`publish.yml`
- Environment：留空
- Allowed actions：`npm publish`

工作流使用 OIDC，不需要配置 `NPM_TOKEN`。推送版本 tag 时，标签必须与 `package.json` 版本一致，支持与 `package.json` 版本一致的 `x.y.z` 或 `vx.y.z` 两种格式。

如果 npm 上还不存在该包，需要先手动发布首个版本，再配置 Trusted Publisher。配置成功并验证发布后，建议在 npm 中禁止传统 token 发布。

## 自动 PR 审核

工作流文件为 `.github/workflows/pr-review.yml`，会在 PR 创建、重新打开、更新提交或标记为可审查时运行：

- `pnpm test`
- `pnpm check`
- `pnpm build`
- `npm pack --dry-run --json`

任何质量检查失败都会让 PR 工作流失败。同一仓库的 PR 会自动更新一条审核摘要评论；来自 fork 的 PR 仍会运行全部质量检查，但不会尝试写评论。
