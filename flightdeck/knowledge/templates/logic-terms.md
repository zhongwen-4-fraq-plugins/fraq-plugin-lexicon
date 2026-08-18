# Logic template terms
SUMMARY: `[逻辑.or]` and `[逻辑.and]` use boolean mode only when every argument is a recognized boolean literal; otherwise `or` randomly selects text and `and` concatenates text, while `[逻辑.in]` performs exact membership.
READ WHEN: before modifying logic template parsing, boolean aliases, random text selection, or question-side logic evaluation

---

- Syntax is `[逻辑.<or|and|in>.<参数1>.<参数2>...]`; every operation requires at least two non-empty arguments.
- Boolean literals are `true/false`, `1/0`, `是/否`, and `真/假`; English values are case-insensitive.
- `or` returns boolean OR when every argument is boolean, otherwise it randomly returns one argument.
- `and` returns boolean AND when every argument is boolean, otherwise it concatenates all arguments in order.
- `in` compares the first argument with every later argument using exact string equality and returns `true` or `false`.
- Logic terms run in both questions and answers and participate in the same innermost-first recursive parsing as variables, events, message segments, APIs, and lexicons.
- Text-mode `or` inside a question makes that question intentionally nondeterministic on each match attempt.
