import type { ShadcnTheme } from "./builder.shadcn";

/**
 * Serialize a {@link ShadcnTheme} into a stylesheet — `:root { … }` for
 * light, `.dark { … }` for dark. Two audiences:
 *
 * - Default: the paste-into-your-`globals.css` snippet, shadcn's own
 *   theming format (what ui.shadcn.com/create's "Copy Theme" emits).
 * - `important: true`: a sheet that *forces* the theme onto a page we
 *   don't control. `!important` beats the inline `style` on `<html>` that
 *   shadcn theme-switchers commonly write; staying unlayered beats
 *   `@layer base` (and for important declarations the layer order
 *   inverts, so a layered sheet would *lose*). The remaining fight —
 *   unlayered site styles injected after ours — is won by re-appending
 *   the `<style>` element on every update (the caller's job).
 */
export function shadcnStyleSheet(
  theme: ShadcnTheme,
  { important = false }: { important?: boolean } = {},
): string {
  const bang = important ? " !important" : "";
  const block = (vars: Record<string, string>) =>
    Object.entries(vars)
      .map(([name, value]) => `  --${name}: ${value}${bang};`)
      .join("\n");

  return `:root {\n${block(theme.light)}\n}\n.dark {\n${block(theme.dark)}\n}\n`;
}
