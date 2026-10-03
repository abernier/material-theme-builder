---
"material-theme-builder": minor
---

`colorMatch` works, as Material Theme Builder's "Color match - Stay true to my
color inputs" does. It was declared, threaded through `<Mtb>`, and ignored.

```ts
builder("#CAF543", {
  neutral: "#36342F",
  customColors: [{ name: "paper", hex: "#E6E2DD", blend: false }],
  colorMatch: true,
});
```

On, every scheme is built as MTB builds it with the toggle on: as `content`,
one per input color. A palette made from a color keeps that color's own chroma,
and its container takes the color's own tone: `primaryContainer` is the primary
as picked. An overridden secondary, tertiary or error is the primary of its own
scheme; an overridden neutral or neutral variant supplies the surfaces, or the
outlines, of its own. So the near-gray `neutral` above gives gray surfaces, and
the near-gray custom color stays gray, where both used to take the source's
yellow-green. MTB's quirks come along: `background` and `onBackground` stay the
source's even with a neutral, and the JSON `palettes` do not change.

It takes the place of `scheme`, which MTB has no counterpart for. Custom colors
are harmonized first when `blend` is set, then read as the primary of their own
scheme, as MTB's Flutter export does.

The JSON export matches MTB's own output for color match, checked against
fixtures computed by MTB's code. Every other output (CSS, Figma, Tailwind,
shadcn, Flutter) is built from the same scheme colors. The CLI takes it as
`--color-match`, and Storybook as a `colorMatch` control (`args=colorMatch:!true`
in a link).

The default stays `false`, and with it every output is unchanged.
