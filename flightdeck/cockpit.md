# Cockpit — fraq-plugin-lexicon

Focus: 验证 `fraq-plugin-lexicon` v0.2.9 的用户输入请求词条在真实群聊和私聊中的交互行为。

## In flight

- `template-message-plugin` — v0.2.9 已发布、安装并完成运行验证，下一步进行真实会话验收

## Next

- 在真实群聊中验证消息段取值和文本消息段构建模板。
- 在真实群聊中验证 `词库 查询 <词条ID>` 和 `词库 查询 <词库名> <词条ID>`。
- 在真实群聊中验证 `词库 修改 <词条ID> [问 <新问题>] 答 <新回答>`。
- 在真实群聊中验证显式逻辑条件分支、文本逻辑词条和嵌套解析。

## Open questions

- 真实 Milky 服务是否还存在 Fraq 类型未覆盖的实现特有参数差异？
- 是否需要手动清理目标项目 `app/node_modules/.ignored` 中不参与解析的旧插件副本？
