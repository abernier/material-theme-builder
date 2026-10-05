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
import {
  buildShadcn,
  buildShadcnAliases,
  buildShadcnRegistryItem,
  type ShadcnRegistryItemOptions,
} from "./builder.shadcn";
import { buildTailwind, type TailwindOptions } from "./builder.tailwind";
import { DEFAULT_PREFIX, type TokenName, tokenNames } from "./tokens";

// ─── Re-exports (types defined alongside their exporter) ─────────────────

export type {
  ShadcnRegistryItem,
  ShadcnRegistryItemOptions,
  ShadcnTheme,
  ShadcnVarName,
} from "./builder.shadcn";

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
export type HexCustomColor = Omit<CustomColor, "value" | "blend"> & {
  hex: string;
  /**
   * Harmonize the color with the source (or `primary`, when given) -- "Harmonize"
   * in Material Theme Builder. Default: `DEFAULT_BLEND` (true).
   */
  blend?: boolean;
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
  /**
   * Color scheme variant. Default: "tonalSpot". Ignored for the core colors
   * when `colorMatch` is on.
   */
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
   * Color match mode for core colors -- "Color match - Stay true to my color
   * inputs" in Material Theme Builder. Default: `DEFAULT_COLOR_MATCH` (false).
   *
   * When true, each core color is rendered with the Content variant of its own
   * input, which keeps the input's chroma and puts the input itself in the
   * container role. When false, the core colors follow `scheme`.
   *
   * It takes precedence over `scheme`: Material Theme Builder has no scheme
   * selector, Color match off is tonal spot and on is content. Custom colors
   * are not affected: they are rendered as they are without `colorMatch`.
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
/** Default color match mode — off, the core colors follow the scheme. */
export const DEFAULT_COLOR_MATCH = false;
/** Default custom colors (none). */
export const DEFAULT_CUSTOM_COLORS: HexCustomColor[] = [];
/** Default blend mode — harmonize custom colors with source. */
export const DEFAULT_BLEND = true;

// ─── Hex validation ──────────────────────────────────────────────────────
//
// Material Color Utilities validates hex by *length alone*: it strips a leading
// `#`, accepts 3, 6 or 8 characters, and then runs `parseInt` on each pair --
// where a pair that is not hex yields `NaN` and lands as 0. So `argbFromHex`
// converts `banana` without complaint, into the same theme as `#ba0000`, and
// `bananas` is rejected only for being seven characters long.
//
// Every hex this module takes -- the source, the six core-color overrides, each
// custom color -- reaches `argbFromHex`, so every one of them has that hole.

const HEX_COLOR = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * Whether `value` is a hex color that converts to the color it spells.
 *
 * Exactly what Material Color Utilities accepts, minus what it only appears to:
 * the same three lengths, with the characters required to be hex digits. The CLI
 * reads it too, to refuse a bad value with one line instead of a stack trace.
 */
export function isHexColor(value: string) {
  return HEX_COLOR.test(value);
}

function assertHexColor(label: string, value: string) {
  if (!isHexColor(value))
    throw new Error(
      `Invalid ${label}: '${value}'. Expected a hex color — 3, 6 or 8 hex digits, with or without '#' (e.g. #6750A4).`,
    );
}

// Checked together at the entry, rather than at each of the five `argbFromHex`
// calls below: those run interleaved with real work, so a bad `customColors[2]`
// would be reported -- if at all -- after two palettes had been built, and the
// label naming which input was wrong would have to be reconstructed from
// whatever object happened to be in hand.
function assertHexInputs(
  source: string,
  cores: Record<string, string | undefined>,
  customColors: HexCustomColor[],
) {
  assertHexColor("source", source);

  for (const [name, hex] of Object.entries(cores))
    if (hex !== undefined) assertHexColor(name, hex);

  customColors.forEach((color, i) =>
    assertHexColor(`customColors[${i}].hex`, color.hex),
  );
}

/**
 * A core override as a UI hands it over, where "not set" arrives as `''`
 * rather than as a missing key -- a cleared color picker, an empty text field.
 *
 * Every override is optional, so a blank one is the *absence* of an override:
 * clearing the picker falls back to the palette generated from the source,
 * which is the only reading that isn't a dead end. (`source` itself is
 * required, so `''` there stays an error.)
 */
function optionalHex(hex: string | undefined) {
  return hex?.trim() || undefined;
}

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

/** The system roles of a scheme, as ARGB integers keyed by token name. */
type SystemRoles = Record<TokenName, number>;

/** The core-color overrides. */
type CoreColorOverrides = Pick<
  MtbConfig,
  "primary" | "secondary" | "tertiary" | "error" | "neutral" | "neutralVariant"
>;

/**
 * The reference palettes, keyed by kebab-case palette name: each one's colors
 * at every `STANDARD_TONES` tone, in that order.
 */
export type RefPalettes = Record<string, { tone: number; argb: number }[]>;

// ─── Builder context ─────────────────────────────────────────────────────

/** Shared state produced by builder() and consumed by output functions. */
export type BuilderContext = {
  // Config inputs
  hexSource: string;
  prefix: string;
  scheme: SchemeName;
  colorMatch: boolean;
  primary?: string;
  secondary?: string;
  tertiary?: string;
  neutral?: string;
  neutralVariant?: string;
  error?: string;
  /** The custom colors, each with its `blend` default applied. */
  hexCustomColors: Required<HexCustomColor>[];

  // Derived intermediates
  /** The core-color overrides, a blank one read as no override. */
  cores: CoreColorOverrides;
  effectiveSourceArgb: number;
  primaryHct: Hct;
  SchemeClass: SchemeConstructor;

  // Computed outputs (shared across toCss, toJson, toFigma)
  allPalettes: Record<string, TonalPalette>;
  refPalettes: RefPalettes;
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
// The roles of one custom color, as DynamicColor objects exactly like core
// colors:
// 1. <colorname>
// 2. on<Colorname>
// 3. <colorname>Container
// 4. on<Colorname>Container
//
// Based on Material Design 3 spec: https://m3.material.io/styles/color/roles
//
// returns: { customColor1: DynamicColor, onCustomColor1: DynamicColor, ... }
//

function buildCustomColorRoles(colorname: string, palette: TonalPalette) {
  const getPaletteForColor = () => palette;

  return {
    [colorname]: new DynamicColor(
      colorname,
      getPaletteForColor,
      (s) => (s.isDark ? 80 : 40), // Main color: lighter in dark mode, darker in light mode
      true, // background
    ),
    [`on${upperFirst(colorname)}`]: new DynamicColor(
      `on${upperFirst(colorname)}`,
      getPaletteForColor,
      (s) => (s.isDark ? 20 : 100), // Text on main color: high contrast (dark on light, light on dark)
      false,
    ),
    [`${colorname}Container`]: new DynamicColor(
      `${colorname}Container`,
      getPaletteForColor,
      (s) => (s.isDark ? 30 : 90), // Container: subtle variant (darker in dark mode, lighter in light mode)
      true, // background
    ),
    [`on${upperFirst(colorname)}Container`]: new DynamicColor(
      `on${upperFirst(colorname)}Container`,
      getPaletteForColor,
      (s) => (s.isDark ? 90 : 30), // Text on container: high contrast against container background
      false,
    ),
  };
}

/**
 * Base colors (all listed in tokenNames), as the scheme renders them.
 *
 * returns: { primary: 0xFF6200EE, onPrimary: 0xFFFFFFFF, ... }
 */
export function systemRoles(scheme: DynamicScheme) {
  // Cast: toRecord() is typed by Object.fromEntries(), which forgets the keys
  return toRecord(tokenNames, (tokenName) => {
    const dynamicColor = MaterialDynamicColors[tokenName];
    const argb = dynamicColor.getArgb(scheme);
    return [tokenName, argb];
  }) as SystemRoles;
}

//
// Merge the base Material Dynamic Colors with custom colors
//
// returns: { primary: 0xFF6200EE, onPrimary: 0xFFFFFFFF, ..., customColor1: 0xFF6200EF, customColor2: 0x00FF00, ... }
//

function mergeBaseAndCustomColors(
  baseVars: SystemRoles,
  scheme: DynamicScheme,
  customColorRoles: Record<string, Record<string, DynamicColor>>,
): Record<string, number> {
  //
  // Custom colors: get the ARGB values using the scheme - exactly like core
  // colors do
  //
  const customVars: Record<string, number> = {};
  for (const roles of Object.values(customColorRoles)) {
    for (const [tokenName, dynamicColor] of Object.entries(roles)) {
      customVars[tokenName] = dynamicColor.getArgb(scheme);
    }
  }

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

// The roles of each accent, mapped to the primary role they are read from on
// the Content scheme of the accent's own color (see buildColorMatchScheme).
const colorMatchAccentRoles = {
  secondary: {
    secondary: "primary",
    onSecondary: "onPrimary",
    secondaryContainer: "primaryContainer",
    onSecondaryContainer: "onPrimaryContainer",
    secondaryFixed: "primaryFixed",
    secondaryFixedDim: "primaryFixedDim",
    onSecondaryFixed: "onPrimaryFixed",
    onSecondaryFixedVariant: "onPrimaryFixedVariant",
  },
  tertiary: {
    tertiary: "primary",
    onTertiary: "onPrimary",
    tertiaryContainer: "primaryContainer",
    onTertiaryContainer: "onPrimaryContainer",
    tertiaryFixed: "primaryFixed",
    tertiaryFixedDim: "primaryFixedDim",
    onTertiaryFixed: "onPrimaryFixed",
    onTertiaryFixedVariant: "onPrimaryFixedVariant",
  },
  error: {
    error: "primary",
    onError: "onPrimary",
    errorContainer: "primaryContainer",
    onErrorContainer: "onPrimaryContainer",
  },
} satisfies Record<
  "secondary" | "tertiary" | "error",
  Partial<Record<TokenName, TokenName>>
>;

/**
 * The scheme of Material Theme Builder's "Color match", for one `isDark` and
 * one contrast level: the system roles, and the scheme holding the palettes
 * they are drawn from.
 *
 * Color match is the Content variant, applied per core color (see
 * docs/adr/0003-color-match-is-the-content-variant-per-core-color.md):
 *
 * - the base is the Content scheme of the source (`primary`, when given);
 * - an overridden accent (`secondary`, `tertiary`, `error`) takes the primary
 *   roles of the Content scheme of its own color;
 * - an overridden `neutral` or `neutralVariant` takes the palette of that name
 *   from the Content scheme of its own color, its roles keeping their tones.
 *
 * Shared by builder() (the rendered light and dark schemes) and toJson() (the
 * six schemes of the export), so the two cannot disagree.
 *
 * @param sourceArgb the effective source: `primary` when given, else `source`
 * @param overrides the other core-color overrides, `primary` being the source
 */
export function buildColorMatchScheme(
  sourceArgb: number,
  overrides: Omit<CoreColorOverrides, "primary">,
  isDark: boolean,
  contrast: number,
) {
  const base = new SchemeContent(Hct.fromInt(sourceArgb), isDark, contrast);

  // The Content scheme of a core color, when it is overridden
  const contentScheme = (hex: string | undefined) =>
    hex
      ? new SchemeContent(Hct.fromInt(argbFromHex(hex)), isDark, contrast)
      : undefined;

  // One Content scheme per overridden core color. A single scheme given the
  // override palettes would not do: the Content container tones follow the
  // scheme's source color, which has to be the accent's own color.
  const secondary = contentScheme(overrides.secondary);
  const tertiary = contentScheme(overrides.tertiary);
  const error = contentScheme(overrides.error);
  const neutral = contentScheme(overrides.neutral);
  const neutralVariant = contentScheme(overrides.neutralVariant);

  // The scheme holding the palettes the roles are drawn from: the reference
  // palettes (see docs/adr/0001-reference-palettes-are-the-scheme-palettes.md)
  const scheme = new DynamicScheme({
    sourceColorArgb: sourceArgb,
    variant: Variant.CONTENT,
    contrastLevel: contrast,
    isDark,
    primaryPalette: base.primaryPalette,
    secondaryPalette: secondary?.primaryPalette ?? base.secondaryPalette,
    tertiaryPalette: tertiary?.primaryPalette ?? base.tertiaryPalette,
    neutralPalette: neutral?.neutralPalette ?? base.neutralPalette,
    neutralVariantPalette:
      neutralVariant?.neutralVariantPalette ?? base.neutralVariantPalette,
  });

  // Note: DynamicScheme constructor doesn't accept errorPalette as parameter
  // We need to set it after creation
  if (error) scheme.errorPalette = error.primaryPalette;

  // Every role as that scheme renders it, `background` and `onBackground`
  // included (see docs/adr/0002-json-background-follows-the-rendered-scheme.md)...
  const roles = systemRoles(scheme);

  // ...but the roles of an overridden accent, read from its own Content scheme
  const accentSchemes = { secondary, tertiary, error };
  for (const accent of ["secondary", "tertiary", "error"] as const) {
    const accentScheme = accentSchemes[accent];
    if (!accentScheme) continue;

    for (const [tokenName, primaryTokenName] of Object.entries(
      colorMatchAccentRoles[accent],
    )) {
      roles[tokenName as TokenName] =
        MaterialDynamicColors[primaryTokenName].getArgb(accentScheme);
    }
  }

  return { scheme, roles };
}

// The reference palettes are, by definition, the palettes the system roles are
// drawn from (see docs/adr/0001-reference-palettes-are-the-scheme-palettes.md).
// Both `--{prefix}-ref-palette-*` in toCss() and `palettes` in toJson() are
// read from here, so the two outputs cannot disagree (#175).
function buildRefPalettes(allPalettes: Record<string, TonalPalette>) {
  const refPalettes: RefPalettes = {};
  for (const [name, palette] of Object.entries(allPalettes)) {
    refPalettes[kebabCase(name)] = STANDARD_TONES.map((tone) => ({
      tone,
      argb: palette.tone(tone),
    }));
  }
  return refPalettes;
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
    colorMatch = DEFAULT_COLOR_MATCH,
    customColors: customColorInputs = DEFAULT_CUSTOM_COLORS,
    prefix = DEFAULT_PREFIX,
  }: Omit<MtbConfig, "source"> = {},
) {
  const cores = {
    primary: optionalHex(primary),
    secondary: optionalHex(secondary),
    tertiary: optionalHex(tertiary),
    error: optionalHex(error),
    neutral: optionalHex(neutral),
    neutralVariant: optionalHex(neutralVariant),
  };

  assertHexInputs(hexSource, cores, customColorInputs);

  // `blend` may be omitted. Its default is applied here, once, so that the
  // palette, the roles and every exporter's metadata read the same value: the
  // palette used to read the raw `blend` (an omitted one meaning "don't
  // harmonize") while toJson() reported `blend ?? DEFAULT_BLEND`.
  const hexCustomColors = customColorInputs.map((c) => ({
    ...c,
    blend: c.blend ?? DEFAULT_BLEND,
  }));

  const sourceArgb = argbFromHex(hexSource);

  // Determine the effective source for harmonization
  // When primary is defined, it becomes the effective source
  const effectiveSource = cores.primary || hexSource;
  const effectiveSourceArgb = argbFromHex(effectiveSource);
  const effectiveSourceForHarmonization = cores.primary
    ? argbFromHex(cores.primary)
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
      hex: cores.primary,
      core: true,
      chromaSource: "primary",
    },
    {
      name: "secondary",
      hex: cores.secondary,
      core: true,
      chromaSource: "primary",
    },
    {
      name: "tertiary",
      hex: cores.tertiary,
      core: true,
      chromaSource: "primary",
    },
    { name: "error", hex: cores.error, core: true, chromaSource: "primary" },
    {
      name: "neutral",
      hex: cores.neutral,
      core: true,
      chromaSource: "neutral",
    },
    {
      name: "neutralVariant",
      hex: cores.neutralVariant,
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
  const errorPalette = colorPalettes["error"];

  // The rendered scheme for one `isDark`: its system roles, and the scheme
  // holding the palettes they are drawn from.
  function renderScheme(isDark: boolean) {
    // Color match takes precedence over `scheme` (MTB has no scheme selector:
    // off is tonal spot, on is content). The custom colors do not follow: they
    // keep the palettes built above, from the `scheme` base.
    if (colorMatch) {
      return buildColorMatchScheme(
        effectiveSourceArgb,
        cores,
        isDark,
        contrast,
      );
    }

    const scheme = new DynamicScheme({ ...schemeConfig, isDark });

    // Note: DynamicScheme constructor doesn't accept errorPalette as parameter
    // We need to set it after creation
    if (errorPalette) scheme.errorPalette = errorPalette;

    return { scheme, roles: systemRoles(scheme) };
  }

  const { scheme: lightScheme, roles: lightRoles } = renderScheme(false);
  const { scheme: darkScheme, roles: darkRoles } = renderScheme(true);

  // The palettes the system roles are drawn from: the reference palettes of
  // toCss() and toJson(). They follow the scheme variant (eg SchemeTonalSpot
  // clamps chroma), which MTB's own JSON export palettes do not (see
  // docs/adr/0001-reference-palettes-are-the-scheme-palettes.md).
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
      value: argbFromHex(c.hex),
    }));

  // The roles of each custom color, keyed by custom color name, then by token
  // name -- the custom-color counterpart of MaterialDynamicColors
  const customColorRoles = Object.fromEntries(
    customColors.map((color) => [
      color.name,
      buildCustomColorRoles(color.name, getPalette(colorPalettes, color.name)),
    ]),
  );

  const mergedColorsLight = mergeBaseAndCustomColors(
    lightRoles,
    lightScheme,
    customColorRoles,
  );
  const mergedColorsDark = mergeBaseAndCustomColors(
    darkRoles,
    darkScheme,
    customColorRoles,
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

  const refPalettes = buildRefPalettes(allPalettes);

  const allPaletteNamesKebab = new Set(Object.keys(allPalettes).map(kebabCase));

  // ── Build context ─────────────────────────────────────────────────────
  const ctx = {
    hexSource,
    prefix,
    scheme,
    colorMatch,
    primary,
    secondary,
    tertiary,
    neutral,
    neutralVariant,
    error,
    hexCustomColors,
    cores,
    effectiveSourceArgb,
    primaryHct,
    SchemeClass,
    allPalettes,
    refPalettes,
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
    toShadcnRegistryItem: (options?: ShadcnRegistryItemOptions) =>
      buildShadcnRegistryItem(ctx, options),
    toFlutter: () => buildFlutter(ctx),
    mergedColorsLight,
    mergedColorsDark,
    allPalettes,
    customColorRoles,
  };
}
