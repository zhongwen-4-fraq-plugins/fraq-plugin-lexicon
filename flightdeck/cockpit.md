# Cockpit — fraq-plugin-lexicon

Focus: 发布并验证 `fraq-plugin-lexicon` 词库与嵌套词条解析插件。

## In flight

- `template-message-plugin` — MVP、发布、PR 审核和 Issue 表单已完成，待实机验证

## Next

- 已发布并安装 `v0.1.3`，验证 `/` 前缀和 Fraq 0.14 兼容性。

- 在 npm 配置 Trusted Publisher，并在真实 Fraq 应用中验证完整交互流程。

## Open questions

- 后续优先增加哪些 Milky API 词条？
- Prefix inheritance fix is prepared for release v0.1.4; the plugin now uses Fraq's route activation resolver.
- Target app installed v0.1.4 and restarted successfully on 2026-08-16; Fraq 0.14.0 and global / activation remain unchanged.
- Preparing v0.1.5: automatic default lexicons and current management-lexicon switching.
