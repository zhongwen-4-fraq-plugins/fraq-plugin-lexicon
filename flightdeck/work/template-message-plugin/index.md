# Index — template-message-plugin

## State

- 用户希望把 `fraq-plugin-lexicon` 实现为支持精确/模糊匹配的词库插件。
- 回答内容包含可执行词条；词条需要支持无固定深度的嵌套解析。
- MVP 已实现：多词库、SQLite、精确/包含匹配、权限、API 词条和词库递归词条。
- v0.2.1 已发布并安装；当前开发版本为 v0.2.2，正在增加中文消息段取值和文本消息段构建模板。

## Next

- 在真实群聊中验证 `[api.get_group_member_info.user_id=[消息.取值.mention.user_id]]` 和 `[api.send_group_message.message=[消息.构建.text.内容]]`。
- 用户确认后为 v0.2.2 打 tag、发布并安装到目标 Fraq 项目。

## Read now

- `src/index.ts`
- `package.json`
- `flightdeck/knowledge/milky/protocol.md`
- `flightdeck/knowledge/milky/api-parameter-mapping.md`
- `flightdeck/knowledge/milky/incoming-segment-template.md`
- `flightdeck/knowledge/fraq/plugin-api.md`
- `flightdeck/work/template-message-plugin/design.md`

## Read if

- 编写使用文档时读取 `README.md`。
- 添加验证时读取 `test/smoke.ts`。

## Progress

- 已确认项目基于 `@fraqjs/fraq`。
- 已确认当前业务代码仅包含 `echo` 示例命令。
- 已整理 Milky API、事件、消息段和兼容性规则。
- 已记录词库管理命令、嵌套解析流程、模块划分和安全边界草案。
- 已确认群戳一戳和好友戳一戳使用不同的 Milky API。
- 已确认全局与群级多词库、SQLite、包含匹配和管理权限。
- 已确认删除支持按 ID 或问题，API 错误需要详细回复。
- 已按数据模型、数据层、解析器、服务、动作和核心控制器拆分源码。
- 已实现群/全局多词库、全局词库按群启停和已确认的匹配优先级。
- 已实现 `[api.send_group_nudge]`、`[api.send_friend_nudge]`、`[词库.<词库名>]`、无固定深度迭代解析和循环检测。
- 已更新包信息、README、测试脚本和运行数据忽略规则。
- 已补齐 npm 作者、仓库、主页、问题反馈、关键词、标准 ESM 导出和公开发布配置。
- 已添加基于 GitHub OIDC 的 npm Trusted Publisher 发布工作流和配置说明。
- 已添加 PR 自动审核工作流，覆盖质量门禁和同仓库评论汇总。
- 已添加 BUG 与功能请求两个 GitHub Issue Form，并关闭空白 Issue。
- 已优化 Issue 模板中的最新版徽章、Issue 列表链接和功能标题前缀。

## Verification

- `pnpm test`：6 个测试全部通过。
- `pnpm check`：Biome 与 TypeScript 检查通过。
- `pnpm build`：构建成功并生成声明文件。
- `npm pack --dry-run --json`：打包预览成功，仅包含 README、`dist` 和 `package.json`。
- `.github/workflows/publish.yml`：结构检查通过，并完成测试、检查、构建和打包预览验证。
- `.github/workflows/pr-review.yml`：YAML 结构检查通过。
- `.github/ISSUE_TEMPLATE/*.yml`：YAML 解析和表单字段结构检查通过。
- Issue 模板修改后再次通过 YAML 解析检查。

## Open questions

## Release verification

- Source tests, checks, build, and package dry-run passed on 2026-08-15.
- Target app removed every nl-milky reference and now installs fraq-plugin-lexicon 0.1.3 with the `/` management prefix.
- Target app uses @fraqjs/fraq 0.14.0; the plugin supports peer dependency ^0.14.0 || ^0.17.0.
- `v0.1.0` 已确认不能重复发布；`v0.1.3` 已发布并安装到目标应用。

- 真实协议端是否会暴露需要额外适配的错误消息格式？
- 后续需要增加哪些 `[api.*]` 动作？

## Prefix inheritance release

- Source now resolves management command text from Fraq route activations instead of a plugin-specific prefix option.
- Release target: v0.1.4; local tests, checks, and build pass.

## Verification update

- Trusted Publisher run 31917741215 completed successfully for v0.1.4.
- Target app app/package.json, package-lock.json, pnpm-lock.yaml, and versions.yml now reference 0.1.4.
- Target app restarted successfully with Fraq 0.14.0; the installed bundle calls routeActivationResolver and the configured / activation is present.

## Default lexicon release

- v0.1.5 adds automatic global/group default lexicons, default-target add/delete commands, and current management lexicon switching.
- Group defaults are created lazily on the first group message because a group ID is required.

## v0.1.5 release verification

- Trusted Publisher run 31918558287 completed successfully.
- Target app app/package.json, package-lock.json, pnpm-lock.yaml, and versions.yml now reference 0.1.5.
- Target app restarted with Fraq 0.14.0; plugin startup is clean and the existing global default lexicon is present in SQLite.
- Group default creation remains lazy and will occur when the first message arrives from each group.

## Template variable release

- v0.1.6 adds `[变量.创建.A]`, `[变量.创建.A=内容]`, and `[变量.读取.A]`.
- Variables live for one template render; values continue through the existing unlimited nested-term parser.

## Variable release verification

- Trusted Publisher run 31919315965 completed successfully for v0.1.6.
- Target app app/package.json, package-lock.json, pnpm-lock.yaml, and versions.yml reference 0.1.6.
- Target app restarted successfully; the installed bundle contains 变量.创建 and 变量.读取 handlers and listens on port 4649 without startup errors.

## Full Milky API release

- v0.1.7 adds all 65 English snake_case Milky API endpoints exposed by Fraq 0.14.0 and 0.17.0.
- API parameters default from the current event, including mentioned/replied/current QQ IDs, group and peer IDs, message sequences, reply/current message segments, media resources, files, and forwarded messages.
- Explicit parameters override event defaults; message parameters accept plain text or message-segment JSON.
- API parameters and serialized return values support scoped variables and the existing unlimited nested-term parser.
- Static endpoint definitions are checked against Fraq's `ApiParams` types so parameter names and scalar/message kinds cannot silently drift.
- `pnpm test`, `pnpm check`, `pnpm build`, and `npm pack --dry-run --json` passed for v0.1.7 on 2026-08-16.

## v0.1.7 release verification

- Trusted Publisher run 31932938825 completed successfully for v0.1.7.
- Target app app/package.json, package-lock.json, pnpm-lock.yaml, and versions.yml now reference 0.1.7.
- Target app restarted successfully with Fraq 0.14.0; fraq-plugin-lexicon is applied and Hono listens on 127.0.0.1:4649 without startup errors.
- The installed bundle contains the 65-endpoint registry, event-derived API defaults, mention/reply context fields, and variable-safe API result serialization.

## Full Milky event templates

- v0.1.8 listens to all 21 event names covered by Fraq `EventMap`.
- Event lexicon questions use `[event.<event_type>]`, such as `[event.group_nudge]`.
- Answers can read nested event values with `[event.<field path>]`, including array indexes, variables, API parameters, and unlimited nested parsing.
- API defaults inherit same-name fields from every event `data` object; explicit parameters still win.
- Group and friend event outputs are sent to their current conversation; events without a sendable conversation still execute API terms.
- Event parsing and controller behavior are covered by 14 passing tests.
- `pnpm test`, `pnpm check`, `pnpm build`, and `npm pack --dry-run --json` passed for v0.1.8 on 2026-08-16.

## Question and answer templates

- v0.1.9 renders variable and event terms in both lexicon questions and answers.
- `[event.<event_type>]` acts as a no-output event condition in both positions.
- Event field paths and scoped variables can build dynamic question text before exact or fuzzy matching.
- API and lexicon terms remain literal during question matching so matching cannot call external APIs or recurse into another lexicon.
- Static questions containing ordinary brackets or API-looking text retain their previous literal matching behavior.
- The dual-position behavior and API alias removal are covered by 14 passing tests.
- `pnpm test`, `pnpm check`, `pnpm build`, and `npm pack --dry-run --json` passed for v0.1.9 on 2026-08-16.

## v0.1.9 release verification

- Annotated tag `v0.1.9` points to feature commit `6bf48b5`.
- Trusted Publisher workflow run `31935651850` completed successfully on 2026-08-16.
- Target app package.json, package-lock.json, pnpm-lock.yaml, and versions.yml now reference 0.1.9.
- The installed bundle contains QuestionTemplateService, dynamic question matching, and event-name guards.
- Target Fraq 0.14.0 restarted successfully; Hono listens on 127.0.0.1:4649 and the Milky WebSocket connected.

## Version progression convention

- In `0.x` releases, patch numbers stop at 9; the version after `0.1.9` is `0.2.0`, never `0.1.10`.
- The source development version is now 0.2.0; npm and the target app remain on the released 0.1.12 until the next tag.

## Variable namespace update

- v0.1.11 removes the old variable syntax and only accepts `[变量.创建.A]` and `[变量.读取.A]`.
- `[变量.创建.A=内容]` assigns an initial value.

## Nudge alias removal

- v0.1.12 removes the Chinese nudge alias and the dedicated nudge action.
- Nudge templates must use the English `send_group_nudge` or `send_friend_nudge` endpoints.

## v0.1.12 release verification

- Annotated tag `v0.1.12` points to merge commit `6ae195d`.
- Trusted Publisher workflow run `31975940798` completed successfully.
- Target app package.json, package-lock.json, pnpm-lock.yaml, and versions.yml now reference 0.1.12.
- The installed bundle accepts only `[变量.创建.*]` and `[变量.读取.*]` variable terms and contains no Chinese nudge alias.
- Target Fraq 0.14.0 restarted successfully; Hono listens on 127.0.0.1:4649 and the Milky WebSocket connected.

## Question variable handoff

- The v0.2.0 development source now carries variables created while matching a question into that entry's answer rendering.
- Nested `[词库.<name>]` matches merge their question variables into the active answer scope for subsequent terms.
- Variable scopes remain isolated between separate messages and Milky events.
- Regression coverage includes message answers, Milky event answers, and nested lexicon expansion.
- `pnpm test`, `pnpm check`, `pnpm build`, and `npm pack --dry-run --json` passed with 15 tests on 2026-08-16.

## v0.2.0 release verification

- Annotated tag `v0.2.0` points to feature commit `085a822`.
- Trusted Publisher workflow run `31978731331` completed successfully on 2026-08-16.
- Target app installed `fraq-plugin-lexicon` `0.2.0`, updated `versions.yml`, and restarted successfully.
- Target Fraq remains listening on `127.0.0.1:4649` with an established local Milky connection.

## v0.2.1 API parameter audit

- Fraq 0.14 and 0.17 expose the same 65 API endpoints with identical request parameter names, types, and optionality.
- `qq` now maps to `user_id` only when the endpoint supports `user_id`; conflicting `qq` and `user_id` values return a clear error.
- Event defaults preserve real event values and derive `notification_type`, `reaction`, `is_self_send`, and group `peer_id -> group_id` mappings.
- API definitions now retain Fraq `request_ZodInput` optionality, validate missing required parameters, and validate finite string enums before calling Milky.
- `group_id` and `message_seq` now use the official JSON Schema ranges for both explicit values and event-derived defaults.
- `pnpm check`, 18 tests, `pnpm build`, and `npm pack --dry-run --json` passed for v0.2.1 on 2026-08-16.

## v0.2.1 release verification

- Annotated tag `v0.2.1` points to feature commit `91ab977` and is present on the remote.
- Trusted Publisher workflow run `31980658775` completed successfully on 2026-08-16, and npm serves `fraq-plugin-lexicon@0.2.1`.
- Target root/app package manifests, pnpm lockfiles, npm lockfiles, `versions.yml`, active node_modules, and Fraq package cache now reference `0.2.1`.
- The installed app bundle contains the `group_id` and `message_seq` range validation code.
- Target Fraq restarted successfully, loaded `fraq-plugin-lexicon`, listens on `127.0.0.1:4649`, and reconnected to Milky.
- pnpm left an inactive `0.2.0` copy under `app/node_modules/.ignored`; recursive cleanup was blocked by the execution safety policy and `pnpm prune` did not remove it. Active module resolution is confirmed as `0.2.1`.

## v0.2.2 IncomingSegment templates

- `[消息.取值.<segment type>.<field path>]` reads from the first matching current-message segment's `data` object.
- Nested object fields and array indexes are supported, including reply segment paths such as `[消息.取值.reply.segments.0.data.text]`.
- `消息.取值` terms work in questions and answers and can be nested into variables and API parameters; the old `[is.*]` syntax is removed.
- `[消息.构建.text.<content>]` builds a text message segment and can be nested into API `message` parameters or variables.
- The original `get_group_member_info` failure can now be avoided with `[api.get_group_member_info.user_id=[消息.取值.mention.user_id]]`, which passes the actual mentioned QQ.
- `pnpm check`, 20 tests, `pnpm build`, and `npm pack --dry-run --json` passed for v0.2.2 on 2026-08-17.

## v0.2.2 release verification

- 注解标签 `v0.2.2` 指向功能提交 `c172ae6`，远程标签已存在。
- npm Trusted Publisher 工作流运行 `32009080694` 已成功完成，npm `latest` 为 `fraq-plugin-lexicon@0.2.2`。
- 目标项目 root/app 的 package manifest、pnpm lockfile、npm lockfile、`versions.yml`、活动 node_modules 和 Fraq 包缓存均已同步为 `0.2.2`。
- 目标项目安装包包含 `[消息.取值.*]`、`[消息.构建.text.*]` 和消息段构建服务代码。
- 目标 Fraq 已重新启动，成功加载 `fraq-plugin-lexicon`，监听 `127.0.0.1:4649` 并重新连接 Milky WebSocket。
