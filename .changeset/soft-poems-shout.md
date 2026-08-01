---
"material-theme-builder": minor
---

Add a `toShadcn()` exporter emitting concrete per-mode `oklch()` values.

`builder(source, options).toShadcn()` returns `{ light, dark }`, each a flat
record of bare shadcn variable names (`primary`, `chart-1`, …) to concrete
colors — the exact shape a shadcn registry item's `cssVars` field expects, so
the result can be served as a `registry:theme` or `registry:base` item and
installed with the standard `shadcn` CLI.

Unlike `toTailwind({ shadcn: true })`, which emits `var()` aliases requiring the
M3 variables to already be on the page, the output stands alone. Both now share
a single mapping table, so they cannot drift apart.
