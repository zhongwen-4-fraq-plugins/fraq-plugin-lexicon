# Cockpit — fraq-plugin-lexicon

Focus: `fraq-plugin-lexicon` v0.2.4 已发布并安装，等待真实群聊验证查询和修改命令。

## In flight

- `template-message-plugin` — v0.2.4 已发布到 npm、安装到目标 Fraq 项目并通过启动验证

## Next

- 在真实群聊中验证消息段取值和文本消息段构建模板。
- 在真实群聊中验证 `词库 查询 <词条ID>` 和 `词库 查询 <词库名> <词条ID>`。
- 在真实群聊中验证 `词库 修改 <词条ID> [问 <新问题>] 答 <新回答>`。

## Open questions

- 真实 Milky 服务是否还存在 Fraq 类型未覆盖的实现特有参数差异？
- 是否需要手动清理目标项目 `app/node_modules/.ignored` 中不参与解析的旧插件副本？
