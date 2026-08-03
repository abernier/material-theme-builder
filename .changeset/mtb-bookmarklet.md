---
"material-theme-builder": minor
---

Add a `ThemePanel` bookmarklet: a `javascript:` snippet (see README) that mounts the panel on any shadcn-based site and re-themes it live by forcing the shadcn variables — same mapping as `toShadcn()`, same-origin preview iframes included. Ships as a self-contained `dist/bookmarklet.global.js` IIFE served from jsDelivr; the panel renders in a shadow root, styled by the very variables it edits, and closing it restores the site untouched. Next to the panel: a button downloading the current theme as a shadcn registry item (`mtb-theme.json`, installable with the shadcn CLI) and one copying the matching `npx shadcn@latest add` command.
