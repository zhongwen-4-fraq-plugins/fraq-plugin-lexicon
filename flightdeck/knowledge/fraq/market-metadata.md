# Fraq market metadata checklist
SUMMARY: Always use an exact allowed `fraq.category` value and complete npm name, version, description, and repository metadata before publishing a plugin for `fraqjs/market`.
READ WHEN: before modifying any Fraq plugin package metadata or preparing a package for fraqjs/market
RECHECK WHEN: fraqjs/market changes src/market.ts, src/types.ts, or src/npm.ts

---

- The market searches npm for packages carrying the `fraq-plugin` keyword and ignores names that do not start with `fraq-plugin-`.
- Accepted categories are exactly `game`, `tool`, `entertainment`, `management`, `utilities`, and `other`.
- A missing or invalid `fraq.category` becomes `category: null`, which makes the plugin `unlisted: true` and excludes it from the generated public plugin list.
- The market copies `name`, `version`, `description`, and the normalized repository URL from the latest npm manifest.
- Metadata changes take effect only after publishing a new npm version and rerunning the registry update workflow.
