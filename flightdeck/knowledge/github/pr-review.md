# GitHub PR 自动审核检查表
SUMMARY: Use pull_request for untrusted PR code, keep quality checks separate from optional write-back comments, and grant write permission only to the same-repository comment job.
READ WHEN: before creating or modifying a GitHub pull request review workflow

---

## 触发与权限

- 使用 `pull_request` 触发器运行测试和构建，不使用 `pull_request_target` 执行 PR 代码。
- 质量检查只需要 `contents: read`。
- 写评论的 job 单独申请 `issues: write`，并限制为同一仓库的 PR。
- fork PR 仍然执行质量检查，但不依赖写权限或 secrets。

## 质量门禁

- 固定运行 `pnpm test`、`pnpm check`、`pnpm build` 和 `npm pack --dry-run --json`。
- 任一检查失败时，quality job 失败，PR 可以将该 job 设为 required check。
- 使用 PR 编号做 concurrency key，新提交到达时取消旧检查。

## 评论策略

- 使用隐藏 marker 定位机器人自己的评论。
- 同一 PR 后续提交更新已有摘要，不重复创建评论。
- 评论 job 使用 `always()`，这样质量检查失败时仍能报告失败原因。

## 官方资料

- `https://docs.github.com/actions/using-workflows/events-that-trigger-workflows`
- `https://docs.github.com/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions`
- `https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions`
