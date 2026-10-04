---
"material-theme-builder": minor
---

`toJson().palettes` now holds the palettes the system colors are drawn from — the
same palettes, tones and values as the `--md-ref-palette-*` of `toCss()` (#175).

The values change for the same input. `palettes` used to reproduce Material Theme
Builder's JSON export, whose palettes ignore the scheme variant and are not the
ones its own `schemes` come from, so `palettes.primary["40"]` could differ from
`schemes.light.primary` and from `--md-ref-palette-primary-40`. They are now the
rendered `DynamicScheme` palettes, so they follow the scheme variant. `palettes`
also gains the `error` palette, the custom-color palettes, and the in-between
tones `toCss()` already emitted (4, 6, 12, 17, 22, 24, 87, 92, 94, 96): 28 tones
per palette instead of 18.

The previous palettes, value for value with Material Theme Builder's export, are
one option away:

```ts
builder("#6750A4").toJson({ palettes: "mtb" });
```

`schemes`, `coreColors` and `extendedColors` are unchanged.
