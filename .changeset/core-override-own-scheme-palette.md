---
"material-theme-builder": patch
---

`toCss()` and `toJson().schemes` now agree when a core color (`secondary`,
`tertiary`, `error`, `neutral`, `neutralVariant`) is overridden under the
`expressive`, `fidelity` or `content` scheme. They used to derive the override's
palette in two different ways, so the same role could differ between the CSS and
the JSON.

Both now read one scheme, in which an override takes the palette the scheme
variant builds from its own color (as `toJson().schemes` already did), instead of
its hue at the chroma of the source. Rendered colors change for `expressive`,
`fidelity` and `content` with core-color overrides: the `--md-sys-color-*` and
`--md-ref-palette-*` of `toCss()`, `toJson().palettes` and every other output.
Under `fidelity` and `content` an override keeps its own chroma; under
`expressive` its hue is rotated like a source color's, and `primary: X` now
renders like `source: X`.

`toJson().schemes` is unchanged, and so is every output under `tonalSpot` (the
default), `monochrome`, `neutral` and `vibrant`. See
`docs/adr/0004-a-core-color-override-takes-the-palette-of-its-own-scheme.md`.
