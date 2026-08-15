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

## Verification

- `pnpm test`：6 个测试全部通过。
- `pnpm check`：Biome 与 TypeScript 检查通过。
- `pnpm build`：构建成功并生成声明文件。

## Open questions

- 真实协议端是否会暴露需要额外适配的错误消息格式？
- 后续需要增加哪些 `[api.*]` 动作？
