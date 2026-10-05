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
import { DEFAULT_PREFIX, tokenNames } from "./tokens";

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

// The core colors an input can override, as ARGB. `primary` is not one of them:
// when given, it replaces the source the whole scheme is built from.
type CoreOverrides = {
  secondary?: number;
  tertiary?: number;
  error?: number;
  neutral?: number;
  neutralVariant?: number;
};

type ColorPalettes = Record<string, TonalPalette>;

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
  primary?: string;
  secondary?: string;
  tertiary?: string;
  neutral?: string;
  neutralVariant?: string;
  error?: string;
  /** The custom colors, each with its `blend` default applied. */
  hexCustomColors: Required<HexCustomColor>[];

  // The rendered scheme at any level -- the one construction behind
  // mergedColorsLight/Dark, for the exporters that need other levels than the
  // configured one (toJson() exports six)
  buildScheme: (isDark: boolean, contrast: number) => DynamicScheme;

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

//
// Merge the base Material Dynamic Colors with custom colors
//
// returns: { primary: 0xFF6200EE, onPrimary: 0xFFFFFFFF, ..., customColor1: 0xFF6200EF, customColor2: 0x00FF00, ... }
//

function mergeBaseAndCustomColors(
  scheme: DynamicScheme,
  customColorRoles: Record<string, Record<string, DynamicColor>>,
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
// The scheme every exporter renders, at one level (light or dark, at one
// contrast): toCss(), toJson().schemes and all the others read their system
// roles from this one construction, so they cannot disagree.
//
// A core-color override takes the palette the variant gives its own color (see
// docs/adr/0004-a-core-color-override-takes-the-palette-of-its-own-scheme.md):
// - `sourceArgb` is the effective source -- `primary` when given, else
//   `source`. Every palette that is not overridden comes from its scheme, the
//   primary palette always;
// - `secondary`, `tertiary` and `error` take the primary palette of the scheme
//   of their own color;
// - `neutral` and `neutralVariant` take the neutral and the neutral-variant
//   palette of the scheme of their own color.
//
function buildScheme(
  schemeName: SchemeName,
  sourceArgb: number,
  overrides: CoreOverrides,
  isDark: boolean,
  contrast: number,
) {
  const SchemeClass = schemesMap[schemeName];
  const schemeOf = (argb: number) =>
    new SchemeClass(Hct.fromInt(argb), isDark, contrast);

  const base = schemeOf(sourceArgb);
  const { secondary, tertiary, error, neutral, neutralVariant } = overrides;

  const scheme = new DynamicScheme({
    sourceColorArgb: sourceArgb,
    variant: schemeToVariant[schemeName],
    contrastLevel: contrast,
    isDark,
    primaryPalette: base.primaryPalette,
    secondaryPalette:
      secondary !== undefined
        ? schemeOf(secondary).primaryPalette
        : base.secondaryPalette,
    tertiaryPalette:
      tertiary !== undefined
        ? schemeOf(tertiary).primaryPalette
        : base.tertiaryPalette,
    neutralPalette:
      neutral !== undefined
        ? schemeOf(neutral).neutralPalette
        : base.neutralPalette,
    neutralVariantPalette:
      neutralVariant !== undefined
        ? schemeOf(neutralVariant).neutralVariantPalette
        : base.neutralVariantPalette,
  });

  // The DynamicScheme constructor does not accept an errorPalette: it has to
  // be set after creation
  if (error !== undefined) {
    scheme.errorPalette = schemeOf(error).primaryPalette;
  }

  return scheme;
}

//
// The palette of a custom color: its hue -- once harmonized with the effective
// source, when `blend` is set -- at the chroma of the scheme's primary palette.
//
function createCustomColorPalette(
  color: Required<HexCustomColor>,
  sourceArgb: number,
  chroma: number,
) {
  const colorArgb = argbFromHex(color.hex);
  const harmonizedArgb = color.blend
    ? Blend.harmonize(colorArgb, sourceArgb)
    : colorArgb;

  return TonalPalette.fromHueAndChroma(Hct.fromInt(harmonizedArgb).hue, chroma);
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

  // The effective source: `primary`, when given, replaces `source` as the color
  // the scheme is built from and custom colors are harmonized with
  const effectiveSourceArgb = argbFromHex(cores.primary ?? hexSource);

  const overrides: CoreOverrides = {};
  if (cores.secondary) overrides.secondary = argbFromHex(cores.secondary);
  if (cores.tertiary) overrides.tertiary = argbFromHex(cores.tertiary);
  if (cores.error) overrides.error = argbFromHex(cores.error);
  if (cores.neutral) overrides.neutral = argbFromHex(cores.neutral);
  if (cores.neutralVariant)
    overrides.neutralVariant = argbFromHex(cores.neutralVariant);

  const renderScheme = (isDark: boolean, contrastLevel: number) =>
    buildScheme(scheme, effectiveSourceArgb, overrides, isDark, contrastLevel);

  const lightScheme = renderScheme(false, contrast);
  const darkScheme = renderScheme(true, contrast);

  // Custom color palettes, keyed by custom color name
  const customColorPalettes: ColorPalettes = Object.fromEntries(
    hexCustomColors.map((color) => [
      color.name,
      createCustomColorPalette(
        color,
        effectiveSourceArgb,
        lightScheme.primaryPalette.chroma,
      ),
    ]),
  );

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
    ...customColorPalettes,
  };

  // The roles of each custom color, keyed by custom color name, then by token
  // name -- the custom-color counterpart of MaterialDynamicColors
  const customColorRoles = Object.fromEntries(
    hexCustomColors.map((color) => [
      color.name,
      buildCustomColorRoles(
        color.name,
        getPalette(customColorPalettes, color.name),
      ),
    ]),
  );

  const mergedColorsLight = mergeBaseAndCustomColors(
    lightScheme,
    customColorRoles,
  );
  const mergedColorsDark = mergeBaseAndCustomColors(
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
    primary,
    secondary,
    tertiary,
    neutral,
    neutralVariant,
    error,
    hexCustomColors,
    buildScheme: renderScheme,
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
