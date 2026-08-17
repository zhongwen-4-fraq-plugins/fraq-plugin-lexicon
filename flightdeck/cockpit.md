# Cockpit — fraq-plugin-lexicon

Focus: 完善 `fraq-plugin-lexicon` v0.2.3 词条 ID 查询命令。

## In flight

- `template-message-plugin` — v0.2.3 已支持使用当前或指定词库按 ID 查询词条

## Next

- 在真实群聊中验证消息段取值和文本消息段构建模板。
- 在真实群聊中验证 `词库 查询 <词条ID>` 和 `词库 查询 <词库名> <词条ID>`。
- 用户确认后为 v0.2.3 打 tag、发布并安装到目标 Fraq 项目。

## Open questions

- 真实 Milky 服务是否还存在 Fraq 类型未覆盖的实现特有参数差异？
- 是否需要手动清理目标项目 `app/node_modules/.ignored` 中不参与解析的旧插件副本？
