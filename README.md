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

A [Tailwind v4](https://tailwindcss.com) plugin ships with the package — one
line, no theme block to maintain:

```css
@import "tailwindcss";
@plugin "material-theme-builder/tailwind";
```

Every M3 role is now a Tailwind color:

```html
<p class="bg-surface-container-high text-on-surface border-outline-variant">
  Hello, <span class="bg-primary-container text-on-primary-container">m3</span>
</p>
```

Shades come along too — `bg-primary-500`, `text-neutral-variant-800`,
`bg-error-50` — each one backed by the matching tonal palette
(`--md-ref-palette-primary-50` and friends), and opacity modifiers work as
usual: `bg-primary/50`.

### Custom colors

Name the custom colors ("Extended colors") you declared on `builder()` or
`<Mtb>`, spelled the same way:

```css
@plugin "material-theme-builder/tailwind" {
  custom-colors: myCustomColor1, myCustomColor2;
}
```

Each one registers its four M3 roles and its shades:

```html
<span class="bg-myCustomColor1 text-on-myCustomColor1">…</span>
<span class="bg-myCustomColor1-container text-on-myCustomColor1-container"
  >…</span
>
<span class="bg-myCustomColor1-300">…</span>
```

> [!NOTE]
>
> The kebab-cased spelling works too — `bg-my-custom-color-1` — matching the
> CSS varnames.

### Options

| option          | default |                                                                                                   |
| --------------- | ------- | ------------------------------------------------------------------------------------------------- |
| `prefix`        | `"md"`  | CSS custom-property prefix — must match the one given to `builder()` / `<Mtb>`                    |
| `custom-colors` | –       | Custom color names, comma-separated                                                               |
| `shades`        | `true`  | Register the `50`…`950` shades. Turn it off to leave Tailwind's own `neutral-*` palette untouched |

> [!NOTE]
>
> Option names are read case- and dash-insensitively — `custom-colors` and
> `customColors` are the same option. The kebab spelling is the one to prefer:
> Prettier lowercases CSS declaration names.

<details>
  <summary>Without the plugin</summary>

The same theme is also shipped as a plain stylesheet:

```css
@import "material-theme-builder/tailwind.css";
```

It is `@theme inline { --color-*: var(--md-sys-color-*) }` written out by hand
(see
[`src/tailwind.css`](https://github.com/abernier/material-theme-builder/blob/main/src/tailwind.css)),
so custom colors are on you:

```css
@theme inline {
  --color-myCustomColor1: var(--md-sys-color-my-custom-color-1);
  --color-on-myCustomColor1: var(--md-sys-color-on-my-custom-color-1);
  --color-myCustomColor1-container: var(
    --md-sys-color-my-custom-color-1-container
  );
  --color-on-myCustomColor1-container: var(
    --md-sys-color-on-my-custom-color-1-container
  );
  /* Shades */
  --color-myCustomColor1-50: var(--md-ref-palette-my-custom-color-1-95);
  --color-myCustomColor1-100: var(--md-ref-palette-my-custom-color-1-90);
  --color-myCustomColor1-200: var(--md-ref-palette-my-custom-color-1-80);
  --color-myCustomColor1-300: var(--md-ref-palette-my-custom-color-1-70);
  --color-myCustomColor1-400: var(--md-ref-palette-my-custom-color-1-60);
  --color-myCustomColor1-500: var(--md-ref-palette-my-custom-color-1-50);
  --color-myCustomColor1-600: var(--md-ref-palette-my-custom-color-1-40);
  --color-myCustomColor1-700: var(--md-ref-palette-my-custom-color-1-30);
  --color-myCustomColor1-800: var(--md-ref-palette-my-custom-color-1-20);
  --color-myCustomColor1-900: var(--md-ref-palette-my-custom-color-1-10);
  --color-myCustomColor1-950: var(--md-ref-palette-my-custom-color-1-5);
}
```

`builder(…).toTailwind()` emits that same block, custom colors included, if you
would rather generate it.

</details>

## shadcn

Pre-requisites:

- You should use
  [`tailwind.cssVariables`](https://ui.shadcn.com/docs/theming#css-variables)

One import — no variable block to copy:

```css
/* globals.css */
@import "tailwindcss";
@import "tw-animate-css";

:root {
  /* ... */
}
.dark {
  /* ... */
}

@import "material-theme-builder/shadcn.css";
```

It remaps [shadcn's CSS
variables](https://ui.shadcn.com/docs/theming#list-of-variables) onto the M3
roles, for both modes at once — `--background` → `--md-sys-color-surface`,
`--muted-foreground` → `--md-sys-color-on-surface-variant`, and so on (see
[`src/shadcn.css`](https://github.com/abernier/material-theme-builder/blob/main/src/shadcn.css)).

> [!IMPORTANT]
>
> Import it AFTER shadcn's own `:root { ... } .dark { ... }`, to take
> precedence.

<details>
  <summary>mapping details</summary>
  see:
  
    - https://chatgpt.com/share/6899f20a-422c-8011-a072-62fb649589a0
    - https://gemini.google.com/share/51e072b6f1d2
</details>

> [!NOTE]
>
> Using the Tailwind plugin alongside shadcn? For the few color names they
> share — `primary`, `secondary`, `background` — shadcn's `@theme inline` block
> wins, whatever the order: Tailwind gives a CSS `@theme` precedence over a
> plugin's theme. Those utilities keep shadcn's semantics, which the import
> above has already pointed at M3.

`builder(…).toShadcn()` is also there, if you would rather ship concrete oklch
values (a registry theme, say) than variables that follow `<Mtb>` at runtime.

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
