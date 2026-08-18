# Redundant work review
SUMMARY: Remove repeated lookups and impossible postcondition checks only after proving the upstream object, synchronous operation, or parser contract already guarantees the same fact; keep boundary validation and semantic undefined branches.
READ WHEN: before refactoring controller/service boundaries, repository write methods, repeated validation, or defensive conditions

---

- When a controller has already resolved a `Lexicon` and checked permission, pass that object to the service. Do not pass the raw name and resolve the same lexicon again.
- After a synchronous existence check and a synchronous SQLite update with no `await` or external callback between them, do not re-query merely to check whether the row suddenly disappeared. Return the updated model from the known current model and new values.
- After a successful insert, construct the returned model from `lastInsertRowid`, the values written, and the captured timestamp instead of immediately selecting the same row again.
- Do not query a sentinel ID such as `-1` when an optional active ID is absent; branch on absence before accessing the repository.
- At a shared event ingress, perform required initialization once before dispatching to command, message, and event handlers. Do not let each downstream handler repeat the same initialization for one event.
- A truthy derived condition already proves every value used to derive it is present. Avoid checking the source value again in the consuming `if`.
- Keep checks at external/parser boundaries, checks that protect against real asynchronous races, and `undefined` branches that represent a distinct domain result such as an unresolved question template.
