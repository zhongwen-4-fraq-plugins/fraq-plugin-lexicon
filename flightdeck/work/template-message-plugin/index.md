# Index — template-message-plugin

## State

- 用户希望把 `fraq-plugin-lexicon` 实现为支持精确/模糊匹配的词库插件。
- 回答内容包含可执行词条；词条需要支持无固定深度的嵌套解析。
- MVP 已实现：多词库、SQLite、精确/包含匹配、权限、API 词条和词库递归词条。
- 单元测试、Biome、TypeScript 和构建均已通过，等待真实 Milky/Fraq 环境验证。

## Next

- 在真实 Fraq 应用中配置 `owners`，创建词库并验证消息、权限和戳一戳流程。

## Read now

- `src/index.ts`
- `package.json`
- `flightdeck/knowledge/milky/protocol.md`
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
- 已实现 `[api.戳一戳]`、`[词库.<词库名>]`、无固定深度迭代解析和循环检测。
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
