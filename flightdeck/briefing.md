# Briefing — fraq-plugin-lexicon

## Conventions

<!-- Project house rules + AI-maintenance preferences, in plain prose.
     e.g. "publishing surface is English", "ask before force-pushing". -->

- 每次代码改动都要提交 git，提交信息用一句话概括本次改动。
- 代码必须面向新手且简洁：优先直白、易读、少嵌套少抽象的写法，不为炫技引入复杂度。
- 代码必须按职责拆分文件和模块，例如数据处理、数据模型、服务、核心逻辑等，避免把不同职责堆在同一文件。
- 需要使用项目名时，必须使用本项目的文件夹名。
- 当用户提出新功能但需求模糊不清时，先向用户询问补全需求，并同时提供一些参考选项或建议，再动手实现。
- commit 信息必须使用中文，并采用 git emoji + 简短说明，例如：✨ 新功能、🐛 修复、♻️ 重构、📝 文档/约定。
- `0.x` 版本中补丁位达到 `9` 后必须向次版本号进位，例如 `0.1.9` 的下一版本使用 `0.2.0`，禁止使用 `0.1.10`。
- 与 flightdeck 相关的内容（briefing / knowledge / cockpit 等）不单独提交，随其他代码改动一起提交。
- 自动生成 Release 更新日志时，只提取至少修改了一个 `src/` 目录文件的 commit。
- README 只保留插件整体介绍、安装和配置入口；词库、词条等详细用法必须写入独立文档。
- 当用户说"打tag提交"时，执行：提交并打 tag → git push 推送远程 → 用 pnpm 把本插件安装到
  fraq-plugins（D:\bot\fraq-plugins\my-fraq-app）→ 关闭本轮产生的所有测试进程（tsx / node 测试进程等）。

## Subscriptions

<!-- one ~/.flightdeck-relative path per line; empty = subscribe to nothing global -->
