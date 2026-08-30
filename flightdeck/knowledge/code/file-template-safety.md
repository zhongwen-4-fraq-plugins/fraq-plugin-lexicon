# 文件词条安全边界
SUMMARY: 文件词条只能解析配置 dataPath 目录内的相对普通文件；打开前必须校验真实路径和符号链接，避免聊天模板读写主机任意路径。
READ WHEN: before modifying file template operations, dataPath configuration, or path validation

---

- 使用 `node:fs/promises` 的 `open` 执行模式，再关闭句柄并读取 UTF-8 内容返回模板。
- 文件名拒绝绝对路径，并使用 `realpath` 校验目标及父目录仍在配置的 `dataPath` 根目录内。
- 已存在的符号链接和非普通文件拒绝访问；不存在文件仅允许在已存在且位于根目录内的父目录下创建。
- 文件词条在问题模板中保持不执行，避免匹配消息时产生文件系统副作用。
