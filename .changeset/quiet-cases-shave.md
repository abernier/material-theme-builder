---
"material-theme-builder": minor
---

`<Mcu>` renders its `<style>` instead of injecting it from an effect, so the
colors are in the server-rendered HTML.

Effects only run in the browser, so on an SSR/SSG page the `<style>` used to
reach the client empty: every `--md-sys-color-*` was undefined for the first
paint, and anything reading one painted with no color at all until hydration
filled it in. Rendering the tag puts the CSS in the HTML the server sends, and
React updates its content in place when `setMcuConfig` changes the theme.

The tag now sits where `<Mcu>` is rather than in `document.head` — same `id`,
same cascade, but worth knowing if you were querying `head` for it.
