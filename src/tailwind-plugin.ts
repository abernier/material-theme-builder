import plugin from "tailwindcss/plugin";

import { DEFAULT_PREFIX } from "./lib/builder";
import { tailwindThemeColors } from "./lib/builder.tailwind";

/**
 * Options for `@plugin "material-theme-builder/tailwind"`.
 *
 * Tailwind parses the `@plugin` option block itself: comma-separated values
 * arrive as arrays, single values as scalars.
 */
export type MaterialThemeBuilderPluginOptions = {
  /**
   * Custom color name(s), as passed to `builder()` / `<Mtb customColors>`,
   * e.g. `custom-colors: myCustomColor1, myCustomColor2;`
   */
  "custom-colors"?: string | string[];
  /** CSS variable prefix, matching the `prefix` config (default `md`). */
  prefix?: string;
};

function customColorNames(options: MaterialThemeBuilderPluginOptions) {
  const listed = options["custom-colors"] ?? [];
  return Array.isArray(listed) ? listed : [listed];
}

/**
 * Tailwind 4 plugin mapping every Material token — including custom colors —
 * to a Tailwind color, backed by the `--{prefix}-sys-color-*` and
 * `--{prefix}-ref-palette-*` custom properties that `<Mtb>`/`toCss()` inject.
 *
 * ```css
 * @import "tailwindcss";
 * @plugin "material-theme-builder/tailwind" {
 *   custom-colors: myCustomColor1, myCustomColor2;
 * }
 * ```
 */
export default plugin.withOptions<MaterialThemeBuilderPluginOptions>(
  () => () => {},
  (options = {}) => ({
    theme: {
      extend: {
        colors: tailwindThemeColors(
          options.prefix ?? DEFAULT_PREFIX,
          customColorNames(options),
        ),
      },
    },
  }),
);
