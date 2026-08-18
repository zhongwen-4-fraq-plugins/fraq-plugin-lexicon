# Cockpit — fraq-plugin-lexicon

Focus: 完善 `fraq-plugin-lexicon` v0.2.5 自动 GitHub Release 工作流。

## In flight

- `template-message-plugin` — v0.2.5 已支持 npm 标签发布成功后自动生成 GitHub Release

## Next

- 在真实群聊中验证消息段取值和文本消息段构建模板。
- 在真实群聊中验证 `词库 查询 <词条ID>` 和 `词库 查询 <词库名> <词条ID>`。
- 在真实群聊中验证 `词库 修改 <词条ID> [问 <新问题>] 答 <新回答>`。
- 下次版本标签发布时验证自动 Release 标题、提交分类和 Flightdeck 文档过滤。

## Open questions

- 真实 Milky 服务是否还存在 Fraq 类型未覆盖的实现特有参数差异？
- 是否需要手动清理目标项目 `app/node_modules/.ignored` 中不参与解析的旧插件副本？
