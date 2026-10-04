---
status: accepted
---

# JSON background follows the rendered scheme, not MTB

When the input overrides the `neutral` core color, the official Material Theme
Builder (MTB) JSON export takes `background` and `onBackground` from the scheme
of `primary` alone, while every other role comes from the scheme with the
overrides. `toJson()` used to reproduce that, so its `schemes.*.background` and
`onBackground` differed from `--md-sys-color-background` and
`--md-sys-color-on-background` of `toCss()`. On the inputs of the `try-02.json`
fixture (all six core colors overridden):

|                                     | MTB export (old `toJson()`) | `toCss()` (and `toJson()` now)          |
| ----------------------------------- | --------------------------- | --------------------------------------- |
| light `background` / `onBackground` | `#FFF9ED` / `#1E1C13`       | `#FDF8FF` / `#1C1B20` (neutral 98 / 10) |
| dark `background` / `onBackground`  | `#15130B` / `#E8E2D4`       | `#141318` / `#E6E1E9` (neutral 6 / 90)  |
| light `surface` / `onSurface`       | `#FDF8FF` / `#1C1B20`       | `#FDF8FF` / `#1C1B20`                   |

MTB's values are not tones of any exported palette: they come from the neutral
palette of `primary`, which neither MTB nor `toCss()` exports. `try-04.json`, the
other fixture with a `neutral` override, shows the same (`background` `#F9FAEF`
beside `surface` `#FFF8F8`), in all six schemes. Without a `neutral` override,
MTB's `background` is `surface`.

We decided that `toJson().schemes` takes `background` and `onBackground` from
the rendered scheme, like every other role and like `toCss()`. MTB's value is
intentionally not reproduced.

## Why

- It is the decision of
  [ADR 0001](./0001-reference-palettes-are-the-scheme-palettes.md) applied to
  one more role. ADR 0001 dropped MTB's exported palettes because they are not
  the palettes MTB's own roles are drawn from; a `background` drawn from a
  palette that is not exported is the same inconsistency.
- In Material Color Utilities (MCU), `background` and `onBackground` are the
  neutral palette at the same tones as `surface` and `onSurface` (98/6 and
  10/90) in the 2021 spec
  ([`color_spec_2021.ts` L141-L158](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/color_spec_2021.ts#L141-L158)),
  and clones of `surface` and `onSurface` in the 2025 spec (`onBackground`
  differs only on the watch platform)
  ([`color_spec_2025.ts` L1156-L1170](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/color_spec_2025.ts#L1156-L1170)).
  A `background` that is not `surface` is MTB's quirk, not M3.
- The M3 spec has dropped both roles; exporters still emit them
  (`src/lib/tokens.ts`). Keeping a quirk alive on a deprecated role buys
  nothing but a JSON that disagrees with the CSS.

## Consequences

- With a `neutral` override, `toJson().schemes.*.background` and `onBackground`
  change: they are now `toCss()`'s values, tones of `toJson().palettes.neutral`.
  Without one, nothing changes.
- `background` is `surface` in every scheme. `onBackground` is `onSurface` at
  standard contrast only: MCU's 2021 spec gives `onBackground` a lower contrast
  curve than `onSurface`, in MTB's export as well.
- The MTB fixture tests compare everything but `palettes`, `background` and
  `onBackground`; every other role of `schemes` stays MTB-identical.
