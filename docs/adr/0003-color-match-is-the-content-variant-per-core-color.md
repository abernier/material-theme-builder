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

We decided that `colorMatch: true` is that algorithm, built in the one scheme
construction that every exporter reads (`renderScheme`, see
[ADR 0004](./0004-a-core-color-override-takes-the-palette-of-its-own-scheme.md)).
The palettes are exactly those of `scheme: "content"` under ADR 0004's per-color
rule; what Color match adds is the roles of an overridden accent, read from the
scheme of its own color (`colorMatchAccentRoles`).

A custom color follows the same rule as an overridden accent (see
[Custom colors](#custom-colors)): its palette is the primary palette of
`SchemeContent` of its own color, and its four roles are that scheme's
`primary`, `onPrimary`, `primaryContainer` and `onPrimaryContainer`
(`colorMatchCustomColorScheme`).

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

## Custom colors

MTB's JSON export says nothing on the roles of a custom color ("extended color"
in MTB): its `extendedColors` hold a name, a color, a description and
`harmonized`. We first concluded there was nothing to conform to, and left custom
colors as they are without `colorMatch`. There is something: the code of MTB's
web app. Its bundle was read, not run:
`https://material-foundation.github.io/material-theme-builder/main.dart.js`
(Flutter web compiled with dart2js), as fetched on 2026-10-05, sha256
`1a8b8b05bab6814fa5a4b235928d3caba2fe54748cfe68299eacc4b76c673a1b`. Line numbers
are those of the file as served; the names are minified.

- One function builds every scheme (`Hy`, l.28416-28727), from a brightness,
  the Color match flag, a contrast level and the core colors. It makes the
  scheme of a color with a factory (l.118526-118529) that is `SchemeContent`
  when Color match is on (`b8j`, l.28199-28212) and `SchemeTonalSpot` when it is
  off (`b8k`, l.28290-28299). That is the per core color algorithm above, read
  from the source this time.
- An extended color is rendered by calling that same function with the
  extended color as its only color, and taking `primary`, `onPrimary`,
  `primaryContainer` and `onPrimaryContainer` from the result as `color`,
  `onColor`, `colorContainer` and `onColorContainer`: on the scheme boards of
  the page (l.120413-120431), in the Flutter export (l.118303-118314,
  l.118724-118749) and in the Compose, Android Views and Web exports (`b9J`,
  l.28810-28829). Light and dark are the brightness argument.

So with Color match on, the roles of a custom color are the primary roles of
`SchemeContent` of that color, and with it off those of `SchemeTonalSpot`. MTB
does not agree with itself on two other points, which do not depend on Color
match:

|                                                  | Color the scheme is built from                                                                   | Contrast                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| Scheme boards, Flutter export                    | harmonized with `primary` when "Harmonize" is on (l.118285-118302)                               | always 0, in all six schemes of the Flutter one |
| Compose, Android Views and Web exports (l.28814) | the color as given, even when "Harmonize" is on (the harmonized one is only exported as `value`) | 0, 0.5 and 1                                    |

On those two points `colorMatch` keeps what custom colors did before it: the
color is harmonized when `blend` is set, and the roles do not follow `contrast`.
With Color match off that was already MTB's rendering on screen: tonal spot's
primary roles at standard contrast are the tones 40, 100, 90 and 30 (80, 20, 30
and 90 in dark) of a palette at chroma 36.

## Combining with `scheme`

We considered giving `colorMatch: true` a meaning with a `scheme` other than
content, and rejected it: nothing upstream defines that combination, and the one
that can be built does not do what Color match promises.

- MTB never makes it. The factory above is the only place a theme's scheme is
  built: tonal spot or content, nothing else.
- In MCU, fidelity is not an option but a property of two variants:
  `isFidelity` is `variant === FIDELITY || variant === CONTENT`
  ([`color_spec_2021.ts`, l.31-34](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/color_spec_2021.ts#L31-L34)),
  in 0.3.0, in 0.4.0 and on `main`. A scheme has one variant, so it is either a
  fidelity one or another one.
- MCU moves further from it. The 2025 spec has no fidelity tone rule, and a
  Content or Fidelity scheme always falls back to the 2021 spec
  ([`dynamic_scheme.ts`, l.204-214](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/dynamic_scheme.ts#L204-L214)).
- What can be built is a `DynamicScheme` of the Content variant given the
  palettes of another variant: the fidelity tone rules on that variant's hues
  and chromas. Material's "Use color fidelity" guidance (m3.material.io, Styles,
  Color, Advanced) words fidelity that way, as a switch apart from the variant.
  It keeps the tone of the input and nothing else. For `#CAB337` (hue 100,
  chroma 49, tone 73) in light, `primaryContainer` is `#CAB337` itself with the
  Content palettes, `#C5B35E` (chroma 36) with the tonal spot ones and `#E59CD0`
  (hue 340, a pink) with the expressive ones. That is not staying true to the
  color inputs. Monochrome cannot take it at all: its tone rules hang on the
  same single variant.

So `scheme` has no effect with `colorMatch: true`, and that is the whole rule.

## Consequences

- `colorMatch` overrides `scheme`, for the core colors and the custom colors.
  Default stays `false`, with which nothing changes.
- Without `colorMatch`, a custom color has the chroma of the primary palette of
  `scheme`; with it, its own. Its roles then sit at the tones Content gives the
  primary roles (the container near the tone of the color itself) instead of
  their standard tones. They are still `DynamicColor`s that take a tone of the
  custom color's palette, so
  [ADR 0001](./0001-reference-palettes-are-the-scheme-palettes.md) holds for
  them too.
- The roles of a custom color do not follow `contrast`, with or without
  `colorMatch`. MTB's Compose, Android Views and Web exports do render them at
  medium and high contrast; reproducing that is a separate decision, for both
  modes at once.
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
