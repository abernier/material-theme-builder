# Reference Palettes Research

Context: issue #175. What is a Material 3 reference palette (`md.ref.palette.*`,
`--md-ref-palette-primary40`) relative to the system color roles (`md.sys.color.*`) and to
Material Color Utilities' `DynamicScheme`? Are reference palettes, by definition, the tonal
palettes the roles are drawn from (and so must follow the scheme variant / "Color match"), or is
there an official, variant-independent "core" palette?

Sources were fetched on 2026-10-04. Every quote below links to the exact file revision or page.

## Conclusion

**Reference palettes are the tonal palettes the system roles are drawn from.** Every primary
source that defines the relationship (the M3 design-token spec, the Material Web token files,
MCU's docs and `DynamicScheme`, and Android's dynamic color code) treats a system role as a tone
picked from a ref palette, for example `md.sys.color.primary` = `md.ref.palette.primary40` in
light. MCU's palettes belong to a `DynamicScheme` and change with the variant, and so do
Android's `system_accent1_*` palettes. There is **no current official notion of a separate,
variant-independent "core" palette**. The closest thing, MCU's `CorePalette`, has been deprecated
since July 2024 in favor of `DynamicScheme`. A Google maintainer of Material Theme Builder has
said in the tracker that MTB's exported `palettes` ignore Color match and the variant, called
that a known issue, and described the palettes as "only there as reference".

**Confidence:** high that ref palettes are, by definition, the palettes the roles come from.
Medium-high that no official variant-independent palette concept exists. That second point rests
on not finding one, plus `CorePalette` being deprecated.

## Sources

### 1. M3 spec: design tokens (m3.material.io)

Page: [Design tokens overview](https://m3.material.io/foundations/design-tokens/overview)
(read in a browser, since the page is rendered client-side)

- Three token classes: reference, system, component.
- Reference tokens: "These tokens make up all of the style options available in a design
  system." They "usually point to a static value" and "don't change based on context."
- System tokens: "System tokens define the purpose a reference token serves in the UI." Also:
  "This is where theming occurs."
- The page's own example of a reference token is `md.ref.palette.secondary90` = `#E8DEF8`.

**Reading:** in the spec's model, a ref token is a value and a sys token is a role that points
at a ref token. "Don't change based on context" refers to contexts such as light/dark (that is
the page's own example). It does not describe a palette that stays fixed when the source color
or the variant changes.

### 2. M3 spec: how the color system works

Page: [How the system works](https://m3.material.io/styles/color/system/how-the-system-works)

- Pipeline: source color, then five key colors, then tonal palettes, then roles.
- The palettes are created per key color: "create a tonal palette for each key color".
- Tones are assigned from those palettes to roles: "assigns the color tone primary40 to the
  primary role".
- Tone set: "0 to 100 in increments of 10, as well as 95, 98, and 99. Some palettes include
  more values."

Page: [Color roles](https://m3.material.io/styles/color/roles)

- On error: "Error is an example of a static color (it doesn't change even in dynamic color
  schemes)." (This is the 2021 behavior. See source 5 for the 2025 spec.)

Page: [Baseline static scheme](https://m3.material.io/styles/color/static/baseline)

- The token module on this page shows `md.sys.color.primary` pointing to
  `md.ref.palette.primary40`, which resolves to `#6750A4`. This was read from the rendered page
  after clicking the Primary token.

Page: [Advanced customizations / adjust existing colors](https://m3.material.io/styles/color/advanced/adjust-existing-colors)

- Color fidelity: "Color fidelity adjusts tones in color roles to produce the closest match to
  your input color."
- In MTB, the "match color" option is how you "enable or disable fidelity".

**Reading:** the spec describes Color match (fidelity) as an adjustment of role tones. It says
nothing about palettes that stay fixed. In MCU code, though, fidelity and content variants also
change the palettes themselves (see source 5).

### 3. Material Web token files (material-components/material-web)

Revision: `a6b2d2640b336e5d9fc73133a317e9173827ba95`

- [`tokens/versions/v0_192/_md-sys-color.scss` L110](https://github.com/material-components/material-web/blob/a6b2d2640b336e5d9fc73133a317e9173827ba95/tokens/versions/v0_192/_md-sys-color.scss#L110):
  `'primary': map.get($deps, 'md-ref-palette', 'primary40'),` (light).
  [L51](https://github.com/material-components/material-web/blob/a6b2d2640b336e5d9fc73133a317e9173827ba95/tokens/versions/v0_192/_md-sys-color.scss#L51)
  maps dark `primary` to `primary80`. Every sys color in the file is a `map.get` into
  `md-ref-palette`, including `error` = `error40`, `surface-dim` = `neutral87` and
  `surface-container-lowest` (dark) = `neutral4`.
- [Header L6-L12](https://github.com/material-components/material-web/blob/a6b2d2640b336e5d9fc73133a317e9173827ba95/tokens/versions/v0_192/_md-sys-color.scss#L6-L12):
  the file is generated ("DO NOT MODIFY IT BY HAND") from "Google Material 3" v0.192, with
  context `"Scheme": "Dynamic"`.
- [`tokens/versions/v0_192/_md-ref-palette.scss`](https://github.com/material-components/material-web/blob/a6b2d2640b336e5d9fc73133a317e9173827ba95/tokens/versions/v0_192/_md-ref-palette.scss):
  static baseline hex values only. For example
  [L73](https://github.com/material-components/material-web/blob/a6b2d2640b336e5d9fc73133a317e9173827ba95/tokens/versions/v0_192/_md-ref-palette.scss#L73)
  `'primary40': ... #6750a4`. The file holds 6 palettes: primary, secondary, tertiary, error,
  neutral and neutral-variant.
  - Accent and error palettes have 13 tones: 0, 10, 20, ..., 90, 95, 99 and 100.
  - Neutral adds 4, 6, 12, 17, 22, 24, 87, 92, 94, 96 and 98
    ([L53](https://github.com/material-components/material-web/blob/a6b2d2640b336e5d9fc73133a317e9173827ba95/tokens/versions/v0_192/_md-ref-palette.scss#L53)
    `neutral4`,
    [L60](https://github.com/material-components/material-web/blob/a6b2d2640b336e5d9fc73133a317e9173827ba95/tokens/versions/v0_192/_md-ref-palette.scss#L60)
    `neutral87`). These are exactly the tones the surface roles reference.
- [`tokens/_md-sys-color.scss` L73-L93](https://github.com/material-components/material-web/blob/a6b2d2640b336e5d9fc73133a317e9173827ba95/tokens/_md-sys-color.scss#L73-L93):
  the public wrapper emits only `var(--md-sys-color-*, <value>)`. It emits no
  `--md-ref-palette-*` properties.
- [`docs/theming/README.md` L53-L54, L70](https://github.com/material-components/material-web/blob/a6b2d2640b336e5d9fc73133a317e9173827ba95/docs/theming/README.md#L53-L70):
  "Reference tokens hold concrete values", and
  "_MWC does not currently support `--md-ref-palette` tokens._"
- [`docs/theming/color.md` L26-L30](https://github.com/material-components/material-web/blob/a6b2d2640b336e5d9fc73133a317e9173827ba95/docs/theming/color.md#L26-L30):
  a color scheme is "the group of key color tones assigned to specific roles". Runtime schemes
  are generated with `material-color-utilities`.

**Reading:** yes, `md-sys-color-primary` aliases `md-ref-palette-primary40`. The ref values that
ship are baseline only. No dynamic ref palette is produced by Material Web, and Material Web does
not expose ref palettes as CSS custom properties at all.

### 4. Material Color Utilities: CorePalette, theme_utils, Scheme (legacy)

Revision: `5b3618b16fdc3825e21d5679bafd144662088ea1`

- [`typescript/palettes/core_palette.ts` L35-L42](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/palettes/core_palette.ts#L35-L42):
  "An intermediate concept between the key color for a UI theme, and a full color scheme." The
  same block says `@deprecated Use {@link DynamicScheme} for color scheme generation.`
- [L119-L137](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/palettes/core_palette.ts#L119-L137)
  defines the two formulas:
  - Non-content: a1 = max(48, chroma), a2 = 16, a3 = hue+60 at 24, n1 = 4, n2 = 8.
  - Content (`contentOf` / `contentFromColors`): a1 = chroma, a2 = chroma/3,
    a3 = hue+60 at chroma/2, n1 = min(chroma/12, 4), n2 = min(chroma/6, 8).
  - Error is always `fromHueAndChroma(25, 84)`.
  - The content formulas are the ones this repo reproduces in `src/lib/builder.json.ts:106-121`.
- Deprecation: commit
  [`140c6b199a` (2024-07-23)](https://github.com/material-foundation/material-color-utilities/commit/140c6b199a)
  "Deprecate legacy core palette class." The Dart
  [CHANGELOG L21-L33](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/dart/CHANGELOG.md#L21-L33)
  records the same thing for 0.13.0 (2025-05-20): "Deprecate legacy `CorePalette` class in favor
  of `CorePalettes`."
- [`typescript/palettes/core_palettes.ts` L20-L25](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/palettes/core_palettes.ts#L20-L25):
  the replacement `CorePalettes` is a plain container of 5 palettes with no formulas. These
  palettes "will then be part of a [DynamicScheme]".
- [`typescript/scheme/scheme.ts` L22-L26](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/scheme/scheme.ts#L22-L26):
  "The `Scheme` class is deprecated in favor of `DynamicScheme`." `Scheme.light` is built from
  `CorePalette.of(argb)` and reads `primary` straight from `core.a1.tone(40)`.
- [`typescript/utils/theme_utils.ts` L77-L96](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/utils/theme_utils.ts#L77-L96):
  `themeFromSourceColor` returns `palettes` from `CorePalette.of(source)` (non-content). That
  set has six palettes and includes `error`. Its `schemes` come from `Scheme.light/dark(source)`,
  which use the same `CorePalette`. So in this legacy API, palettes and roles are internally
  consistent: `schemes.light.primary` equals `palettes.primary.tone(40)`.
- [`theme_utils.ts` L168-L177](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/utils/theme_utils.ts#L168-L177):
  `applyTheme(..., {paletteTones})` is the only official code found that writes
  `--md-ref-palette-*` custom properties. It writes them from `theme.palettes` (legacy
  `CorePalette`), with the doubled naming
  `` `--md-ref-palette-${paletteKey}-${paletteKey}${tone}` ``, and only for the tones the
  caller passes. `theme_utils.ts` itself is not marked deprecated, but it depends on two
  deprecated classes.

### 5. Material Color Utilities: DynamicScheme and MaterialDynamicColors (current)

Revision: `5b3618b16fdc3825e21d5679bafd144662088ea1`

- [`typescript/dynamiccolor/dynamic_scheme.ts` L160-L200](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/dynamic_scheme.ts#L160-L200):
  `primaryPalette`, `secondaryPalette`, `tertiaryPalette`, `neutralPalette`,
  `neutralVariantPalette` and `errorPalette` are fields of the scheme. Each accent and neutral
  palette is documented with "Hue and chroma of the color are specified in the design
  specification of the variant."
- [L636-L663](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/dynamic_scheme.ts#L636-L663):
  `getPrimaryPalette` switches on the variant. `CONTENT`/`FIDELITY` use the source chroma.
  `TONAL_SPOT` uses chroma 36, `VIBRANT` 200, `NEUTRAL` 12, and so on. Secondary for
  `CONTENT`/`FIDELITY` is `max(chroma - 32, chroma * 0.5)`, not the legacy content `chroma / 3`.
  So **MCU's palettes depend on the variant**, and none of the current variants reproduces the
  legacy content `CorePalette` exactly.
- [L263-L268](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/dynamic_scheme.ts#L263-L268):
  the default error palette is `fromHueAndChroma(25.0, 84.0)`. In the 2025 spec,
  [L999-L1021](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/dynamic_scheme.ts#L999-L1021)
  makes the error palette depend on the variant too (piecewise hue, chroma per variant).
  `DEFAULT_SPEC_VERSION` is still `'2021'`
  ([L120](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/dynamic_scheme.ts#L120)).
- [`typescript/dynamiccolor/color_spec_2021.ts` L341-L357](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/color_spec_2021.ts#L341-L357):
  the `primary` role is `palette: (s) => s.primaryPalette` with tone `s.isDark ? 80 : 40`, plus
  a `contrastCurve` and a `toneDeltaPair`. Every role is defined this way, as a palette plus a
  tone function.
- [`concepts/color_terms.md` L10-L15, L24-L27, L35-L37](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/concepts/color_terms.md#L8-L37):
  - "MCU assigns each color role with a value from a specific tonal palette."
  - A variant is "a set of design decisions on the assignment of color values from tonal
    palettes to color roles."
  - "MCU produces 6 tonal palettes: primary, secondary, tertiary, neutral, neutral variant, and
    error."
- [`concepts/dynamic_color_scheme.md` L35-L36, L54-L59](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/concepts/dynamic_color_scheme.md#L35-L59):
  `DynamicScheme` "comprises assignments of color values from tonal palettes ... to color
  roles". The five palettes are "the basis of a Material color scheme".
- [`concepts/scheme_generation.md` L33-L90](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/concepts/scheme_generation.md#L33-L90):
  the role tone is only a "starting" tone (primary T40 / T80). Fidelity and contrast steps can
  move it. **So a role is always drawn from its palette, but not always at the nominal tone.**
- [`dev_guide/creating_color_scheme.md` L21-L31](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/dev_guide/creating_color_scheme.md#L21-L31):
  the tonal palettes are listed as parameters of `DynamicScheme`. Variants such as
  `SchemeTonalSpot` and `SchemeContent` "come with pre-defined tonal palettes".

### 6. Android dynamic color (AOSP)

- **Android 14**: `ColorScheme.kt` at tag `android-14.0.0_r1`,
  [enum `Style` L233](https://android.googlesource.com/platform/frameworks/base/+/refs/tags/android-14.0.0_r1/packages/SystemUI/monet/src/com/android/systemui/monet/ColorScheme.kt#233).
  - Each style carries its own `CoreSpec` for a1/a2/a3/n1/n2.
  - `TONAL_SPOT` (L243): a1 chroma 36, a2 16, a3 hue+60 at 24, n1 6, n2 8. These match MCU's
    `SchemeTonalSpot` palettes.
  - `CONTENT` (L288): chroma multiples 1, 0.33, 0.66, 0.0833 and 0.1666.
  - `accent1 = TonalPalette(style.coreSpec.a1, seedArgb)` (L440).
  - `ThemeOverlayController.java` at the same tag
    ([L583-L620](https://android.googlesource.com/platform/frameworks/base/+/refs/tags/android-14.0.0_r1/packages/SystemUI/src/com/android/systemui/theme/ThemeOverlayController.java#583))
    builds `new ColorScheme(color, nightMode, mThemeStyle)` and writes each palette to
    `"android:color/system_" + name + "_" + shade` (accent1-3, neutral1-2). It builds the role
    colors (`system_primary_light` and others) from a `DynamicScheme` of the same style.
- **Current main**: `ColorScheme.java` at `frameworks/libs/systemui`
  [`89da99e2`, L83-L103](https://android.googlesource.com/platform/frameworks/libs/systemui/+/89da99e2435efec403883849efac27a137ae56f3/monet/src/com/android/systemui/monet/ColorScheme.java#83)
  picks `SchemeTonalSpot`, `SchemeContent` and so on by style, then sets
  `mAccent1 = new TonalPalette(mMaterialScheme.primaryPalette)` through
  `mError = new TonalPalette(mMaterialScheme.errorPalette)`.
  - The `system_accent1_*` palettes are literally the `DynamicScheme`'s palettes.
  - [`TonalPalette.java` L103](https://android.googlesource.com/platform/frameworks/libs/systemui/+/89da99e2435efec403883849efac27a137ae56f3/monet/src/com/android/systemui/monet/TonalPalette.java#103)
    defines `SHADE_KEYS` 0, 10, 50, 100, ... 1000 (13 shades). Shade s maps to tone
    `(1000 - s) / 10`.
- `ThemeOverlayController.java` on `frameworks/base` main (fetched at
  `1cdfff555f4a21f71ccc978290e2e212e2f8b168`), L611-L646: overlays are written only for
  accent1-3 and neutral1-2. No `system_error_*` overlay is assigned there.
- [`android.R.color`](https://developer.android.com/reference/android/R.color):
  - `system_accent1_*` were added in API 31.
  - `system_error_0` to `system_error_1000` were added in API 35.
  - `system_palette_key_color_primary_light` (API 34) is a "Color whose hue and chroma are used
    to create Primary palette and related tokens".
  - Where `system_error_*` gets its runtime value was not traced (see "Not found").

**Reading:** on Android, the public palette resources are the palettes of the active style
(variant), not a separate core palette.

### 7. Material Theme Builder

- [README @ `8e4e50ba`](https://github.com/material-foundation/material-theme-builder/blob/8e4e50ba4ac5048a804479a6f068c1552175a60f/README.md):
  - "The foundation of a color scheme is the set of key colors that individually relate to
    separate tonal palettes. Specific tones from each tonal palette are assigned to color roles
    across a UI."
  - On Color match: "**Color Match** will use the color inputs in place of _Container_ roles".
- The MTB source is not public. Open issue
  [#350](https://github.com/material-foundation/material-theme-builder/issues/350) asks for it
  to be open-sourced. The exporter could therefore not be inspected.
- Statements by Ivy Knight (`@margeeta`, GitHub profile: Google, "Designer Advocate, Android
  Design", the second-largest contributor to the repo):
  - [#240 comment, 2024-02-20](https://github.com/material-foundation/material-theme-builder/issues/240#issuecomment-1955161653):
    "The palettes are only displaying the color match variation currently, regardless if color
    match or content color variant settings are off." She adds that the team is investigating
    whether "the algorithm display the corresponding palettes", and that with Color match off
    "the tonal spot variant is used".
  - [#240 comment, 2024-02-22](https://github.com/material-foundation/material-theme-builder/issues/240#issuecomment-1960041331):
    "We highly recommend only using the color scheme and not the tonal palettes ... The tonal
    palettes are only there as reference."
  - [#327 comment, 2024-08-15](https://github.com/material-foundation/material-theme-builder/issues/327#issuecomment-2291991401):
    "Color match adds the input colors as the container colors".
- Related open user reports with no maintainer answer:
  - [#308](https://github.com/material-foundation/material-theme-builder/issues/308): JSON
    `palettes.primary.40` is not equal to `schemes.light.primary`, and the palettes are the same
    whether Color match is on or off.
  - [#321](https://github.com/material-foundation/material-theme-builder/issues/321) and
    [#275](https://github.com/material-foundation/material-theme-builder/issues/275): the error
    palette is missing from the JSON.
  - [#322](https://github.com/material-foundation/material-theme-builder/issues/322) and
    [#366](https://github.com/material-foundation/material-theme-builder/issues/366): tones
    used by roles (neutral 4, 6, 12, 17, 22, 24, 87, 92, 94, 96) are missing from the exported
    palettes.
- Local check of `src/fixtures/material-theme-builder/try-0*.json` (an observation, not a
  source): `palettes` is byte-identical between each `try-0N.json` and its `.colormatch.json`.
  `schemes.light.primary === palettes.primary["40"]` holds in 3 of the 5 Color-match exports
  (try-01, -02, -05) and in none of the non-Color-match exports. Secondary-40 never matches.

**Reading:** MTB's own maintainer describes the exported palettes as not following the variant,
says this is under investigation, and calls them reference-only. That is a description of a
shortcoming, not a definition of a separate palette concept.

### 8. Material 3 Design Kit (Figma)

- [Community page](https://www.figma.com/community/file/1035203688168086460/material-3-design-kit):
  the description and changelog say nothing about how ref palette tokens relate to variants or
  Color match.

## Implications for #175 (inference, not sourced)

These follow from the facts above. They are judgments, not statements from the sources.

- **`toCss()` matches the spec model.** `--md-ref-palette-*` is emitted from the
  `DynamicScheme`'s palettes (`src/lib/builder.ts:629-645`), which is how M3, MCU and Android
  define the relationship: the roles are tones of these palettes. Their following the variant
  (Tonal spot vs. Content/Fidelity under Color match) is the expected behavior, not a bug.
- **`toJson().palettes` reproduces an MTB shortcoming.** It uses content-`CorePalette`-like
  formulas and ignores Color match. The sources treat this as a known MTB issue, built from a
  deprecated concept, with no official status as a "core palette". Keeping it is defensible only
  as MTB-export conformance, which is what `toJson()` is for. If kept, it is worth documenting
  as "MTB-compatible, not the palettes the roles are drawn from". The existing comment at
  `src/lib/builder.json.ts:91-99` already says this. Possibly add an opt-in to export the scheme
  palettes instead.
- **Do not make `toCss()` follow `toJson()`.** No source supports deriving ref palettes
  independently of the variant. Doing so would break the `sys → ref` aliasing that the token
  spec describes.
- **Tone set.** The spec's minimum is 0-100 by 10, plus 95, 98 and 99. Material Web's
  `md.ref.palette` also has the neutral surface tones 4, 6, 12, 17, 22, 24, 87, 92, 94, 96 and 98. MTB's 18-tone set (with 5, 15, 25, 35) omits those surface tones, and users file that as a
  bug (#322, #366). `toCss()`'s 28 `STANDARD_TONES` are a superset of both, which is consistent
  with the sources. Material Web only defines the surface tones on neutral, so emitting them for
  every palette is harmless but goes beyond the spec.
- **Error palette.** It is included in Material Web's `md.ref.palette` (`error0` to
  `error100`), in MCU's six palettes, in `DynamicScheme.errorPalette` and in Android's
  `system_error_*` (API 35). MTB's JSON omission is an open bug (#321, #275). `toCss()` including
  `error` is consistent with the sources.
- **Aliasing caveat.** Even with scheme palettes, a role does not always land on a nominal
  palette tone. Contrast curves, tone-delta pairs and fidelity can move it (MCU
  `scheme_generation.md`). Any `sys → var(--ref-palette-…)` aliasing must keep the raw-hex
  fallback, which `sysColorVar` in `src/lib/builder.css.ts` already appears to do.

## Not found / unverified

- **No official definition of a variant-independent "core" or "key" palette as a token tier.**
  Searched: M3 design-token, color-system, roles, static, dynamic and advanced pages; Material
  Web tokens and docs; MCU concepts, dev_guide, READMEs and CHANGELOG. `CorePalette` is the only
  candidate, and it is deprecated.
- **No official MTB documentation of what the JSON `palettes` field means.** There is no help
  page or changelog entry for it. The only statements are the GitHub maintainer comments quoted
  above. The MTB source is closed.
- **The exact MTB palette formula is not confirmed from source.** That it matches
  `CorePalette.contentFromColors` is inferred from this repo's conformance tests, not from MTB
  code.
- **The M3 "Key colors & tonal palettes" page** (old URL
  `styles/color/the-color-system/key-colors-tones`, still linked from Material Web docs) was not
  found under the current navigation. Its content now appears to live in "How the system works".
  The old URL was not fetched separately.
- **Where Android's `system_error_*` (API 35) values come from at runtime** was not traced.
  `ThemeOverlayController` on `frameworks/base` main writes no `system_error_*` overlay.
  `ColorScheme.getError()` exists, but its caller was not found in the files fetched.
- **The token modules on the M3 site under a dynamic context** were not checked. Only the
  "Default, Light" baseline module was inspected (`primary` pointing to `primary40`).
- **The Figma M3 Design Kit's internal variable descriptions for ref palettes** could not be
  read without opening the file in Figma.
- **The 2025/2026 spec versions in MCU** (`color_spec_2025.ts`, `color_spec_2026.ts`) were
  skimmed for the error palette only. Whether their palettes also depend on `isDark` was not
  checked. This matters because `toCss()` takes its palettes from `lightScheme` only.

## References

- [M3 Design tokens overview](https://m3.material.io/foundations/design-tokens/overview)
- [M3 How the color system works](https://m3.material.io/styles/color/system/how-the-system-works)
- [M3 Color roles](https://m3.material.io/styles/color/roles)
- [M3 Baseline static scheme](https://m3.material.io/styles/color/static/baseline)
- [M3 Advanced: adjust existing colors (fidelity / match color)](https://m3.material.io/styles/color/advanced/adjust-existing-colors)
- [Material Web `_md-sys-color.scss` v0.192](https://github.com/material-components/material-web/blob/a6b2d2640b336e5d9fc73133a317e9173827ba95/tokens/versions/v0_192/_md-sys-color.scss)
- [Material Web `_md-ref-palette.scss` v0.192](https://github.com/material-components/material-web/blob/a6b2d2640b336e5d9fc73133a317e9173827ba95/tokens/versions/v0_192/_md-ref-palette.scss)
- [Material Web theming README](https://github.com/material-components/material-web/blob/a6b2d2640b336e5d9fc73133a317e9173827ba95/docs/theming/README.md)
- [MCU `core_palette.ts`](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/palettes/core_palette.ts)
- [MCU `theme_utils.ts`](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/utils/theme_utils.ts)
- [MCU `dynamic_scheme.ts`](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/dynamic_scheme.ts)
- [MCU `color_spec_2021.ts`](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/color_spec_2021.ts)
- [MCU `concepts/color_terms.md`](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/concepts/color_terms.md)
- [MCU `concepts/scheme_generation.md`](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/concepts/scheme_generation.md)
- [AOSP Android 14 `ColorScheme.kt`](https://android.googlesource.com/platform/frameworks/base/+/refs/tags/android-14.0.0_r1/packages/SystemUI/monet/src/com/android/systemui/monet/ColorScheme.kt)
- [AOSP main `monet/ColorScheme.java`](https://android.googlesource.com/platform/frameworks/libs/systemui/+/89da99e2435efec403883849efac27a137ae56f3/monet/src/com/android/systemui/monet/ColorScheme.java)
- [Android `R.color` reference](https://developer.android.com/reference/android/R.color)
- [MTB README](https://github.com/material-foundation/material-theme-builder/blob/8e4e50ba4ac5048a804479a6f068c1552175a60f/README.md)
- [MTB issue #240 (maintainer comments)](https://github.com/material-foundation/material-theme-builder/issues/240)
- [MTB issue #308](https://github.com/material-foundation/material-theme-builder/issues/308)
