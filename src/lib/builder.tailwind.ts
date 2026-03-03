import { kebabCase } from "lodash-es";

import type { BuilderContext } from "./builder";

// Tailwind shade → M3 tone mapping
const SHADE_TO_TONE = [
  [50, 95],
  [100, 90],
  [200, 80],
  [300, 70],
  [400, 60],
  [500, 50],
  [600, 40],
  [700, 30],
  [800, 20],
  [900, 10],
  [950, 5],
] as const;

// Core palette names that receive shade mappings
const CORE_PALETTES = [
  "primary",
  "secondary",
  "tertiary",
  "error",
  "neutral",
  "neutral-variant",
] as const;

// shadcn CSS variable → M3 sys-color token mapping
// see: https://ui.shadcn.com/docs/theming#list-of-variables
const SHADCN_MAPPING = [
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

export type TailwindOptions = {
  /** When true, append a shadcn CSS variable block after the Tailwind theme. */
  shadcn?: boolean;
};

/**
 * Generate a Tailwind CSS `@theme inline` block from the builder context.
 *
 * Produces `--color-*` theme variables that reference the Material Design
 * `--{prefix}-sys-color-*` and `--{prefix}-ref-palette-*` custom properties,
 * including any custom colors.
 *
 * When `options.shadcn` is `true`, a `:root, .dark` block remapping shadcn CSS
 * variables to the Material `--{prefix}-sys-color-*` properties is appended.
 */
export function buildTailwind(ctx: BuilderContext, options?: TailwindOptions) {
  const { prefix, mergedColorsLight, hexCustomColors } = ctx;

  const lines: string[] = [];

  // ── Scheme tokens ──
  // Standard tokens first (from tokenNames), then custom color tokens
  for (const name of Object.keys(mergedColorsLight)) {
    const kebab = kebabCase(name);
    lines.push(`--color-${kebab}: var(--${prefix}-sys-color-${kebab});`);
  }

  // ── Shades for core palettes ──
  lines.push("");
  lines.push("/* Shades */");

  for (const palette of CORE_PALETTES) {
    lines.push("");
    for (const [shade, tone] of SHADE_TO_TONE) {
      lines.push(
        `--color-${palette}-${shade}: var(--${prefix}-ref-palette-${palette}-${tone});`,
      );
    }
  }

  // ── Custom color shades ──
  if (hexCustomColors.length > 0) {
    for (const customColor of hexCustomColors) {
      const kebab = kebabCase(customColor.name);
      lines.push("");
      for (const [shade, tone] of SHADE_TO_TONE) {
        lines.push(
          `--color-${kebab}-${shade}: var(--${prefix}-ref-palette-${kebab}-${tone});`,
        );
      }
    }
  }

  let output = `@theme inline {\n  ${lines.join("\n  ")}\n}\n`;

  if (options?.shadcn) {
    const shadcnLines = SHADCN_MAPPING.map(
      ([shadcnVar, m3Token]) =>
        `${shadcnVar}: var(--${prefix}-sys-color-${m3Token});`,
    );
    output += `\n:root,\n.dark {\n  ${shadcnLines.join("\n  ")}\n}\n`;
  }

  return output;
}
