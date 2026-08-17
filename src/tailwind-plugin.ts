import { kebabCase } from "lodash-es";
import plugin from "tailwindcss/plugin";

import {
  CORE_PALETTES,
  DEFAULT_PREFIX,
  SHADE_TO_TONE,
  tokenNames,
} from "./lib/tokens";

/**
 * Options accepted by `@plugin "material-theme-builder/tailwind" { ... }`.
 *
 * Tailwind parses the block as CSS declarations, so the property names are
 * kebab-case and a comma-separated value arrives as an array. Everything is
 * typed loosely on the way in because the values come from a stylesheet, not
 * from a type-checked call site.
 */
export type MtbTailwindPluginOptions = {
  /**
   * Custom color names, exactly as passed to `builder()` / `<Mtb>`:
   *
   * ```css
   * @plugin "material-theme-builder/tailwind" {
   *   custom-colors: myCustomColor1, myCustomColor2;
   * }
   * ```
   */
  "custom-colors"?: string | string[] | number | (string | number)[];
  /** CSS custom-property prefix, matching `builder({ prefix })`. Default `md`. */
  prefix?: string;
};

/**
 * Read a `custom-colors`-shaped option into a list of names.
 *
 * Tailwind hands `a, b` over as `["a", "b"]` and a lone `a` as `"a"`, so both
 * shapes have to be accepted. Whitespace- and comma-separated strings are split
 * too, so `custom-colors: a b` and a quoted `"a, b"` behave the same way.
 */
function toNames(value: MtbTailwindPluginOptions["custom-colors"]): string[] {
  if (value === undefined || value === null) return [];

  return (Array.isArray(value) ? value : [value])
    .flatMap((entry) => String(entry).split(/[\s,]+/))
    .map((name) => name.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

/**
 * The `--color-*` map the plugin registers, as a plain object.
 *
 * Keys are Tailwind color names (`primary`, `on-primary`, `primary-500`),
 * values are `var()` references into the `--{prefix}-sys-color-*` /
 * `--{prefix}-ref-palette-*` properties `<Mtb>` (or `builder().toCss()`) emits.
 *
 * Custom colors keep the name they were declared with — `myCustomColor1` stays
 * `bg-myCustomColor1` — while the CSS property it points at is kebab-cased,
 * because that is the spelling the builder writes.
 */
export function mtbColors({
  customColors = [],
  prefix = DEFAULT_PREFIX,
}: {
  customColors?: string[];
  prefix?: string;
} = {}): Record<string, string> {
  const colors: Record<string, string> = {};

  const sys = (token: string) => `var(--${prefix}-sys-color-${token})`;
  const ref = (palette: string, tone: number) =>
    `var(--${prefix}-ref-palette-${palette}-${tone})`;

  // ── Scheme tokens ──
  for (const name of tokenNames) {
    const kebab = kebabCase(name);

    colors[kebab] = sys(kebab);
  }

  // ── Shades for core palettes ──
  for (const palette of CORE_PALETTES) {
    for (const [shade, tone] of SHADE_TO_TONE) {
      colors[`${palette}-${shade}`] = ref(palette, tone);
    }
  }

  // ── Custom colors ──
  for (const name of customColors) {
    const kebab = kebabCase(name);

    colors[name] = sys(kebab);
    colors[`on-${name}`] = sys(`on-${kebab}`);
    colors[`${name}-container`] = sys(`${kebab}-container`);
    colors[`on-${name}-container`] = sys(`on-${kebab}-container`);

    for (const [shade, tone] of SHADE_TO_TONE) {
      colors[`${name}-${shade}`] = ref(kebab, tone);
    }
  }

  return colors;
}

/**
 * Tailwind v4 plugin — the `@theme inline` block of
 * `material-theme-builder/tailwind.css`, minus the copy-paste.
 *
 * ```css
 * @import "tailwindcss";
 * @plugin "material-theme-builder/tailwind" {
 *   custom-colors: myCustomColor1, myCustomColor2;
 * }
 * ```
 *
 * Colors declared through a plugin's `theme` are inlined by Tailwind — the
 * utility resolves straight to `var(--md-sys-color-primary)` and no
 * `--color-*` indirection is emitted — which is what the stylesheet's
 * `@theme inline` was there to get. That indirection is not cosmetic: a
 * `--color-primary: var(--md-sys-color-primary)` declared on `:root` resolves
 * once, against `:root`, so a nested `<Mtb>` re-declaring the M3 properties
 * would not reach the utilities.
 *
 * Unlike the stylesheet, custom colors need no hand-written block: name them
 * in the options and their four scheme roles plus eleven shades come with them.
 *
 * One thing the stylesheet does that this cannot: theme values a plugin
 * contributes are defaults, so an `@theme` block in the consumer's own CSS
 * wins over them whatever the order — where a later `@import` of the
 * stylesheet would have won. Only colliding names are affected, and against
 * shadcn there are exactly three (`background`, `primary`, `secondary`), which
 * a three-line `@theme inline` of one's own hands back. See the README.
 *
 * @see https://tailwindcss.com/docs/functions-and-directives#plugin-directive
 */
const mtbTailwindPlugin = plugin.withOptions<MtbTailwindPluginOptions>(
  () => () => {},
  (options = {}) => ({
    theme: {
      extend: {
        colors: mtbColors({
          customColors: toNames(options["custom-colors"]),
          prefix: options.prefix,
        }),
      },
    },
  }),
);

export default mtbTailwindPlugin;
