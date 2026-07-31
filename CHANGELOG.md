# material-theme-builder

## 3.0.0

### Major Changes

- d7ab3f0: **Breaking:** the React bindings moved to `material-theme-builder/react`. The
  package root now holds `builder` alone.

  ### Migration

  Change the import path for `Mcu`, `useMcu` and `ExportButton`:

  ```diff
  - import { Mcu, useMcu, ExportButton } from "material-theme-builder";
  + import { Mcu, useMcu, ExportButton } from "material-theme-builder/react";
  ```

  `builder` is unchanged — it stays on the root:

  ```ts
  import { builder } from "material-theme-builder"; // unchanged
  ```

  Both can be mixed freely; importing from each entry in the same file is fine.
  `material-theme-builder/tailwind.css` and the CLI are untouched. The root also
  now exports the `McuConfig` type, which was previously unreachable.

  ### Why

  2.2.0 made `builder` callable from a server component, but not free. The root
  entry re-exported the React components, and a framework that splits server and
  client graphs registers every export of a `"use client"` module it reaches —
  re-export included, and tree-shaking can't undo it. So this:

  ```tsx
  import { builder } from "material-theme-builder";
  const css = builder("#5de4c7").toCss();
  ```

  still shipped `Mcu` and the color utilities to the browser in a server
  component that never renders `<Mcu>`.

  Measured on a Next `output: "export"` app whose layout does nothing but call
  `builder(...).toCss()` and render it into a `<style>`, same app source on both
  sides, only the package shape differing:

  |       | client chunks (gzip) | chunk files | `tonalSpot` in them | SSR'd CSS    |
  | ----- | -------------------- | ----------- | ------------------- | ------------ |
  | 2.2.0 | 198 715              | 9           | present             | 19 398 chars |
  | 3.0.0 | **166 679**          | 8           | **absent**          | 19 398 chars |

  −32 036 bytes gzip, byte-identical output. The saving exceeds what
  `dist/react.js` weighs on its own (26 184 gzip) because dropping it also
  collapses a whole chunk.

  A subpath for the React-free half would have fixed the bundle while leaving the
  default import the expensive one: you'd have to know about client-reference
  registration to reach for it. Putting the framework-agnostic core at the root
  and the bindings behind `/react` makes the cheap path the default, and matches
  how the ecosystem splits this elsewhere (`motion` / `motion/react`,
  `@floating-ui/dom` / `@floating-ui/react`).

## 2.2.0

### Minor Changes

- 74aec64: `builder` is now callable from a React Server Component.

  `dist/index.js` carried a `"use client"` banner over the whole bundle, so any
  import from the package — `builder` included — was a client module. Calling it
  from a server component threw `Attempted to call builder() from the server but
builder is on the client`, which left generating the CSS at build time to the
  CLI.

  The React surface is built into its own `dist/react.js`, which is where the
  directive lands now; `dist/index.js` re-exports it. Nothing moves in the public
  API: `builder`, `Mcu`, `useMcu` and `ExportButton` are all still imported from
  `material-theme-builder`, and importing `Mcu` into a server component still
  works — it becomes a client reference, as it did before.

- c7394fe: `<Mcu>` renders its `<style>` instead of injecting it from an effect, so the
  colors are in the server-rendered HTML.

  Effects only run in the browser, so on an SSR/SSG page the `<style>` used to
  reach the client empty: every `--md-sys-color-*` was undefined for the first
  paint, and anything reading one painted with no color at all until hydration
  filled it in. Rendering the tag puts the CSS in the HTML the server sends, and
  React updates its content in place when `setMcuConfig` changes the theme.

  The tag now sits where `<Mcu>` is rather than in `document.head` — same `id`,
  same cascade, but worth knowing if you were querying `head` for it.

## 2.1.2

### Patch Changes

- 8ee5992: -builder subcommand

## 2.1.1

### Patch Changes

- fcec239: doc

## 2.1.0

### Minor Changes

- Package renamed from `react-mcu` to `material-theme-builder`
- Default Figma output directory renamed from `mcu-theme` to `material-theme`

## 2.0.0

### Major Changes

- c6c0880: ### BREAKING: CSS custom properties renamed to follow Material Design 3 token architecture

  All generated CSS custom properties have been renamed to align with the official M3 design token naming convention (`sys.color` for semantic tokens, `ref.palette` for tonal palettes).

  #### Scheme tokens (semantic colors)

  | Before             | After                       |
  | ------------------ | --------------------------- |
  | `--mcu-primary`    | `--md-sys-color-primary`    |
  | `--mcu-on-primary` | `--md-sys-color-on-primary` |
  | `--mcu-surface`    | `--md-sys-color-surface`    |
  | `--mcu-{token}`    | `--md-sys-color-{token}`    |

  #### Tonal palette tokens (shades)

  | Before                   | After                               |
  | ------------------------ | ----------------------------------- |
  | `--mcu-primary-40`       | `--md-ref-palette-primary-40`       |
  | `--mcu-secondary-90`     | `--md-ref-palette-secondary-90`     |
  | `--mcu-{palette}-{tone}` | `--md-ref-palette-{palette}-{tone}` |

  #### New `prefix` prop

  The default prefix is `"md"` (Material Design convention). Use the new `prefix` prop to customize it:

  ```tsx
  <Mcu source="#6750A4" prefix="my-app">
  ```

  This produces `--my-app-sys-color-primary`, `--my-app-ref-palette-primary-40`, etc.

  #### Migration

  Find and replace in your CSS/Tailwind:
  1. `--mcu-<palette>-<tone>` → `--md-ref-palette-<palette>-<tone>` (palette shades)
  2. `--mcu-<token>` → `--md-sys-color-<token>` (semantic tokens)

  Or set `prefix="mcu"` and adapt the new `sys-color` / `ref-palette` segments.

  #### Scheme tokens now reference palette tokens via `var()`

  Scheme tokens are no longer raw hex values — they resolve to `var(--md-ref-palette-...)`, enabling a single point of truth for color values.

  #### Tonal palette expanded from 18 to 28 tones

  New tones added: 4, 6, 12, 17, 22, 24, 35, 87, 92, 94, 96. This increases the number of CSS variables generated but does not break existing usage.

  #### Figma tokens (`toFigmaTokens()`) restructured
  - Top-level structure changed from `Schemes` / `Palettes` to `ref.palette.*` / `sys.color.*`
  - System tokens now use DTCG alias syntax `{ref.palette.Primary.40}` instead of direct color values
  - System tokens include `$description` and `css.variable` (kebab-case) extensions

  #### Removed `contrastAllColors` and `adaptiveShades` options

  The `contrastAllColors` and `adaptiveShades` props/options have been removed from the `<Mcu>` component, the `builder()` function, and the CLI.

  These experimental features are no longer needed now that `md.sys.*` tokens properly reference `md.ref.*` palette tokens via `var()`.

  **Migration:** Simply remove any usage of `contrastAllColors` or `adaptiveShades` from your code:

  ```diff
  - <Mcu source="#6750A4" contrastAllColors adaptiveShades>
  + <Mcu source="#6750A4">
  ```

  ```diff
  - builder("#6750A4", { contrastAllColors: true, adaptiveShades: true })
  + builder("#6750A4")
  ```

  ```diff
  - react-mcu builder '#6750A4' --contrast-all-colors --adaptive-shades
  + react-mcu builder '#6750A4'
  ```

## 1.3.2

### Patch Changes

- b41c145: -tsx

## 1.3.1

### Patch Changes

- 648f966: fix bin deps

## 1.3.0

### Minor Changes

- d3e99ec: cli

## 1.2.0

### Minor Changes

- 70156a3: contrastAllColors

## 1.1.1

### Patch Changes

- 9f1fd78: different fixes

## 1.1.0

### Minor Changes

- 05568d5: shades

## 1.0.10

### Patch Changes

- 19b5825: Add 'use client' directive for React Server Components compatibility

## 1.0.9

### Patch Changes

- 834cc2a: doc

## 1.0.8

### Patch Changes

- 5d50023: doc

## 1.0.7

### Patch Changes

- 3274bf6: core colors impl

## 1.0.6

### Patch Changes

- 7f27aca: tw fix

## 1.0.5

### Patch Changes

- eab6a2c: defaults
- 27d5e6f: fix custom-colors impl

## 1.0.4

### Patch Changes

- 5941837: Export useMcu hook from package and add Tailwind CSS v4 integration file
- c413069: tw x sb

## 1.0.3

### Patch Changes

- 4bf1958: bump

## 1.0.2

### Patch Changes

- ddcf28f: impl

## 1.0.1

### Patch Changes

- fab7ea5: Update Mcu component output from "Hello World" to "hello react-mcu"
