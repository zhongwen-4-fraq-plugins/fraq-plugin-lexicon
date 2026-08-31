# ⚠ Milky API 参数映射陷阱
SUMMARY: Fraq API 可选性来自 request_ZodInput；API 参数名必须严格使用协议定义，事件默认值先放协议默认再覆盖真实事件字段。
READ WHEN: when a Milky API template reports unsupported, missing, or incorrect parameters

---

## 参数定义

- `ApiParams<Endpoint>` 使用 Fraq 的 `request_ZodInput`，带协议默认值的字段通常是可选字段。
- 运行时定义需要同时保存参数类型和可选性，否则无法在调用前准确报告缺失的必填参数。
- Fraq 1.1 暴露 65 个端点；静态定义通过 `ApiParams` 映射校验每个参数的名称、类型和可选性。

## 事件默认值

- 构建默认值时先写协议兜底值，再展开事件 `data`；顺序相反会把 `is_filtered=true`、`is_self_send=true` 等真实事件值错误覆盖为 `false`。
- `group_join_request` 和 `group_invited_join_request` 需要转换为 API 的 `notification_type`。
- `group_message_reaction.face_id` 需要转换为 `send_group_message_reaction.reaction`。
- `friend_file_upload.is_self` 需要转换为 `get_private_file_download_url.is_self_send`。
- `message_scene=group` 的消息类事件需要把 `peer_id` 作为 `group_id`。

## 用户参数

- API 参数名必须严格使用协议定义；`qq` 不再作为 `user_id` 别名，而是返回“应当是 user_id”的纠错提示。
- 参数进入客户端前校验未知参数、必填参数、整数、布尔值和有限枚举，避免把可解释错误推迟到 Milky 服务端。
- 官方 JSON Schema 中所有 `group_id` 都使用 `10001..4294967295`，所有 `message_seq` 都使用 `0..9007199254740991`；范围校验必须作用于显式参数和事件默认参数。
