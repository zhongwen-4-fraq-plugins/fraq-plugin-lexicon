# GitHub Release automation checklist
SUMMARY: Create GitHub Releases in a release job that needs the npm publish job, derive notes from commits between version tags, hide empty Git Emoji sections, skip Flightdeck-only docs, and keep only the newest bookmark commit.
READ WHEN: before creating or modifying GitHub Release workflows or automatic release-note generation

---

- Keep npm publishing and GitHub Release creation in `.github/workflows/publish.yml`; the `release` job must declare `needs: publish` and only run when the publish job succeeds.
- Trigger the workflow from a version tag push and check out that tag before writing a Release.
- Use the previous reachable version tag as the exclusive lower bound and the current tag as the inclusive upper bound.
- Group `✨`/`:sparkles:`, `🐛`/`:bug:`, `🎨`/`:art:`, and `📝`/`:pencil:` commits into separate sections; omit empty sections.
- Skip documentation commits when every changed file is under `flightdeck/`.
- Put uncategorized commits under “其他”; when multiple `🔖`/`:bookmark:` commits exist, include only the newest one.
- Strip the leading `v` from the tag for the Release title, but use the full tag as `tag_name`.
- Create or update the Release idempotently so rerunning the workflow does not create duplicates.
