import type { BuilderContext } from "./builder";

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

/**
 * Generate a CSS block that remaps shadcn CSS variables to Material Design
 * `--{prefix}-sys-color-*` custom properties.
 *
 * The output is a `:root, .dark` rule that should come after shadcn's own
 * `:root` / `.dark` blocks so the Material values take precedence.
 */
export function buildShadcn(ctx: BuilderContext) {
  const { prefix } = ctx;

  const lines = SHADCN_MAPPING.map(
    ([shadcnVar, m3Token]) =>
      `${shadcnVar}: var(--${prefix}-sys-color-${m3Token});`,
  );

  return `:root,\n.dark {\n  ${lines.join("\n  ")}\n}\n`;
}
