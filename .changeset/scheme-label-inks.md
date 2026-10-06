---
"material-theme-builder": minor
---

The poster writes each label in the color M3 pairs it with, as Material Theme
Builder's own does, instead of white blended by difference:

- `Scheme`: each role in its counterpart — `on-primary` on `primary`,
  `primary` on `on-primary`, `on-surface` on the surfaces… Custom colors too.
- `Shades`: each tone in its own palette's tone 100 on the dark half, 10 on the
  light one — the tones of `on-primary` and `on-primary-container`.

`Poster` no longer sets any `color` or `mix-blend-mode` on the `<p>`s it holds:
it inks only the labels `Scheme` and `Shades` write, and whatever else goes in
paints its own.

`<Scheme tw>` paints `primary`, `secondary` and `background` straight from
their `--md-sys-color-*` property, as an arbitrary value: next to shadcn, which
claims those three names too, `bg-secondary` lands on `secondary-container`.

`<Shades tw>` (new prop, which follows `<Scheme tw>` when nested in one) paints
the plugin's eleven Tailwind shades (`bg-primary-500`…), and `<Scheme tw>`
paints the custom colors with their utilities too (`bg-on-brand`…). A custom
color's utilities are named at runtime, which no scanner sees: under `tw`, list
them with `@source inline()` (Tailwind 4.1+), e.g.
`@source inline("bg-{,on-}brand{,-container} bg-brand-{50,{100..900..100},950}");`
— without it those cells now paint nothing, where they used to fall back to
`var()`.
