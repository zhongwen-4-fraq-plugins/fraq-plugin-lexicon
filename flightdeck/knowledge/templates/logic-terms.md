# Logic condition blocks
SUMMARY: Logic mode is explicit; user-input terms support per-request timeout seconds and timeout text, defaulting to 30 seconds and “会话超时”, and timeout ends the answer without an extra execution-error reply.
READ WHEN: before modifying logic template parsing, conditional branches, boolean aliases, user-input waiting, or question-side condition evaluation

---

- Text syntax is `[逻辑.or.<文本...>]` or `[逻辑.and.<文本...>]`; every operation requires at least two non-empty arguments.
- Conditional syntax starts with `[逻辑.如果]`, may contain `[逻辑.否则如果]` and `[逻辑.否则]`, and ends with `[逻辑.如果.结束]`.
- Every `如果` or `否则如果` marker must be followed immediately by one `[逻辑.or]`, `[逻辑.and]`, or `[逻辑.in]` term.
- Boolean literals are `true/false`, `1/0`, `是/否`, and `真/假`; English values are case-insensitive.
- Outside conditions, `or` always randomly returns one argument and `and` always concatenates arguments; no type detection occurs.
- Inside conditions, `or` and `and` require boolean arguments, while `in` compares the first argument with later candidates using exact equality.
- `[逻辑.in]` is rejected outside a condition block.
- Conditions and selected branches run in both questions and answers and support nested condition blocks and ordinary nested terms.
- Unselected branches are removed before term execution; failed conditions use isolated variable scopes so they do not leak assignments.
- `parseConditionalBlock` guarantees every non-else branch starts with one outer logic term, and `LogicService.resolveCondition` either returns a boolean or throws. After a successful condition render, callers should compare the result with `true` directly instead of repeating a `true/false` membership check.
- Question-side condition rendering may still return `undefined` when a variable, event field, message segment, or nested logic value cannot be resolved. Keep this branch because it represents an invalid/non-matching question condition rather than a boolean result.
- Only copy isolated condition variables back to the outer scope when the condition is true; false and undefined conditions must not leak assignments.
- `[逻辑.请求用户输入.<提示消息>.<超时时间=秒>.<超时提示=文本>]` is answer-only. The two trailing named parameters are optional and may be supplied independently; unrecognized dot-separated suffixes remain part of the prompt.
- It sends only the explicit prompt, waits for the next message from the same self ID, scene, peer, and sender, then resumes parsing with the input escaped as literal text.
- Text before the request remains in the suspended template and is sent only with the final completed answer; the former prefix-segmentation behavior and parameterless syntax are unsupported.
- Pending input is consumed before ordinary message and event lexicons, but management commands keep priority and do not satisfy the request.
- Requests may be nested inside variables, APIs, lexicon answers, and selected conditional branches, and multiple requests run sequentially. Requests are rejected inside question templates and boolean condition parameters.
- The default wait is 30 seconds and remains configurable through `userInputTimeoutMs`; a valid positive `超时时间` value overrides it for one request.
- The default timeout text is “会话超时”. On timeout, send the configured timeout text, clear the pending session, stop the suspended answer, and suppress the generic “词条执行失败” reply.
