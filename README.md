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

> [!NOTE]
>
> CSS varnames are always kebab-cased, e.g. `myCustomColor1` →
> `--md-sys-color-my-custom-color-1` / `--md-ref-palette-my-custom-color-1-<tone>`

> [!NOTE]
>
> `<Mtb>` injects the CSS from the client, and is the only thing here carrying
> `"use client"`. The root entry holds `builder` alone — so from a
> [React Server Component](https://react.dev/reference/rsc/server-components)
> you can call it and emit `toCss()` into the document yourself, without
> shipping components the page never renders.

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

Compatible through a
[Tailwind 4 plugin](https://tailwindcss.com/docs/functions-and-directives#plugin-directive):

```css
@import "tailwindcss";
@plugin "material-theme-builder/tailwind";
```

→ `bg-surface-container-high`, `text-on-primary-container`,
`border-outline-variant`… every m3 role, plus shades: `bg-primary-500`,
`text-neutral-variant-800`. Opacity modifiers work: `bg-primary/50`.

Custom colors must be named — they only exist at runtime:

```css
@plugin "material-theme-builder/tailwind" {
  custom-colors: myCustomColor1, myCustomColor2;
}
```

→ `bg-myCustomColor1`, `text-on-myCustomColor1`,
`bg-myCustomColor1-container`, `bg-myCustomColor1-300`

Options:

| option          | default |                                    |
| --------------- | ------- | ---------------------------------- |
| `prefix`        | `"md"`  | same as `builder()` / `<Mtb>`      |
| `custom-colors` | –       | comma-separated                    |
| `shades`        | `true`  | `50`…`950`, off the tonal palettes |

> [!NOTE]
>
> Custom colors also answer to their kebab spelling, e.g.
> `bg-my-custom-color-1`

> [!NOTE]
>
> Option names are read case- and dash-insensitively, e.g. `custom-colors` =
> `customColors`. Prefer the kebab one: Prettier lowercases CSS declaration
> names.

<details>
  <summary>what it registers</summary>

Two rules, nothing else:

- `--md-sys-color-<role>` → `--color-<role>`
- shade → tone:

  | shade | 50  | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
  | ----- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | tone  | 95  | 90  | 80  | 70  | 60  | 50  | 40  | 30  | 20  | 10  | 5   |

  on `primary`, `secondary`, `tertiary`, `error`, `neutral`,
  `neutral-variant`, and every custom color.

```css
@theme inline {
  --color-background: var(--md-sys-color-background);
  --color-surface: var(--md-sys-color-surface);
  --color-surface-container: var(--md-sys-color-surface-container);
  --color-on-surface: var(--md-sys-color-on-surface);
  --color-outline-variant: var(--md-sys-color-outline-variant);
  --color-primary: var(--md-sys-color-primary);
  --color-on-primary: var(--md-sys-color-on-primary);
  --color-primary-container: var(--md-sys-color-primary-container);
  /* …one per role: secondary, tertiary, error, the -fixed and inverse-*
     variants, scrim, shadow… */

  /* Shades */

  --color-primary-50: var(--md-ref-palette-primary-95);
  --color-primary-100: var(--md-ref-palette-primary-90);
  /* …200 → 800… */
  --color-primary-950: var(--md-ref-palette-primary-5);

  /* …idem secondary, tertiary, error, neutral, neutral-variant… */
}
```

In full in
[`src/tailwind.css`](https://github.com/abernier/material-theme-builder/blob/main/src/tailwind.css).

</details>

Or simply, the same theme as a stylesheet:

```css
@import "material-theme-builder/tailwind.css";
```

> [!IMPORTANT]
>
> Do not forget to manually add your custom colors, as in:
>
> ```css
> @theme inline {
>   --color-myCustomColor1: var(--md-sys-color-my-custom-color-1);
>   --color-on-myCustomColor1: var(--md-sys-color-on-my-custom-color-1);
>   --color-myCustomColor1-container: var(
>     --md-sys-color-my-custom-color-1-container
>   );
>   --color-on-myCustomColor1-container: var(
>     --md-sys-color-on-my-custom-color-1-container
>   );
>   /* Shades */
>   --color-myCustomColor1-50: var(--md-ref-palette-my-custom-color-1-95);
>   /* …100 → 900… */
>   --color-myCustomColor1-950: var(--md-ref-palette-my-custom-color-1-5);
> }
> ```
>
> `builder(…).toTailwind()` emits the whole block, custom colors included.

## shadcn

Pre-requisites:

- You should use
  [`tailwind.cssVariables`](https://ui.shadcn.com/docs/theming#css-variables)

One import remaps
[shadcn's CSS variables](https://ui.shadcn.com/docs/theming#list-of-variables)
onto the m3 roles, for both modes at once:

```css
/* globals.css */
@import "tailwindcss";
@import "material-theme-builder/shadcn.css";

:root {
  /* ... */
}
.dark {
  /* ... */
}
```

> [!NOTE]
>
> Position does not matter: the block is written `:root:root, .dark.dark`, one
> specificity step above shadcn's own — bundlers hoist `@import` to the top of
> the sheet (Vite does), so source order could not be relied on. To override
> one of these yourself, match that specificity, e.g.
> `:root:root { --primary: … }`

<details>
  <summary>what it remaps</summary>

```css
:root:root,
.dark.dark {
  --background: var(--md-sys-color-surface);
  --foreground: var(--md-sys-color-on-surface);
  --card: var(--md-sys-color-surface-container-low);
  --popover: var(--md-sys-color-surface-container-high);
  --muted: var(--md-sys-color-surface-container-highest);
  --muted-foreground: var(--md-sys-color-on-surface-variant);
  --primary: var(--md-sys-color-primary);
  --secondary: var(--md-sys-color-secondary-container);
  --accent: var(--md-sys-color-secondary-container);
  --destructive: var(--md-sys-color-error);
  --border: var(--md-sys-color-outline-variant);
  --input: var(--md-sys-color-outline);
  --ring: var(--md-sys-color-primary);
  /* …the -foreground of each, --chart-1…5 off the -fixed roles,
     --sidebar-* mirroring the above… */
}
```

Surfaces come from the surface containers, `--secondary` / `--accent` from
`secondary-container` (shadcn uses them as tinted fills — the container role,
not m3's `secondary`), borders from `outline-variant`, ring from `primary`.

In full in
[`src/shadcn.css`](https://github.com/abernier/material-theme-builder/blob/main/src/shadcn.css).

</details>

<details>
  <summary>mapping details</summary>
  see:
  
    - https://chatgpt.com/share/6899f20a-422c-8011-a072-62fb649589a0
    - https://gemini.google.com/share/51e072b6f1d2
</details>

> [!NOTE]
>
> With the Tailwind plugin too: on the names they share (`primary`,
> `secondary`, `background`), shadcn's `@theme inline` wins whatever the order
> — Tailwind gives a CSS `@theme` precedence over a plugin's. Those utilities
> keep shadcn's semantics, already pointed at m3 by the import above. Only
> `secondary` differs in value — shadcn points it at the container role. To
> take that one back, write the line yourself in `globals.css`:
> `@theme inline { --color-secondary: var(--md-sys-color-secondary); }`. It has
> to be written, not imported: bundlers hoist `@import` to the top of the sheet
> (Vite does), which would put it back below shadcn's.

> [!NOTE]
>
> `builder(…).toShadcn()` emits concrete oklch values instead — for a registry
> theme, say.

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
