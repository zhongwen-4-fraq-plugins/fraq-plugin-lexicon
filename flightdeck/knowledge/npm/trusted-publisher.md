# npm Trusted Publisher 发布检查表
SUMMARY: Always publish npm packages through GitHub OIDC with minimal permissions, a GitHub-hosted runner, current npm CLI, exact repository/workflow registration, and no long-lived token.
READ WHEN: before creating or modifying any npm publishing workflow

---

## npm 端

- 包必须已经存在，首次发布后才能配置 Trusted Publisher。
- Provider 选择 GitHub Actions，并精确填写组织或用户、仓库和工作流文件名。
- Environment 只有在工作流 job 使用 GitHub Environment 时才填写，并且必须完全一致。
- Allowed actions 使用 `npm publish`。
- Trusted Publisher 验证稳定后，建议禁止传统 token 发布。

## GitHub Actions

- 必须使用 GitHub 托管运行器。
- 当前工作流监听 `v*` Git tag 推送；推送版本 tag 会触发工作流，GitHub Release 不是必要条件。
- 当测试、检查、构建均通过而 `npm publish` 失败时，优先核对 npm Trusted Publisher 的组织、仓库、工作流文件名和 Environment 是否与 GitHub Actions 完全一致。
- npm 已发布的版本号不能重复发布；若 `npm publish` 只在发布步骤失败，先检查包版本是否已存在，再升版本并推送匹配的 tag。
pm publish 失败时，优先核对 npm Trusted Publisher 的组织、仓库、工作流文件名和 Environment 是否与 GitHub Actions 完全一致。
- 权限保持最小：`contents: read` 和 `id-token: write`。
- 使用 Node.js 22.14 或更高版本，并确保 npm CLI 至少为 11.5.1。
- `actions/setup-node` 指向 `https://registry.npmjs.org`，发布步骤直接运行 `npm publish`。
- 不要配置 `NPM_TOKEN`；OIDC 由 npm CLI 自动交换短期凭证。
- npm Trusted Publishing 会自动生成 provenance，发布工作流不需要手动维护长期 token。

## 本项目

- 工作流文件：`.github/workflows/publish.yml`。
- npm 组织或用户：`zhongwen-4-fraq-plugins`。
- 仓库：`fraq-plugin-lexicon`。
- Git tag 必须等于包版本或在版本前添加 `v`。

## 官方资料

- `https://docs.npmjs.com/trusted-publishers/`
- `https://docs.npmjs.com/trusted-publishers/using-trusted-publishing-with-oidc/`
- `https://docs.github.com/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-npm`
