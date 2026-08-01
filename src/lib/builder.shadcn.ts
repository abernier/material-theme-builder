import { camelCase } from "lodash-es";

import type { BuilderContext } from "./builder";

/**
 * shadcn CSS variable → M3 sys-color token mapping.
 *
 * The single source of truth for which M3 token backs which shadcn variable:
 * `toShadcn()` reads it to emit concrete values, `toTailwind({ shadcn: true })`
 * reads it to emit `var()` aliases. Neither can name a variable the other
 * doesn't.
 *
 * Token names are kebab-case (the CSS spelling); the camelCase spelling the
 * scheme objects use is derived from them here, in one place.
 *
 * @see https://ui.shadcn.com/docs/theming#list-of-variables
 */
export const SHADCN_MAPPING = [
  ["--background", "surface"],
  ["--foreground", "on-surface"],
  ["--card", "surface-container-low"],
  ["--card-foreground", "on-surface"],
  ["--popover", "surface-container-high"],
  ["--popover-foreground", "on-surface"],
  ["--primary", "primary"],
  ["--primary-foreground", "on-primary"],
  ["--secondary", "secondary-container"],
  ["--secondary-foreground", "on-secondary-container"],
  ["--muted", "surface-container-highest"],
  ["--muted-foreground", "on-surface-variant"],
  ["--accent", "secondary-container"],
  ["--accent-foreground", "on-secondary-container"],
  ["--destructive", "error"],
  ["--border", "outline-variant"],
  ["--input", "outline"],
  ["--ring", "primary"],
  ["--chart-1", "primary-fixed"],
  ["--chart-2", "secondary-fixed"],
  ["--chart-3", "tertiary-fixed"],
  ["--chart-4", "primary-fixed-dim"],
  ["--chart-5", "secondary-fixed-dim"],
  ["--sidebar", "surface-container-low"],
  ["--sidebar-foreground", "on-surface"],
  ["--sidebar-primary", "primary"],
  ["--sidebar-primary-foreground", "on-primary"],
  ["--sidebar-accent", "secondary-container"],
  ["--sidebar-accent-foreground", "on-secondary-container"],
  ["--sidebar-border", "outline-variant"],
  ["--sidebar-ring", "primary"],
] as const;

// Distributes over the union of CSS variable names, stripping each `--`.
type StripDashes<T extends string> = T extends `--${infer Bare}` ? Bare : never;

/** A bare shadcn color variable name, e.g. `primary` or `chart-1`. */
export type ShadcnVarName = StripDashes<(typeof SHADCN_MAPPING)[number][0]>;

/**
 * Concrete shadcn colors, split by mode.
 *
 * Shaped exactly like a shadcn registry item's `cssVars` field, so it can be
 * assigned there without rewriting keys or values.
 */
export type ShadcnTheme = {
  light: Record<ShadcnVarName, string>;
  dark: Record<ShadcnVarName, string>;
};

// ─── sRGB → OKLCh ────────────────────────────────────────────────────────
//
// A fixed sRGB → linear → OKLab → OKLCh pipeline, in-repo rather than via a
// color library: the package carries no color dependency beyond Material
// Color Utilities, and this conversion does not warrant one.
//
// @see https://bottosson.github.io/posts/oklab/

function srgbToLinear(channel: number) {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

// 3 decimals, trailing zeros trimmed — the precision shadcn's own themes use.
function round(n: number) {
  return String(Number(n.toFixed(3)));
}

function argbToOklch(argb: number) {
  const r = srgbToLinear(((argb >> 16) & 0xff) / 255);
  const g = srgbToLinear(((argb >> 8) & 0xff) / 255);
  const b = srgbToLinear((argb & 0xff) / 255);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const chroma = Math.hypot(a, bb);
  // atan2(0, 0) is meaningless: an achromatic color has no hue.
  const hue =
    Number(chroma.toFixed(3)) === 0
      ? 0
      : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;

  return `oklch(${round(lightness)} ${round(chroma)} ${round(hue)})`;
}

// ─── Exporter ────────────────────────────────────────────────────────────

// Project one mode's M3 colors onto shadcn's variable set, in oklch.
// The mapping spells M3 tokens kebab-case (the CSS spelling); the merged
// colors key them camelCase. This is the one place that bridges the two.
function toShadcnVars(mergedColors: Record<string, number>) {
  const entries = SHADCN_MAPPING.map(([cssVar, m3Token]) => {
    const argb = mergedColors[camelCase(m3Token)];
    if (argb === undefined) {
      throw new Error(
        `M3 token '${m3Token}' is missing from the scheme, needed by '${cssVar}'. This is likely a bug in the implementation.`,
      );
    }
    return [cssVar.slice(2), argbToOklch(argb)];
  });

  return Object.fromEntries(entries) as Record<ShadcnVarName, string>;
}

/**
 * Generate a shadcn theme — concrete per-mode color values keyed by bare
 * shadcn variable name — from the builder context.
 *
 * The result matches the shape of a shadcn registry item's `cssVars` field,
 * so it can be served as a `registry:theme` or `registry:base` item and
 * installed with the standard `shadcn` CLI.
 *
 * Reads the same merged colors as `toCss()`, so `contrast` — and every other
 * option — lands here exactly as it does there, at full resolution.
 *
 * `customColors` and `prefix` have no effect here: shadcn's variable set is
 * fixed, so no component reads a custom color, and the mapping replaces the
 * prefixed M3 variable names with shadcn ones.
 */
export function buildShadcn(ctx: BuilderContext): ShadcnTheme {
  const { mergedColorsLight, mergedColorsDark } = ctx;

  return {
    light: toShadcnVars(mergedColorsLight),
    dark: toShadcnVars(mergedColorsDark),
  };
}
