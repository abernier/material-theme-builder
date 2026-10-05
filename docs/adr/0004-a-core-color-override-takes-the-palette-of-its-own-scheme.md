---
status: accepted
---

# A core-color override takes the palette of its own scheme

With core-color overrides (`secondary`, `tertiary`, `error`, `neutral`,
`neutralVariant`) and a non-default `scheme`, `toJson().schemes` and the
`--md-sys-color-*` variables of `toCss()` disagreed. On the inputs of the
`try-02.json` fixture (all six core colors overridden), in the light scheme:

| `scheme`                                | Roles that differ |
| --------------------------------------- | ----------------- |
| expressive                              | 42                |
| fidelity                                | 22                |
| content                                 | 22                |
| tonalSpot, monochrome, neutral, vibrant | 0                 |

The override logic existed twice:

- `builder()`, which feeds `toCss()` and the other exporters, gave an override
  (`primary` included) its own hue at the chroma of the scheme built from the
  source: `TonalPalette.fromHueAndChroma(overrideHue, baseScheme.primaryPalette.chroma)`,
  with the chroma of `neutralPalette` and `neutralVariantPalette` for the two
  neutrals.
- `toJson()` took the palette of the scheme built from the override itself:
  the `primaryPalette` of `new SchemeClass(Hct(override))` for `secondary`,
  `tertiary` and `error`, its `neutralPalette` and `neutralVariantPalette` for
  the neutrals. `primary` was the base scheme's.

The two coincide only where the variant keeps the hue of its input and gives
the palette a fixed chroma. Expressive rotates the hue; fidelity and content
take the chroma from the input
([`dynamic_scheme.ts` L636-L663](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/dynamic_scheme.ts#L636-L663)).
The disagreement contradicts
[ADR 0001](./0001-reference-palettes-are-the-scheme-palettes.md) (`toJson()`
and `toCss()` must not disagree) and the rule of
[ADR 0002](./0002-json-background-follows-the-rendered-scheme.md) (every role
comes from the rendered scheme).

We decided that both outputs read one shared scheme construction, built with
the per-color rule `toJson()` had:

- the base is the variant's scheme of `primary` when given, of `source`
  otherwise. `primary` stands in for the source, it is not a palette override:
  `primary: X` renders like `source: X`;
- an overridden `secondary`, `tertiary` or `error` takes the primary palette of
  the variant's scheme of its own color;
- an overridden `neutral` or `neutralVariant` takes the palette of that name
  from the variant's scheme of its own color.

## Why

- Neither the M3 spec nor Material Color Utilities (MCU) defines a core-color
  override: a `DynamicScheme` accepts palettes and says nothing on deriving one
  from a color. The official Material Theme Builder (MTB) is the only official
  implementation; it is closed source and has two modes only. With Color match
  off it renders tonal spot, where both rules give the same result (the
  `try-0N.json` fixtures pass either way). With Color match on it renders the
  content variant: the only official evidence where the rules differ.
- Measured against MTB's Color match exports
  (`src/fixtures/material-theme-builder/try-0N.colormatch.json`) with
  `scheme: "content"`, the per-color rule is the closer one. Number of roles
  off, out of the 47 per scheme other than `background` and `onBackground`,
  light / dark:

  |        | Per-color rule | Source-chroma rule |
  | ------ | -------------- | ------------------ |
  | try-02 | 9 / 7          | 23 / 27            |
  | try-03 | 3 / 2          | 7 / 8              |
  | try-05 | 5 / 5          | 11 / 13            |

  What remains off is confined to the families of the overridden accents (the
  accent role and its containers). Reproducing those exactly is the job of the
  `colorMatch` option, not of this decision.

- Fidelity and content take their chroma from the input color. The per-color
  rule keeps each override's own chroma; the source-chroma rule replaced it
  with the chroma of `primary` (49 on try-02). try-02, light, fidelity and
  content:

  | Override              | Role before (source chroma) | Role now (own chroma) |
  | --------------------- | --------------------------- | --------------------- |
  | `secondary` `#B03A3A` | `#9D403E` (chroma 49)       | `#A93535` (chroma 62) |
  | `tertiary` `#2138D2`  | `#4B57AB` (chroma 49)       | `#364BE1` (chroma 72) |
  | `error` `#479200`     | `#3B6A19`                   | `#336B00`             |

- It is one rule, easy to state: an override is treated the way the variant
  treats a source color.

## Consequences

- `toJson().schemes` does not change. `toCss()`, the reference palettes
  (`--md-ref-palette-*` and `toJson().palettes`) and every other exporter change
  for expressive, fidelity and content when a core color is overridden.
  tonalSpot (the default), monochrome, neutral and vibrant do not change;
  neither does any output without overrides, except `primary` under expressive
  (next point). The MTB fixture tests still pass.
- Expressive rotates hues, overrides included. MCU's expressive variant rotates
  the source hue: +240 degrees for the primary palette, +15 for the neutral and
  neutral-variant ones
  ([`dynamic_scheme.ts` L655-L657](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/dynamic_scheme.ts#L655-L657),
  [L759-L761](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/dynamic_scheme.ts#L759-L761),
  [L789-L791](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/typescript/dynamiccolor/dynamic_scheme.ts#L789-L791)).
  An override gets the same treatment. try-02, light, expressive:

  | Input                  | `toCss()` role before | Role now            |
  | ---------------------- | --------------------- | ------------------- |
  | `secondary: "#B03A3A"` | `#944744` (hue 22)    | `#385F97` (hue 261) |
  | `primary: "#CAB337"`   | `#6D5E00` (hue 100)   | `#864978` (hue 339) |

  `#864978` is what `source: "#CAB337"` alone always rendered. No official
  reference exists for this variant with overrides: this is the rule applied
  uniformly, not something MTB or MCU prescribes. An alternative that keeps the
  override's hue under expressive was considered and rejected for the sake of a
  single rule.

- Custom colors are unaffected: their palette is still their hue at the chroma
  of the base scheme's primary palette.
- A test compares `toJson().schemes` with the roles of `toCss()` for every
  scheme in `schemeNames`, with overrides, at the six light/dark and contrast
  levels (`src/lib/builder.json.test.ts`).
