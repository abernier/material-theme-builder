[![npm version](https://img.shields.io/npm/v/material-theme-builder.svg)](https://www.npmjs.com/package/material-theme-builder)
[![](https://img.shields.io/badge/chromatic-171c23.svg?logo=chromatic)](https://www.chromatic.com/library?appId=695eb517cb602e59b4cc045c&branch=main)
[![](https://img.shields.io/badge/storybook-171c23.svg?logo=storybook)](https://main--695eb517cb602e59b4cc045c.chromatic.com)

Outputs [m3 colors](https://m3.material.io/styles/color/system/overview) `--md-sys-color-*` and `--md-ref-palette-*`, 1:1 with [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/), either:

- [programmatically](#programmatic-api)
- from [CLI](#cli)
- using [React](#react)

https://github.com/user-attachments/assets/5b67c961-d7a4-4b64-9356-4ada26bc9be4

Support for:

- [x] light/dark mode
- [x] source color
- [x] scheme
- [x] contrast
- [x] core-colors overrides: primary, secondary, tertiary, error, neutral,
      neutralVariant
- [x] custom-colors (aka. "Extended colors")
  - [x] Harmonization (aka. `blend`) -- with effective color: `source` or
        `primary` if defined
- [x] Shades (aka. "tonals")
- [ ] colorMatch

# Usage

## Programmatic API

```ts
import { builder } from "material-theme-builder";

const theme = builder("#6750A4", {
  scheme: "vibrant",
  contrast: 0.5,
  primary: "#FF0000",
  secondary: "#00FF00",
  customColors: [
    { name: "brand", hex: "#FF5733", blend: true },
    { name: "success", hex: "#28A745", blend: false },
  ],
});

theme.toFigmaTokens();
theme.toJson();
theme.toCss();
theme.toTailwind();
theme.toFlutter();
theme.toShadcn();
theme.toShadcnAliases();
theme.toShadcnRegistryItem({ fallback: true });
```

## CLI

```sh
$ npx material-theme-builder "#6750A4"
```

will generate a `material-theme` folder with: `Light.tokens.json` and `Dark.tokens.json` [design-tokens](https://www.designtokens.org/tr/2025.10/) files, you can (both) import into Figma.

See `npx material-theme-builder --help` for all available options.

## React

The React bindings live on their own entry point, `material-theme-builder/react`.

CSS variables are injected into the page:

```tsx
import { Mtb } from "material-theme-builder/react";

<Mtb
  source="#0e1216"
  scheme="vibrant"
  contrast={0.5}
  customColors={[
    { name: "myCustomColor1", hex: "#6C8A0C", blend: true },
    { name: "myCustomColor2", hex: "#E126C6", blend: true },
    { name: "myCustomColor3", hex: "#E126C6", blend: false },
  ]}
>
  <p style={{
    backgroundColor: "var(--md-sys-color-surface)",
    color: "var(--md-sys-color-on-surface)",
  }}>
    Hello, m3 <span style={{
      backgroundColor: "var(--md-sys-color-my-custom-color-1)",
      color: "var(--md-sys-color-on-my-custom-color-1)",
    }}>colors<span>!
  </p>
</Mtb>
```

> [!TIP]
>
> Typically wrapping `{children}` in a
> [layout](https://nextjs.org/docs/app/getting-started/layouts-and-pages#creating-a-layout).
>
> `<Mtb>` renders its `<style>`, so it works both server- and client-side.
> Client-side is what you want when the theme has to be interactive through
> `setMtbConfig`.

> [!NOTE]
>
> For a theme that is not interactive / never changes at runtime, skip the
> component entirely: the root entry holds `builder` alone, so a Server
> Component can call it and emit `toCss()` into the document itself — no client
> JS, and no `useMtb`.
>
> ```tsx
> import { builder } from "material-theme-builder";
>
> const css = builder("#0e1216", { scheme: "vibrant" }).toCss();
>
> export default function RootLayout({
>   children,
> }: {
>   children: React.ReactNode;
> }) {
>   return (
>     <html lang="en">
>       <head>
>         <style dangerouslySetInnerHTML={{ __html: css }} />
>       </head>
>       <body>{children}</body>
>     </html>
>   );
> }
> ```

> [!NOTE]
>
> CSS varnames are always kebab-cased, e.g. `myCustomColor1` →
> `--md-sys-color-my-custom-color-1` / `--md-ref-palette-my-custom-color-1-<tone>`

## `useMtb`

A hook is also provided:

```tsx
import { useMtb } from "material-theme-builder/react";

const { initials, setMtbConfig, getMtbColor } = useMtb();

return (
  <button onClick={() => setMtbConfig({ ...initials, source: "#FF5722" })}>
    Change to {getMtbColor("primary", "light")}
  </button>
);
```

## Tailwind

Compatible through [theme variables](https://tailwindcss.com/docs/theme) — a
stylesheet for the standard tokens, and a plugin for the custom colors:

```css
@import "tailwindcss";

@import "material-theme-builder/tailwind.css";
@plugin "material-theme-builder/tailwind" {
  custom-colors: myCustomColor1, myCustomColor2;
}
```

Drop the `@plugin` line if you have no custom colors.

<details>
  Each name listed brings its four scheme roles and eleven shades — `bg-myCustomColor1`,
`text-on-myCustomColor1`, `bg-myCustomColor1-container`,
`bg-myCustomColor1-300`.

`prefix` mirrors `builder({ prefix })`:

```css
@plugin "material-theme-builder/tailwind" {
  prefix: my;
  custom-colors: myCustomColor1;
}
```

</details>

> [!TIP]
>
> Colors are declared as
> [inlined theme values](https://tailwindcss.com/docs/theme#referencing-other-variables):
> `bg-primary` compiles to `background-color: var(--md-sys-color-primary)`, with
> no `--color-primary` in between. That one would sit on `:root`, out of reach
> of a nested `<Mtb>`.

<details>
<summary>The theme variables the stylesheet declares</summary>

Generated from [`toTailwind()`](#programmatic-api), so the two cannot drift:

```css
@theme inline {
  --color-background: var(--md-sys-color-background);
  --color-error: var(--md-sys-color-error);
  --color-error-container: var(--md-sys-color-error-container);
  --color-inverse-on-surface: var(--md-sys-color-inverse-on-surface);
  --color-inverse-primary: var(--md-sys-color-inverse-primary);
  --color-inverse-surface: var(--md-sys-color-inverse-surface);
  --color-on-background: var(--md-sys-color-on-background);
  --color-on-error: var(--md-sys-color-on-error);
  /* ... */
}
```

115 names in all — every M3 scheme token, plus eleven Tailwind shades for each
of `primary`, `secondary`, `tertiary`, `error`, `neutral` and
`neutral-variant`.

</details>

## shadcn

Pre-requisites:

- You should use
  [`tailwind.cssVariables`](https://ui.shadcn.com/docs/theming#css-variables)

One import at the end of your
[`globals.css`](https://ui.shadcn.com/docs/installation/manual#configure-styles):

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  ...
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  ...
}

.dark {
  --background: oklch(0.145 0 0);
  ...
}

@layer base {
  ...
}

/**
 * 👇🏻 ADD THIS 👇🏻
 */

@import "material-theme-builder/shadcn.css";
```

> [!IMPORTANT]
>
> It must come after `:root` and `.dark`, because it overrides them. Moved up
> with the other imports, shadcn's own colors win instead — no error, no
> warning.
>
> An `@import` after CSS rules is unusual, yes. Tailwind resolves it where it is
> written, so it works.

That points
[shadcn's variables](https://ui.shadcn.com/docs/theming#list-of-variables) at
the M3 custom properties, so every shadcn component follows whichever `<Mtb>` is
above it in the tree. It carries no colors of its own — mount an `<Mtb>`, or
emit [`toCss()`](#programmatic-api) server-side, or nothing resolves.

For the opposite trade — concrete `oklch()` values and no `var()` at all, frozen
at build time — see [`toShadcn()`](#programmatic-api).

<details>
<summary>The variables it remaps</summary>

Both halves are generated from [`toShadcnAliases()`](#programmatic-api) and
[`toShadcnRegistryItem()`](#programmatic-api), off one mapping, so they cannot
drift:

```css
:root,
.dark {
  --background: var(--md-sys-color-surface);
  --foreground: var(--md-sys-color-on-surface);
  --card: var(--md-sys-color-surface-container-low);
  --card-foreground: var(--md-sys-color-on-surface);
  --popover: var(--md-sys-color-surface-container-high);
  --popover-foreground: var(--md-sys-color-on-surface);
  --primary: var(--md-sys-color-primary);
  --primary-foreground: var(--md-sys-color-on-primary);
  --secondary: var(--md-sys-color-secondary-container);
  --secondary-foreground: var(--md-sys-color-on-secondary-container);
  --muted: var(--md-sys-color-surface-container-highest);
  --muted-foreground: var(--md-sys-color-on-surface-variant);
  --accent: var(--md-sys-color-secondary-container);
  --accent-foreground: var(--md-sys-color-on-secondary-container);
  --destructive: var(--md-sys-color-error);
  --border: var(--md-sys-color-outline-variant);
  --input: var(--md-sys-color-outline);
  --ring: var(--md-sys-color-primary);
  --chart-1: var(--md-sys-color-primary-fixed);
  --chart-2: var(--md-sys-color-secondary-fixed);
  --chart-3: var(--md-sys-color-tertiary-fixed);
  --chart-4: var(--md-sys-color-primary-fixed-dim);
  --chart-5: var(--md-sys-color-secondary-fixed-dim);
  --sidebar: var(--md-sys-color-surface-container-low);
  --sidebar-foreground: var(--md-sys-color-on-surface);
  --sidebar-primary: var(--md-sys-color-primary);
  --sidebar-primary-foreground: var(--md-sys-color-on-primary);
  --sidebar-accent: var(--md-sys-color-secondary-container);
  --sidebar-accent-foreground: var(--md-sys-color-on-secondary-container);
  --sidebar-border: var(--md-sys-color-outline-variant);
  --sidebar-ring: var(--md-sys-color-primary);
}
```

</details>

### `shadcn-apply`

The alternative, for colors to fall back on and no import to place. One command,
from inside your project:

```sh
$ npx material-theme-builder shadcn-apply "#6750A4"
```

From nothing at all, scaffold with shadcn's own CLI first — what this repo
dogfoods:

```sh
$ npx shadcn@latest init --preset b0 --name material-theme-app
$ cd material-theme-app && npx material-theme-builder shadcn-apply "#6750A4"
```

It generates a registry item for your source color and hands it to `shadcn add`,
which rewrites the values inside your existing `:root` and `.dark` blocks, in
place. Same mapping as the stylesheet, with that theme's own colors left in as
the `var()` fallbacks:

```css
:root {
  --card: var(--md-sys-color-surface-container-low, oklch(0.968 0.012 317.742));
}

.dark {
  --card: var(--md-sys-color-surface-container-low, oklch(0.227 0.01 303.714));
}
```

So it works with no `<Mtb>` at all — the fallbacks render the theme statically,
server-rendered, zero client JS. Your old values are overwritten, not kept
anywhere: `git diff` is the undo.

Both steps by hand, if you would rather:

```sh
$ npx material-theme-builder "#6750A4" --format registry-item > mtb.json
$ npx shadcn@latest add ./mtb.json && rm mtb.json
```

`shadcn-apply` takes every theme option `material-theme-builder` itself takes,
and they all land in those fallbacks:

```sh
$ npx material-theme-builder shadcn-apply "#6750A4" --scheme vibrant --contrast 0.5
```

<details>
<summary>The rest of the options</summary>

`--no-fallback` leaves the fallbacks out, on both — so shadcn's own colors are
dropped rather than kept in reserve. Nothing then declares those variables
except an `<Mtb>` or a [`toCss()`](#programmatic-api): without one, they resolve
to nothing and the components render transparent.

`--custom-colors` is the one option missing: shadcn's variable set is fixed, so
a registry item cannot carry one.

Anything after a `--` is forwarded verbatim to `shadcn add`. Our options go
before it:

```sh
$ npx material-theme-builder shadcn-apply "#6750A4" -- --overwrite --dry-run
```

> [!NOTE]
>
> shadcn's CLI also appends a self-referential `--card: var(--card);` per
> variable to your `@theme inline` block. Noise, not a bug: they land _above_
> your `:root`, so the real values win. Delete them if they bother you.

</details>

<details>
<summary>Install the mapping alone, without generating anything</summary>

The package publishes a registry item too, so `shadcn add` has something to
fetch without a build step:

```sh
$ npx shadcn@latest add https://unpkg.com/material-theme-builder/registry-item.json
```

It is the stylesheet's content, installed the registry way: the mapping and
nothing else, no colors to fall back on. Generate your own, as above, to have
some.

</details>

<details>
  <summary>mapping details</summary>
  see:
  
    - https://chatgpt.com/share/6899f20a-422c-8011-a072-62fb649589a0
    - https://gemini.google.com/share/51e072b6f1d2
</details>

# Dev

## INSTALL

Pre-requisites:

- Install [nvm](https://github.com/nvm-sh/nvm), then:
  ```sh
  $ nvm install
  $ nvm use
  $ node -v # make sure your version satisfies package.json#engines.node
  ```
  nb: if you want this node version to be your default nvm's one:
  `nvm alias default node`
- Install pnpm, with:
  ```sh
  $ corepack enable
  $ corepack prepare --activate # it reads "packageManager"
  $ pnpm -v # make sure your version satisfies package.json#engines.pnpm
  ```

```sh
$ pnpm i
```

## Figma plugin

1. `pnpm run build-figma`
2. In Figma: Plugins → Development → Import plugin from manifest…
3. Select `figma-plugin/manifest.json`

## Validation

```sh
$ pnpm run lgtm
```

## CONTRIBUTING

```bash
pnpm run storybook # the day-to-day loop -- no build needed, the stylesheets regenerate as you edit
pnpm run build     # dist/, plus the generated stylesheets -- both gitignored
pnpm run lgtm      # everything CI checks
```

`tailwind.css`, `shadcn.css` and `registry-item.json` are generated — from
`toTailwind()`, `toShadcnAliases()` and `toShadcnRegistryItem()` — and
gitignored. `pnpm run build` writes them (`scripts/generate.mjs`); the two
stylesheets also get a `src/` copy, which is what Storybook `@import`s, and in
Storybook a Vite plugin (`.storybook/main.ts`) rewrites those at server start
and again on every edit under `src/lib/`, so the stories never show a stale
vocabulary.

`generate.mjs` builds the registry item without `{ fallback: true }`, which is
what keeps every one of those outputs a function of the _mapping_ rather than of
a color: `SOURCE` there is arbitrary, and has to stay able to be. The fallback
variant belongs to whoever knows a real source color — the CLI's
`--format registry-item`.

`src/styles/shadcn.css` is the other half of that arrangement, and is _not_
generated from anything here: it is pristine `shadcn init --preset b0` output,
committed verbatim — regenerate it with the recipe in its own header. Same for
the components, via `pnpm dlx shadcn@latest add <item> --overwrite`. All of it
is exempt from Prettier and from the repo's own lint conventions, so that a
regeneration diffs to nothing; see `.prettierignore` and `SHADCN_FILES` in
`eslint.config.mjs` for which paths `components.json` makes shadcn's territory.

The `Shadcn/dashboard-01` story is what checks the shadcn mapping end to end: it
renders one of [shadcn's blocks](https://ui.shadcn.com/blocks), unmodified,
under `<Mtb>`. Every other story paints from the M3 vocabulary directly, so none
of them would notice `shadcn.css` pointing a variable at the wrong role.

When submitting a pull request, please include a changeset to document your
changes:

```bash
pnpm exec changeset
```

This helps us maintain the changelog and version the package appropriately.

# Outro

m3 references:

| builder                                                                                                                                                                                                                             | roles                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [<img width="2836" height="2266" alt="CleanShot 2026-01-14 at 08 58 40@2x" src="https://github.com/user-attachments/assets/e4b47c00-716f-4b08-b393-de306d5ce302" />](https://material-foundation.github.io/material-theme-builder/) | [<img width="2836" height="2266" alt="CleanShot 2026-01-14 at 09 01 23@2x" src="https://github.com/user-attachments/assets/826e502d-e173-43c4-807a-53d0ba075a88" />](https://m3.material.io/styles/color/roles) |

The spec itself, deep-linked to the sections that matter. `m3.material.io` is a
client-rendered SPA, so `#:~:text=` fragments get stripped on load — only these
section anchors work:

- [Color roles](https://m3.material.io/styles/color/roles) — the inventory:
  _"26 standard color roles organized into six groups"_, which is what
  `tokenDescriptions` is checked against
- [Color roles § Surface](https://m3.material.io/styles/color/roles#89f972b1-e372-494c-aabc-69aea34ed591)
  — _"three surface roles: Surface / On surface / On surface variant"_. No
  `surface variant`: the ink outlived its own background, hence the asymmetry
- [Color roles § Add-on color roles](https://m3.material.io/styles/color/roles#a5f6ea3d-d457-4c5d-94f4-55f3cdf6470b)
  — fixed accents and surface dim/bright are add-ons, and _"most products won't
  need to use these"_
- [Color system § What's new](https://m3.material.io/styles/color/system/overview#ca18ba03-a1ec-4bbb-a531-ae5396d3ee4a)
  — the changelog. Feb 2023 is when tone-based surfaces replaced the +1…+5
  elevation model

The Material Design blog is where the reasoning behind the color system lives —
and where changes to it get announced before the spec pages catch up:

- [Tone-based Surfaces in Material 3](https://m3.material.io/blog/tone-based-surface-color-m3)
  — the surface roles replacing elevation overlays. The only first-party text
  stating that `Surface Variant` gives way to `Surface Container Highest`
- [The science of color & design](https://m3.material.io/blog/science-of-color-design)
  — HCT, and why a tone means the same contrast across hues: the basis of the
  tonal palettes
- [Designing Harmony into Dynamic Color](https://m3.material.io/blog/dynamic-color-harmony)
  — what `customColors[].blend` actually does to a custom color
- [Introducing Material Theme Builder](https://m3.material.io/blog/material-theme-builder)
  — the tool this package reimplements
