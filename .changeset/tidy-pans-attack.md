---
"material-theme-builder": minor
---

Add a Tailwind v4 plugin, `material-theme-builder/tailwind`, as an alternative
to pasting the `@theme inline` block:

```css
@import "tailwindcss";
@plugin "material-theme-builder/tailwind" {
  custom-colors: myCustomColor1, myCustomColor2;
}
```

Custom colors — the part the stylesheet could never cover, since their names
are only known to the app — register their four M3 roles and their shades on
their own. `prefix` and `shades` options too.

Also ships the shadcn remapping as a stylesheet of its own,
`material-theme-builder/shadcn.css`, so the `:root, .dark { … }` block no
longer has to be copied into a project. It stays CSS on purpose: it has to beat
shadcn's own unlayered `:root`, which a plugin — confined to `@layer base` —
cannot. Its selectors are doubled (`:root:root, .dark.dark`) so it wins by
specificity rather than by source order, an `@import` being at the mercy of
whatever the bundler does with it.

Nothing is removed. `material-theme-builder/tailwind.css` keeps working, and
gains the two roles it was missing: `--color-surface-tint` and
`--color-surface-variant`.
