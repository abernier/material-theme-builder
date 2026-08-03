import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import plugin from "tailwindcss/plugin";
import { z } from "zod";

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
  /**
   * Path to a JSON file declaring `{ "customColors": [{ "name": … }] }` —
   * share it with your `<Mtb>` props for a single source of truth. Resolved
   * from the current working directory (usually the project root).
   */
  config?: string;
  /** CSS variable prefix, matching the `prefix` config (default `md`). */
  prefix?: string;
};

const configFileSchema = z.object({
  customColors: z.array(z.object({ name: z.string() })).default([]),
});

function customColorNames(options: MaterialThemeBuilderPluginOptions) {
  const listed = options["custom-colors"] ?? [];
  const names = Array.isArray(listed) ? [...listed] : [listed];

  if (options.config) {
    const file = readFileSync(resolve(options.config), "utf8");
    const parsed = configFileSchema.parse(JSON.parse(file));
    names.push(...parsed.customColors.map((color) => color.name));
  }

  return [...new Set(names)];
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
