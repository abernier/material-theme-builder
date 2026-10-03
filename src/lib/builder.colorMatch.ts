// Material Theme Builder's "Color match -- Stay true to my color inputs".
//
// Reproduced from MTB web itself (its compiled `main.dart.js`), not designed
// here. With the toggle off, MTB builds every scheme as `tonalSpot`; with it
// on, as `content` -- whose primary palette keeps the color's own chroma, and
// whose containers take the color's own tone. And MTB never merges the core
// colors into one scheme: each one it is given gets a scheme of its own, and
// the roles of its group are read off that scheme:
//
// - the primary (or, without one, the source) makes the base scheme, which
//   supplies every role nobody overrode -- and, always, `background` and
//   `onBackground`, even when a neutral is given;
// - an overridden secondary, tertiary or error is read as the *primary* of its
//   own scheme;
// - an overridden neutral, or neutral variant, supplies the surfaces, or the
//   surface variants and outlines, of its own scheme.
//
// Custom colors follow MTB's Flutter export: harmonized first when `blend` is
// set, then read as the primary of their own scheme, at standard contrast.
//
// Parity is checked against MTB's own output: see `color-match-*.json` in
// `src/fixtures/material-theme-builder/`.

import {
  Blend,
  DynamicScheme,
  Hct,
  MaterialDynamicColors,
  SchemeContent,
  type TonalPalette,
} from "@material/material-color-utilities";
import { upperFirst } from "lodash-es";

import { tokenNames, type TokenName } from "./tokens";

/** The core color inputs, as ARGB. `primary` is the primary, or the source. */
export type MatchedInputs = {
  primary: number;
  secondary?: number;
  tertiary?: number;
  error?: number;
  neutral?: number;
  neutralVariant?: number;
};

/** A custom color, as ARGB, and whether it is harmonized. */
export type MatchedCustomColor = {
  name: string;
  value: number;
  blend: boolean;
};

// The roles of a group that an override takes over, read off the override's
// own scheme with the roles in `PRIMARY_ROLES`, position by position.
const PRIMARY_ROLES = [
  "primary",
  "onPrimary",
  "primaryContainer",
  "onPrimaryContainer",
  "primaryFixed",
  "onPrimaryFixed",
  "primaryFixedDim",
  "onPrimaryFixedVariant",
] as const satisfies readonly TokenName[];

const SECONDARY_ROLES = [
  "secondary",
  "onSecondary",
  "secondaryContainer",
  "onSecondaryContainer",
  "secondaryFixed",
  "onSecondaryFixed",
  "secondaryFixedDim",
  "onSecondaryFixedVariant",
] as const satisfies readonly TokenName[];

const TERTIARY_ROLES = [
  "tertiary",
  "onTertiary",
  "tertiaryContainer",
  "onTertiaryContainer",
  "tertiaryFixed",
  "onTertiaryFixed",
  "tertiaryFixedDim",
  "onTertiaryFixedVariant",
] as const satisfies readonly TokenName[];

const ERROR_ROLES = [
  "error",
  "onError",
  "errorContainer",
  "onErrorContainer",
] as const satisfies readonly TokenName[];

const NEUTRAL_ROLES = [
  "surface",
  "onSurface",
  "shadow",
  "scrim",
  "inverseSurface",
  "inverseOnSurface",
  "surfaceDim",
  "surfaceBright",
  "surfaceContainerLowest",
  "surfaceContainerLow",
  "surfaceContainer",
  "surfaceContainerHigh",
  "surfaceContainerHighest",
] as const satisfies readonly TokenName[];

const NEUTRAL_VARIANT_ROLES = [
  "surfaceVariant",
  "onSurfaceVariant",
  "outline",
  "outlineVariant",
] as const satisfies readonly TokenName[];

// Always from the base scheme, whatever is overridden.
const BASE_ROLES = [
  "surfaceTint",
  "inversePrimary",
  "background",
  "onBackground",
] as const satisfies readonly TokenName[];

function contentScheme(argb: number, isDark: boolean, contrast: number) {
  return new SchemeContent(Hct.fromInt(argb), isDark, contrast);
}

/**
 * The 49 scheme colors MTB computes with color match on, for one brightness
 * and contrast level.
 */
export function matchedSchemeColors(
  inputs: MatchedInputs,
  isDark: boolean,
  contrast: number,
) {
  const schemeOf = (argb: number) => contentScheme(argb, isDark, contrast);
  const base = schemeOf(inputs.primary);
  const colors: Partial<Record<TokenName, number>> = {};

  function read(
    tokens: readonly TokenName[],
    roles: readonly TokenName[],
    scheme: DynamicScheme,
  ) {
    tokens.forEach((token, i) => {
      const role = roles[i] ?? token;
      colors[token] = MaterialDynamicColors[role].getArgb(scheme);
    });
  }

  // An overridden accent is the primary of its own scheme; otherwise, the
  // base scheme's own role.
  function readAccent(tokens: readonly TokenName[], override?: number) {
    if (override === undefined) read(tokens, tokens, base);
    else read(tokens, PRIMARY_ROLES, schemeOf(override));
  }

  // An overridden neutral keeps its roles, read off its own scheme.
  function readNeutral(tokens: readonly TokenName[], override?: number) {
    read(tokens, tokens, override === undefined ? base : schemeOf(override));
  }

  read(PRIMARY_ROLES, PRIMARY_ROLES, base);
  read(BASE_ROLES, BASE_ROLES, base);
  readAccent(SECONDARY_ROLES, inputs.secondary);
  readAccent(TERTIARY_ROLES, inputs.tertiary);
  readAccent(ERROR_ROLES, inputs.error);
  readNeutral(NEUTRAL_ROLES, inputs.neutral);
  readNeutral(NEUTRAL_VARIANT_ROLES, inputs.neutralVariant);

  // In the canonical token order, like the schemes built without color match.
  return Object.fromEntries(
    tokenNames.map((token) => [token, colors[token] ?? 0]),
  ) as Record<TokenName, number>;
}

/**
 * The tonal palettes behind `matchedSchemeColors()`, as a scheme -- the shape
 * the rest of the builder reads palettes from, and maps tokens to them with.
 */
export function matchedPaletteScheme(inputs: MatchedInputs) {
  const schemeOf = (argb: number) => contentScheme(argb, false, 0);
  const base = schemeOf(inputs.primary);
  const accent = (fallback: TonalPalette, override?: number) =>
    override === undefined ? fallback : schemeOf(override).primaryPalette;

  const scheme = new DynamicScheme({
    sourceColorArgb: inputs.primary,
    variant: base.variant,
    contrastLevel: 0,
    isDark: false,
    primaryPalette: base.primaryPalette,
    secondaryPalette: accent(base.secondaryPalette, inputs.secondary),
    tertiaryPalette: accent(base.tertiaryPalette, inputs.tertiary),
    neutralPalette:
      inputs.neutral === undefined
        ? base.neutralPalette
        : schemeOf(inputs.neutral).neutralPalette,
    neutralVariantPalette:
      inputs.neutralVariant === undefined
        ? base.neutralVariantPalette
        : schemeOf(inputs.neutralVariant).neutralVariantPalette,
  });
  scheme.errorPalette = accent(base.errorPalette, inputs.error);

  return scheme;
}

/**
 * Custom colors with color match on: palette, and four roles per brightness,
 * the way MTB's Flutter export computes them.
 *
 * @param harmonizeWith the color a blended custom color is harmonized with --
 *   the primary, or the source
 */
export function matchedCustomColors(
  customColors: MatchedCustomColor[],
  harmonizeWith: number,
) {
  const palettes: Record<string, TonalPalette> = {};
  const light: Record<string, number> = {};
  const dark: Record<string, number> = {};

  for (const { name, value, blend } of customColors) {
    const argb = blend ? Blend.harmonize(value, harmonizeWith) : value;

    for (const [isDark, vars] of [
      [false, light],
      [true, dark],
    ] as const) {
      const scheme = contentScheme(argb, isDark, 0);
      if (!isDark) palettes[name] = scheme.primaryPalette;

      const get = (role: TokenName) =>
        MaterialDynamicColors[role].getArgb(scheme);
      vars[name] = get("primary");
      vars[`on${upperFirst(name)}`] = get("onPrimary");
      vars[`${name}Container`] = get("primaryContainer");
      vars[`on${upperFirst(name)}Container`] = get("onPrimaryContainer");
    }
  }

  return { palettes, light, dark };
}
