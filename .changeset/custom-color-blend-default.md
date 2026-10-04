---
"material-theme-builder": patch
---

A custom color given without `blend` is now harmonized with the source color, as
`DEFAULT_BLEND` (true) always documented. It used to be rendered unharmonized
while `toJson().extendedColors[].harmonized` reported it as harmonized.

Rendered colors change for custom colors given without `blend`: their
`--md-ref-palette-*` and `--md-sys-color-*` values (and every other output) now
match those of `blend: true`. Custom colors with an explicit `blend` are
unchanged. `HexCustomColor.blend` is now optional in the types, to match.
