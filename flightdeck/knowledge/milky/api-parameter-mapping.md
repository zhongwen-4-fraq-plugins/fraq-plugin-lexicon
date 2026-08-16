# ⚠ Milky API 参数映射陷阱
SUMMARY: Fraq API 的可选性来自 request_ZodInput；事件默认值必须先放协议默认值再覆盖真实事件字段，并显式转换名称不同但语义相同的字段。
READ WHEN: when a Milky API template reports unsupported, missing, or incorrect parameters

---

## 参数定义

- `ApiParams<Endpoint>` 使用 Fraq 的 `request_ZodInput`，带协议默认值的字段通常是可选字段。
- 运行时定义需要同时保存参数类型和可选性，否则无法在调用前准确报告缺失的必填参数。
- Fraq 0.14 与 0.17 暴露的 65 个端点名称、参数名称、类型和可选性一致。

## 事件默认值

- 构建默认值时先写协议兜底值，再展开事件 `data`；顺序相反会把 `is_filtered=true`、`is_self_send=true` 等真实事件值错误覆盖为 `false`。
- `group_join_request` 和 `group_invited_join_request` 需要转换为 API 的 `notification_type`。
- `group_message_reaction.face_id` 需要转换为 `send_group_message_reaction.reaction`。
- `friend_file_upload.is_self` 需要转换为 `get_private_file_download_url.is_self_send`。
- `message_scene=group` 的消息类事件需要把 `peer_id` 作为 `group_id`。

## 用户参数

- `qq` 只在目标 API 存在 `user_id` 时作为简写，不能和 `user_id` 同时出现。
- 参数进入客户端前校验未知参数、必填参数、整数、布尔值和有限枚举，避免把可解释错误推迟到 Milky 服务端。
