# Target app integration checklist
SUMMARY: When replacing a Fraq plugin in the target app, update the app entry, fraq.yml, versions.yml, package.json, both lockfiles, cache metadata, and node_modules leftovers together.
READ WHEN: before installing or replacing a plugin in D:/bot/fraq-plugins/my-fraq-app

---

- Keep npm and pnpm lockfiles synchronized when both exist.
- Use a relative `file:` dependency for a local package when npm compatibility is required.
- Verify the installed plugin peer range against the target app's Fraq version before runtime testing.
