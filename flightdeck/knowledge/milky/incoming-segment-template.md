# IncomingSegment 模板约定
SUMMARY: `[is.<type>.<path>]` 从当前消息首个指定类型的 IncomingSegment.data 读取字段，并复用事件字段的路径、序列化和模板转义规则。
READ WHEN: before modifying message-segment template parsing or IncomingSegment value access

---

## 语法

- `[is.mention.user_id]` 读取首个 mention 消息段的 `data.user_id`。
- 路径从消息段的 `data` 开始，不重复书写 `data`。
- 对象字段和数组下标使用点号继续访问，例如 `[is.reply.segments.0.data.text]`。
- 同类型消息段存在多个时使用第一个；消息段或字段不存在时返回明确错误。

## 作用域

- 只读取当前 `TemplateContext.segments`，非消息事件通常没有可读取的消息段。
- `is` 可用于问题与回答，也可嵌套进变量和 API 参数。
- 值序列化与 `[event.<path>]` 一致：字符串和 JSON 必须转义模板控制字符，数字和布尔值直接转为文本。
