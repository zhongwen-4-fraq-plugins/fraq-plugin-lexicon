# Target app integration checklist
SUMMARY: When replacing a Fraq plugin in the target app, update the app entry, fraq.yml, versions.yml, package.json, both lockfiles, cache metadata, and node_modules leftovers together.
READ WHEN: before installing or replacing a plugin in D:/bot/fraq-plugins/my-fraq-app

---

- Keep npm and pnpm lockfiles synchronized when both exist.
- Use a relative `file:` dependency for a local package when npm compatibility is required.
- Verify the installed plugin peer range against the target app's Fraq version before runtime testing.
- `my-fraq-app` keeps dependency records in both the root and `app/`; update both package manifests, both pnpm lockfiles, and both npm lockfiles.
- When the target's existing peer conflicts block npm lock generation, use `npm install --package-lock-only --ignore-scripts --legacy-peer-deps` after pnpm has installed the intended versions.
- `pnpm start:no-install` still lets Fraq refresh `versions.yml`-driven package metadata and `cache/package-json` before starting, while preserving the already synchronized node_modules.
- Switching an existing app from npm-managed node_modules to pnpm may move old packages under `app/node_modules/.ignored`; verify the active package under `app/node_modules/<package>/package.json` rather than treating `.ignored` as active resolution.
