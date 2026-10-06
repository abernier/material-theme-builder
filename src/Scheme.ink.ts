/**
 * The colors the poster writes its labels in -- dressing, kept here so none of
 * it leaks into the swatches: they only ask `roleInk()` or `toneInk()`.
 *
 * Each label takes the color M3 pairs its swatch with, as Material Theme
 * Builder's own poster does.
 *
 * The pairs hold at the default contrast. `<Mtb contrast>` moves the tones
 * the surfaces sit on, and at the extremes two labels lose their legibility:
 * `outline-variant` at contrast 1, `outline` at contrast -1. No fixed role
 * reads on either across the whole range, and a poster painted from `var()`
 * cannot pick its ink from the tone underneath.
 *
 * @see https://m3.material.io/styles/color/roles
 */

import { refPaletteVar, sysColorVar } from "./lib/tokens";

/**
 * The roles whose ink is not simply their `on-` counterpart, or back -- the
 * spec pairs them with the role they are meant to be read against.
 */
const exceptions: Record<string, string> = {
  "primary-fixed": sysColorVar("on-primary-fixed"),
  "primary-fixed-dim": sysColorVar("on-primary-fixed"),
  "on-primary-fixed-variant": sysColorVar("primary-fixed"),
  "secondary-fixed": sysColorVar("on-secondary-fixed"),
  "secondary-fixed-dim": sysColorVar("on-secondary-fixed"),
  "on-secondary-fixed-variant": sysColorVar("secondary-fixed"),
  "tertiary-fixed": sysColorVar("on-tertiary-fixed"),
  "tertiary-fixed-dim": sysColorVar("on-tertiary-fixed"),
  "on-tertiary-fixed-variant": sysColorVar("tertiary-fixed"),

  "surface-dim": sysColorVar("on-surface"),
  "surface-bright": sysColorVar("on-surface"),
  "surface-container-lowest": sysColorVar("on-surface"),
  "surface-container-low": sysColorVar("on-surface"),
  "surface-container": sysColorVar("on-surface"),
  "surface-container-high": sysColorVar("on-surface"),
  "surface-container-highest": sysColorVar("on-surface"),

  "on-surface-variant": sysColorVar("surface"),
  outline: sysColorVar("surface"),
  "outline-variant": sysColorVar("on-surface"),
  "inverse-surface": sysColorVar("inverse-on-surface"),
  "inverse-on-surface": sysColorVar("inverse-surface"),
  "inverse-primary": sysColorVar("inverse-surface"),
  "surface-tint": sysColorVar("on-primary"),
  // Black in both themes, and no role is white in both
  scrim: "white",
  shadow: "white",
};

/**
 * The ink of a scheme role: `on-primary` on `primary`, `primary` on
 * `on-primary`...
 *
 * For the scheme's own roles. A custom color's four roles are paired by
 * `Scheme` itself, which knows which is which -- a name like `onSale` would
 * fool the `on-` rule below.
 *
 * @param role The role, kebab-cased: the `--md-sys-color-*` suffix.
 */
export function roleInk(role: string) {
  // A plain object: looked up as is, `constructor` would read Object.prototype
  const exception = Object.hasOwn(exceptions, role)
    ? exceptions[role]
    : undefined;

  return (
    exception ??
    sysColorVar(role.startsWith("on-") ? role.slice(3) : `on-${role}`)
  );
}

/**
 * The ink of a tonal palette's `tone`: the palette's tone 100 on the dark
 * half, 10 on the light one -- the tones of `on-primary` (100 on 40) and
 * `on-primary-container` (10 on 90). The cut at 50 keeps every pair at about
 * 4.5:1 or more.
 *
 * @param palette The palette, kebab-cased: `primary`, `neutral-variant`...
 * @param tone The tone the label sits on, 0 to 100.
 */
export function toneInk(palette: string, tone: number) {
  return refPaletteVar(palette, tone <= 50 ? 100 : 10);
}
