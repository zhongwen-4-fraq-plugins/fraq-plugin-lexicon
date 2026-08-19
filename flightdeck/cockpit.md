# Cockpit — fraq-plugin-lexicon

Focus: 完成 `fraq-plugin-lexicon` v0.3.1，并确保 Release 更新日志只提取修改 `src/` 的 commit。

## In flight

- `template-message-plugin` — v0.3.1 已实现用户输入超时、Issue Form、文档拆分和仅提取 `src/` commit 的 Release 日志，尚未发布

## Next

- 发布并在真实群聊中验证 `[逻辑.请求用户输入.<提示文本>.<超时时间=秒>.<超时提示=文本>]`。
- 在真实群聊中验证消息段取值和文本消息段构建模板。
- 在真实群聊中验证 `词库 查询 <词条ID>` 和 `词库 查询 <词库名> <词条ID>`。
- 在真实群聊中验证 `词库 修改 <词条ID> [问 <新问题>] 答 <新回答>`。
- 在真实群聊中验证显式逻辑条件分支、文本逻辑词条和嵌套解析。

## Open questions

- 真实 Milky 服务是否还存在 Fraq 类型未覆盖的实现特有参数差异？
- 是否需要手动清理目标项目 `app/node_modules/.ignored` 中不参与解析的旧插件副本？
