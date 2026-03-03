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

CSS variables are injected into the page:

```tsx
import { Mcu } from "material-theme-builder";

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

## `useMcu`

A hook is also provided:

```tsx
import { useMcu } from "material-theme-builder";

const { initials, setMcuConfig, getMcuColor } = useMcu();

return (
  <button onClick={() => setMcuConfig({ ...initials, source: "#FF5722" })}>
    Change to {getMcuColor("primary", "light")}
  </button>
);
```

## Tailwind

Compatible through [theme variables](https://tailwindcss.com/docs/theme):

```css
@theme inline {
  --color-background: var(--md-sys-color-background);
  --color-on-background: var(--md-sys-color-on-background);
  --color-surface: var(--md-sys-color-surface);
  --color-surface-dim: var(--md-sys-color-surface-dim);
  --color-surface-bright: var(--md-sys-color-surface-bright);
  --color-surface-container-lowest: var(
    --md-sys-color-surface-container-lowest
  );
  --color-surface-container-low: var(--md-sys-color-surface-container-low);
  --color-surface-container: var(--md-sys-color-surface-container);
  --color-surface-container-high: var(--md-sys-color-surface-container-high);
  --color-surface-container-highest: var(
    --md-sys-color-surface-container-highest
  );
  --color-on-surface: var(--md-sys-color-on-surface);
  --color-on-surface-variant: var(--md-sys-color-on-surface-variant);
  --color-outline: var(--md-sys-color-outline);
  --color-outline-variant: var(--md-sys-color-outline-variant);
  --color-inverse-surface: var(--md-sys-color-inverse-surface);
  --color-inverse-on-surface: var(--md-sys-color-inverse-on-surface);
  --color-primary: var(--md-sys-color-primary);
  --color-on-primary: var(--md-sys-color-on-primary);
  --color-primary-container: var(--md-sys-color-primary-container);
  --color-on-primary-container: var(--md-sys-color-on-primary-container);
  --color-primary-fixed: var(--md-sys-color-primary-fixed);
  --color-primary-fixed-dim: var(--md-sys-color-primary-fixed-dim);
  --color-on-primary-fixed: var(--md-sys-color-on-primary-fixed);
  --color-on-primary-fixed-variant: var(
    --md-sys-color-on-primary-fixed-variant
  );
  --color-inverse-primary: var(--md-sys-color-inverse-primary);
  --color-secondary: var(--md-sys-color-secondary);
  --color-on-secondary: var(--md-sys-color-on-secondary);
  --color-secondary-container: var(--md-sys-color-secondary-container);
  --color-on-secondary-container: var(--md-sys-color-on-secondary-container);
  --color-secondary-fixed: var(--md-sys-color-secondary-fixed);
  --color-secondary-fixed-dim: var(--md-sys-color-secondary-fixed-dim);
  --color-on-secondary-fixed: var(--md-sys-color-on-secondary-fixed);
  --color-on-secondary-fixed-variant: var(
    --md-sys-color-on-secondary-fixed-variant
  );
  --color-tertiary: var(--md-sys-color-tertiary);
  --color-on-tertiary: var(--md-sys-color-on-tertiary);
  --color-tertiary-container: var(--md-sys-color-tertiary-container);
  --color-on-tertiary-container: var(--md-sys-color-on-tertiary-container);
  --color-tertiary-fixed: var(--md-sys-color-tertiary-fixed);
  --color-tertiary-fixed-dim: var(--md-sys-color-tertiary-fixed-dim);
  --color-on-tertiary-fixed: var(--md-sys-color-on-tertiary-fixed);
  --color-on-tertiary-fixed-variant: var(
    --md-sys-color-on-tertiary-fixed-variant
  );
  --color-error: var(--md-sys-color-error);
  --color-on-error: var(--md-sys-color-on-error);
  --color-error-container: var(--md-sys-color-error-container);
  --color-on-error-container: var(--md-sys-color-on-error-container);
  --color-scrim: var(--md-sys-color-scrim);
  --color-shadow: var(--md-sys-color-shadow);

  /* Shades */

  --color-primary-50: var(--md-ref-palette-primary-95);
  --color-primary-100: var(--md-ref-palette-primary-90);
  --color-primary-200: var(--md-ref-palette-primary-80);
  --color-primary-300: var(--md-ref-palette-primary-70);
  --color-primary-400: var(--md-ref-palette-primary-60);
  --color-primary-500: var(--md-ref-palette-primary-50);
  --color-primary-600: var(--md-ref-palette-primary-40);
  --color-primary-700: var(--md-ref-palette-primary-30);
  --color-primary-800: var(--md-ref-palette-primary-20);
  --color-primary-900: var(--md-ref-palette-primary-10);
  --color-primary-950: var(--md-ref-palette-primary-5);

  --color-secondary-50: var(--md-ref-palette-secondary-95);
  --color-secondary-100: var(--md-ref-palette-secondary-90);
  --color-secondary-200: var(--md-ref-palette-secondary-80);
  --color-secondary-300: var(--md-ref-palette-secondary-70);
  --color-secondary-400: var(--md-ref-palette-secondary-60);
  --color-secondary-500: var(--md-ref-palette-secondary-50);
  --color-secondary-600: var(--md-ref-palette-secondary-40);
  --color-secondary-700: var(--md-ref-palette-secondary-30);
  --color-secondary-800: var(--md-ref-palette-secondary-20);
  --color-secondary-900: var(--md-ref-palette-secondary-10);
  --color-secondary-950: var(--md-ref-palette-secondary-5);

  --color-tertiary-50: var(--md-ref-palette-tertiary-95);
  --color-tertiary-100: var(--md-ref-palette-tertiary-90);
  --color-tertiary-200: var(--md-ref-palette-tertiary-80);
  --color-tertiary-300: var(--md-ref-palette-tertiary-70);
  --color-tertiary-400: var(--md-ref-palette-tertiary-60);
  --color-tertiary-500: var(--md-ref-palette-tertiary-50);
  --color-tertiary-600: var(--md-ref-palette-tertiary-40);
  --color-tertiary-700: var(--md-ref-palette-tertiary-30);
  --color-tertiary-800: var(--md-ref-palette-tertiary-20);
  --color-tertiary-900: var(--md-ref-palette-tertiary-10);
  --color-tertiary-950: var(--md-ref-palette-tertiary-5);

  --color-error-50: var(--md-ref-palette-error-95);
  --color-error-100: var(--md-ref-palette-error-90);
  --color-error-200: var(--md-ref-palette-error-80);
  --color-error-300: var(--md-ref-palette-error-70);
  --color-error-400: var(--md-ref-palette-error-60);
  --color-error-500: var(--md-ref-palette-error-50);
  --color-error-600: var(--md-ref-palette-error-40);
  --color-error-700: var(--md-ref-palette-error-30);
  --color-error-800: var(--md-ref-palette-error-20);
  --color-error-900: var(--md-ref-palette-error-10);
  --color-error-950: var(--md-ref-palette-error-5);

  --color-neutral-50: var(--md-ref-palette-neutral-95);
  --color-neutral-100: var(--md-ref-palette-neutral-90);
  --color-neutral-200: var(--md-ref-palette-neutral-80);
  --color-neutral-300: var(--md-ref-palette-neutral-70);
  --color-neutral-400: var(--md-ref-palette-neutral-60);
  --color-neutral-500: var(--md-ref-palette-neutral-50);
  --color-neutral-600: var(--md-ref-palette-neutral-40);
  --color-neutral-700: var(--md-ref-palette-neutral-30);
  --color-neutral-800: var(--md-ref-palette-neutral-20);
  --color-neutral-900: var(--md-ref-palette-neutral-10);
  --color-neutral-950: var(--md-ref-palette-neutral-5);

  --color-neutral-variant-50: var(--md-ref-palette-neutral-variant-95);
  --color-neutral-variant-100: var(--md-ref-palette-neutral-variant-90);
  --color-neutral-variant-200: var(--md-ref-palette-neutral-variant-80);
  --color-neutral-variant-300: var(--md-ref-palette-neutral-variant-70);
  --color-neutral-variant-400: var(--md-ref-palette-neutral-variant-60);
  --color-neutral-variant-500: var(--md-ref-palette-neutral-variant-50);
  --color-neutral-variant-600: var(--md-ref-palette-neutral-variant-40);
  --color-neutral-variant-700: var(--md-ref-palette-neutral-variant-30);
  --color-neutral-variant-800: var(--md-ref-palette-neutral-variant-20);
  --color-neutral-variant-900: var(--md-ref-palette-neutral-variant-10);
  --color-neutral-variant-950: var(--md-ref-palette-neutral-variant-5);

  /*
   * Custom colors
   */

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

  --color-myCustomColor2: var(--md-sys-color-my-custom-color-2);
  --color-on-myCustomColor2: var(--md-sys-color-on-my-custom-color-2);
  --color-myCustomColor2-container: var(
    --md-sys-color-my-custom-color-2-container
  );
  --color-on-myCustomColor2-container: var(
    --md-sys-color-on-my-custom-color-2-container
  );
  /* Shades */
  --color-myCustomColor2-50: var(--md-ref-palette-my-custom-color-2-95);
  --color-myCustomColor2-100: var(--md-ref-palette-my-custom-color-2-90);
  --color-myCustomColor2-200: var(--md-ref-palette-my-custom-color-2-80);
  --color-myCustomColor2-300: var(--md-ref-palette-my-custom-color-2-70);
  --color-myCustomColor2-400: var(--md-ref-palette-my-custom-color-2-60);
  --color-myCustomColor2-500: var(--md-ref-palette-my-custom-color-2-50);
  --color-myCustomColor2-600: var(--md-ref-palette-my-custom-color-2-40);
  --color-myCustomColor2-700: var(--md-ref-palette-my-custom-color-2-30);
  --color-myCustomColor2-800: var(--md-ref-palette-my-custom-color-2-20);
  --color-myCustomColor2-900: var(--md-ref-palette-my-custom-color-2-10);
  --color-myCustomColor2-950: var(--md-ref-palette-my-custom-color-2-5);
}
```

Or simply:

```css
@import "material-theme-builder/tailwind.css";
```

> [!IMPORTANT]
>
> Do not forget to manually add your custom colors, as in:
>
> ```css
> /*
>  * Custom colors
>  */
>
> --color-myCustomColor1: var(--md-sys-color-my-custom-color-1);
> --color-on-myCustomColor1: var(--md-sys-color-on-my-custom-color-1);
> --color-myCustomColor1-container: var(
>   --md-sys-color-my-custom-color-1-container
> );
> --color-on-myCustomColor1-container: var(
>   --md-sys-color-on-my-custom-color-1-container
> );
> /* Shades */
> --color-myCustomColor1-50: var(--md-ref-palette-my-custom-color-1-95);
> --color-myCustomColor1-100: var(--md-ref-palette-my-custom-color-1-90);
> --color-myCustomColor1-200: var(--md-ref-palette-my-custom-color-1-80);
> --color-myCustomColor1-300: var(--md-ref-palette-my-custom-color-1-70);
> --color-myCustomColor1-400: var(--md-ref-palette-my-custom-color-1-60);
> --color-myCustomColor1-500: var(--md-ref-palette-my-custom-color-1-50);
> --color-myCustomColor1-600: var(--md-ref-palette-my-custom-color-1-40);
> --color-myCustomColor1-700: var(--md-ref-palette-my-custom-color-1-30);
> --color-myCustomColor1-800: var(--md-ref-palette-my-custom-color-1-20);
> --color-myCustomColor1-900: var(--md-ref-palette-my-custom-color-1-10);
> --color-myCustomColor1-950: var(--md-ref-palette-my-custom-color-1-5);
>
> --color-myCustomColor2: var(--md-sys-color-my-custom-color-2);
> --color-on-myCustomColor2: var(--md-sys-color-on-my-custom-color-2);
> --color-myCustomColor2-container: var(
>   --md-sys-color-my-custom-color-2-container
> );
> --color-on-myCustomColor2-container: var(
>   --md-sys-color-on-my-custom-color-2-container
> );
> /* Shades */
> --color-myCustomColor2-50: var(--md-ref-palette-my-custom-color-2-95);
> --color-myCustomColor2-100: var(--md-ref-palette-my-custom-color-2-90);
> --color-myCustomColor2-200: var(--md-ref-palette-my-custom-color-2-80);
> --color-myCustomColor2-300: var(--md-ref-palette-my-custom-color-2-70);
> --color-myCustomColor2-400: var(--md-ref-palette-my-custom-color-2-60);
> --color-myCustomColor2-500: var(--md-ref-palette-my-custom-color-2-50);
> --color-myCustomColor2-600: var(--md-ref-palette-my-custom-color-2-40);
> --color-myCustomColor2-700: var(--md-ref-palette-my-custom-color-2-30);
> --color-myCustomColor2-800: var(--md-ref-palette-my-custom-color-2-20);
> --color-myCustomColor2-900: var(--md-ref-palette-my-custom-color-2-10);
> --color-myCustomColor2-950: var(--md-ref-palette-my-custom-color-2-5);
> ```

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
