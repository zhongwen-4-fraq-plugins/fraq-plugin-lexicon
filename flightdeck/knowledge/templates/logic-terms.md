# Logic condition blocks
SUMMARY: Logic mode is explicit; conditions support strict boolean `or/and`, membership `in`, and exact two-value `等于/不等于`; counted loops support variable counts, nesting, nearest-loop break/continue, and a 10000-iteration limit; user-input terms keep per-request timeout behavior; `[逻辑.休眠.<秒数>]` waits in answer text; `[词库.拒绝执行]` stops the current answer without compatibility aliases.
READ WHEN: before modifying logic template parsing, conditional branches, boolean aliases, user-input waiting, or question-side condition evaluation

---

- Text syntax is `[逻辑.or.<文本...>]` or `[逻辑.and.<文本...>]`; every operation requires at least two non-empty arguments.
- Conditional syntax starts with `[逻辑.判断]`, may contain `[逻辑.否则判断]` and `[逻辑.否则]`, and ends with `[逻辑.判断.结束]`.
- Every `判断` or `否则判断` marker must be followed immediately by one `[逻辑.or]`, `[逻辑.and]`, `[逻辑.in]`, `[逻辑.等于]`, or `[逻辑.不等于]` term.
- Conditional `逻辑.or` and `逻辑.and` accept only exact lowercase `true` and `false`; never trim, normalize case, or accept numeric or Chinese aliases.
- Outside conditions, `or` always returns the first non-empty argument in order and `and` always concatenates arguments; no type detection occurs.
- Inside conditions, `or` and `and` require boolean arguments, `in` compares the first argument with later candidates, and `等于/不等于` compare exactly two non-empty rendered values.
- `等于/不等于` use exact text comparison without trimming or case normalization.
- `[逻辑.in]`, `[逻辑.等于]`, and `[逻辑.不等于]` are rejected outside a condition block.
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

- Counted-loop syntax is `[逻辑.计次循环.<count>]...[逻辑.计次循环尾]`; render the count expression once before entering the loop.
- Counts may come from nested variable or other template terms and must resolve to an integer from 0 through 10000.
- `[循环.退出]` breaks and `[循环.跳过]` continues the nearest enclosing loop; output produced before the control marker is preserved.
- Loop blocks work in questions and answers, support arbitrary nesting, and share the current variable scope across iterations.
- Select the earliest outer block between conditionals and counted loops before executing ordinary terms; otherwise an inner conditional may execute once outside its loop instead of once per iteration.
- Escape each completed loop result before reinserting it into the outer template so literal brackets are not executed again.
- Loop controls are invalid outside a loop, inside boolean condition parameters, or inside a loop-count expression.
- `[词库.拒绝执行]` stops the current answer immediately, preserves output and actions before it, skips all later text and terms, and does not affect later messages.
- `[逻辑.休眠.<秒数>]` waits the requested positive number of seconds, supports decimal seconds, and is invalid in questions, conditions, and loop-count expressions.
- Text-mode `逻辑.or` and `逻辑.and` keep their existing text behavior; the strict boolean rule applies only inside conditional blocks.
