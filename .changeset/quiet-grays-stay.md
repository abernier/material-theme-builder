---
"material-theme-builder": minor
---

`colorMatch` works — Material Theme Builder's "Color match: stay true to my color
inputs". It was declared, threaded through `<Mtb>`, and ignored.

```ts
builder("#CAF543", {
  scheme: "vibrant",
  neutral: "#36342F",
  customColors: [{ name: "paper", hex: "#E6E2DD", blend: false }],
  colorMatch: true,
});
```

Off, a palette made from an input color keeps only its hue and takes the
scheme's chroma: the near-gray `neutral` above comes out tinted at the scheme's
neutral chroma (10 in `vibrant`), and the near-gray custom color at the
primary's (up to 200), so both turn the source's yellow-green. On, every palette
made from an input color keeps that color's own chroma too — `source` (or
`primary`), the six core overrides, and each custom color — so the grays stay
gray and a saturated custom color stays as saturated as it was picked. Palettes
the scheme derives on its own (an unset secondary, tertiary or neutral) are
untouched, and `blend` still harmonizes a custom color's hue first.

Every output follows: CSS, JSON, Figma, Tailwind, shadcn, Flutter. The CLI takes
it as `--color-match`, and Storybook as a `colorMatch` control
(`args=colorMatch:!true` in a link).

The default stays `false`, and with it every output is unchanged.
