# GitHub Release automation checklist
SUMMARY: Publish npm first, use the latest successfully published tag as the range base, and include only commits that changed src/ in the generated GitHub Release notes.
READ WHEN: before creating or modifying GitHub Release workflows or automatic release-note generation

---

- Keep npm publishing, history checking, and GitHub Release creation in `.github/workflows/publish.yml`; chain them as `publish` → `release_base` → `release` through `needs` without redundant success conditions.
- Trigger the workflow from a version tag push and check out that tag before writing a Release.
- Give the history-check job `actions: read` and `contents: read`, and match historical runs by tag plus peeled commit SHA so recreated tags or unrelated runs cannot become the baseline.
- Walk previous reachable version tags newest-first until finding a workflow run whose overall conclusion is `success`; tags with missing, cancelled, or failed runs remain inside the next successful Release range.
- Use the latest successfully published tag as the exclusive lower bound and the current tag as the inclusive upper bound. If no historical tag succeeded, include every commit reachable from the current tag.
- Before classifying a commit, require at least one changed path equal to `src` or beginning with `src/`; pure documentation, Issue, workflow, package-version, and Flightdeck commits do not enter Release notes.
- Group `✨`/`:sparkles:`, `🐛`/`:bug:`, `🎨`/`:art:`, and `📝`/`:pencil:` commits into separate sections; omit empty sections.
- Put uncategorized source commits under “其他”; when multiple source-changing `🔖`/`:bookmark:` commits exist, include only the newest one.
- Strip the leading `v` from the tag for the Release title, but use the full tag as `tag_name`.
- Create or update the Release idempotently so rerunning the workflow does not create duplicates.
