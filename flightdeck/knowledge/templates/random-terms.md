# Random term checklist
SUMMARY: Random templates use Fraq `@fraqjs/plugin-random` `int` half-open ranges and `range` closed ranges, accept only safe integer bounds, and require the random plugin in the host.
READ WHEN: before modifying random template parsing, random service injection, or random term documentation

---

- `[随机.int.<最小值>.<最大值>]` calls `RandomService.int(min, max)`, excluding the maximum.
- `[随机.range.<最小值>.<最大值>]` calls `RandomService.range(min, max)`, including the maximum.
- Parsing validates JavaScript safe integer bounds and the required bound ordering.
- The host must install and activate `@fraqjs/plugin-random` before installing this plugin.
