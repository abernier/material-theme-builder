---
"material-theme-builder": minor
---

Add a Tailwind v4 plugin at `material-theme-builder/tailwind`, so custom colors
no longer have to be written out by hand:

```css
@import "material-theme-builder/tailwind.css";
@plugin "material-theme-builder/tailwind" {
  custom-colors: myCustomColor1, myCustomColor2;
}
```

Each name listed brings its four scheme roles (`myCustomColor1`,
`on-myCustomColor1`, `myCustomColor1-container`, `on-myCustomColor1-container`)
and its eleven shades. A `prefix` option mirrors `builder({ prefix })`. The
plugin can carry the standard tokens too, on its own, for a setup that would
rather not import CSS at all.

The two halves split along what a shipped file can know: the stylesheet carries
the standard tokens, the plugin carries the custom colors, which depend on your
config. It also keeps the stylesheet in charge of the three names shadcn's
`@theme inline` also claims (`background`, `primary`, `secondary`) — a plugin's
theme values are defaults and would lose them.

`tailwind.css` is now generated from `toTailwind()` rather than maintained
alongside it, which is what let `--color-surface-tint` and
`--color-surface-variant` go missing from one and not the other. It is build
output now, so `src/tailwind.css` is no longer committed nor published —
`material-theme-builder/tailwind.css` resolves as before.

**The generated file no longer carries the `myCustomColor1` / `myCustomColor2`
example block.** Those names only ever resolved against custom colors you had
declared under exactly those names; if you did, list them in `@plugin` instead.
