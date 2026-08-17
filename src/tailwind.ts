import { kebabCase } from "lodash-es";
import plugin from "tailwindcss/plugin";

import { CORE_PALETTES, SHADE_TO_TONE } from "./lib/builder.tailwind";
import { DEFAULT_PREFIX, tokenNames } from "./lib/tokens";

/**
 * Options for the Tailwind v4 plugin, spelled in CSS as an `@plugin` body:
 *
 * ```css
 * @plugin "material-theme-builder/tailwind" {
 *   custom-colors: myCustomColor1, myCustomColor2;
 * }
 * ```
 *
 * Option names are read case- and dash-insensitively, so `custom-colors` and
 * `customColors` are one and the same — Prettier lowercases CSS declaration
 * names, and a stylesheet that goes through it must not stop working.
 */
export type MtbPluginOptions = {
  /**
   * CSS custom-property prefix — must match the `prefix` given to `builder()`
   * or `<Mtb>`.
   *
   * @default "md"
   */
  prefix?: string;
  /**
   * Names of the custom colors ("Extended colors") declared on `builder()` or
   * `<Mtb>`, spelled exactly as they are there.
   *
   * Each one registers its four M3 roles (`brand`, `on-brand`,
   * `brand-container`, `on-brand-container`) plus its shades.
   */
  customColors?: string | number | (string | number)[];
  /**
   * Register the `50`…`950` shades backed by the tonal palettes.
   *
   * Turning this off leaves Tailwind's own `neutral-*` palette untouched.
   *
   * @default true
   */
  shades?: boolean;
};

/** A Tailwind color entry: a single value, or a scale keyed by shade. */
type ColorValue = string | Record<string, string>;

// `@plugin` bodies are untyped CSS: a lone value arrives as a scalar, a
// comma-separated list as an array, and every entry may be a number
// (`custom-colors: color1` is a string, but nothing stops `color1` from
// looking numeric).
function toNameList(value: MtbPluginOptions["customColors"]) {
  if (value === undefined) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.map((name) => String(name).trim()).filter(Boolean);
}

// One option, several spellings: CSS wants `custom-colors`, JS wants
// `customColors`, and Prettier turns either into `customcolors` on its way
// through a stylesheet. Fold them all before reading.
const OPTION_KEYS = ["prefix", "customColors", "shades"] as const;

function normalizeOptions(options: MtbPluginOptions = {}) {
  const fold = (key: string) => key.replaceAll("-", "").toLowerCase();
  const canonical = new Map(OPTION_KEYS.map((key) => [fold(key), key]));

  const normalized: MtbPluginOptions = {};
  for (const [key, value] of Object.entries(options)) {
    const name = canonical.get(fold(key));
    if (!name) {
      throw new Error(
        `Unknown option '${key}' for the material-theme-builder Tailwind plugin. Expected one of: ${OPTION_KEYS.join(", ")}.`,
      );
    }
    Object.assign(normalized, { [name]: value });
  }

  return normalized;
}

/**
 * Build the Tailwind color theme backing the M3 color system.
 *
 * Every entry points at a `--{prefix}-sys-color-*` or `--{prefix}-ref-palette-*`
 * custom property rather than a literal color, so the whole theme re-resolves
 * whenever those change — which is what `<Mtb>` does at runtime.
 *
 * Exported for tests and for anyone assembling their own Tailwind config; the
 * plugin's default export is the thing to reach for.
 */
export function mtbColors(options: MtbPluginOptions = {}) {
  const {
    prefix = DEFAULT_PREFIX,
    shades: withShades = true,
    customColors,
  } = normalizeOptions(options);

  const sys = (token: string) => `var(--${prefix}-sys-color-${token})`;
  const ref = (palette: string, tone: number) =>
    `var(--${prefix}-ref-palette-${palette}-${tone})`;

  const colors: Record<string, ColorValue> = {};

  // Keep an existing single value reachable as the scale's `DEFAULT`, so
  // `bg-primary` stays the scheme role and `bg-primary-500` becomes the tone.
  const addShades = (name: string, palette: string) => {
    if (!withShades) return;
    const scale = Object.fromEntries(
      SHADE_TO_TONE.map(([shade, tone]) => [shade, ref(palette, tone)]),
    );
    const current = colors[name];
    colors[name] =
      typeof current === "string" ? { DEFAULT: current, ...scale } : scale;
  };

  // ── Scheme tokens ──
  for (const token of tokenNames) {
    const kebab = kebabCase(token);
    colors[kebab] = sys(kebab);
  }

  // ── Shades for core palettes ──
  for (const palette of CORE_PALETTES) addShades(palette, palette);

  // ── Custom colors ──
  for (const name of toNameList(customColors)) {
    const kebab = kebabCase(name);

    // M3 spells custom colors kebab-case; the name the user wrote is accepted
    // too (`bg-myCustomColor1` next to `bg-my-custom-color-1`), because that
    // is the spelling the hand-written `@theme` block documented before this
    // plugin existed.
    for (const alias of new Set([kebab, name])) {
      colors[alias] = sys(kebab);
      colors[`on-${alias}`] = sys(`on-${kebab}`);
      colors[`${alias}-container`] = sys(`${kebab}-container`);
      colors[`on-${alias}-container`] = sys(`on-${kebab}-container`);
      addShades(alias, kebab);
    }
  }

  return colors;
}

/**
 * Tailwind v4 plugin exposing the M3 color system as Tailwind colors.
 *
 * ```css
 * @import "tailwindcss";
 * @plugin "material-theme-builder/tailwind" {
 *   custom-colors: brand, success;
 * }
 * ```
 *
 * Replaces the hand-written `@theme inline { --color-*: var(--md-sys-color-*) }`
 * block: `bg-surface-container-high`, `text-on-primary-container`,
 * `border-outline-variant` and the `50`…`950` shades all resolve to the
 * variables `<Mtb>` (or `toCss()`) writes to the page.
 */
export default plugin.withOptions<MtbPluginOptions | undefined>(
  () => () => {},
  (options) => ({ theme: { extend: { colors: mtbColors(options) } } }),
);
