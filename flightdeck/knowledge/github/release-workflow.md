# GitHub Release automation checklist
SUMMARY: Always create GitHub Releases only after the npm publish workflow succeeds, derive notes from commits between version tags, hide empty Git Emoji sections, skip Flightdeck-only docs, and keep only the newest bookmark commit.
READ WHEN: before creating or modifying GitHub Release workflows or automatic release-note generation

---

- Trigger from `workflow_run` for the successful `发布 npm 包` workflow, not directly from the tag push.
- Require the completed run to be a successful tag push and verify the tag points to `workflow_run.head_sha` before writing a Release.
- Use the previous reachable version tag as the exclusive lower bound and the current tag as the inclusive upper bound.
- Group `✨`/`:sparkles:`, `🐛`/`:bug:`, `🎨`/`:art:`, and `📝`/`:pencil:` commits into separate sections; omit empty sections.
- Skip documentation commits when every changed file is under `flightdeck/`.
- Put uncategorized commits under “其他”; when multiple `🔖`/`:bookmark:` commits exist, include only the newest one.
- Strip the leading `v` from the tag for the Release title, but use the full tag as `tag_name`.
- Create or update the Release idempotently so rerunning the workflow does not create duplicates.
