---
"material-theme-builder": minor
---

Add a Tailwind v4 plugin, `material-theme-builder/tailwind`, replacing the
hand-written `@theme inline` block:

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
longer has to be copied into a project.

`material-theme-builder/tailwind.css` keeps working, and gains the two roles it
was missing: `--color-surface-tint` and `--color-surface-variant`.
