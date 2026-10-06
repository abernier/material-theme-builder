---
"material-theme-builder": patch
---

The poster writes each label in the color M3 pairs it with, as Material Theme
Builder's own does, instead of white blended by difference:

- `Scheme`: each role in its counterpart — `on-primary` on `primary`,
  `primary` on `on-primary`, `on-surface` on the surfaces… Custom colors too.
- `Shades`: each tone in its own palette's tone 100 on the dark half, 10 on the
  light one — the tones of `on-primary` and `on-primary-container`.

`Poster` no longer sets any `color` or `mix-blend-mode` on the `<p>`s it holds.

`<Scheme tw>` paints `primary`, `secondary` and `background` straight from
their `--md-sys-color-*` property, as an arbitrary value: next to shadcn, which
claims those three names too, `bg-secondary` lands on `secondary-container`.
