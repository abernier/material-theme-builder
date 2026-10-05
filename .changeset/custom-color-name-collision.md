---
"material-theme-builder": minor
---

`builder()` now throws on a custom color whose name collides with a system role,
a core palette or another custom color, e.g.
`Invalid customColors[0].name: 'secondary'. Its role 'secondary' collides with the system role 'secondary'.`

Such a color used to silently replace part of the core family: one named
`secondary` took over `secondary`, `onSecondary`, `secondaryContainer`,
`onSecondaryContainer` and the `secondary` reference palette in `toCss()`, while
`secondaryFixed`, `secondaryFixedDim` and `toJson().schemes` kept the core
color's.

Names are compared as the exporters spell them, kebab-cased, so `Secondary`,
`neutral variant` (the `neutral-variant` palette) and `brand` next to `Brand` are
refused too. So is a name that lands on a Tailwind shade, like `primary500`:
`toTailwind()` would declare `--color-primary-500` twice.

Rename the custom color, or use the core-color override (`secondary: "#..."`) if
replacing the core color was the intent. `<Mtb>` throws the same error, and the
CLI prints it in one line.
