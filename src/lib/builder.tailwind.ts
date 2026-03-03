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

/**
 * Generate a Tailwind CSS `@theme inline` block from the builder context.
 *
 * Produces `--color-*` theme variables that reference the Material Design
 * `--{prefix}-sys-color-*` and `--{prefix}-ref-palette-*` custom properties,
 * including any custom colors.
 */
export function buildTailwind(ctx: BuilderContext) {
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

  return `@theme inline {\n  ${lines.join("\n  ")}\n}\n`;
}
