# GitHub Action version checklist
SUMMARY: Always verify an action's remote major-version tag exists before using it; do not infer matching major versions across unrelated actions.
READ WHEN: before modifying any GitHub Actions workflow or upgrading an action version

---

- 使用 `git ls-remote <action repository> refs/tags/v<major>` 确认目标主版本 tag 真实存在。
- 不同 action 独立发布版本，不能因为 `actions/checkout@v6` 存在就推断 `actions/setup-node@v6` 以上版本也存在。
- 当前已确认可用：`actions/checkout@v6`、`pnpm/action-setup@v4`、`actions/setup-node@v6`、`actions/github-script@v9`。
- 工作流结构测试应拒绝已知不存在的版本，避免直到 GitHub Actions 运行时才发现解析失败。
