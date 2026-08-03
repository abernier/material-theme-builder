import type { ShadcnTheme } from "./builder.shadcn";

/**
 * Serialize a {@link ShadcnTheme} into a stylesheet that *forces* the theme
 * onto a host page — `:root { … }` for light, `.dark { … }` for dark.
 *
 * Built to win the cascade on a page we don't control:
 *
 * - Declarations are `!important`: shadcn theme-switchers commonly set the
 *   variables as inline `style` on `<html>`, which beats any normal
 *   stylesheet declaration — but not an important one.
 * - No `@layer`: unlayered normal declarations beat layered ones (where
 *   Tailwind v4 sites put their theme), and for important declarations the
 *   order inverts — a layered sheet would *lose* to the site's.
 *
 * The remaining fight — unlayered site styles injected after ours — is won
 * by re-appending the `<style>` element on every update (the caller's job).
 */
export function shadcnStyleSheet(theme: ShadcnTheme): string {
  const block = (vars: Record<string, string>) =>
    Object.entries(vars)
      .map(([name, value]) => `  --${name}: ${value} !important;`)
      .join("\n");

  return `:root {\n${block(theme.light)}\n}\n.dark {\n${block(theme.dark)}\n}\n`;
}
