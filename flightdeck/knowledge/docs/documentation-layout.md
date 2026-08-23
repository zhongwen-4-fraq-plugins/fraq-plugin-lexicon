# Documentation layout checklist
SUMMARY: Always keep README focused on the plugin overview, installation, configuration, management command table, and documentation links; place template usage and maintainer procedures in dedicated docs.
READ WHEN: before modifying README, lexicon usage documentation, or package documentation files

---

- `README.md` 保留插件整体介绍、安装、基础配置、管理命令表和文档入口。
- 词库作用域、匹配规则和词条模板用法放在 `docs/lexicon-usage.md`。
- 开发、发布和 PR 维护说明放在 `docs/development.md`。
- `package.json` 的 `files` 必须包含 `docs`，确保 npm 包中可直接查看详细文档。
