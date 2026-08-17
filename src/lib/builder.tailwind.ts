import { kebabCase } from "lodash-es";

import type { BuilderContext } from "./builder";
import { buildShadcnAliases } from "./builder.shadcn";
import { CORE_PALETTES, SHADE_TO_TONE } from "./tokens";

/** Options for the Tailwind CSS exporter. */
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

  // The same block `material-theme-builder/shadcn.css` is generated from --
  // one mapping, so a `shadcn: true` inline copy and the shipped file cannot
  // say different things.
  if (options?.shadcn) output += `\n${buildShadcnAliases(ctx)}`;

  return output;
}
