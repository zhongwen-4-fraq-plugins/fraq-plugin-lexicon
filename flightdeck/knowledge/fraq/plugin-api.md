# Fraq 1.1 插件接口速查
SUMMARY: Fraq 1.1 插件通过 ctx.on 接收消息、ctx.createSession 构造会话、ctx.client 调用类型化 Milky API，并将需要随 Context 释放的资源注册为可释放服务。
READ WHEN: before modifying Fraq plugin event handling, permission checks, or Milky API calls

---

## 插件与事件

- `definePlugin` 的 `apply(ctx, ...args)` 可以接收 `ctx.install(plugin, ...args)` 传入的插件配置。
- 使用 `ctx.on('message_receive', handler)` 监听所有接收消息。
- 事件包含 `self_id` 和 `data`；`data` 是按 `message_scene` 区分的消息联合类型。
- 使用 `ctx.createSession(self_id, data)` 创建 `Session`，再通过 `session.reply(...)` 回复。
- `ctx.on('message_receive')` 读取的是原始消息文本，不会自动消费 Fraq 路由前缀；插件需要显式接收并去除自己的管理命令前缀。
- 插件持有的数据库等资源应实现 `dispose()`，声明在 `provides` 中并通过 `ctx.provide()` 注册；Context 停止时 Fraq 会按逆序释放服务。

## 消息与权限

- 文本位于 `data.segments` 中 `type === 'text'` 的消息段。
- 群消息的 `data.group_member.role` 为 `owner`、`admin` 或 `member`。
- 群号使用群消息的 `peer_id`；发送者 QQ 号使用 `sender_id`。

## Milky API

- 类型化客户端位于 `ctx.client`。
- 群戳一戳：`ctx.client.send_group_nudge({ group_id, user_id })`。
- 好友戳一戳：`ctx.client.send_friend_nudge({ user_id, is_self })`。

## 测试

- 使用 `@fraqjs/plugin-mock` 1.1 的 `createMockContext()` 创建测试 Context。
- `ctx.install()` 安装插件后调用 `ctx.start()`，通过 `ctx.mock.receiveGroup()` 等方法注入事件，并从 `ctx.mock.apiCalls` 断言 API 调用。
- 测试结束调用 `ctx.stop()`，确保事件源与可释放服务都被清理。
