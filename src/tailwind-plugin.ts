import { hexFromArgb } from "@material/material-color-utilities";
import { kebabCase } from "lodash-es";
import plugin from "tailwindcss/plugin";

import {
  builder,
  DEFAULT_CUSTOM_COLORS,
  DEFAULT_PREFIX,
  type McuConfig,
  STANDARD_TONES,
} from "./lib/builder";

/**
 * Tailwind shade → Material You tonal palette mapping.
 *
 * Each key is a conventional Tailwind shade number and the value is the
 * corresponding Material You tone value used in `--{prefix}-ref-palette-*`.
 */
const SHADES_TO_TONES: Record<number, number> = {
  50: 95,
  100: 90,
  200: 80,
  300: 70,
  400: 60,
  500: 50,
  600: 40,
  700: 30,
  800: 20,
  900: 10,
  950: 5,
};

/** Core palette groups that receive shade variants. */
const CORE_PALETTES = [
  "primary",
  "secondary",
  "tertiary",
  "error",
  "neutral",
  "neutral-variant",
] as const;

/**
 * Build the Tailwind `theme.extend.colors` mapping from `--color-*` names
 * to `var(--{prefix}-sys-color-*)` / `var(--{prefix}-ref-palette-*-<tone>)`.
 */
function buildThemeColors(config: McuConfig) {
  const prefix = config.prefix ?? DEFAULT_PREFIX;
  const customColors = config.customColors ?? DEFAULT_CUSTOM_COLORS;

  const colors: Record<string, string> = {};

  // ── Standard sys-color tokens ──────────────────────────────────────────
  // Derive the full list from the builder itself so the plugin stays in
  // sync automatically. We build once just to read the token keys.
  const { mergedColorsLight } = builder(config.source, config);
  for (const tokenName of Object.keys(mergedColorsLight)) {
    colors[kebabCase(tokenName)] =
      `var(--${prefix}-sys-color-${kebabCase(tokenName)})`;
  }

  // ── Core palette shades ────────────────────────────────────────────────
  for (const palette of CORE_PALETTES) {
    for (const [shade, tone] of Object.entries(SHADES_TO_TONES)) {
      colors[`${palette}-${shade}`] =
        `var(--${prefix}-ref-palette-${palette}-${tone})`;
    }
  }

  // ── Custom color mappings ──────────────────────────────────────────────
  for (const cc of customColors) {
    const kebab = kebabCase(cc.name);
    colors[cc.name] = `var(--${prefix}-sys-color-${kebab})`;
    colors[`on-${cc.name}`] = `var(--${prefix}-sys-color-on-${kebab})`;
    colors[`${cc.name}-container`] =
      `var(--${prefix}-sys-color-${kebab}-container)`;
    colors[`on-${cc.name}-container`] =
      `var(--${prefix}-sys-color-on-${kebab}-container)`;

    // Shades
    for (const [shade, tone] of Object.entries(SHADES_TO_TONES)) {
      colors[`${cc.name}-${shade}`] =
        `var(--${prefix}-ref-palette-${kebab}-${tone})`;
    }
  }

  return colors;
}

/**
 * Build the shadcn CSS variable overrides that remap shadcn's design tokens
 * to Material You CSS variables.
 */
function buildShadcnVars(prefix: string) {
  return {
    "--background": `var(--${prefix}-sys-color-surface)`,
    "--foreground": `var(--${prefix}-sys-color-on-surface)`,
    "--card": `var(--${prefix}-sys-color-surface-container-low)`,
    "--card-foreground": `var(--${prefix}-sys-color-on-surface)`,
    "--popover": `var(--${prefix}-sys-color-surface-container-high)`,
    "--popover-foreground": `var(--${prefix}-sys-color-on-surface)`,
    "--primary": `var(--${prefix}-sys-color-primary)`,
    "--primary-foreground": `var(--${prefix}-sys-color-on-primary)`,
    "--secondary": `var(--${prefix}-sys-color-secondary-container)`,
    "--secondary-foreground": `var(--${prefix}-sys-color-on-secondary-container)`,
    "--muted": `var(--${prefix}-sys-color-surface-container-highest)`,
    "--muted-foreground": `var(--${prefix}-sys-color-on-surface-variant)`,
    "--accent": `var(--${prefix}-sys-color-secondary-container)`,
    "--accent-foreground": `var(--${prefix}-sys-color-on-secondary-container)`,
    "--destructive": `var(--${prefix}-sys-color-error)`,
    "--border": `var(--${prefix}-sys-color-outline-variant)`,
    "--input": `var(--${prefix}-sys-color-outline)`,
    "--ring": `var(--${prefix}-sys-color-primary)`,
    "--chart-1": `var(--${prefix}-sys-color-primary-fixed)`,
    "--chart-2": `var(--${prefix}-sys-color-secondary-fixed)`,
    "--chart-3": `var(--${prefix}-sys-color-tertiary-fixed)`,
    "--chart-4": `var(--${prefix}-sys-color-primary-fixed-dim)`,
    "--chart-5": `var(--${prefix}-sys-color-secondary-fixed-dim)`,
    "--sidebar": `var(--${prefix}-sys-color-surface-container-low)`,
    "--sidebar-foreground": `var(--${prefix}-sys-color-on-surface)`,
    "--sidebar-primary": `var(--${prefix}-sys-color-primary)`,
    "--sidebar-primary-foreground": `var(--${prefix}-sys-color-on-primary)`,
    "--sidebar-accent": `var(--${prefix}-sys-color-secondary-container)`,
    "--sidebar-accent-foreground": `var(--${prefix}-sys-color-on-secondary-container)`,
    "--sidebar-border": `var(--${prefix}-sys-color-outline-variant)`,
    "--sidebar-ring": `var(--${prefix}-sys-color-primary)`,
  };
}

/** Options accepted by the Tailwind v4 plugin. */
export type MaterialThemeOptions = McuConfig & {
  /** When true, inject shadcn CSS variable overrides mapped to Material You tokens. */
  shadcn?: boolean;
};

/**
 * Tailwind v4 plugin that generates Material You color theme variables.
 *
 * Injects `--md-sys-color-*` and `--md-ref-palette-*` CSS custom properties
 * (via `builder()`) and registers them as Tailwind theme colors so utility
 * classes like `bg-primary` or `text-on-surface` work out of the box.
 *
 * @example
 * ```ts
 * // tailwind.config.ts
 * import { materialTheme } from "material-theme-builder";
 *
 * export default {
 *   plugins: [
 *     materialTheme({
 *       source: "#6750A4",
 *       scheme: "vibrant",
 *       customColors: [
 *         { name: "brand", hex: "#FF5733", blend: true },
 *       ],
 *       shadcn: true,
 *     }),
 *   ],
 * };
 * ```
 */
export function materialTheme(options: MaterialThemeOptions) {
  const prefix = options.prefix ?? DEFAULT_PREFIX;

  // Build the actual color values via the builder
  const theme = builder(options.source, options);

  // Build addBase rules directly from the builder's structured data
  const sysVars = (merged: Record<string, number>) => {
    const vars: Record<string, string> = {};
    for (const [name, argb] of Object.entries(merged)) {
      vars[`--${prefix}-sys-color-${kebabCase(name)}`] = hexFromArgb(argb);
    }
    return vars;
  };

  const paletteVars: Record<string, string> = {};
  for (const [name, palette] of Object.entries(theme.allPalettes)) {
    const paletteName = kebabCase(name);
    for (const tone of STANDARD_TONES) {
      paletteVars[`--${prefix}-ref-palette-${paletteName}-${tone}`] =
        hexFromArgb(palette.tone(tone));
    }
  }

  const cssRules = {
    ":root": { ...sysVars(theme.mergedColorsLight), ...paletteVars },
    ".dark": { ...sysVars(theme.mergedColorsDark), ...paletteVars },
  };

  return plugin(
    ({ addBase }) => {
      // Inject the builder-generated CSS custom properties
      addBase(cssRules);

      // Inject shadcn CSS variable overrides when requested
      if (options.shadcn) {
        addBase({ ":root, .dark": buildShadcnVars(prefix) });
      }
    },
    {
      theme: {
        extend: {
          colors: buildThemeColors(options),
        },
      },
    },
  );
}
