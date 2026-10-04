---
status: accepted
---

# `toJson().schemes` keeps MTB's background, `toCss()` keeps the surface alias

When the input overrides the `neutral` core color, `toJson().schemes.*.background`
and `onBackground` differ from `--md-sys-color-background` and
`--md-sys-color-on-background` of `toCss()`. On the inputs of the
`try-02.json` fixture (all six core colors overridden):

|                                     | `toJson().schemes`    | `toCss()`                               |
| ----------------------------------- | --------------------- | --------------------------------------- |
| light `background` / `onBackground` | `#FFF9ED` / `#1E1C13` | `#FDF8FF` / `#1C1B20` (neutral 98 / 10) |
| dark `background` / `onBackground`  | `#15130B` / `#E8E2D4` | `#141318` / `#E6E1E9` (neutral 6 / 90)  |
| light `surface` / `onSurface`       | `#FDF8FF` / `#1C1B20` | `#FDF8FF` / `#1C1B20`                   |

The JSON values are not tones of the exported `neutral` palette: they are the
background roles of the scheme built from `primary` alone, whose neutral palette
is not exported.

We decided to keep both as they are. `toJson().schemes` reproduces MTB's export,
and `toCss()` follows Material Color Utilities (MCU).

## Why

- MTB's own export does this. Both fixtures that override `neutral` pin it:
  `try-02.json` has light `background` `#FFF9ED` beside `surface` `#FDF8FF`, and
  `try-04.json` has `#F9FAEF` beside `#FFF8F8`, in all six schemes. In the
  fixtures without a `neutral` override, `background` is `surface`. The fixture
  tests compare `schemes` exactly, so changing `toJson()` would break MTB
  conformance, which is what `schemes` is for.
- In MCU, `background` and `onBackground` are the neutral palette at the same
  tones as `surface` and `onSurface` (98/6 and 10/90) in the 2021 spec
  ([`color_spec_2021.ts` L141-L158](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/color_spec_2021.ts#L141-L158)),
  and clones of `surface` and `onSurface` in the 2025 spec (`onBackground`
  differs only on the watch platform)
  ([`color_spec_2025.ts` L1156-L1170](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/color_spec_2025.ts#L1156-L1170)).
  The M3 spec has dropped both roles; exporters still emit them
  (`src/lib/tokens.ts`). A `background` that is not `surface` is MTB's quirk,
  not M3.
- Every `toCss()` role is a tone of a reference palette it emits
  ([ADR 0001](./0001-reference-palettes-are-the-scheme-palettes.md)).
  Following MTB there would draw `background` from a palette `toCss()` does not
  emit.

## Consequences

- With a `neutral` override, `toJson().schemes.*.background` and `onBackground`
  are not tones of `toJson().palettes.neutral`, and differ from `toCss()`.
- Without a `neutral` override, `background` is `surface` in both.
- `src/lib/builder.json.test.ts` pins both behaviours on the MTB fixtures that
  override `neutral`.
