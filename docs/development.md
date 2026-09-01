# 开发与维护

## 开发

```bash
pnpm test
pnpm check
pnpm build
```

测试依赖 Fraq `1.1.x` 与 `@fraqjs/plugin-mock` `1.1.x`；`pnpm test` 会运行真实 Context 安装和群消息收发集成测试。

## Trusted Publisher 发布

工作流文件为 `.github/workflows/publish.yml`。推送版本 tag 后，同一工作流会先运行测试、检查、构建和 `npm publish`；只有 npm 发布任务成功完成，才会继续生成发布说明并创建或更新 GitHub Release。

在 npm 包设置的 **Trusted Publisher** 中填写：

- Provider：GitHub Actions
- Organization or user：`zhongwen-4-fraq-plugins`
- Repository：`fraq-plugin-lexicon`
- Workflow filename：`publish.yml`
- Environment：留空
- Allowed actions：`npm publish`

工作流使用 OIDC，不需要配置 `NPM_TOKEN`。推送版本 tag 时，标签必须与 `package.json` 版本一致，支持与 `package.json` 版本一致的 `x.y.z` 或 `vx.y.z` 两种格式。

如果 npm 上还不存在该包，需要先手动发布首个版本，再配置 Trusted Publisher。配置成功并验证发布后，建议在 npm 中禁止传统 token 发布。

## 自动 PR 审核

工作流文件为 `.github/workflows/pr-review.yml`，会在 PR 创建、重新打开、更新提交或标记为可审查时运行：

- 读取 PR 的实际改动文件，只审核本次 PR 的变更。
- 改动触及 `src/`、插件依赖、构建配置或官方 mock 测试时，才安装依赖并运行 `pnpm test:mock`。
- PR 评论使用审核结果标题、默认折叠的 Fraq mock 测试日志和结果表格；表格包含测试结果、PR 提交 hash 值和本次自动测试记录链接。
- 纯文档、工作流或其他不影响插件运行的改动会跳过 mock，并在同一仓库 PR 评论中说明原因。

相关 mock 测试失败会让 PR 工作流失败。同一仓库的 PR 会自动更新一条审核摘要评论；来自 fork 的 PR 仍会审核改动并按需运行 mock，但不会尝试写评论。
