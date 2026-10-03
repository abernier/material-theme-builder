import {
  argbFromHex,
  DynamicScheme,
  Hct,
  hexFromArgb,
  MaterialDynamicColors,
  SchemeContent,
  TonalPalette,
} from "@material/material-color-utilities";

import type { BuilderContext, TokenName } from "./builder";
import { DEFAULT_BLEND, schemeToVariant } from "./builder";
import { overriddenRoleGroups, readRoles } from "./roleGroups";

// The 18 baseline tones matching the Material Theme Builder JSON output
const MTB_TONES = [
  0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100,
] as const;

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
 * Generate a JSON object matching the Material Theme Builder export format.
 */
export function buildJson(ctx: BuilderContext) {
  const {
    hexSource,
    sourceHct,
    effectiveSourceArgb,
    primaryHct,
    SchemeClass,
    scheme,
    colorMatch,
    primary,
    secondary,
    tertiary,
    error,
    neutral,
    neutralVariant,
    hexCustomColors,
  } = ctx;

  // Build "raw" palettes for JSON export — these use the color's own hue/chroma
  // (TonalPalette.fromInt), NOT the scheme-transformed palettes (allPalettes).
  //
  // ⚠️  Known MTB inconsistency:
  // MTB's JSON export uses raw palettes from input colors, while its UI uses
  // scheme-transformed palettes (e.g. SchemeTonalSpot clamps secondary chroma).
  // This means `palettes.secondary.40` in JSON can differ from `schemes.light.secondary`.
  // We intentionally reproduce this behavior.
  const neuHct = neutral ? Hct.fromInt(argbFromHex(neutral)) : sourceHct;
  const nvHct = neutralVariant
    ? Hct.fromInt(argbFromHex(neutralVariant))
    : sourceHct;

  const rawPalettes = {
    primary: TonalPalette.fromInt(effectiveSourceArgb),
    secondary: secondary
      ? TonalPalette.fromInt(argbFromHex(secondary))
      : TonalPalette.fromHueAndChroma(sourceHct.hue, sourceHct.chroma / 3),
    tertiary: tertiary
      ? TonalPalette.fromInt(argbFromHex(tertiary))
      : TonalPalette.fromHueAndChroma(
          (sourceHct.hue + 60) % 360,
          sourceHct.chroma / 2,
        ),
    neutral: TonalPalette.fromHueAndChroma(
      neuHct.hue,
      Math.min(neuHct.chroma / 12, 4),
    ),
    "neutral-variant": TonalPalette.fromHueAndChroma(
      nvHct.hue,
      Math.min(nvHct.chroma / 6, 8),
    ),
  };

  function buildJsonSchemes() {
    // Resolve an override palette from a hex color string.
    // Returns null when hex is undefined (no override for that role).
    function resolveOverridePalette(
      hex: string | undefined,
      role: "primaryPalette" | "neutralPalette" | "neutralVariantPalette",
    ) {
      if (!hex) return null;
      return new SchemeClass(Hct.fromInt(argbFromHex(hex)), false, 0)[role];
    }

    // Override palettes (isDark/contrast-invariant). Under colorMatch,
    // `SchemeClass` is `SchemeContent`: neutral / neutral variant overrides
    // then keep chroma `C/8` / `C/8 + 4` of their input.
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

      // One scheme per input color: override palette where specified, base
      // default otherwise, sourced on that input.
      function composedScheme(sourceColorArgb: number) {
        const composed = new DynamicScheme({
          sourceColorArgb,
          variant: schemeToVariant[scheme],
          contrastLevel: contrast,
          isDark,
          primaryPalette: baseScheme.primaryPalette,
          secondaryPalette: secPalette || baseScheme.secondaryPalette,
          tertiaryPalette: terPalette || baseScheme.tertiaryPalette,
          neutralPalette: neuPalette || baseScheme.neutralPalette,
          neutralVariantPalette: nvPalette || baseScheme.neutralVariantPalette,
        });
        if (errPalette) composed.errorPalette = errPalette;
        return composed;
      }

      // Each overridden core color's role group from the scheme sourced on
      // that override; every other token from the one sourced on the primary.
      // Under colorMatch, that scheme is `SchemeContent(input)` and the group
      // is read off its *primary* role group, so that `XContainer` lands on
      // the input's tone.
      const overrides = { secondary, tertiary, error };
      const roleGroupSources = colorMatch
        ? overriddenRoleGroups(
            overrides,
            (hex) =>
              new SchemeContent(
                Hct.fromInt(argbFromHex(hex)),
                isDark,
                contrast,
              ),
            "primary",
          )
        : overriddenRoleGroups(overrides, (hex) =>
            composedScheme(argbFromHex(hex)),
          );
      const colors = readRoles(
        FIXTURE_TOKEN_ORDER,
        composedScheme(effectiveSourceArgb),
        roleGroupSources,
      );

      // background/onBackground always from base scheme (primary-based)
      colors.background = MaterialDynamicColors.background.getArgb(baseScheme);
      colors.onBackground =
        MaterialDynamicColors.onBackground.getArgb(baseScheme);

      jsonSchemes[name] = Object.fromEntries(
        Object.entries(colors).map(([token, argb]) => [
          token,
          hexFromArgb(argb).toUpperCase(),
        ]),
      );
    }

    return jsonSchemes;
  }

  function rawPalettesToJson() {
    const jsonPalettes: Record<string, Record<string, string>> = {};

    // The 5 palette names used in JSON export (matches Material Theme Builder format)
    const RAW_PALETTE_NAMES = [
      "primary",
      "secondary",
      "tertiary",
      "neutral",
      "neutral-variant",
    ] as const;

    for (const name of RAW_PALETTE_NAMES) {
      const palette = rawPalettes[name];
      const tones: Record<string, string> = {};
      for (const tone of MTB_TONES) {
        tones[tone.toString()] = hexFromArgb(palette.tone(tone)).toUpperCase();
      }
      jsonPalettes[name] = tones;
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
    harmonized: c.blend ?? DEFAULT_BLEND,
  }));

  return {
    seed,
    coreColors,
    extendedColors,
    schemes: buildJsonSchemes(),
    palettes: rawPalettesToJson(),
  };
}
