# Cockpit — fraq-plugin-lexicon

Focus: 完成 `fraq-plugin-lexicon` v0.1.8 全量 Milky 事件模板并准备发布。

## In flight

- `template-message-plugin` — v0.1.8 已接入 21 个 Milky 事件并通过完整验证，待发布

## Next

- 如用户要求打 tag，再发布并安装到真实 Fraq 应用验证事件交互。

## Open questions

- 真实 Milky 服务对请求类事件是否允许直接向关联群发送文本？
- Prefix inheritance fix is prepared for release v0.1.4; the plugin now uses Fraq's route activation resolver.
- Target app installed v0.1.4 and restarted successfully on 2026-08-16; Fraq 0.14.0 and global / activation remain unchanged.
- Preparing v0.1.5: automatic default lexicons and current management-lexicon switching.
- v0.1.5 published and installed in the target app; automatic default lexicon behavior is ready for group-message verification.
- Preparing v0.1.6: scoped template variables with recursive lexicon expansion.
- v0.1.6 variable support is published and loaded by the target app; runtime startup verification passed.
- Preparing v0.1.7: all 65 Fraq Milky API endpoints, event-derived defaults, and variable-aware nested API results.
- v0.1.7 published through Trusted Publisher run 31932938825 and loaded by the target Fraq 0.14.0 app on port 4649.
