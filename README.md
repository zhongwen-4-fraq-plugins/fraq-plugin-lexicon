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

词库 查询 <词条ID>
词库 修改 <词条ID> [问 <新问题>] 答 <新回答>

词库 添加 <精确|模糊> 问 <内容> 答 <内容>
词库 删除 id <词条ID>
词库 删除 问 <内容>

词库 添加 <词库名> <精确|模糊> 问 <内容> 答 <内容>
词库 查询 <词库名> <词条ID>
词库 修改 <词库名> <词条ID> [问 <新问题>] 答 <新回答>
词库 删除 <词库名> id <词条ID>
词库 删除 <词库名> 问 <内容>
```

群词库由群主、群管理员和机器人主人管理；全局词库仅机器人主人可以管理。

插件首次启动时会创建全局“默认”词库；每个群首次使用插件时会创建该群的“默认”词库。
不指定词库名的查询、修改、添加和删除命令使用当前管理词库，初始为“默认”，可使用“词库 切换 <词库名>”切换。
修改词条时“问 <新问题>”可以省略；省略后保留原问题，词条的精确/模糊匹配方式不会改变。

## 匹配顺序

多个词条同时命中时依次比较：

1. 精确匹配优先于模糊匹配。
2. 群词库优先于全局词库。
3. 问题文本更长的词条优先。
4. ID 更小的词条优先。

模糊匹配表示用户消息中包含词条的问题文本。

## 词条语法

### 逻辑词条

条件外的逻辑词条只执行文本操作：

```text
[逻辑.or.文本1.文本2]
[逻辑.and.文本1.文本2]
```

- `or` 随机返回一个参数。
- `and` 按顺序拼接全部参数。
- `in` 只能用于条件块，不能作为普通文本词条执行。

条件块以 `[逻辑.如果]` 开始，以 `[逻辑.如果.结束]` 结束；`否则如果` 和 `否则` 都可以省略：

```text
[逻辑.如果][逻辑.or.true.false]条件成立
[逻辑.否则如果][逻辑.in.目标.候选1.目标]次级条件成立
[逻辑.否则]全部条件不成立
[逻辑.如果.结束]
```

- `[逻辑.如果]` 和 `[逻辑.否则如果]` 后必须紧跟一个 `or`、`and` 或 `in` 条件词条。
- 条件中的 `or` 和 `and` 始终执行布尔逻辑，不再根据参数内容自动判断模式。
- 条件中的 `in` 判断第一个参数是否精确等于后续任意候选。
- 布尔值支持 `true/false`、`1/0`、`是/否` 和 `真/假`；其他值会返回明确错误。
- 条件、分支内容和整个条件块都支持变量、事件、消息段、其他逻辑词条以及无限嵌套。
- 未选中的分支不会执行，其中的 API 和变量操作也不会产生副作用。

使用 `[逻辑.请求用户输入.<提示消息>.<超时时间=秒>.<超时提示=文本>]` 可以发送指定提示，再等待同一用户在同一群聊或私聊中的下一条消息。`超时时间` 和 `超时提示` 都可以省略：

```text
词库 添加 精确 问 登记名字 答 [变量.创建.名字=[逻辑.请求用户输入.请输入名字]]你好，[变量.读取.名字]！
词库 添加 精确 问 临时登记 答 [逻辑.请求用户输入.请输入内容.超时时间=30.超时提示=会话超时]
```

- 命中词条时只发送请求词条中的提示消息，不会提前发送请求词条之前的回答内容。
- 用户回复后，输入内容会替换请求词条并继续解析，最终回答会一次性发送。
- 提示消息和后续内容都支持变量、事件、消息段、API、词库和逻辑词条嵌套。
- 多个请求词条会按出现顺序依次等待，已选中的条件分支中也可以使用请求词条。
- 用户输入会作为普通文本处理，不会被当成 API 或其他模板执行。
- 等待期间，词库管理命令优先执行且不会被消费；其他下一条消息会作为输入，不再触发其他词库。
- `超时时间` 使用秒数，并覆盖本次请求的默认等待时间；省略时默认等待 30 秒，也可以通过插件配置 `userInputTimeoutMs` 修改全局默认值。
- `超时提示` 省略时默认发送“会话超时”；超时提示支持变量、事件、消息段、API、词库和逻辑词条嵌套。
- 超时后只发送超时提示并终止本次回答，不会再追加“词条执行失败”；无提示消息的语法不支持，请求词条也不能放在问题或逻辑条件参数中。

### 事件词条

将事件模板作为词条的问题，即可在对应 Milky 事件发生时执行回答：

```text
词库 添加 精确 问 [event.group_nudge] 答 收到来自 [event.data.sender_id] 的戳一戳
词库 添加 精确 问 [event.friend_file_upload] 答 收到文件 [event.data.file_name]
```

插件监听 Fraq 提供的全部 21 个 Milky 事件。群事件匹配当前群词库和已启用的全局词库；好友事件及没有群号的事件匹配全局词库。回答产生文本时会发送到当前群或好友会话；没有可发送会话的事件仍会执行回答中的 API 词条。

回答中可以使用 `[event.<字段路径>]` 读取完整事件对象，支持对象字段和数组下标：

```text
[event.event_type]
[event.time]
[event.self_id]
[event.data.group_id]
[event.data.segments.0.data.text]
[变量.创建.QQ=[event.data.sender_id]][api.send_group_nudge.user_id=[变量.读取.QQ]]
```

事件字段可以进入变量、API 参数和其他嵌套词条。字符串与 JSON 会自动转义模板控制字符；字段不存在时会返回明确错误。

事件词条、消息段词条和变量词条在问题与回答中都可使用：

```text
词库 添加 精确 问 [event.message_receive][变量.创建.Q=戳我][变量.读取.Q] 答 [event.message_receive]收到
词库 添加 精确 问 [变量.创建.QQ=[event.data.sender_id]][变量.读取.QQ] 答 你的 QQ 是 [event.data.sender_id]
```

- 问题中的 `[event.<事件名>]` 是事件条件，只在当前事件名称相同时匹配，并且自身不参与文本比较。
- 回答中的 `[event.<事件名>]` 是事件条件，匹配时不输出文本，事件名称不同时返回明确错误。
- 问题中的事件字段会先转换为当前字段值，再按照精确或模糊模式与消息文本比较。
- 问题中的变量拥有独立作用域，可以创建、读取并嵌套事件字段。
- 为避免匹配消息时产生副作用，问题中的 API 和词库词条保持字面量，不会执行。

### 消息段词条

```text
[消息.取值.<消息段类型>.<字段路径>]
[消息.取值.mention.user_id]
[消息.取值.reply.sender_id]
[消息.取值.reply.segments.0.data.text]
```

`消息.取值` 会读取当前消息中第一个指定类型的 IncomingSegment，字段路径从消息段的 `data` 开始，因此不需要再写一层 `data`。对象字段和数组下标都可继续嵌套读取；消息段或字段不存在时会返回明确错误。

消息段值可以进入变量、问题和 API 参数。例如发送 `getinfo` 并艾特群成员时：

```text
词库 添加 精确 问 getinfo 答 [api.get_group_member_info.user_id=[消息.取值.mention.user_id]]
```

使用 `消息.构建.text.<内容>` 构建文本消息段，结果可以直接作为 API 的 `message` 参数，也可以继续嵌套变量和其他词条：

```text
[消息.构建.text.内容]
[变量.创建.A=动态内容][消息.构建.text.[变量.读取.A]]
[api.send_group_message.message=[消息.构建.text.内容]]
```

当前仅支持构建 `text` 消息段；其他消息段类型会返回明确错误。

完整消息段类型和字段请参考 [Milky IncomingSegment](https://milky.ntqqrev.org/struct/IncomingSegment)。

### API 词条

```text
[api.<英文 API 端点>.<参数名>=<参数值>]
[api.send_group_nudge]
[api.send_group_nudge.user_id=123456789]
[api.get_group_member_info.qq=123456789]
```

插件支持当前 Milky/Fraq 提供的全部 65 个英文 API 端点。用户显式填写的参数优先；未填写时会先读取事件 `data` 中的同名字段，再按端点需要补充：

- `user_id`：第一个被艾特的 QQ、被回复消息的发送者、事件中的 `user_id`、`sender_id`、`operator_id`、`initiator_id`，最后是当前发送者。
- `qq`：当目标 API 支持 `user_id` 时可作为其简写；不能与 `user_id` 同时填写。
- `group_id`：当前群号；群消息撤回等事件会根据 `message_scene=group` 将 `peer_id` 转为群号；有效范围为 `10001..4294967295`。
- `message_scene`、`peer_id`：当前消息场景和会话 ID。
- `message_seq`、`start_message_seq`：被回复消息的序列号，否则使用当前消息序列号；`message_seq` 有效范围为 `0..9007199254740991`。
- `message`、`content`：被回复消息的消息段，否则使用当前消息的消息段。
- `resource_id`、`uri`、`image_uri`、`file_uri`：回复或当前消息中的首个图片、语音或视频资源。
- `file_id`、`file_hash`、`file_name`、`forward_id`：回复或当前消息中的文件、合并转发数据。
- `notification_type`：根据 `group_join_request` 或 `group_invited_join_request` 事件自动生成。
- `reaction`：群消息反应事件会自动将 `face_id` 转为 API 使用的 `reaction`。
- `is_self_send`：好友文件事件会自动继承事件中的 `is_self`。
- `no_cache=false`、`is_filtered=false`、`is_self=false`、`is_self_send=false`、`limit=20`、`count=1`。

事件自身提供的参数不会被上述默认值覆盖。调用前会检查必填参数、`group_id` 与 `message_seq` 范围，以及 `message_scene`、`notification_type`、`reaction_type` 等枚举参数，并直接返回可读错误；显式参数和事件自动参数使用相同校验。

消息参数可以直接填写文本，也可以填写消息段 JSON：

```text
[变量.创建.result=[api.send_group_message.message=Hello]][变量.读取.result]
[变量.创建.target=123456789][变量.创建.result=[api.send_group_nudge.user_id=[变量.读取.target]]]
```

API 返回空对象时不输出文本；其他返回值会序列化为 JSON，并可通过变量继续参与嵌套解析。完整端点定义位于 `src/data/milky-api-definitions.ts`。

本插件已适配 Fraq 0.14 与 0.17 暴露的全部 65 个 Milky API，具体参数请参考 [Milky 协议 API](https://milky.ntqqrev.org/api/system)。

### 词库词条

```text
[词库.<词库名>]
```

词库词条会使用用户的原始消息，在指定词库中执行完整匹配，并继续解析命中的回答：

```text
词库 添加 入口 精确 问 戳我 答 [词库.动作库]
词库 添加 动作库 精确 问 戳我 答 [变量.创建.result=[api.send_group_nudge]]戳啦
```

解析器不设置固定嵌套深度，使用迭代方式持续解析；检测到直接或间接循环引用时会停止并回复详细错误。

### 变量词条

```text
[变量.创建.A]
[变量.创建.A=变量内容]
[变量.读取.A]
```

同一次词条命中中，问题创建的变量可以在回答中读取；通过 `[词库.<词库名>]` 命中的嵌套词条也会把问题变量传递给后续回答。每条新消息或新事件都会创建独立变量作用域。变量内容可以继续包含词条，读取变量后会继续参与嵌套解析；回答中读取未创建变量会返回错误，问题中读取未创建变量则视为不匹配。

需要输出字面量方括号、点号或等号时，可以使用反斜杠转义，例如 `\[普通文本\]`。

## 开发

```bash
pnpm test
pnpm check
pnpm build
```

## Trusted Publisher 发布

工作流文件为 `.github/workflows/publish.yml`。推送版本 tag 后，同一工作流会先运行测试、检查、构建和 `npm publish`；只有 npm 发布任务成功完成，才会继续生成发布说明并创建或更新 GitHub Release。

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
