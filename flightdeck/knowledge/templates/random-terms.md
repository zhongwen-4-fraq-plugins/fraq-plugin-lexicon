# Random term checklist
SUMMARY: Random templates use Fraq `@fraqjs/plugin-random` `int` half-open ranges, `range` closed ranges, `bool` probabilities, and `float` values, with strict argument validation and a required random plugin host dependency.
READ WHEN: before modifying random template parsing, random service injection, or random term documentation

---

- `[随机.int.<最小值>.<最大值>]` calls `RandomService.int(min, max)`, excluding the maximum.
- `[随机.range.<最小值>.<最大值>]` calls `RandomService.range(min, max)`, including the maximum.
- `[随机.bool]` and `[随机.bool.<概率>]` call `RandomService.bool()` or `bool(probability)`, with probability constrained to `0..1`.
- `[随机.float]` calls `RandomService.float()` and returns a value in `[0, 1)`.
- Parsing validates JavaScript safe integer bounds and the required bound ordering.
- The host must install and activate `@fraqjs/plugin-random` before installing this plugin.
