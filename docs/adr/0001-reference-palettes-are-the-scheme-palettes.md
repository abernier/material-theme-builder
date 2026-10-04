---
status: accepted
---

# Reference palettes are the palettes the system roles are drawn from

`toJson().palettes` and the `--md-ref-palette-*` variables of `toCss()` disagreed
([#175](https://github.com/abernier/material-theme-builder/issues/175)). `toCss()`
emitted the `DynamicScheme`'s palettes, the ones the `--md-sys-color-*` roles are
tones of: six palettes (`error` included) plus the custom colors, at 28 tones,
following the scheme variant. `toJson()` rebuilt the palettes of the official
Material Theme Builder (MTB) JSON export instead: five palettes, 18 tones, built
from the input colors with the legacy content `CorePalette` formulas, the same
whatever the variant. So `palettes.primary["40"]` was not `schemes.light.primary`.

We decided that a reference palette is, by definition, a palette the system roles
are drawn from. `toCss()` is right; `toJson().palettes` now returns exactly what
`toCss()` emits, both read from one shared value (`refPalettes`, built from the
scheme palettes at `STANDARD_TONES`). Full research:
[`docs/reference-palettes-research.md`](../reference-palettes-research.md).

## Why

- The M3 token model makes a system token a role that points at a reference token.
  Material Web's generated tokens alias `md-sys-color-primary` to
  `md-ref-palette primary40` (light) and every other role the same way, `error`
  and the neutral surface tones included:
  [`_md-sys-color.scss` L110](https://github.com/material-components/material-web/blob/a6b2d2640b336e5d9fc73133a317e9173827ba95/tokens/versions/v0_192/_md-sys-color.scss#L110),
  [`_md-ref-palette.scss`](https://github.com/material-components/material-web/blob/a6b2d2640b336e5d9fc73133a317e9173827ba95/tokens/versions/v0_192/_md-ref-palette.scss),
  [M3 design tokens](https://m3.material.io/foundations/design-tokens/overview),
  [M3 baseline scheme](https://m3.material.io/styles/color/static/baseline).
- In Material Color Utilities the palettes are fields of the `DynamicScheme` and
  depend on the variant
  ([`dynamic_scheme.ts` L160-L200](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/dynamic_scheme.ts#L160-L200),
  [L636-L663](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/dynamic_scheme.ts#L636-L663));
  every role is a palette plus a tone function
  ([`color_spec_2021.ts` L341-L357](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/color_spec_2021.ts#L341-L357),
  [`color_terms.md`](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/concepts/color_terms.md#L8-L37)).
  `CorePalette`, the only variant-independent palette concept, is deprecated in
  favour of `DynamicScheme`
  ([`core_palette.ts` L35-L42](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/palettes/core_palette.ts#L35-L42),
  [commit `140c6b199a`](https://github.com/material-foundation/material-color-utilities/commit/140c6b199a)).
- Android's `system_accent1_*` palettes are the `DynamicScheme`'s palettes of the
  active style
  ([`ColorScheme.java` L83-L103](https://android.googlesource.com/platform/frameworks/libs/systemui/+/89da99e2435efec403883849efac27a137ae56f3/monet/src/com/android/systemui/monet/ColorScheme.java#83)).
- MTB's maintainer says its exported palettes ignore Color match and the variant,
  calls it a known issue, and says the tonal palettes "are only there as
  reference"
  ([MTB #240](https://github.com/material-foundation/material-theme-builder/issues/240#issuecomment-1960041331)).
  Users report the resulting mismatch, the missing `error` palette and the missing
  surface tones as bugs
  ([#308](https://github.com/material-foundation/material-theme-builder/issues/308),
  [#321](https://github.com/material-foundation/material-theme-builder/issues/321),
  [#322](https://github.com/material-foundation/material-theme-builder/issues/322)).

## Consequences

- For the same input, `toJson().palettes` values change: they are now the rendered
  palettes, so they follow the scheme variant (and the 2021 spec's chroma clamps),
  and the roles in `schemes` are tones of them (e.g. `palettes.primary["40"]` is
  `schemes.light.primary` for a tonal-spot scheme at standard contrast). One MTB
  quirk `schemes` keeps: with a `neutral` override, `background` and
  `onBackground` still come from the neutral palette of `primary` (or the
  source) alone, which is not exported.
- `toJson().palettes` gains the `error` palette, the custom-color palettes, and the
  10 tones `toCss()` already had (4, 6, 12, 17, 22, 24, 87, 92, 94, 96): 28 tones.
- MTB-export conformance becomes opt-in: `toJson({ palettes: "mtb" })` returns the
  previous palettes, value for value. The MTB fixture tests use it; `schemes` stays
  MTB-identical by default.
- A role is always a tone of its palette, but not always of an exported tone:
  contrast curves, tone-delta pairs and fidelity can land it in between. So the
  `--md-sys-color-*` to `var(--md-ref-palette-*)` aliasing in `toCss()` must keep its
  raw-hex fallback.
