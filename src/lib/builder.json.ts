import { hexFromArgb } from "@material/material-color-utilities";

import type { BuilderContext, RenderedScheme, TokenName } from "./builder";

// Token order matching Material Theme Builder export format
const FIXTURE_TOKEN_ORDER = [
  "primary",
  "surfaceTint",
  "onPrimary",
  "primaryContainer",
  "onPrimaryContainer",
  "secondary",
  "onSecondary",
  "secondaryContainer",
  "onSecondaryContainer",
  "tertiary",
  "onTertiary",
  "tertiaryContainer",
  "onTertiaryContainer",
  "error",
  "onError",
  "errorContainer",
  "onErrorContainer",
  "background",
  "onBackground",
  "surface",
  "onSurface",
  "surfaceVariant",
  "onSurfaceVariant",
  "outline",
  "outlineVariant",
  "shadow",
  "scrim",
  "inverseSurface",
  "inverseOnSurface",
  "inversePrimary",
  "primaryFixed",
  "onPrimaryFixed",
  "primaryFixedDim",
  "onPrimaryFixedVariant",
  "secondaryFixed",
  "onSecondaryFixed",
  "secondaryFixedDim",
  "onSecondaryFixedVariant",
  "tertiaryFixed",
  "onTertiaryFixed",
  "tertiaryFixedDim",
  "onTertiaryFixedVariant",
  "surfaceDim",
  "surfaceBright",
  "surfaceContainerLowest",
  "surfaceContainerLow",
  "surfaceContainer",
  "surfaceContainerHigh",
  "surfaceContainerHighest",
] as const satisfies readonly TokenName[];

/**
 * Generate a JSON object in the Material Theme Builder export format.
 *
 * `schemes` matches MTB's export. `palettes` holds the reference palettes
 * `toCss()` emits.
 */
export function buildJson(ctx: BuilderContext) {
  const {
    hexSource,
    renderScheme,
    primary,
    secondary,
    tertiary,
    error,
    neutral,
    neutralVariant,
    hexCustomColors,
    refPalettes,
  } = ctx;

  function buildJsonSchemes() {
    // Extract scheme colors in fixture token order
    function extractSchemeColors({ roles }: RenderedScheme) {
      const colors: Record<string, string> = {};

      for (const tokenName of FIXTURE_TOKEN_ORDER) {
        colors[tokenName] = hexFromArgb(roles[tokenName]).toUpperCase();
      }

      return colors;
    }

    const jsonSchemes: Record<string, Record<string, string>> = {};

    const jsonContrastLevels = [
      { name: "light", isDark: false, contrast: 0 },
      { name: "light-medium-contrast", isDark: false, contrast: 0.5 },
      { name: "light-high-contrast", isDark: false, contrast: 1.0 },
      { name: "dark", isDark: true, contrast: 0 },
      { name: "dark-medium-contrast", isDark: true, contrast: 0.5 },
      { name: "dark-high-contrast", isDark: true, contrast: 1.0 },
    ] as const;

    for (const { name, isDark, contrast } of jsonContrastLevels) {
      // Every level is the scheme toCss() renders at that level, built by
      // builder()'s one scheme construction. So every role, background and
      // onBackground included, comes from the rendered scheme. MTB's export
      // takes background/onBackground from the scheme of `primary` alone
      // instead; we do not reproduce that (see
      // docs/adr/0002-json-background-follows-the-rendered-scheme.md).
      jsonSchemes[name] = extractSchemeColors(renderScheme(isDark, contrast));
    }

    return jsonSchemes;
  }

  // The reference palettes, as `--{prefix}-ref-palette-*` in toCss() holds
  // them: every palette the system roles are drawn from (error and custom
  // colors included), at every STANDARD_TONES tone.
  function refPalettesToJson() {
    const jsonPalettes: Record<string, Record<string, string>> = {};

    for (const [name, tones] of Object.entries(refPalettes)) {
      const jsonTones: Record<string, string> = {};
      for (const { tone, argb } of tones) {
        jsonTones[tone.toString()] = hexFromArgb(argb).toUpperCase();
      }
      jsonPalettes[name] = jsonTones;
    }

    return jsonPalettes;
  }

  function buildCoreColors(opts: {
    primary: string;
    secondary?: string;
    tertiary?: string;
    error?: string;
    neutral?: string;
    neutralVariant?: string;
  }) {
    const colors: Record<string, string> = { primary: opts.primary };
    if (opts.secondary) colors.secondary = opts.secondary.toUpperCase();
    if (opts.tertiary) colors.tertiary = opts.tertiary.toUpperCase();
    if (opts.error) colors.error = opts.error.toUpperCase();
    if (opts.neutral) colors.neutral = opts.neutral.toUpperCase();
    if (opts.neutralVariant)
      colors.neutralVariant = opts.neutralVariant.toUpperCase();
    return colors;
  }

  const seed = hexSource.toUpperCase();
  const coreColors = buildCoreColors({
    primary: (primary || hexSource).toUpperCase(),
    secondary,
    tertiary,
    error,
    neutral,
    neutralVariant,
  });

  const extendedColors = hexCustomColors.map((c) => ({
    name: c.name,
    color: c.hex.toUpperCase(),
    description: "",
    harmonized: c.blend,
  }));

  return {
    seed,
    coreColors,
    extendedColors,
    schemes: buildJsonSchemes(),
    palettes: refPalettesToJson(),
  };
}
