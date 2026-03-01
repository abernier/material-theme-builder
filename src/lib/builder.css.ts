import {
  hexFromArgb,
  type TonalPalette,
} from "@material/material-color-utilities";
import { kebabCase } from "lodash-es";

import type { BuilderContext } from "./builder";
import { deriveCustomPaletteName, STANDARD_TONES } from "./builder";

/**
 * Generate CSS custom properties (light + dark) from the builder context.
 */
export function buildCss(ctx: BuilderContext) {
  const {
    prefix,
    allPalettes,
    mergedColorsLight,
    mergedColorsDark,
    tokenToPalette,
    allPaletteNamesKebab,
  } = ctx;

  // Build a lookup: hex → array of {paletteName, tone}
  // Uses the same tone computation as generateTonalPaletteVars so that
  // var() references resolve to the correct palette variable in each CSS rule.
  function buildRefPaletteLookup() {
    const lookup: Record<string, { paletteName: string; tone: number }[]> = {};
    for (const [name, palette] of Object.entries(allPalettes)) {
      const paletteName = kebabCase(name);
      for (const tone of STANDARD_TONES) {
        const hex = hexFromArgb(palette.tone(tone));
        if (!lookup[hex]) lookup[hex] = [];
        lookup[hex].push({ paletteName, tone });
      }
    }
    return lookup;
  }

  type RefPaletteLookup = ReturnType<typeof buildRefPaletteLookup>;

  // Scheme tokens: --{prefix}-sys-color-<name>
  // Resolves to var(--{prefix}-ref-palette-<palette>-<tone>) when a
  // matching tonal-palette variable exists; falls back to raw hex.
  function sysColorVar(
    colorName: string,
    colorValue: number,
    lookup: RefPaletteLookup,
  ) {
    const name = `--${prefix}-sys-color-${kebabCase(colorName)}`;
    const hex = hexFromArgb(colorValue);
    const matches = lookup[hex];
    if (matches && matches.length > 0) {
      // Prefer the semantically correct palette via tokenToPalette,
      // fall back to custom color palette derivation, then first match
      const preferred =
        tokenToPalette[colorName] ??
        deriveCustomPaletteName(colorName, allPaletteNamesKebab);
      const match =
        (preferred
          ? matches.find((m) => m.paletteName === preferred)
          : undefined) ?? matches[0];
      if (match) {
        return `${name}:var(--${prefix}-ref-palette-${match.paletteName}-${match.tone});`;
      }
    }
    return `${name}:${hex};`;
  }

  function toCssVars(
    mergedColors: Record<string, number>,
    lookup: RefPaletteLookup,
  ) {
    return Object.entries(mergedColors)
      .map(([name, value]) => sysColorVar(name, value, lookup))
      .join(" ");
  }

  // Tonal palette tokens: --{prefix}-ref-palette-<name>-<tone>
  function refPaletteVar(
    paletteName: string,
    tone: number,
    colorValue: number,
  ) {
    const name = `--${prefix}-ref-palette-${paletteName}-${tone}`;
    const value = hexFromArgb(colorValue);
    return `${name}:${value};`;
  }

  function generateTonalPaletteVars(
    paletteName: string,
    palette: TonalPalette,
  ) {
    return STANDARD_TONES.map((tone) => {
      const color = palette.tone(tone);
      return refPaletteVar(paletteName, tone, color);
    }).join(" ");
  }

  // Generate tonal palette CSS variables for all colors (core + custom)
  function generateTonalVars() {
    return Object.entries(allPalettes)
      .map(([name, palette]) =>
        generateTonalPaletteVars(kebabCase(name), palette),
      )
      .join(" ");
  }

  // Build ref palette lookup (mode-independent since tonal values are constant)
  const refPaletteLookup = buildRefPaletteLookup();

  const lightVars = toCssVars(mergedColorsLight, refPaletteLookup);
  const darkVars = toCssVars(mergedColorsDark, refPaletteLookup);

  const tonalVars = generateTonalVars();

  return `
:root { ${lightVars} ${tonalVars} }
.dark { ${darkVars} ${tonalVars} }
`;
}
