# Index — template-message-plugin

## State

- 用户希望把 `fraq-plugin-lexicon` 实现为支持精确/模糊匹配的词库插件。
- 回答内容包含可执行词条；词条需要支持无固定深度的嵌套解析。
- MVP 已实现：多词库、SQLite、精确/包含匹配、权限、API 词条和词库递归词条。
- v0.3.3 已发布并安装到目标 Fraq；本轮文本模式 `逻辑.or` 优先回退变更已完成目标启动验证，待真实群聊验证。
- 当前源码已将消息段读取语法改为 `[消息.读取.<类型>.<路径>]`，不兼容旧的 `[消息.取值...]`；尚未发布或安装到目标 Fraq。
- 当前发行版本为 `v0.3.4`，已发布、推送并安装到目标 Fraq；包含 `[词库.拒绝执行]` 和 `[逻辑.休眠.<秒数>]`。
- 当前源码已将 `package.json` 的 `fraq.category` 从市场不接受的 `utility` 修正为 `utilities`；复刻市场转换后为 `unlisted: false`，尚未发布到 npm。
- 当前源码已将条件模式的 `[逻辑.or...]` 和 `[逻辑.and...]` 改为只接受完全匹配的小写 `true` 和 `false`；尚未发布安装。
- 当前源码已新增条件词条 `[逻辑.等于.<值1>.<值2>]` 和 `[逻辑.不等于.<值1>.<值2>]`；两者精确比较两个非空参数，尚未发布安装。
- 当前源码已新增 `[逻辑.notin.<目标>.<候选...>]`；目标与全部候选都不相等时条件成立，尚未发布安装。
- README 已新增管理命令表；`docs/lexicon-usage.md` 改为引用该表并继续承载词条详细用法。
- `docs/lexicon-usage.md` 已新增按前缀分组、从短到长排列的完整词条速查表，API 表不展开具体端点。

## Next

- 下次发布后确认 `fraqjs/registry` 生成的 `plugins.json` 已收录本插件且分类为 `utilities`。
- 发布并安装本轮变更后，在真实群聊中验证 ID 3 的 `[消息.读取.mention.user_id]` 和 `[api.get_user_profile]`。
- 发布并安装本轮变更后，在真实群聊中验证 `[词库.拒绝执行]` 会阻止后续 API 和嵌套词条执行。
- 发布并安装本轮变更后，在真实群聊中验证 `[逻辑.休眠.<秒数>]` 的整数、小数和后续继续执行。
- 在真实群聊中验证 `词库 查询 <词条ID>` 和 `词库 查询 <词库名> <词条ID>`。
- 在真实群聊中验证 `词库 修改 <词条ID> [问 <新问题>] 答 <新回答>`。
- 在真实群聊中验证 `[逻辑.判断]` 条件块、块外文本逻辑词条和无限嵌套解析。

## Read now

- `src/index.ts`
- `package.json`
- `flightdeck/knowledge/milky/protocol.md`
- `flightdeck/knowledge/milky/api-parameter-mapping.md`
- `flightdeck/knowledge/milky/incoming-segment-template.md`
- `flightdeck/knowledge/fraq/plugin-api.md`
- `flightdeck/knowledge/github/release-workflow.md`
- `flightdeck/knowledge/templates/logic-terms.md`
- `flightdeck/work/template-message-plugin/design.md`

## Read if

- 修改 npm 插件信息或 Fraq 市场分类时读取 `flightdeck/knowledge/fraq/market-metadata.md`。
- 修改 README 或使用文档时读取 `README.md` 和 `flightdeck/knowledge/docs/documentation-layout.md`。
- 添加验证时读取 `test/smoke.ts`。
- 再次发布并安装到目标 Fraq 时读取 `flightdeck/knowledge/fraq/target-app-integration.md`。

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
- 已按 `fraqjs/market` 当前转换规则修正 npm 插件分类，避免生成结果被标记为 `unlisted`。
- 已添加基于 GitHub OIDC 的 npm Trusted Publisher 发布工作流和配置说明。
- 已添加 PR 自动审核工作流，覆盖质量门禁和同仓库评论汇总。
- 已添加 BUG 与功能请求两个 GitHub Issue Form，并关闭空白 Issue。
- 已优化 Issue 模板中的最新版徽章、Issue 列表链接和功能标题前缀。

## Verification

- `pnpm test`：6 个测试全部通过。
- `pnpm check`：Biome 与 TypeScript 检查通过。
- `pnpm build`：构建成功并生成声明文件。
- `npm pack --dry-run --json`：打包预览成功，仅包含 README、`dist` 和 `package.json`。
- 复刻 `fraqjs/market` manifest 转换：分类为 `utilities`，仓库地址正确，`unlisted: false`。
- 市场分类修正后 `pnpm check` 与 `npm pack --dry-run --json` 均通过。
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

- `[消息.读取.<segment type>.<field path>]` reads from the first matching current-message segment's `data` object.
- Nested object fields and array indexes are supported, including reply segment paths such as `[消息.读取.reply.segments.0.data.text]`.
- `消息.读取` terms work in questions and answers and can be nested into variables and API parameters; the old `[is.*]` syntax is removed.
- `[消息.构建.text.<content>]` builds a text message segment and can be nested into API `message` parameters or variables.
- The original `get_group_member_info` failure can now be avoided with `[api.get_group_member_info.user_id=[消息.读取.mention.user_id]]`, which passes the actual mentioned QQ.
- `pnpm check`, 20 tests, `pnpm build`, and `npm pack --dry-run --json` passed for v0.2.2 on 2026-08-17.

## v0.2.2 release verification

- 注解标签 `v0.2.2` 指向功能提交 `c172ae6`，远程标签已存在。
- npm Trusted Publisher 工作流运行 `32009080694` 已成功完成，npm `latest` 为 `fraq-plugin-lexicon@0.2.2`。
- 目标项目 root/app 的 package manifest、pnpm lockfile、npm lockfile、`versions.yml`、活动 node_modules 和 Fraq 包缓存均已同步为 `0.2.2`。
- 目标项目当时安装包包含消息段字段读取、`[消息.构建.text.*]` 和消息段构建服务代码。
- 目标 Fraq 已重新启动，成功加载 `fraq-plugin-lexicon`，监听 `127.0.0.1:4649` 并重新连接 Milky WebSocket。

## v0.2.3 entry query command

- `词库 查询 <词条ID>` 使用当前管理词库，切换词库后会随当前选择查询。
- `词库 查询 <词库名> <词条ID>` 查询指定词库，并继续支持 `全局:<名称>` 与 `群:<名称>` 选择器。
- 查询前复用词库管理权限检查，结果展示词库作用域、匹配方式、问题和回答。
- 查询服务会校验词条 ID 确实属于目标词库，避免跨词库读取同一 ID。
- `pnpm test`、`pnpm check`、`pnpm build` 和 `npm pack --dry-run --json` 均通过，共 21 个测试。

## v0.2.4 entry update command

- `词库 修改 <词条ID> [问 <新问题>] 答 <新回答>` 使用当前管理词库。
- `词库 修改 <词库名> <词条ID> [问 <新问题>] 答 <新回答>` 修改指定词库。
- 省略“问”时保留原问题；无论是否修改问题，原精确/模糊匹配方式保持不变。
- 修改前复用词库管理权限和词条归属校验；修改问题触发唯一键冲突时返回明确错误。
- `pnpm test`、`pnpm check`、`pnpm build` 和 `npm pack --dry-run --json` 均通过，共 22 个测试。

## v0.2.4 release verification

- 注解标签 `v0.2.4` 指向功能提交 `3a7534f`，远程标签已存在。
- npm Trusted Publisher 工作流运行 `32080575300` 于 2026-08-17 成功完成，npm `latest` 为 `fraq-plugin-lexicon@0.2.4`。
- 目标项目 root/app 的 package manifest、pnpm lockfile、npm lockfile、`versions.yml`、活动 node_modules 和 Fraq 包缓存均已同步为 `0.2.4`。
- 目标项目安装包已确认包含当前/指定词库查询命令，以及保留问题或同时修改问答的命令。
- 目标 Fraq 已重新启动，成功加载 `fraq-plugin-lexicon`，监听 `127.0.0.1:4649` 并重新连接 Milky WebSocket。

## v0.2.5 automatic GitHub Release

- `.github/workflows/release.yml` 在 `发布 npm 包` 工作流成功完成后触发，并只处理 `v*` 标签推送。
- `.github/scripts/generate-release-notes.mjs` 使用上一个可达版本标签到当前标签的提交历史生成发布说明。
- `✨`、`🐛`、`🎨`、`📝` 分别生成新增、修复、优化和文档区段，空区段自动隐藏。
- 纯 `flightdeck/` 文档提交不进入发布说明；未分类提交进入“其他”，多个 `🔖` 提交只保留最新一个。
- Release 标题去掉标签前导 `v`，重复运行时更新已有 Release，避免创建重复条目。
- 使用真实 `v0.2.4` 历史生成的说明只包含两个新增功能；25 个测试、静态检查、构建、打包预览和 YAML 解析均通过。

## v0.2.6 logic template terms

- `[逻辑.or.<参数...>]` 在全部参数为布尔值时执行或运算，否则随机返回一个文本参数。
- `[逻辑.and.<参数...>]` 在全部参数为布尔值时执行与运算，否则按顺序拼接全部文本参数。
- `[逻辑.in.<值>.<候选...>]` 使用精确字符串比较判断首个值是否属于候选集合。
- 布尔值支持 `true/false`、`1/0`、`是/否` 和 `真/假`，输出统一为 `true` 或 `false`。
- 逻辑词条已接入问题和回答解析，可嵌套变量、事件、消息段和其他逻辑词条。
- `pnpm test`、`pnpm check`、`pnpm build` 和 `npm pack --dry-run --json` 均通过，共 27 个测试。

## v0.2.7 explicit logic conditions

- 新增 `[逻辑.判断]条件内容[逻辑.否则判断]条件内容[逻辑.否则]内容[逻辑.判断.结束]` 显式条件块；否则判断和否则分支均可省略。
- `[逻辑.判断]` 与 `[逻辑.否则判断]` 后必须紧跟 `[逻辑.or]`、`[逻辑.and]` 或 `[逻辑.in]` 条件词条，不再根据参数内容自动判断布尔或文本模式。
- 条件块内 `or`、`and` 强制解析布尔值，`in` 精确判断首值是否属于候选集合；非法布尔参数返回明确错误。
- 条件块外 `or` 随机选择文本，`and` 顺序拼接文本，`in` 禁止使用并提示必须放入条件分支。
- 条件块已接入问题与回答解析，支持无限嵌套；未选分支不会执行 API 或变量操作，失败条件的变量作用域不会泄漏。
- `pnpm test`、`pnpm check`、`pnpm build` 和 `npm pack --dry-run --json` 均通过，共 28 个测试。

## v0.2.7 release verification

- 注解标签 `v0.2.7` 指向功能提交 `4ce9b6f`，并已推送到远程仓库。
- npm Trusted Publisher 工作流 `32085345487` 与 GitHub Release 工作流 `32085374723` 均于 2026-08-18 成功完成。
- npm `latest` 与 GitHub Release 均为 `0.2.7`；Release 标题为 `0.2.7`，发布说明正确列出三个新增功能。
- 目标项目根目录与 `app` 的 manifest、pnpm/npm 锁文件、`versions.yml` 和已安装包均已同步为 `fraq-plugin-lexicon@0.2.7`。
- 目标 Fraq 已重新启动并加载 `fraq-plugin-lexicon`，监听 `127.0.0.1:4649`，Milky WebSocket 已连接。
- 本轮未发现遗留的 `tsx --test`、`node --test` 或词库测试进程。

## v0.2.8 merged release workflow

- GitHub Release 已从独立的 `.github/workflows/release.yml` 合并到 `.github/workflows/publish.yml`。
- `release` job 使用 `needs: publish`，依靠 GitHub Actions 的默认依赖行为确保 `npm publish` 成功完成后才生成发布说明并创建或更新 Release。
- Release job 使用独立的 `contents: write` 权限，npm publish job 继续使用 Trusted Publisher 所需的最小 OIDC 权限。
- Release job 检出当前发布 tag，并继续使用 `--verify-tag` 避免为不存在的标签创建 Release。
- 已移除回答与问题条件解析中重复的 `true/false` 返回值校验；外层逻辑词条已保证非失败结果为布尔字符串。
- YAML 解析、29 个测试、静态检查、构建和 `npm pack --dry-run --json` 均已通过。

## v0.2.8 redundant work audit

- 管理控制器现在只解析并校验目标词库一次，再把已确认的 `Lexicon` 传入新增、查询、修改和删除服务，避免服务层按名称重复查询。
- 默认词库选择会先检查真实存在的活动词库 ID，不再以 `-1` 执行无意义查询，也不会在活动词库有效时重复查询默认词库。
- 数据层插入词库和词条后直接使用写入值、时间戳和 `lastInsertRowid` 构造模型，不再立即查询刚插入的同一行。
- 修改词条在同步存在性检查后直接执行同步更新，并从当前模型与新值构造结果，不再查询和检查词条是否“突然消失”。
- `message_receive` 的默认词库初始化已收口到消息入口，同一事件不会由消息控制器和事件控制器重复初始化。
- 转义判断、条件变量作用域写回和错误文本转换均已提取为共享实现；具名命令匹配成功后不再提前执行默认格式正则。
- 保留了外部输入校验、权限边界、异步失败处理和问题模板 `undefined` 语义等真实防御；新增删除回归测试后共 30 个测试通过。

## v0.2.8 release verification

- 注解标签 `v0.2.8` 指向功能提交 `18db1de`，并已推送到远程仓库。
- 合并后的 `发布 npm 包` 工作流 `32088940167` 于 2026-08-18 成功完成；`测试、构建并发布` 任务完成后，`生成发布说明并创建 Release` 任务才开始执行。
- npm `latest` 与 GitHub Release 均为 `0.2.8`，Release 标题为 `0.2.8`。
- 目标项目根目录与 `app` 的 manifest、pnpm/npm 锁文件、`versions.yml` 和已安装包均已同步为 `fraq-plugin-lexicon@0.2.8`。
- 目标 Fraq 已完整重新启动并加载 `fraq-plugin-lexicon`，监听 `127.0.0.1:4649`，Milky WebSocket 已连接。
- 本轮未发现遗留的 `tsx --test`、`node --test` 或词库测试进程。

## v0.2.9 user input request term

- 新增 `[逻辑.请求用户输入]`，先发送当前可见前置文本，再等待同一机器人、会话和用户的下一条消息并继续解析。
- 等待状态由独立服务管理，默认 5 分钟超时；词库管理命令保持优先且不会被当作输入，普通输入消息不会继续触发其他词库。
- 用户输入会转义为普通文本，避免输入内容中的 API、变量或其他模板被意外执行。
- 请求词条可嵌套在变量、API、词库回答和已选条件分支中，并支持多个请求依次等待；问题模板和布尔条件参数不允许请求输入。
- `pnpm check`、32 项测试、`pnpm build` 和 `npm pack --dry-run --json` 均已通过，打包版本为 `fraq-plugin-lexicon@0.2.9`。

## v0.2.9 release verification

- 注解标签 `v0.2.9` 指向功能提交 `7367bf2`，并已推送到远程仓库。
- 合并后的 `发布 npm 包` 工作流 `32197734844` 成功完成；`测试、构建并发布` 任务完成后，`生成发布说明并创建 Release` 任务才开始执行。
- npm `latest` 与 GitHub Release 均为 `0.2.9`，Release 标题为 `0.2.9`。
- 目标项目根目录与 `app` 的 manifest、pnpm/npm 锁文件、`versions.yml` 和已安装包均已同步为 `fraq-plugin-lexicon@0.2.9`。
- 目标 Fraq 已完整重新启动并加载 `fraq-plugin-lexicon`，监听 `127.0.0.1:4649`，Milky WebSocket 已连接，WebUI 返回 HTTP 200。
- 本轮未发现遗留的 `tsx --test`、`node --test` 或词库测试进程。

## v0.3.0 explicit user input prompt

- 用户输入请求语法改为 `[逻辑.请求用户输入.<提示消息>]`，无提示消息的旧语法不再支持。
- 命中请求词条时只发送显式提示消息，不再分段发送请求词条之前的回答内容。
- 用户回复后输入替换请求词条，保留的回答前缀、输入和后续模板解析完成后一次性发送最终结果。
- 提示消息仍可嵌套变量、事件、消息段、API、词库和逻辑词条；等待隔离、命令优先、文本转义和超时规则保持不变。
- `pnpm check`、32 项测试、`pnpm build` 和 `npm pack --dry-run --json` 均已通过，打包版本为 `fraq-plugin-lexicon@0.3.0`。

## v0.3.0 failed publish release notes

- 发布链增加 `检查历史发布状态` 任务，顺序为 npm 发布、历史检查、生成 Release；后续任务依赖前一任务的默认成功语义。
- 历史检查按版本倒序查询同一 `publish.yml` 工作流，并同时匹配标签名与标签指向的提交 SHA。
- 遇到失败、取消或没有工作流的标签时继续向前查找最近成功发布标签，Release 说明从该成功标签统计到当前标签，因此自动包含所有失败标签期间的提交。
- 如果没有任何历史标签成功发布，则当前 Release 包含当前标签可达的全部提交。
- `pnpm check`、34 项测试、`pnpm build` 和 `npm pack --dry-run --json` 均已通过；工作流结构测试确认执行顺序和提交范围参数正确。

## v0.3.0 release verification

- 注解标签 `v0.3.0` 指向功能提交 `fcb0eb3`，并已推送到远程仓库。
- `发布 npm 包` 工作流 `32251596406` 于 2026-08-19 成功完成；npm 发布、历史发布检查和 GitHub Release 三个任务均成功。
- npm `latest` 与 GitHub Release 均为 `0.3.0`，Release 标题为 `0.3.0`，更新日志包含新增和修复分类。
- 目标项目根目录与 `app` 的 manifest、pnpm/npm 锁文件、`versions.yml` 和活动安装包均已同步为 `fraq-plugin-lexicon@0.3.0`。
- 目标 Fraq 已通过完整 `pnpm start` 重新启动并加载 `fraq-plugin-lexicon`，监听 `127.0.0.1:4649`，Milky WebSocket 已连接，WebUI 跟随登录跳转后返回 HTTP 200。
- 本轮未发现遗留的 `tsx --test`、`node --test` 或词库测试进程。

## v0.3.1 user input timeout options

- 请求用户输入词条支持 `[逻辑.请求用户输入.<提示文本>.<超时时间=秒>.<超时提示=文本>]`，两个具名参数均可独立省略。
- 未指定词条级参数时默认等待 30 秒并发送“会话超时”；`userInputTimeoutMs` 仍可修改全局默认等待时间。
- 词条级超时时间覆盖全局默认值；超时提示发送后终止当前回答，控制器不会再追加“词条执行失败”。
- 参数只从词条末尾识别，提示文本中的普通点号保持兼容；重复参数、非正数超时和空超时提示会返回明确格式错误。
- 开发版本已更新为 `0.3.1`；`pnpm test` 共 35 项、`pnpm check`、`pnpm build` 和 `npm pack --dry-run --json` 均通过。

## Help issue form

- 新增 `.github/ISSUE_TEMPLATE/help.yml`，用于提交插件使用或配置帮助请求。
- 表单要求提交者确认已阅读 Issue 列表，并必填“你需要什么帮助？”文本框。
- 模板使用 `[Help] ` 标题前缀和 `question` 标签；YAML 解析与必填字段结构验证通过。
- BUG 表单的复现步骤占位提示已简化为“执行了什么操作”和“出现了什么结果”，不再重复询问版本。

## Source-only release notes

- 自动生成的 Release 更新日志现在只提取至少修改一个 `src/` 文件的 commit。
- README、Issue 模板、工作流、版本文件和 Flightdeck 等未触及 `src/` 的提交不会进入任何更新日志分类。
- Git Emoji 分类和“仅保留最新书签提交”规则仍然保留，但同样受 `src/` 提交门槛约束。
- 发布说明定向测试共 7 项通过，静态检查通过。

## Documentation layout

- README 现在只保留插件整体介绍、安装、配置和详细文档入口。
- 词库管理、匹配规则和词条模板用法已迁移到 `docs/lexicon-usage.md`。
- 开发、Trusted Publisher 和 PR 审核说明已迁移到 `docs/development.md`，`package.json` 已将 `docs` 加入 npm 包。
- `pnpm check` 通过；`npm pack --dry-run --json` 确认 README 和两份 `docs/` 文档均进入 `fraq-plugin-lexicon@0.3.1` 包。

## v0.3.1 API syntax validation

- Milky API 端点会在调用客户端之前校验；未知端点直接返回“没有这个 Milky API”。
- 显式参数名必须严格使用 Milky 协议名称；`qq` 别名已移除，会纠正为 `user_id`。
- 参数名校验会提示常见别名、忽略下划线后的匹配名或单参数 API 的唯一参数；无建议时列出可用参数。
- 必填参数仍在合并事件默认值后校验，保留“参数默认从事件取”的既有行为。
- `pnpm test` 36 项、`pnpm check` 和 `pnpm build` 均通过。

## v0.3.1 counted loops

- 新增 `[逻辑.计次循环.<次数>]...[逻辑.计次循环尾]`，次数可使用变量或其他嵌套词条生成。
- 新增 `[循环.退出]` 和 `[循环.跳过]`，保留控制词条前的输出，并只影响最近一层循环。
- 循环支持问题和回答、无限嵌套、条件分支、变量作用域与现有所有词条。
- 次数必须是 `0..10000` 之间的整数，防止空循环或超大次数占用执行资源。
- 块级解析改为按最早外层位置在条件和循环之间选择，确保循环内条件每次迭代重新执行。
- `pnpm test` 共 40 项、`pnpm check`、`pnpm build` 和 `npm pack --dry-run --json` 均通过，打包版本为 `fraq-plugin-lexicon@0.3.1`。

## v0.3.1 release verification

- 注解标签 `v0.3.1` 指向功能提交 `e34719f`，并已推送到远程仓库。
- `发布 npm 包` 工作流 `32313573811` 成功完成；npm 发布、历史发布检查和 GitHub Release 三个任务均成功。
- npm `latest` 与 GitHub Release 均为 `0.3.1`，Release 标题为 `0.3.1`，更新日志仅包含修改 `src/` 的提交。
- 目标项目根目录与 `app` 的 manifest、pnpm/npm 锁文件、`versions.yml`、缓存元数据和活动安装包均已同步为 `fraq-plugin-lexicon@0.3.1`。
- 目标项目 `app/node_modules/.ignored` 中遗留的 `fraq-plugin-lexicon@0.3.0` 副本已精确清理。
- 目标 Fraq 已完整重新启动并加载 `fraq-plugin-lexicon`，监听 `127.0.0.1:4649`，Milky WebSocket 已连接，WebUI 跟随登录跳转后返回 HTTP 200。
- 本轮未发现遗留的 `tsx --test`、`node --test` 或词库测试进程。

## v0.3.2 JSON variable value term

- 新增 `[json.取值.<变量名>.<字段路径>]`，从变量中的 JSON 读取对象字段或数组下标。
- JSON 变量可以来自字面值、事件字段、消息段、API 返回值或其他嵌套词条；变量名和字段路径也支持嵌套词条动态生成。
- JSON 取值同时支持问题与回答，问题中创建的 JSON 变量会继续传递到回答作用域。
- 对象或数组结果序列化为 JSON 文本，字符串、数字和布尔值按模板值输出，并继续使用现有模板转义规则。
- 变量未创建、内容不是有效 JSON 或字段不存在时返回明确错误；问题解析遇到这些错误时视为不匹配。
- 开发版本更新为 `0.3.2`；`pnpm test` 共 42 项、`pnpm check`、`pnpm build` 和 `npm pack --dry-run --json` 均通过。

## Logic OR optional candidates

- 文本模式的 `[逻辑.or.<候选1>.<候选2>...]` 现在会跳过空文本、未创建变量和当前消息中不存在的字段。
- 按参数顺序优先返回第一个可用候选；第一个不可用时继续尝试后续候选，全部不可用时返回明确错误。
- 逻辑条件中的 `or` 仍要求布尔参数，缺失变量不会被静默转换为 `false`。
- `pnpm test` 共 43 项、`pnpm check` 和 `pnpm build` 均通过。

## v0.3.2 release verification

- 注解标签 `v0.3.2` 指向功能提交 `69eac6d`，并已推送到远程仓库。
- `发布 npm 包` 工作流 `32429170482` 成功完成；测试发布、历史发布检查和 GitHub Release 三个任务均成功。
- npm `latest` 与 GitHub Release 均为 `0.3.2`，Release 更新日志仅包含修改 `src/` 的 JSON 变量取值提交。
- 目标项目根目录与 `app` 的 manifest、pnpm/npm 锁文件、`versions.yml`、缓存元数据和活动安装包均已同步为 `fraq-plugin-lexicon@0.3.2`。
- 目标项目 `app/node_modules/.ignored` 中遗留的 `fraq-plugin-lexicon@0.3.1` 副本已精确清理。
- 目标 Fraq 已完整重新启动并加载 `fraq-plugin-lexicon@0.3.2`，监听 `127.0.0.1:4649`，Milky WebSocket 已连接，WebUI 跳转登录页后返回 HTTP 200。
- 活动构建文件已确认包含 JSON 变量取值解析逻辑，本轮没有遗留词库测试进程。
## v0.3.3 ordered logic.or fallback release verification

- 注解标签 `v0.3.3` 指向提交 `d3f9a54`，已推送到远程仓库。
- `发布 npm 包` 工作流 `32533707424` 成功完成，npm 发布、历史发布检查和 GitHub Release 均成功。
- npm `latest` 与 GitHub Release 均为 `0.3.3`。
- 目标项目根目录与 `app` 的 package manifest、pnpm/npm 锁文件、`versions.yml`、缓存元数据和活动安装包均已同步为 `fraq-plugin-lexicon@0.3.3`。
- 目标 Fraq 已重新启动并加载 `fraq-plugin-lexicon`，监听 `127.0.0.1:4649`，Milky WebSocket 已连接，WebUI 跟随跳转后返回 HTTP 200。
- 目标根路径返回 HTTP 404 属于当前路由配置，服务监听和 WebUI 路由均正常；未发现遗留测试进程。

## Message segment read syntax rename

- 消息段字段语法从 `[消息.取值.<类型>.<路径>]` 破坏性重命名为 `[消息.读取.<类型>.<路径>]`，旧语法直接返回“不支持的消息操作：取值”。
- ID 3 已保存为新语法；此前没有响应是因为 v0.3.3 解析器只识别旧语法，问题模板解析异常后按不匹配处理。
- 帮助文本、使用文档、IncomingSegment 知识约定和全部消息段测试已同步更新。
- `pnpm test` 43 项、`pnpm check` 和 `pnpm build` 均通过。

## Execution stop term

- 新增保留控制词条 `[词库.拒绝执行]`；它终止当前回答解析，保留控制词条之前的文本和已执行 API，跳过之后的文本与词条。
- 控制信号会跨词库嵌套和计次循环传播，但不能放入逻辑条件或循环次数表达式。
- `pnpm test` 44 项通过；完整检查和构建待本轮结束前执行。

## Sleep term

- 新增 `[逻辑.休眠.<秒数>]`；参数按秒解析，支持小数，转换为毫秒后等待，再继续当前回答模板。
- 休眠只允许在回答文本中执行；问题匹配、逻辑条件和循环次数表达式不会等待。
- `pnpm test` 45 项通过；完整检查和构建待本轮结束前执行。

## v0.3.4 release verification

- 提交 `3b161d5` 已打注释标签 `v0.3.4` 并推送到远程仓库；npm 发布工作流 `32608435025` 成功完成。
- npm 已提供 `fraq-plugin-lexicon@0.3.4`；目标项目根目录和 `app/` 的 manifest、pnpm/npm 锁文件均已同步为 `0.3.4`。
- 目标 `app/node_modules/fraq-plugin-lexicon` 活动包为 `0.3.4`，构建文件包含 `[逻辑.休眠]`、`[词库.拒绝执行]` 和 `[消息.读取]`。
- `versions.yml` 已更新为 `lexicon: 0.3.4`，Fraq 重启后缓存生成 `fraq-plugin-lexicon@0.3.4`，WebUI 返回 HTTP 200。
- `app/node_modules/.ignored` 中仍有安装器保留的 `0.3.3` 旧副本；活动解析路径不是该副本，删除操作受当前安全策略阻止。
- 本轮未发现遗留 `tsx --test` 或 `node --test` 测试进程。

## Strict logic booleans

- 条件模式的 `[逻辑.or...]` 和 `[逻辑.and...]` 现在都只接受完全匹配的小写 `true` 和 `false`。
- 不再兼容 `TRUE/FALSE`、前后空格、`1/0`、`是/否`、`真/假`；文本模式的 `逻辑.or` 和 `逻辑.and` 不受影响。
- `pnpm test` 45 项、`pnpm check` 和 `pnpm build` 均通过。

## README management command table

- 管理命令已从 `docs/lexicon-usage.md` 迁移到 README，并按功能、命令和说明整理为表格。
- README 同时说明 Fraq 路由前缀、管理权限、默认词库和省略修改问题时的行为。
- 详细用法文档保留词库作用域、匹配顺序和词条模板，并链接回 README 管理命令表。

## Grouped term quick reference

- 词条速查按 `逻辑`、`循环`、`event`、`消息`、`api`、`词库`、`变量` 和 `json` 开头分别建表。
- 每个表按显示的词条格式从短到长排列，并为每种格式提供用途说明。
- API 表仅保留无参数和带参数的通用格式，不列出具体 Milky API 端点。

## Equality condition terms

- 新增 `[逻辑.等于.<值1>.<值2>]` 和 `[逻辑.不等于.<值1>.<值2>]`，仅能紧跟 `[逻辑.判断]` 或 `[逻辑.否则判断]` 使用。
- 两个词条都要求恰好两个非空参数，按渲染后的原文本精确比较，不忽略大小写或前后空格。
- 问题和回答条件均支持两个新词条，参数可嵌套变量及其他普通取值词条；条件块外直接使用会返回明确错误。
- `pnpm test` 45 项、`pnpm check` 和 `pnpm build` 均通过。

## Logic notin condition

- 新增 `[逻辑.notin.<目标>.<候选1>...]`，作为 `[逻辑.in]` 的反向条件词条。
- `notin` 至少接收两个非空参数；首个参数与后续任意候选相等时为 `false`，与全部候选都不相等时为 `true`。
- `notin` 仅能用于 `[逻辑.判断]` 或 `[逻辑.否则判断]`，条件块外直接使用会返回明确错误。
- `pnpm test` 45 项、`pnpm check` 和 `pnpm build` 均通过。
