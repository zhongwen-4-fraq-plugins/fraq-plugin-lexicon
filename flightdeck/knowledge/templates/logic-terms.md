# Logic condition blocks
SUMMARY: Logic mode is explicit: outside conditions `or` randomly selects text and `and` concatenates text; only conditions immediately following `[逻辑.如果]` or `[逻辑.否则如果]` evaluate `or`, `and`, and `in` as booleans.
READ WHEN: before modifying logic template parsing, conditional branch markers, boolean aliases, or question-side condition evaluation

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
