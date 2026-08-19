# GitHub Issue Form 约定
SUMMARY: Use YAML issue forms with required checkboxes for reporter prerequisites and textareas for logs, reproduction steps, feature descriptions, and optional context.
READ WHEN: before creating or modifying GitHub issue templates

---

## 表单结构

- 每个表单包含 `name`、`description`、可选的 `title`/`labels` 和 `body`。
- 复选确认使用 `type: checkboxes`，每个选项单独设置 `required: true`。
- 长文本输入使用 `type: textarea`，通过 `validations.required` 控制必填项。
- 日志字段可以设置 `render: shell`，提交后以代码块展示。
- `config.yml` 的 `blank_issues_enabled: false` 可强制用户从预设表单进入。

## 本项目表单

- BUG 表单要求确认版本和已查阅 Issue 列表，并要求填写错误日志、复现步骤。
- 功能请求表单要求确认已更新插件，并要求填写功能描述。
- 帮助表单要求确认已查阅 Issue 列表，并要求详细描述需要的帮助。
- BUG 和功能请求表单保留可选的附加内容字段。

## 官方资料

- `https://docs.github.com/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms`
- `https://docs.github.com/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository`
