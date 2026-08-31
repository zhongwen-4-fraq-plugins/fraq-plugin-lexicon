# Milky 协议速查
SUMMARY: Milky 是面向 QQ Bot 的强类型通信协议，使用 HTTP API 调用并通过 SSE、WebSocket 或 WebHook 推送事件。
READ WHEN: when implementing or debugging Milky API calls, event handling, or message segments

---

## 当前版本

- 官方文档当前展示 Milky `1.2`，协议包元数据显示版本为 `1.2.2`。
- 官方提供中间表示（IR）、OpenAPI 文档和 JSON Schema，可用于生成类型、校验实现与对照协议结构。
- TypeScript SDK 列表包含 `@fraqjs/fraq`，本项目通过 peer dependency 使用它。
- Fraq `1.1.0` 使用 Milky `1.3` 类型并暴露 65 个英文 API 端点，插件按当前 Fraq 客户端能力全部接入。

## 通信模型

- API：客户端向 `/api/<api>` 发送 `POST` JSON，请求和响应均使用 UTF-8。
- 事件：服务端通过 `/event` 使用 SSE 或 WebSocket 推送，也可使用 WebHook。
- 鉴权：启用访问令牌时，使用 `Authorization: Bearer <access_token>`；WebSocket 也可使用 `access_token` 查询参数。
- API 响应统一包含 `status`、`retcode`、`data` 和 `message`；HTTP `200` 表示成功或业务错误，`400` 表示请求无效，`403` 表示鉴权失败。

## 事件与消息

- 所有事件都包含 `time`、`self_id` 和 `event_type`，具体事件再附带群、好友、请求或通知字段。
- Fraq `1.1.0` 的 `EventMap` 当前包含 21 个事件；使用覆盖 `Record<keyof EventMap, true>` 的静态表可以在协议类型新增事件时让 TypeScript 报错。
- `fraq-plugin-lexicon` 使用 `[event.<event_type>]` 作为事件匹配文本，并使用 `[event.<字段路径>]` 读取事件对象；字段值进入模板前必须转义 `[] .= \\`。
- 问题模板中的 `[event.<event_type>]` 应作为无输出的事件条件；问题匹配阶段只能执行事件与变量词条，API 和词库词条必须保持字面量，避免匹配消息时产生副作用。
- 消息事件的 `data` 包含来源标识、发送者、时间、消息场景、消息序列号和消息段数组。
- 接收消息段常见类型：文本、提及、表情、回复、图片、语音、视频、文件、转发和市场表情。
- 发送消息段仅支持：文本、提及、回复、图片、语音和视频；发送图片、语音、视频时使用 URI。

## 戳一戳 API

- 群聊使用 `send_group_nudge`，参数为 `group_id` 和被戳成员的 `user_id`。
- 好友使用 `send_friend_nudge`，参数为好友 `user_id` 和表示是否戳自己的 `is_self`。

## Fraq API 模板覆盖

- `fraq-plugin-lexicon` 使用英文 snake_case 端点名，并以静态定义覆盖 Fraq `1.1.0` 的全部 65 个端点。
- API 默认参数先继承事件 `data` 中与端点参数同名的字段；目标 QQ 再按艾特、回复发送者、`user_id`、`sender_id`、`operator_id`、`initiator_id` 和当前发送者的顺序选择。
- 回复或当前消息中的消息段、媒体资源、文件和合并转发字段可作为 API 参数默认值；用户显式参数始终覆盖事件默认值。
- API 参数与返回值可进入变量模板，并通过迭代解析继续无限嵌套；返回 JSON 会转义模板控制字符，避免被误识别为词条。
- 当前变量模板命名空间仅为 `[变量.创建.A]`、`[变量.创建.A=内容]` 和 `[变量.读取.A]`。

## 兼容性规则

- 服务端向后兼容旧客户端；客户端需要向前兼容新服务端。
- 未知事件类型应记录警告并忽略，不应导致程序崩溃。
- 未知消息段应降级为提示文本，至少保留“存在未知消息段”这一事实。
- 对象出现未知字段时忽略；数组出现未知元素时跳过。
- 新增枚举值、事件、消息段和可选字段通常属于兼容更新；删除或修改现有结构属于不兼容更新。

## 官方资料

- 首页：`https://milky.ntqqrev.org/`
- 通信：`https://milky.ntqqrev.org/guide/communication`
- 兼容性：`https://milky.ntqqrev.org/guide/compatibility`
- API：`https://milky.ntqqrev.org/api/`
- 事件：`https://milky.ntqqrev.org/event/`
- 消息段：`https://milky.ntqqrev.org/struct/IncomingSegment`
