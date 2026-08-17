import {
  argbFromHex,
  Blend,
  type CustomColor,
  DynamicColor,
  DynamicScheme,
  Hct,
  MaterialDynamicColors,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeTonalSpot,
  SchemeVibrant,
  TonalPalette,
} from "@material/material-color-utilities";
import { kebabCase, upperFirst } from "lodash-es";

import { buildCss } from "./builder.css";
import { buildFigmaTokens, buildFigmaVariables } from "./builder.figma";
import { buildFlutter } from "./builder.flutter";
import { buildJson } from "./builder.json";
import { buildShadcn, buildShadcnAliases } from "./builder.shadcn";
import { buildTailwind, type TailwindOptions } from "./builder.tailwind";
import { DEFAULT_PREFIX, tokenNames } from "./tokens";

// ─── Re-exports (types defined alongside their exporter) ─────────────────

export type { ShadcnTheme, ShadcnVarName } from "./builder.shadcn";

// The M3 vocabulary lives in `./tokens` — a leaf module the Tailwind plugin can
// import without pulling the color engine in — and is re-exported here so
// `./lib/builder` stays the one place the rest of the codebase reads it from.
export {
  DEFAULT_PREFIX,
  isTokenName,
  tokenDescriptions,
  tokenNames,
} from "./tokens";
export type { TokenName } from "./tokens";

export type {
  DtcgColorToken,
  DtcgColorValue,
  DtcgPaletteGroup,
  FigmaTokenModeFile,
  FigmaTokens,
  FigmaVariable,
  FigmaVariableAlias,
  FigmaVariableColor,
  FigmaVariableValue,
} from "./builder.figma";

// ─── Public types ────────────────────────────────────────────────────────

/** A custom color defined with a hex string instead of an ARGB integer. */
export type HexCustomColor = Omit<CustomColor, "value"> & {
  hex: string;
};

type SchemeConstructor = new (
  sourceColorHct: Hct,
  isDark: boolean,
  contrastLevel: number,
) => DynamicScheme;

/** Available Material You color scheme variants. */
export const schemeNames = [
  "tonalSpot",
  "monochrome",
  "neutral",
  "vibrant",
  "expressive",
  "fidelity",
  "content",
] as const;
type SchemeName = (typeof schemeNames)[number];

const schemesMap = {
  tonalSpot: SchemeTonalSpot,
  monochrome: SchemeMonochrome,
  neutral: SchemeNeutral,
  vibrant: SchemeVibrant,
  expressive: SchemeExpressive,
  fidelity: SchemeFidelity,
  content: SchemeContent,
} satisfies Record<SchemeName, SchemeConstructor>;

/** Configuration for the Material Theme Builder. */
export type MtbConfig = {
  /** Source color in hex format (e.g., "#6750A4") used to generate the color scheme */
  source: string;
  /** Color scheme variant. Default: "tonalSpot" */
  scheme?: SchemeName;
  /** Contrast level from -1.0 (reduced) to 1.0 (increased). Default: 0 (standard) */
  contrast?: number;
  /** Primary color - the main brand color. Overrides the default palette generation. */
  primary?: string;
  /** Secondary color - accent color. Overrides the default palette generation. */
  secondary?: string;
  /** Tertiary color - additional accent color. Overrides the default palette generation. */
  tertiary?: string;
  /** Neutral color - used for surfaces. Overrides the default palette generation. */
  neutral?: string;
  /** Neutral variant color - used for surfaces with slight tint. Overrides the default palette generation. */
  neutralVariant?: string;
  /** Error color - used for error states. Overrides the default palette generation. */
  error?: string;
  /**
   * Color match mode for core colors.
   * When true, stays true to input colors without harmonization.
   * When false (default), colors may be adjusted for better harmonization.
   * Corresponds to "Color match - Stay true to my color inputs" in Material Theme Builder.
   *
   * @deprecated Not yet implemented. This prop is currently ignored.
   */
  colorMatch?: boolean;
  /**
   * Array of custom colors to include in the generated palette.
   * Each custom color can be blended with the source color for harmonization.
   *
   * @see https://m3.material.io/blog/dynamic-color-harmony
   */
  customColors?: HexCustomColor[];
  /**
   * Prefix for generated CSS custom properties and Figma token css.variable extensions.
   * Scheme tokens use `--{prefix}-sys-color-*`, palette tones use `--{prefix}-ref-palette-*`.
   * Default: "md" (Material Design convention).
   */
  prefix?: string;
};

/**
 * @deprecated Renamed `MtbConfig` — same shape. This alias will be removed in
 * the next major.
 */
export type McuConfig = MtbConfig;

// ─── Constants ───────────────────────────────────────────────────────────

/** Default color scheme variant. */
export const DEFAULT_SCHEME = "tonalSpot" satisfies SchemeName;
/** Default contrast level (standard). */
export const DEFAULT_CONTRAST = 0;
/** Default custom colors (none). */
export const DEFAULT_CUSTOM_COLORS: HexCustomColor[] = [];
/** Default blend mode — harmonize custom colors with source. */
export const DEFAULT_BLEND = true;

/**
 * The 28 standard tone values used in Material You tonal palettes.
 *
 * Tones are perceptual lightness in HCT, which is why the same tone reads as
 * the same contrast across hues.
 *
 * @see https://m3.material.io/blog/science-of-color-design
 */
export const STANDARD_TONES = [
  0, 4, 5, 6, 10, 12, 15, 17, 20, 22, 24, 25, 30, 35, 40, 50, 60, 70, 80, 87,
  90, 92, 94, 95, 96, 98, 99, 100,
] as const;

// Material You schemes map to variant numbers according to the spec
const Variant = {
  MONOCHROME: 0,
  NEUTRAL: 1,
  TONAL_SPOT: 2,
  VIBRANT: 3,
  EXPRESSIVE: 4,
  FIDELITY: 5,
  CONTENT: 6,
  RAINBOW: 7,
  FRUIT_SALAD: 8,
} as const;

/** Maps each scheme name to its Material You variant number. */
export const schemeToVariant = {
  monochrome: Variant.MONOCHROME,
  neutral: Variant.NEUTRAL,
  tonalSpot: Variant.TONAL_SPOT,
  vibrant: Variant.VIBRANT,
  expressive: Variant.EXPRESSIVE,
  fidelity: Variant.FIDELITY,
  content: Variant.CONTENT,
} satisfies Record<SchemeName, number>;

// ─── Internal types ──────────────────────────────────────────────────────

type ColorDefinition = {
  name: string;
  hex?: string;
  blend?: boolean;
  core?: boolean;
  chromaSource?: "primary" | "neutral" | "neutralVariant";
};

type ColorPalettes = Record<string, TonalPalette>;

// ─── Builder context ─────────────────────────────────────────────────────

/** Shared state produced by builder() and consumed by output functions. */
export type BuilderContext = {
  // Config inputs
  hexSource: string;
  prefix: string;
  scheme: SchemeName;
  primary?: string;
  secondary?: string;
  tertiary?: string;
  neutral?: string;
  neutralVariant?: string;
  error?: string;
  hexCustomColors: HexCustomColor[];

  // Derived intermediates
  sourceHct: Hct;
  effectiveSourceArgb: number;
  primaryHct: Hct;
  SchemeClass: SchemeConstructor;

  // Computed outputs (shared across toCss, toJson, toFigma)
  allPalettes: Record<string, TonalPalette>;
  mergedColorsLight: Record<string, number>;
  mergedColorsDark: Record<string, number>;
  tokenToPalette: Record<string, string>;
  allPaletteNamesKebab: Set<string>;
};

// ─── Shared utilities ────────────────────────────────────────────────────

/**
 * Derive the preferred palette name for a custom color token.
 */
export function deriveCustomPaletteName(
  tokenName: string,
  allPaletteNamesKebab: Set<string>,
) {
  let baseName = tokenName;
  if (/^on[A-Z]/.test(baseName) && baseName.length > 2) {
    baseName = baseName.charAt(2).toLowerCase() + baseName.slice(3);
  }
  if (baseName.endsWith("Container")) {
    baseName = baseName.slice(0, -"Container".length);
  }
  const kebab = kebabCase(baseName);
  return allPaletteNamesKebab.has(kebab) ? kebab : undefined;
}

// ─── Internal helpers ────────────────────────────────────────────────────

function toRecord<T, K extends string, V>(
  arr: readonly T[],
  getEntry: (item: T) => readonly [K, V],
) {
  return Object.fromEntries(arr.map(getEntry));
}

function getPalette(palettes: ColorPalettes, colorName: string) {
  const palette = palettes[colorName];
  if (!palette) {
    throw new Error(
      `Custom color palette not found for '${colorName}'. This is likely a bug in the implementation.`,
    );
  }
  return palette;
}

//
// Merge the base Material Dynamic Colors with custom colors
//
// returns: { primary: 0xFF6200EE, onPrimary: 0xFFFFFFFF, ..., customColor1: 0xFF6200EF, customColor2: 0x00FF00, ... }
//

function mergeBaseAndCustomColors(
  scheme: DynamicScheme,
  customColors: CustomColor[],
  colorPalettes: ColorPalettes,
) {
  //
  // Base colors (all listed in tokenNames)
  //
  // returns: { primary: 0xFF6200EE, onPrimary: 0xFFFFFFFF, ... }
  //
  const baseVars = toRecord(tokenNames, (tokenName) => {
    const dynamicColor = MaterialDynamicColors[tokenName];
    const argb = dynamicColor.getArgb(scheme);
    return [tokenName, argb];
  });

  //
  // Custom colors - using MaterialDynamicColors-like approach
  //
  // For each custom color, generate DynamicColor objects exactly like core colors:
  // 1. <colorname>
  // 2. on-<colorname>
  // 3. <colorname>-container
  // 4. on-<colorname>-container
  //
  // Based on Material Design 3 spec: https://m3.material.io/styles/color/roles
  //
  const customVars: Record<string, number> = {};

  customColors.forEach((color) => {
    const colorname = color.name;

    // Helper to get palette for this color
    const getPaletteForColor = () => getPalette(colorPalettes, colorname);

    // Create DynamicColor objects for all 4 color roles
    const colorDynamicColor = new DynamicColor(
      colorname,
      getPaletteForColor,
      (s) => (s.isDark ? 80 : 40), // Main color: lighter in dark mode, darker in light mode
      true, // background
    );
    const onColorDynamicColor = new DynamicColor(
      `on${upperFirst(colorname)}`,
      getPaletteForColor,
      (s) => (s.isDark ? 20 : 100), // Text on main color: high contrast (dark on light, light on dark)
      false,
    );
    const containerDynamicColor = new DynamicColor(
      `${colorname}Container`,
      getPaletteForColor,
      (s) => (s.isDark ? 30 : 90), // Container: subtle variant (darker in dark mode, lighter in light mode)
      true, // background
    );
    const onContainerDynamicColor = new DynamicColor(
      `on${upperFirst(colorname)}Container`,
      getPaletteForColor,
      (s) => (s.isDark ? 90 : 30), // Text on container: high contrast against container background
      false,
    );

    // Get the ARGB values using the scheme - exactly like core colors do
    customVars[colorname] = colorDynamicColor.getArgb(scheme);
    customVars[`on${upperFirst(colorname)}`] =
      onColorDynamicColor.getArgb(scheme);
    customVars[`${colorname}Container`] = containerDynamicColor.getArgb(scheme);
    customVars[`on${upperFirst(colorname)}Container`] =
      onContainerDynamicColor.getArgb(scheme);
  });

  // Merge both
  return { ...baseVars, ...customVars };
}

//
// Helper function to create a palette for any color (core or custom)
// This unifies the logic between core colors and custom colors
//
function createColorPalette(
  colorDef: ColorDefinition & { hex: string },
  baseScheme: DynamicScheme,
  effectiveSourceForHarmonization: number,
) {
  // Get the color value, applying harmonization if needed
  const colorArgb = argbFromHex(colorDef.hex);
  const harmonizedArgb = colorDef.blend
    ? Blend.harmonize(colorArgb, effectiveSourceForHarmonization)
    : colorArgb;

  const hct = Hct.fromInt(harmonizedArgb);

  // Determine which chroma to use based on color type
  let targetChroma: number;
  if (colorDef.core && colorDef.chromaSource) {
    // Core colors use specific chroma values from the base scheme
    if (colorDef.chromaSource === "neutral") {
      targetChroma = baseScheme.neutralPalette.chroma;
    } else if (colorDef.chromaSource === "neutralVariant") {
      targetChroma = baseScheme.neutralVariantPalette.chroma;
    } else {
      // primary chroma for primary, secondary, tertiary, error
      targetChroma = baseScheme.primaryPalette.chroma;
    }
  } else {
    // Custom colors use primary chroma (same as before)
    targetChroma = baseScheme.primaryPalette.chroma;
  }

  return TonalPalette.fromHueAndChroma(hct.hue, targetChroma);
}

// Maps each MaterialDynamicColors property to its source palette name
// by comparing palette references from the scheme.
function buildTokenToPaletteMap(
  schemePalettes: [string, TonalPalette][],
  scheme: DynamicScheme,
) {
  const result: Record<string, string> = {};
  for (const propName of Object.getOwnPropertyNames(MaterialDynamicColors)) {
    const dc = Object.getOwnPropertyDescriptor(
      MaterialDynamicColors,
      propName,
    )?.value;
    if (!(dc instanceof DynamicColor)) continue;
    const palette = dc.palette(scheme);
    for (const [palName, pal] of schemePalettes) {
      if (palette === pal) {
        result[propName] = palName;
        break;
      }
    }
  }
  return result;
}

//
// ██████  ██    ██ ██ ██      ██████  ███████ ██████
// ██   ██ ██    ██ ██ ██      ██   ██ ██      ██   ██
// ██████  ██    ██ ██ ██      ██   ██ █████   ██████
// ██   ██ ██    ██ ██ ██      ██   ██ ██      ██   ██
// ██████   ██████  ██ ███████ ██████  ███████ ██   ██
//

/**
 * Build a Material You color theme from a hex source color.
 *
 * Returns an object with lazy accessors for CSS, JSON, Figma variables,
 * and Figma DTCG tokens.
 *
 * @example
 * ```ts
 * const theme = builder("#6750A4");
 * const css = theme.toCss();
 * const json = theme.toJson();
 * ```
 */
export function builder(
  hexSource: MtbConfig["source"],
  {
    scheme = DEFAULT_SCHEME,
    contrast = DEFAULT_CONTRAST,
    primary,
    secondary,
    tertiary,
    neutral,
    neutralVariant,
    error,
    customColors: hexCustomColors = DEFAULT_CUSTOM_COLORS,
    prefix = DEFAULT_PREFIX,
  }: Omit<MtbConfig, "source"> = {},
) {
  const sourceArgb = argbFromHex(hexSource);
  const sourceHct = Hct.fromInt(sourceArgb);

  // Determine the effective source for harmonization
  // When primary is defined, it becomes the effective source
  const effectiveSource = primary || hexSource;
  const effectiveSourceArgb = argbFromHex(effectiveSource);
  const effectiveSourceForHarmonization = primary
    ? argbFromHex(primary)
    : sourceArgb;

  // Create a base scheme to get the standard chroma values
  const SchemeClass = schemesMap[scheme];
  const primaryHct = Hct.fromInt(effectiveSourceArgb);
  const baseScheme = new SchemeClass(primaryHct, false, contrast);

  // Unified color processing: Combine core colors and custom colors, filter to only those with hex defined
  const allColors: ColorDefinition[] = [
    // Core colors (hex may be undefined)
    {
      name: "primary",
      hex: primary,
      core: true,
      chromaSource: "primary",
    },
    {
      name: "secondary",
      hex: secondary,
      core: true,
      chromaSource: "primary",
    },
    {
      name: "tertiary",
      hex: tertiary,
      core: true,
      chromaSource: "primary",
    },
    { name: "error", hex: error, core: true, chromaSource: "primary" },
    {
      name: "neutral",
      hex: neutral,
      core: true,
      chromaSource: "neutral",
    },
    {
      name: "neutralVariant",
      hex: neutralVariant,
      core: true,
      chromaSource: "neutralVariant",
    },
    //
    // Custom colors
    //
    ...hexCustomColors.map((c) => ({
      name: c.name,
      hex: c.hex,
      blend: c.blend,
      core: false,
    })),
  ];

  const definedColors = allColors.filter(
    (c): c is ColorDefinition & { hex: string } => c.hex !== undefined,
  );

  // Create palettes for all defined colors
  const colorPalettes = Object.fromEntries(
    definedColors.map((colorDef) => [
      colorDef.name,
      createColorPalette(colorDef, baseScheme, effectiveSourceForHarmonization),
    ]),
  );

  // Create schemes with core color palettes (or defaults from baseScheme)
  // Since source is always required, we always have a base to work from
  const variant = schemeToVariant[scheme];
  const schemeConfig = {
    sourceColorArgb: effectiveSourceArgb,
    variant,
    contrastLevel: contrast,
    primaryPalette: colorPalettes["primary"] || baseScheme.primaryPalette,
    secondaryPalette: colorPalettes["secondary"] || baseScheme.secondaryPalette,
    tertiaryPalette: colorPalettes["tertiary"] || baseScheme.tertiaryPalette,
    neutralPalette: colorPalettes["neutral"] || baseScheme.neutralPalette,
    neutralVariantPalette:
      colorPalettes["neutralVariant"] || baseScheme.neutralVariantPalette,
  };
  const lightScheme = new DynamicScheme({ ...schemeConfig, isDark: false });
  const darkScheme = new DynamicScheme({ ...schemeConfig, isDark: true });

  // Note: DynamicScheme constructor doesn't accept errorPalette as parameter
  // We need to set it after creation
  const errorPalette = colorPalettes["error"];
  if (errorPalette) {
    lightScheme.errorPalette = errorPalette;
    darkScheme.errorPalette = errorPalette;
  }

  // Scheme-transformed palettes used by toCss() for CSS variables.
  // These match what MTB displays visually (eg SchemeTonalSpot clamps chroma),
  // NOT what it exports in JSON (see rawPalettes inside toJson()).
  const allPalettes = {
    primary: lightScheme.primaryPalette,
    secondary: lightScheme.secondaryPalette,
    tertiary: lightScheme.tertiaryPalette,
    error: lightScheme.errorPalette,
    neutral: lightScheme.neutralPalette,
    "neutral-variant": lightScheme.neutralVariantPalette,
    // Add custom color palettes
    ...Object.fromEntries(
      definedColors
        .filter((c) => !c.core)
        .map((colorDef) => [colorDef.name, colorPalettes[colorDef.name]]),
    ),
  };

  // Extract custom colors (non-core) for merging
  const customColors = definedColors
    .filter((c) => !c.core)
    .map((c) => ({
      name: c.name,
      blend: c.blend ?? DEFAULT_BLEND,
      value: argbFromHex(c.hex),
    }));

  const mergedColorsLight = mergeBaseAndCustomColors(
    lightScheme,
    customColors,
    colorPalettes,
  );
  const mergedColorsDark = mergeBaseAndCustomColors(
    darkScheme,
    customColors,
    colorPalettes,
  );

  // ── Shared token→palette mapping ──────────────────────────────────────
  const schemePalettes: [string, TonalPalette][] = [
    ["primary", lightScheme.primaryPalette],
    ["secondary", lightScheme.secondaryPalette],
    ["tertiary", lightScheme.tertiaryPalette],
    ["error", lightScheme.errorPalette],
    ["neutral", lightScheme.neutralPalette],
    ["neutral-variant", lightScheme.neutralVariantPalette],
  ];
  const tokenToPalette = buildTokenToPaletteMap(schemePalettes, lightScheme);

  const allPaletteNamesKebab = new Set(Object.keys(allPalettes).map(kebabCase));

  // ── Build context ─────────────────────────────────────────────────────
  const ctx = {
    hexSource,
    prefix,
    scheme,
    primary,
    secondary,
    tertiary,
    neutral,
    neutralVariant,
    error,
    hexCustomColors,
    sourceHct,
    effectiveSourceArgb,
    primaryHct,
    SchemeClass,
    allPalettes,
    mergedColorsLight,
    mergedColorsDark,
    tokenToPalette,
    allPaletteNamesKebab,
  } satisfies BuilderContext;

  return {
    toCss: () => buildCss(ctx),
    toJson: () => buildJson(ctx),
    toFigmaVariables: () => buildFigmaVariables(ctx),
    toFigmaTokens: () => buildFigmaTokens(ctx),
    toTailwind: (options?: TailwindOptions) => buildTailwind(ctx, options),
    toShadcn: () => buildShadcn(ctx),
    toShadcnAliases: () => buildShadcnAliases(ctx),
    toFlutter: () => buildFlutter(ctx),
    mergedColorsLight,
    mergedColorsDark,
    allPalettes,
  };
}
