---
"material-theme-builder": minor
---

`colorMatch` is implemented — it was declared, and ignored. It mirrors Material
Theme Builder's "Color match - Stay true to my color inputs" toggle (#196):

```ts
builder("#6750A4", { colorMatch: true, tertiary: "#80CBC4" });
```

The `content` variant is forced and `scheme` is ignored. The primary (or
`source`), each overridden core color and each custom color gets its own
scheme, so its `*Container` role lands on the input tone — subject to MCU's
usual adjustments: tones in [50, 60) get nudged, and contrast curves still
apply. Neutral / neutralVariant overrides keep their hue, at chroma C/8 and
C/8 + 4. A custom color's `blend` is still honoured: harmonized first, then
matched; and, as in the official export, its roles are the same at every
`contrast` level. `toJson()` matches the official exports 1:1, `palettes` section
included, which Color match leaves unchanged.

It is everywhere the other options are: `<Mtb colorMatch>`, `--color-match` on
the CLI (and in the `shadcn-apply` command Storybook spells out for a theme),
and a Storybook arg that the URL can set — the `scheme` control hides while it
is on.

One behaviour changes without it: under `scheme: "content"` or `"fidelity"`
with a `tertiary` override, `tertiaryContainer` now lands on the tertiary
input's tone instead of the primary's — `#80CBC4` gives tone 77 where it used
to give 40. Each overridden core color now reads its roles from a scheme
sourced on that color, which is what made Color match possible.
