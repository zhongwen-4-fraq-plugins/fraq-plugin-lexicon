# Documentation layout checklist
SUMMARY: Always keep README focused on the plugin overview, installation, configuration, management command table, and documentation links; keep a prefix-grouped, shortest-first term table in usage docs without enumerating API endpoints.
READ WHEN: before modifying README, lexicon usage documentation, or package documentation files

---

- `README.md` 保留插件整体介绍、安装、基础配置、管理命令表和文档入口。
- 词库作用域、匹配规则和词条模板用法放在 `docs/lexicon-usage.md`。
- `docs/lexicon-usage.md` 的词条速查按开头分别建表，每个表按词条格式从短到长排列；API 只列通用调用格式，不枚举端点。
- 开发、发布和 PR 维护说明放在 `docs/development.md`。
- `package.json` 的 `files` 必须包含 `docs`，确保 npm 包中可直接查看详细文档。
