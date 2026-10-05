---
status: accepted
---

# Color match is the Content variant, per core color

The official Material Theme Builder (MTB) has a "Color match - Stay true to my
color inputs" switch. MTB is closed source, and Material Color Utilities (MCU)
has no such option. `colorMatch` was declared in `MtbConfig` but ignored.

We reverse-engineered it from MTB's JSON exports: the `try-0N.colormatch.json`
fixtures are the `try-0N.json` inputs exported with Color match on. They are
reproduced exactly (all five fixtures, all six schemes each, `background` and
`onBackground` aside, see below) by MCU's Content variant (`SchemeContent`),
applied per core color:

- The base is `SchemeContent` of the source (`primary`, when given). Every role
  that is not overridden comes from it.
- An overridden accent (`secondary`, `tertiary`, `error`) takes the _primary_
  roles of `SchemeContent` of its own color: `secondary` is that scheme's
  `primary`, `onSecondaryContainer` its `onPrimaryContainer`, and so on for the
  whole family, fixed roles included.
- An overridden `neutral` or `neutralVariant` takes the palette of that name from
  `SchemeContent` of its own color (chroma / 8, and chroma / 8 + 4). Its roles
  keep their standard tones.

We decided that `colorMatch: true` is that algorithm, built in one place
(`buildColorMatchScheme`) that both `builder()` and `toJson()` read.

## Why

- `SchemeFidelity` does not reproduce the fixtures (37 roles off on `try-01`,
  which overrides nothing), `SchemeContent` does.
- One `DynamicScheme` of the Content variant, given the override palettes, does
  not either (accent roles off on `try-02`, `-03` and `-05`): the Content
  container tones follow the scheme's source color (`sourceColorHct`, in
  [`color_spec_2021.ts`](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/color_spec_2021.ts)),
  so each accent needs a scheme whose source is its own color.
- MTB has no scheme selector: Color match off is tonal spot, on is content. So a
  `scheme` given along with `colorMatch: true` has no MTB reading, and
  `colorMatch` takes precedence.

## Consequences

- `colorMatch` overrides `scheme` for the core colors. Default stays `false`,
  with which nothing changes.
- Custom colors are unaffected: their palettes and roles are what they are
  without `colorMatch`, for the same inputs (`scheme` included, which they still
  follow). MTB's JSON does not export extended-color roles, so there is nothing
  to conform to.
- [ADR 0001](./0001-reference-palettes-are-the-scheme-palettes.md) holds: the
  reference palettes are the palettes the roles are drawn from. For an
  overridden accent, the exported palette is the primary palette of
  `SchemeContent` of its color. Content containers rarely land on an exported
  tone, so `toCss()` often falls back to raw hex for them. Checked against the
  `palettes` of the five Color-match exports: MTB's `primary` palette, and the
  palette of every overridden accent, are those palettes exactly (18 tones out
  of 18). Its `neutral` and `neutral-variant` palettes, and the `secondary` and
  `tertiary` ones when not overridden, are not the ones its roles are drawn
  from, so ADR 0001's reading of MTB's exported palettes stands with Color
  match on.
- [ADR 0002](./0002-json-background-follows-the-rendered-scheme.md) holds:
  `background` and `onBackground` come from the rendered scheme, so with a
  `neutral` override they are tones of the overridden neutral palette. MTB takes
  them from the neutral palette of `primary`; that is still not reproduced, and
  the fixture tests still leave both roles out.
