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
import { Mcu } from "material-theme-builder/react";

<Mcu
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
</Mcu>
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
> `<Mcu>` injects the CSS from the client, and is the only thing here carrying
> `"use client"`. The root entry holds `builder` alone — so from a
> [React Server Component](https://react.dev/reference/rsc/server-components)
> you can call it and emit `toCss()` into the document yourself, without
> shipping components the page never renders.

## `useMcu`

A hook is also provided:

```tsx
import { useMcu } from "material-theme-builder/react";

const { initials, setMcuConfig, getMcuColor } = useMcu();

return (
  <button onClick={() => setMcuConfig({ ...initials, source: "#FF5722" })}>
    Change to {getMcuColor("primary", "light")}
  </button>
);
```

## Tailwind

A [Tailwind 4 plugin](https://tailwindcss.com/docs/functions-and-directives#plugin-directive) maps every Material token to a [theme variable](https://tailwindcss.com/docs/theme):

```css
@import "tailwindcss";
@plugin "material-theme-builder/tailwind";
```

You get `bg-primary`, `text-on-surface`, `border-outline-variant`, shades like
`bg-primary-100` (Tailwind shade → M3 tone: `50`→`95` … `500`→`50` … `950`→`5`),
all backed by the `--md-sys-color-*` / `--md-ref-palette-*` variables `<Mtb>`
(or `toCss()`) injects — so they follow scheme/contrast changes live.

Custom colors live in your JS at runtime, so the plugin cannot discover them at
build time: list their names —

```css
@plugin "material-theme-builder/tailwind" {
  custom-colors: myCustomColor1, myCustomColor2;
}
```

— which yields `bg-my-custom-color-1`, `text-on-my-custom-color-1`,
`bg-my-custom-color-1-container`, shades `bg-my-custom-color-1-50`…`950`, etc.

Or avoid the duplication entirely by sharing one JSON file with `<Mtb>`:

```jsonc
// mtb.json
{
  "customColors": [
    { "name": "myCustomColor1", "hex": "#FFDE3F", "blend": true },
  ],
}
```

```css
@plugin "material-theme-builder/tailwind" {
  config: "./mtb.json"; /* resolved from the cwd, usually the project root */
}
```

```tsx
import mtb from "./mtb.json";

<Mtb source="#4285F4" customColors={mtb.customColors}>
```

Options: `custom-colors` (name or comma-separated names), `config` (path to a
JSON file with a `customColors` array), `prefix` (default `md` — must match the
`prefix` prop/option).

<details>
<summary>Without the plugin (manual theme variables)</summary>

Standard tokens are covered by a static stylesheet:

```css
@import "material-theme-builder/tailwind.css";
```

Custom colors must then be mapped by hand, following the same naming scheme —
for a custom color named `myCustomColor1`:

```css
@theme inline {
  --color-my-custom-color-1: var(--md-sys-color-my-custom-color-1);
  --color-on-my-custom-color-1: var(--md-sys-color-on-my-custom-color-1);
  --color-my-custom-color-1-container: var(
    --md-sys-color-my-custom-color-1-container
  );
  --color-on-my-custom-color-1-container: var(
    --md-sys-color-on-my-custom-color-1-container
  );
  /* Shades */
  --color-my-custom-color-1-50: var(--md-ref-palette-my-custom-color-1-95);
  --color-my-custom-color-1-100: var(--md-ref-palette-my-custom-color-1-90);
  --color-my-custom-color-1-200: var(--md-ref-palette-my-custom-color-1-80);
  --color-my-custom-color-1-300: var(--md-ref-palette-my-custom-color-1-70);
  --color-my-custom-color-1-400: var(--md-ref-palette-my-custom-color-1-60);
  --color-my-custom-color-1-500: var(--md-ref-palette-my-custom-color-1-50);
  --color-my-custom-color-1-600: var(--md-ref-palette-my-custom-color-1-40);
  --color-my-custom-color-1-700: var(--md-ref-palette-my-custom-color-1-30);
  --color-my-custom-color-1-800: var(--md-ref-palette-my-custom-color-1-20);
  --color-my-custom-color-1-900: var(--md-ref-palette-my-custom-color-1-10);
  --color-my-custom-color-1-950: var(--md-ref-palette-my-custom-color-1-5);
}
```

You can also generate the whole block (custom colors included) with the CLI:

```sh
material-theme-builder '#4285F4' --format tailwind --custom-colors '[{"name":"myCustomColor1","hex":"#FFDE3F","blend":true}]'
```

</details>

## shadcn

Pre-requisites:

- You should use
  [`tailwind.cssVariables`](https://ui.shadcn.com/docs/theming#css-variables)

Simply override/remap
[shadcn's CSS variables](https://ui.shadcn.com/docs/theming#list-of-variables):

```css
:root {
  /* ... */
}
.dark {
  /* ... */
}

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

<details>
  <summary>mapping details</summary>
  see:
  
    - https://chatgpt.com/share/6899f20a-422c-8011-a072-62fb649589a0
    - https://gemini.google.com/share/51e072b6f1d2
</details>

> [!IMPORTANT]
>
> Make sure `:root, .dark { ... }` comes AFTER `.root { ... } .dark { ... }` to
> take precedence.

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
