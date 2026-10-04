import {
  argbFromHex,
  DynamicScheme,
  Hct,
  hexFromArgb,
  MaterialDynamicColors,
} from "@material/material-color-utilities";

import type { BuilderContext, TokenName } from "./builder";
import { schemeToVariant } from "./builder";

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
    effectiveSourceArgb,
    primaryHct,
    SchemeClass,
    scheme,
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
    function extractSchemeColors(
      scheme: DynamicScheme,
      backgroundScheme?: DynamicScheme,
    ) {
      const colors: Record<string, string> = {};

      for (const tokenName of FIXTURE_TOKEN_ORDER) {
        const dynamicColor = MaterialDynamicColors[tokenName];
        const useScheme =
          backgroundScheme &&
          (tokenName === "background" || tokenName === "onBackground")
            ? backgroundScheme
            : scheme;

        colors[tokenName] = hexFromArgb(
          dynamicColor.getArgb(useScheme),
        ).toUpperCase();
      }

      return colors;
    }

    // Resolve an override palette from a hex color string.
    // Returns null when hex is undefined (no override for that role).
    function resolveOverridePalette(
      hex: string | undefined,
      role: "primaryPalette" | "neutralPalette" | "neutralVariantPalette",
    ) {
      if (!hex) return null;
      return new SchemeClass(Hct.fromInt(argbFromHex(hex)), false, 0)[role];
    }

    // Override palettes (isDark/contrast-invariant)
    const secPalette = resolveOverridePalette(secondary, "primaryPalette");
    const terPalette = resolveOverridePalette(tertiary, "primaryPalette");
    const errPalette = resolveOverridePalette(error, "primaryPalette");
    const neuPalette = resolveOverridePalette(neutral, "neutralPalette");
    const nvPalette = resolveOverridePalette(
      neutralVariant,
      "neutralVariantPalette",
    );

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
      // Base scheme from primary — provides default palettes for all roles
      const baseScheme = new SchemeClass(primaryHct, isDark, contrast);

      // Compose scheme: override palette where specified, base default otherwise
      const composedScheme = new DynamicScheme({
        sourceColorArgb: effectiveSourceArgb,
        variant: schemeToVariant[scheme],
        contrastLevel: contrast,
        isDark,
        primaryPalette: baseScheme.primaryPalette,
        secondaryPalette: secPalette || baseScheme.secondaryPalette,
        tertiaryPalette: terPalette || baseScheme.tertiaryPalette,
        neutralPalette: neuPalette || baseScheme.neutralPalette,
        neutralVariantPalette: nvPalette || baseScheme.neutralVariantPalette,
      });

      if (errPalette) composedScheme.errorPalette = errPalette;

      // background/onBackground always from base scheme (primary-based)
      jsonSchemes[name] = extractSchemeColors(composedScheme, baseScheme);
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
