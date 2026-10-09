---
"material-theme-builder": minor
---

`toFigmaTokens()` now emits a `shadcn` group alongside `ref` and `sys`, and
`toFigmaVariables()` the matching `shadcn/*` descriptors. Designers get the 31
names they actually build components from — `Card`, `Muted`, `Chart 1` — where
before the export stopped at the M3 roles and left the remap behind in the CSS.

It reads `SHADCN_MAPPING`, so it is the third exporter on that table next to
`toShadcn()` and `toTailwind({ shadcn: true })` rather than a second opinion
about which M3 role backs which variable. Each token is a DTCG alias onto its
`sys/color` token (`{sys.color.Surface Container Low}`), identical in both mode
files: the sys token carries the mode, so the group follows a reseed and a mode
switch the way `var(--md-sys-color-*)` does. `css.variable` spells the shadcn
variable — unprefixed, since `prefix` renames the M3 layer and not the fixed set
shadcn components read.

The Figma plugin needs no change: it already creates every variable before
resolving aliases, so `shadcn/Card` lands as a real alias in the same collection.
