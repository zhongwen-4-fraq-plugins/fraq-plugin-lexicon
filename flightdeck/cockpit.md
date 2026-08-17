# Cockpit — fraq-plugin-lexicon

Focus: 验证已发布的 `fraq-plugin-lexicon` v0.2.1 Milky API 参数映射。

## In flight

- `template-message-plugin` — v0.2.1 已发布、安装并正常启动，等待真实群聊验证

## Next

- 验证 `get_group_member_info` 的 `qq` 简写，以及群请求、消息反应、文件和撤回事件自动参数。
- 验证后根据实际 Milky 返回继续补充实现差异适配。

## Open questions

- 真实 Milky 服务是否还存在 Fraq 类型未覆盖的实现特有参数差异？
- 是否需要手动清理目标项目 `app/node_modules/.ignored` 中不参与解析的旧插件副本？
