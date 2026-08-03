---
"material-theme-builder": minor
---

feat: add a Tailwind 4 plugin — `@plugin "material-theme-builder/tailwind"`

One line replaces the whole manual `@theme inline` block, custom colors
included:

```css
@import "tailwindcss";
@plugin "material-theme-builder/tailwind" {
  custom-colors: myCustomColor1, myCustomColor2;
}
```

Options: `custom-colors` (names), `prefix` (default `md`).

The static `material-theme-builder/tailwind.css` fallback is now generated from
`toTailwind()`: it gains the missing `--color-surface-tint` /
`--color-surface-variant` mappings and no longer ships the `myCustomColor1` /
`myCustomColor2` placeholder entries.
