# Fraq 0.17 插件接口速查
SUMMARY: Fraq 插件通过 ctx.on 接收消息、ctx.createSession 构造会话、ctx.client 调用类型化 Milky API，并从群消息读取成员角色。
READ WHEN: before modifying Fraq plugin event handling, permission checks, or Milky API calls

---

## 插件与事件

- `definePlugin` 的 `apply(ctx, ...args)` 可以接收 `ctx.install(plugin, ...args)` 传入的插件配置。
- 使用 `ctx.on('message_receive', handler)` 监听所有接收消息。
- 事件包含 `self_id` 和 `data`；`data` 是按 `message_scene` 区分的消息联合类型。
- 使用 `ctx.createSession(self_id, data)` 创建 `Session`，再通过 `session.reply(...)` 回复。

## 消息与权限

- 文本位于 `data.segments` 中 `type === 'text'` 的消息段。
- 群消息的 `data.group_member.role` 为 `owner`、`admin` 或 `member`。
- 群号使用群消息的 `peer_id`；发送者 QQ 号使用 `sender_id`。

## Milky API

- 类型化客户端位于 `ctx.client`。
- 群戳一戳：`ctx.client.send_group_nudge({ group_id, user_id })`。
- 好友戳一戳：`ctx.client.send_friend_nudge({ user_id, is_self })`。
