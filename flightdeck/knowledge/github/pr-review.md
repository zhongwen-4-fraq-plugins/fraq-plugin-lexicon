# GitHub PR 自动审核检查表
SUMMARY: Review only files changed by the PR, run Fraq's official mock test only when runtime-relevant paths changed, and grant write permission only to the same-repository comment job.
READ WHEN: before creating or modifying a GitHub pull request review workflow

---

## 触发与权限

- 使用 `pull_request` 触发器运行测试和构建，不使用 `pull_request_target` 执行 PR 代码。
- 质量检查只需要 `contents: read`。
- 写评论的 job 单独申请 `issues: write`，并限制为同一仓库的 PR。
- fork PR 仍然执行 Fraq 官方 mock 测试，但不依赖写权限或 secrets。

## Mock 门禁

- 通过 `pulls.listFiles` 获取 PR base/head 的实际改动文件，不使用不完整的浅克隆 diff。
- 仅当改动触及 `src/`、`test/fraq-integration.test.ts`、`package.json`、`pnpm-lock.yaml`、`tsconfig.json` 或 `tsdown.config.ts` 时安装锁定依赖并运行 `pnpm test:mock`。
- 纯文档、工作流和其他不影响插件运行的改动跳过 mock，但仍在评论中列出并审核本次变更文件。
- mock 测试失败时测试 job 失败，PR 可以将该 job 设为 required check。
- 使用 PR 编号做 concurrency key，新提交到达时取消旧检查。

## 评论策略

- 使用隐藏 marker 定位机器人自己的评论。
- 同一 PR 后续提交更新已有摘要，不重复创建评论。
- 评论列出本次 PR 的改动文件，并说明 mock 是成功、失败还是因无相关改动而跳过。
- 实际运行 mock 时捕获 stdout/stderr，去除 ANSI 控制码并截断到安全长度，再以 Base64 job output 传给评论 job；评论使用默认折叠的 `<details>` + `<pre>` 展示。
- 评论 job 使用 `always()`，这样 mock 测试失败时仍能报告失败结果。

## 官方资料

- `https://docs.github.com/actions/using-workflows/events-that-trigger-workflows`
- `https://docs.github.com/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions`
- `https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions`
