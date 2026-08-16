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
[创建变量=QQ=[event.data.sender_id]][api.send_group_nudge.user_id=[读取变量=QQ]]
```

事件字段可以进入变量、API 参数和其他嵌套词条。字符串与 JSON 会自动转义模板控制字符；字段不存在时会返回明确错误。

### API 词条

```text
[api.<英文 API 端点>.<参数名>=<参数值>]
[api.send_group_nudge]
[api.send_group_nudge.user_id=123456789]
```

插件支持当前 Milky/Fraq 提供的全部 65 个英文 API 端点。用户显式填写的参数优先；未填写时会先读取事件 `data` 中的同名字段，再按端点需要补充：

- `user_id`：第一个被艾特的 QQ、被回复消息的发送者、事件中的 `user_id`、`sender_id`、`operator_id`、`initiator_id`，最后是当前发送者。
- `group_id`：当前群号。
- `message_scene`、`peer_id`：当前消息场景和会话 ID。
- `message_seq`、`start_message_seq`：被回复消息的序列号，否则使用当前消息序列号。
- `message`、`content`：被回复消息的消息段，否则使用当前消息的消息段。
- `resource_id`、`uri`、`image_uri`、`file_uri`：回复或当前消息中的首个图片、语音或视频资源。
- `file_id`、`file_hash`、`file_name`、`forward_id`：回复或当前消息中的文件、合并转发数据。
- `no_cache=false`、`is_filtered=false`、`is_self=false`、`is_self_send=false`、`limit=20`、`count=1`。

消息参数可以直接填写文本，也可以填写消息段 JSON：

```text
[创建变量=result=[api.send_group_message.message=Hello]]
[创建变量=target=123456789][创建变量=result=[api.send_group_nudge.user_id=[读取变量=target]]]
```

API 返回空对象时不输出文本；其他返回值会序列化为 JSON，并可通过变量继续参与嵌套解析。完整端点定义位于 `src/data/milky-api-definitions.ts`。为了兼容已有词条，旧的 `[api.戳一戳]` 别名仍然可用。

支持的端点按类别包括：

- 账号与资料：`get_login_info`、`get_impl_info`、`get_user_profile`、`set_avatar`、`set_nickname`、`set_bio`、`get_cookies`、`get_csrf_token`。
- 好友与消息：`get_friend_list`、`get_friend_info`、`send_private_message`、`send_group_message`、`recall_private_message`、`recall_group_message`、`get_message`、`get_history_messages`、`mark_message_as_read`、`send_friend_nudge`、`send_profile_like`、`delete_friend`。
- 群与成员：`get_group_list`、`get_group_info`、`get_group_member_list`、`get_group_member_info`、`set_group_name`、`set_group_avatar`、`set_group_member_card`、`set_group_member_special_title`、`set_group_member_admin`、`set_group_member_mute`、`set_group_whole_mute`、`kick_group_member`、`quit_group`、`send_group_nudge`、`send_group_message_reaction`。
- 请求与通知：`get_friend_requests`、`accept_friend_request`、`reject_friend_request`、`get_group_notifications`、`accept_group_request`、`reject_group_request`、`accept_group_invitation`、`reject_group_invitation`。
- 公告与精华：`get_group_announcements`、`send_group_announcement`、`delete_group_announcement`、`get_group_essence_messages`、`set_group_essence_message`。
- 资源、转发与文件：`get_custom_face_url_list`、`get_resource_temp_url`、`get_forwarded_messages`、`upload_private_file`、`upload_group_file`、`get_private_file_download_url`、`get_group_file_download_url`、`get_group_files`、`move_group_file`、`rename_group_file`、`delete_group_file`、`persist_group_file`、`create_group_folder`、`rename_group_folder`、`delete_group_folder`。
- 会话置顶：`get_peer_pins`、`set_peer_pin`。

### 词库词条

```text
[词库.<词库名>]
```

词库词条会使用用户的原始消息，在指定词库中执行完整匹配，并继续解析命中的回答：

```text
词库 添加 入口 精确 问 戳我 答 [词库.动作库]
词库 添加 动作库 精确 问 戳我 答 [创建变量=result=[api.send_group_nudge]]戳啦
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
