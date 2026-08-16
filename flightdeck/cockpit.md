# Cockpit — fraq-plugin-lexicon

Focus: 发布并验证 `fraq-plugin-lexicon` 词库与嵌套词条解析插件。

## In flight

- `template-message-plugin` — v0.1.7 全量英文 Milky API 模板已发布并安装，待真实消息交互验证

## Next

- 已发布并安装 `v0.1.3`，验证 `/` 前缀和 Fraq 0.14 兼容性。

- 在 npm 配置 Trusted Publisher，并在真实 Fraq 应用中验证完整交互流程。

## Open questions

- 后续优先增加哪些 Milky API 词条？
- Prefix inheritance fix is prepared for release v0.1.4; the plugin now uses Fraq's route activation resolver.
- Target app installed v0.1.4 and restarted successfully on 2026-08-16; Fraq 0.14.0 and global / activation remain unchanged.
- Preparing v0.1.5: automatic default lexicons and current management-lexicon switching.
- v0.1.5 published and installed in the target app; automatic default lexicon behavior is ready for group-message verification.
- Preparing v0.1.6: scoped template variables with recursive lexicon expansion.
- v0.1.6 variable support is published and loaded by the target app; runtime startup verification passed.
- Preparing v0.1.7: all 65 Fraq Milky API endpoints, event-derived defaults, and variable-aware nested API results.
- v0.1.7 published through Trusted Publisher run 31932938825 and loaded by the target Fraq 0.14.0 app on port 4649.
