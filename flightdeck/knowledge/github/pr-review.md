# GitHub PR 自动审核检查表
SUMMARY: Use pull_request for untrusted PR code, install the complete locked dependency set, run the dedicated integration test with Fraq's official `@fraqjs/plugin-mock`, and grant write permission only to the same-repository comment job.
READ WHEN: before creating or modifying a GitHub pull request review workflow

---

## 触发与权限

- 使用 `pull_request` 触发器运行测试和构建，不使用 `pull_request_target` 执行 PR 代码。
- 质量检查只需要 `contents: read`。
- 写评论的 job 单独申请 `issues: write`，并限制为同一仓库的 PR。
- fork PR 仍然执行 Fraq 官方 mock 测试，但不依赖写权限或 secrets。

## Mock 门禁

- 使用 `pnpm install --frozen-lockfile` 安装 Fraq、`@fraqjs/plugin-mock` 和全部锁定依赖。
- 固定运行 `pnpm test:mock`，只执行基于 Fraq 官方 `@fraqjs/plugin-mock` 的真实 Context 安装与消息收发集成测试。
- mock 测试失败时测试 job 失败，PR 可以将该 job 设为 required check。
- 使用 PR 编号做 concurrency key，新提交到达时取消旧检查。

## 评论策略

- 使用隐藏 marker 定位机器人自己的评论。
- 同一 PR 后续提交更新已有摘要，不重复创建评论。
- 评论 job 使用 `always()`，这样 mock 测试失败时仍能报告失败结果。

## 官方资料

- `https://docs.github.com/actions/using-workflows/events-that-trigger-workflows`
- `https://docs.github.com/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions`
- `https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions`
