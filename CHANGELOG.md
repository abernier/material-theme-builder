# material-theme-builder

## 3.3.0

### Minor Changes

- 5f143da: Two subcommands, so that theming a shadcn project is one command rather than
  three:

  ```sh
  $ npx material-theme-builder shadcn-init "#6750A4"   # a new project
  $ npx material-theme-builder shadcn-apply "#6750A4"  # a project you already have
  ```

  `shadcn-init` scaffolds a stock shadcn app, themes it and hands over to its dev server —
  from nothing to something running, with nothing installed first and nothing to
  read beforehand. `shadcn-apply` does the theming half inside a project of your own, and
  replaces what the README used to spell out by hand:

  ```sh
  $ npx material-theme-builder "#6750A4" --format registry-item > mtb.json
  $ npx shadcn@latest add ./mtb.json && rm mtb.json
  ```

  Same mechanism, same result — the registry item is generated for your source
  color with the `var()` fallbacks baked in, and `shadcn add` rewrites the values
  inside your existing `:root` and `.dark` blocks in place — minus the temporary
  file you had to remember to delete. `--format registry-item` is unchanged and
  stays the way to pipe it somewhere else.

  The verbs are shadcn's own: there, `init` is the new project and `apply` the
  existing one, and https://ui.shadcn.com/create offers exactly that pair of
  buttons — so anyone arriving from that page already knows which of these to reach
  for. They are prefixed because shadcn is one integration here among Figma, CSS,
  Tailwind and Flutter: a bare `init` would read as "initialize
  material-theme-builder" rather than "initialize a shadcn project", and it would
  spend the shared verb space on one integration, leaving nowhere sensible for a
  `tailwind-init` later.

  Our `shadcn-apply` does not call `shadcn apply`, though — that command installs
  shadcn _presets_, a different artifact with its own schema, where what we
  generate is a `registry:theme` item that `shadcn add` installs. Borrowed verb,
  unchanged mechanism.

  Both take the theme options as well — `--scheme`, `--contrast`, the core-color
  overrides, `--prefix`, `--no-fallback` — with the same names and defaults they
  have on the root command:

  ```sh
  $ npx material-theme-builder shadcn-apply "#6750A4" --scheme vibrant --contrast 0.5
  ```

  Without them these two commands could only ever install the default theme, which
  is the limitation that motivated generating a registry item in the first place:
  the item this package _publishes_ is impersonal precisely because it cannot be
  asked for a scheme. (`--custom-colors` is not among them, and not by omission —
  shadcn's variable set is fixed, so no component reads a custom color and a
  registry item cannot carry one.)

  Anything after a `--` is forwarded verbatim — to `shadcn init` for `shadcn-init`,
  to `shadcn add` for `shadcn-apply` — and the defaults are merged in flag by flag,
  in either spelling, so yours replace ours instead of duplicating them:

  ```sh
  $ npx material-theme-builder shadcn-init "#6750A4" -- --template next -n my-app
  ```

  Ours belong before the separator, and one written after it is refused by name
  rather than forwarded: `-- --scheme vibrant` gets told where `--scheme` goes,
  instead of coming back three seconds later as an unknown-option error from a
  shadcn command that has never heard of it.

  The one default worth knowing about is `--preset b0`: without a preset, `shadcn
init` stops to ask which component library you want, which would hang a
  one-liner. `b0` is Base UI, style nova, neutral, lucide and Inter — the bundle
  this repo dogfoods. None of it reaches the mapping, which only ever rewrites the
  31 standard color variables every preset writes.

  `--shadcn-cli <spec>` says which shadcn to run, defaulting to `shadcn@latest`:

  ```sh
  $ npx material-theme-builder shadcn-apply "#6750A4" --shadcn-cli shadcn@4.18.0
  ```

  Any spec `npx` resolves — a version, a tag, a fork, a tarball — and `shadcn-init` pins
  both of its shadcn steps with it, a chain pinned for the scaffold and floating for
  the install being worse than one that floats throughout. It is an escape hatch for
  the neighbouring versions rather than a time machine, though, and honestly so:
  `--preset b0` is itself 4.x vocabulary, so pinning far enough back means passing
  that era's preset after the `--` as well.

  The `-cli` is not decoration: `--shadcn` is taken, by the root command's boolean
  that appends the alias block to `--format tailwind`. Nothing would actually
  mis-parse — each command matches only the options it declares — but one word
  meaning a boolean here and a package spec there is a trap for whoever reads
  `--help` twice, and of the two it is the unreleased one that can give way.

  `--print` writes the equivalent shell chain to stdout and runs nothing — for the
  docs, for debugging, and for anyone who would rather read what a command is about
  to do, or paste it themselves, than let it spawn `npx` on their machine.

- 5f143da: Ship the shadcn mapping as a registry item, so it installs the way every other
  shadcn theme does — generated for your source color:

  ```sh
  $ npx material-theme-builder "#6750A4" --format registry-item > mtb.json
  $ npx shadcn@latest add ./mtb.json && rm mtb.json
  ```

  The CLI rewrites the values inside your existing `:root` and `.dark` blocks, in
  place. That removes the one thing `material-theme-builder/shadcn.css` asked you
  to get right: the stylesheet has to be imported _after_ shadcn's own blocks to
  win the cascade, and the natural place for an `@import` is at the top of the file
  with the others — which is exactly where it silently loses.

  Values keep pointing at the M3 custom properties, so this is not `toShadcn()`
  under another name: the colors still follow whichever `<Mtb>` is above them at
  runtime. But the CLI knows your source color, so it also writes that theme's own
  colors in as the `var()` fallbacks — which means the same install renders
  correctly server-side with no client JS at all, and only gets _more_ correct
  under an `<Mtb>`. `--no-fallback` opts out.

  A colorless item is published as well, for `shadcn add` straight off a URL:

  ```sh
  $ npx shadcn@latest add https://unpkg.com/material-theme-builder/registry-item.json
  ```

  That one is the mapping and nothing else — the same 31 `var()` references
  whatever the theme, since the colors arrive from `<Mtb>` at runtime. Which is
  also its requirement: with no `<Mtb>` and no fallbacks, nothing resolves.

  The stylesheet is unchanged and stays supported, for setups that would rather
  keep the mapping in one line they can delete. All three are generated off one
  mapping, so they cannot drift.

  New API: `builder(...).toShadcnRegistryItem({ fallback })`, the
  `ShadcnRegistryItem` and `ShadcnRegistryItemOptions` types, a
  `material-theme-builder/registry-item.json` export, and `--format registry-item`
  / `--no-fallback` on the CLI.

- 5f143da: Add a Tailwind v4 plugin at `material-theme-builder/tailwind`, so custom colors
  no longer have to be written out by hand:

  ```css
  @import "material-theme-builder/tailwind.css";
  @plugin "material-theme-builder/tailwind" {
    custom-colors: myCustomColor1, myCustomColor2;
  }
  ```

  Each name listed brings its four scheme roles (`myCustomColor1`,
  `on-myCustomColor1`, `myCustomColor1-container`, `on-myCustomColor1-container`)
  and its eleven shades. A `prefix` option mirrors `builder({ prefix })`. The
  plugin can carry the standard tokens too, on its own, for a setup that would
  rather not import CSS at all.

  The two halves split along what a shipped file can know: the stylesheet carries
  the standard tokens, the plugin carries the custom colors, which depend on your
  config. It also keeps the stylesheet in charge of the three names shadcn's
  `@theme inline` also claims (`background`, `primary`, `secondary`) — a plugin's
  theme values are defaults and would lose them.

  `tailwind.css` is now generated from `toTailwind()` rather than maintained
  alongside it, which is what let `--color-surface-tint` and
  `--color-surface-variant` go missing from one and not the other. It is build
  output now, so `src/tailwind.css` is no longer committed nor published —
  `material-theme-builder/tailwind.css` resolves as before.

  The same treatment turns the shadcn remapping — until now 31 lines to copy out
  of the README — into a stylesheet you can import:

  ```css
  @import "./shadcn.css"; /* shadcn's own `:root` and `.dark` */
  @import "material-theme-builder/shadcn.css";
  ```

  It points shadcn's variables at the M3 custom properties `<Mtb>` emits, so
  shadcn components follow the theme above them in the tree. Generated from a new
  `toShadcnAliases()`, off the same mapping `toShadcn()` and
  `toTailwind({ shadcn: true })` read, so no two of them can drift.

  **The generated file no longer carries the `myCustomColor1` / `myCustomColor2`
  example block.** Those names only ever resolved against custom colors you had
  declared under exactly those names; if you did, list them in `@plugin` instead.

### Patch Changes

- 5f143da: Fix: a source color that is not a color no longer produces a theme.

  Material Color Utilities validates hex by length alone — it strips a leading `#`,
  accepts 3, 6 or 8 characters, then runs `parseInt` on each pair, where a pair that
  is not hex yields `NaN` and lands as zero. So `banana` was accepted, and themed
  as `#ba0000`:

  ```sh
  $ material-theme-builder banana --format shadcn     # primary oklch(0.495 0.095 30.297)
  $ material-theme-builder ba0000 --format shadcn     # primary oklch(0.495 0.095 30.297)
  ```

  Identical, to the value. `bananas` was rejected only for being seven characters
  long, and by a `throw` from inside `node_modules` that reached the terminal as a
  stack trace.

  `builder()` now checks every hex it takes — `source`, the six core-color
  overrides, and each `customColors[].hex` — against the characters as well as the
  length, at its entry, before anything is converted. The message names the input:
  `source` and `customColors[2].hex` are very different things to be told about.
  `<Mtb source="banana">` is covered by the same fix, being the same call.

  The CLI states the rule a second time, as commander's parser for `<source>` and
  the core-color flags, and as a refinement on the `--custom-colors` schema. Not a
  redundant check but a second presentation: the library has to refuse garbage on
  its own account, for programmatic callers and for `<Mtb>`, while someone at a
  terminal should be told about a typo in one line rather than in a stack trace.

  ```
  $ material-theme-builder banana
  error: command-argument value 'banana' is invalid for argument 'source'. Expected a hex color — 3, 6 or 8 hex digits, with or without '#' (e.g. #6750A4).
  ```

  This does reject input that previously "worked", which is why it is worth stating
  plainly rather than leaving to be discovered: `banana`, `zzz`, and every other 3,
  6 or 8 character string that is not hex used to render. They rendered a color
  nobody chose — the argument for the change, not an omission from it. Everything
  Material Color Utilities reads as the color it spells is still accepted, `#`
  optional, 3, 6 and 8 digits, any case.

- fcae90f: Add the missing `--color-surface-tint` and `--color-surface-variant` theme
  variables to `tailwind.css` (and the README block), so `bg-surface-tint` /
  `bg-surface-variant` work like the rest of the roles emitted by `toTailwind()`.

## 3.2.0

### Minor Changes

- 7307139: Finish the `Mcu` → `Mtb` rename in the value `useMtb()` returns: `mcuConfig`,
  `setMcuConfig` and `getMcuColor` are now `mtbConfig`, `setMtbConfig` and
  `getMtbColor`.

  The `mcu*` keys stay on the context value as deprecated aliases holding the very
  same references as their `mtb*` counterparts, so existing destructuring keeps
  working until the next major.

  ```diff
  - const { setMcuConfig, getMcuColor } = useMtb();
  + const { setMtbConfig, getMtbColor } = useMtb();
  ```

  The `id` of the injected `<style>` tag stays `mcu-styles`, since user CSS and
  scripts may target it.

## 3.1.0

### Minor Changes

- 571fda2: Rename the `Mcu` React surface to `Mtb`: the `Mcu` component is now `Mtb`, the `useMcu` hook is now `useMtb`, and the `McuConfig` type is now `MtbConfig`. The old names still work as deprecated aliases (same component, same hook, same shape) and will be removed in the next major.
- e061253: Add a `toShadcn()` exporter emitting concrete per-mode `oklch()` values.

  `builder(source, options).toShadcn()` returns `{ light, dark }`, each a flat
  record of bare shadcn variable names (`primary`, `chart-1`, …) to concrete
  colors — the exact shape a shadcn registry item's `cssVars` field expects, so
  the result can be served as a `registry:theme` or `registry:base` item and
  installed with the standard `shadcn` CLI.

  Unlike `toTailwind({ shadcn: true })`, which emits `var()` aliases requiring the
  M3 variables to already be on the page, the output stands alone. Both now share
  a single mapping table, so neither can name a variable the other doesn't.

  Values come from the same merged colors `toCss()` emits, so every option —
  `contrast` included, across its full `-1.0`…`1.0` range — lands identically in
  both exporters.

  Available from the CLI as `--format shadcn`. The existing `--shadcn` flag is
  unchanged, but now errors instead of being silently ignored when combined with
  a format other than `tailwind`.

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
