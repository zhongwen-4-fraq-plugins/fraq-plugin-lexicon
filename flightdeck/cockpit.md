# Cockpit — fraq-plugin-lexicon

Focus: 完成 `fraq-plugin-lexicon` v0.1.11 变量命名空间清理。

## In flight

- `template-message-plugin` — v0.1.11 已移除旧变量语法，仅支持 `[变量.创建.A]` / `[变量.读取.A]`，待验证

## Next

- 运行测试、检查、构建和打包预览，提交 v0.1.11 改动。

## Open questions

- 真实 Milky 服务对请求类事件是否允许直接向关联群发送文本？
- v0.1.9 Trusted Publisher run 31935651850 succeeded; target app is running fraq-plugin-lexicon 0.1.9 on 127.0.0.1:4649.
- Prefix inheritance fix is prepared for release v0.1.4; the plugin now uses Fraq's route activation resolver.
- Target app installed v0.1.4 and restarted successfully on 2026-08-16; Fraq 0.14.0 and global / activation remain unchanged.
- Preparing v0.1.5: automatic default lexicons and current management-lexicon switching.
- v0.1.5 published and installed in the target app; automatic default lexicon behavior is ready for group-message verification.
- Preparing v0.1.6: scoped template variables with recursive lexicon expansion.
- v0.1.6 variable support is published and loaded by the target app; runtime startup verification passed.
- Preparing v0.1.7: all 65 Fraq Milky API endpoints, event-derived defaults, and variable-aware nested API results.
- v0.1.7 published through Trusted Publisher run 31932938825 and loaded by the target Fraq 0.14.0 app on port 4649.
