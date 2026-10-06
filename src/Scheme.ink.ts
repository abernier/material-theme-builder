/**
 * The colors the poster writes its labels in -- dressing, kept here so none of
 * it leaks into the swatches: they only ask `roleInk()` or `toneInk()`.
 *
 * Each label takes the color M3 pairs its swatch with, as Material Theme
 * Builder's own poster does.
 *
 * @see https://m3.material.io/styles/color/roles
 */

const sys = (role: string) => `var(--md-sys-color-${role})`;

/**
 * The roles whose ink is not simply their `on-` counterpart, or back -- the
 * spec pairs them with the role they are meant to be read against.
 */
const exceptions: Record<string, string> = {
  ...Object.fromEntries(
    ["primary", "secondary", "tertiary"].flatMap((c) => [
      [`${c}-fixed`, sys(`on-${c}-fixed`)],
      [`${c}-fixed-dim`, sys(`on-${c}-fixed`)],
      [`on-${c}-fixed-variant`, sys(`${c}-fixed`)],
    ]),
  ),
  ...Object.fromEntries(
    [
      "surface-dim",
      "surface-bright",
      "surface-container-lowest",
      "surface-container-low",
      "surface-container",
      "surface-container-high",
      "surface-container-highest",
    ].map((s) => [s, sys("on-surface")]),
  ),
  "on-surface-variant": sys("surface"),
  outline: sys("surface"),
  "outline-variant": sys("on-surface"),
  "inverse-surface": sys("inverse-on-surface"),
  "inverse-on-surface": sys("inverse-surface"),
  "inverse-primary": sys("inverse-surface"),
  "surface-tint": sys("on-primary"),
  // Black in both themes, and no role is white in both
  scrim: "var(--md-ref-palette-neutral-100)",
  shadow: "var(--md-ref-palette-neutral-100)",
};

/**
 * The ink of a scheme role (kebab-cased, custom colors included):
 * `on-primary` on `primary`, `primary` on `on-primary`...
 */
export function roleInk(role: string) {
  return (
    exceptions[role] ??
    sys(role.startsWith("on-") ? role.slice(3) : `on-${role}`)
  );
}

/**
 * The ink of a tonal palette's `tone`: the palette's tone 100 on the dark
 * half, 10 on the light one -- the tones of `on-primary` (100 on 40) and
 * `on-primary-container` (10 on 90). The cut at 50 keeps every pair at about
 * 4.5:1 or more.
 */
export function toneInk(palette: string, tone: number) {
  return `var(--md-ref-palette-${palette}-${tone <= 50 ? 100 : 10})`;
}
