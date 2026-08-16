# Cockpit — fraq-plugin-lexicon

Focus: 验证 `fraq-plugin-lexicon` v0.1.12 新变量语法与英文 nudge API。

## In flight

- `template-message-plugin` — v0.1.12 已通过 Trusted Publisher 发布并安装到目标 Fraq 应用，待真实交互验证

## Next

- 在真实群聊中验证 `[变量.创建.*]`、`[变量.读取.*]` 和英文 nudge API。

## Open questions

- 真实 Milky 服务对请求类事件是否允许直接向关联群发送文本？
- v0.1.12 Trusted Publisher run 31975940798 succeeded; target app is running fraq-plugin-lexicon 0.1.12 on 127.0.0.1:4649.
- Prefix inheritance fix is prepared for release v0.1.4; the plugin now uses Fraq's route activation resolver.
- Target app installed v0.1.4 and restarted successfully on 2026-08-16; Fraq 0.14.0 and global / activation remain unchanged.
- Preparing v0.1.5: automatic default lexicons and current management-lexicon switching.
- v0.1.5 published and installed in the target app; automatic default lexicon behavior is ready for group-message verification.
- Preparing v0.1.6: scoped template variables with recursive lexicon expansion.
- v0.1.6 variable support is published and loaded by the target app; runtime startup verification passed.
- Preparing v0.1.7: all 65 Fraq Milky API endpoints, event-derived defaults, and variable-aware nested API results.
- v0.1.7 published through Trusted Publisher run 31932938825 and loaded by the target Fraq 0.14.0 app on port 4649.
