import {
  hexFromArgb,
  type TonalPalette,
} from "@material/material-color-utilities";
import { kebabCase } from "lodash-es";

import type { BuilderContext } from "./builder";
import { deriveCustomPaletteName, STANDARD_TONES } from "./builder";

// ─── Shared helpers ──────────────────────────────────────────────────────

type RefPaletteLookup = Record<
  string,
  { paletteName: string; tone: number }[]
>;

function buildRefPaletteLookup(
  allPalettes: Record<string, TonalPalette>,
): RefPaletteLookup {
  const lookup: RefPaletteLookup = {};
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

function resolveSysColorValue(
  colorName: string,
  colorValue: number,
  prefix: string,
  lookup: RefPaletteLookup,
  tokenToPalette: Record<string, string>,
  allPaletteNamesKebab: Set<string>,
) {
  const hex = hexFromArgb(colorValue);
  const matches = lookup[hex];
  if (matches && matches.length > 0) {
    const preferred =
      tokenToPalette[colorName] ??
      deriveCustomPaletteName(colorName, allPaletteNamesKebab);
    const match =
      (preferred
        ? matches.find((m) => m.paletteName === preferred)
        : undefined) ?? matches[0];
    if (match) {
      return `var(--${prefix}-ref-palette-${match.paletteName}-${match.tone})`;
    }
  }
  return hex;
}

function buildSysColorVars(
  mergedColors: Record<string, number>,
  prefix: string,
  lookup: RefPaletteLookup,
  tokenToPalette: Record<string, string>,
  allPaletteNamesKebab: Set<string>,
) {
  const vars: Record<string, string> = {};
  for (const [name, value] of Object.entries(mergedColors)) {
    const prop = `--${prefix}-sys-color-${kebabCase(name)}`;
    vars[prop] = resolveSysColorValue(
      name,
      value,
      prefix,
      lookup,
      tokenToPalette,
      allPaletteNamesKebab,
    );
  }
  return vars;
}

function buildTonalVars(
  allPalettes: Record<string, TonalPalette>,
  prefix: string,
) {
  const vars: Record<string, string> = {};
  for (const [name, palette] of Object.entries(allPalettes)) {
    const paletteName = kebabCase(name);
    for (const tone of STANDARD_TONES) {
      const prop = `--${prefix}-ref-palette-${paletteName}-${tone}`;
      vars[prop] = hexFromArgb(palette.tone(tone));
    }
  }
  return vars;
}

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Generate CSS custom properties as a structured JS object keyed by selector.
 *
 * Returns `{ ":root": { ... }, ".dark": { ... } }` — ready for Tailwind's
 * `addBase()` or any other CssInJs consumer.
 */
export function buildCssInJs(ctx: BuilderContext) {
  const {
    prefix,
    allPalettes,
    mergedColorsLight,
    mergedColorsDark,
    tokenToPalette,
    allPaletteNamesKebab,
  } = ctx;

  const lookup = buildRefPaletteLookup(allPalettes);
  const tonalVars = buildTonalVars(allPalettes, prefix);

  const lightSys = buildSysColorVars(
    mergedColorsLight,
    prefix,
    lookup,
    tokenToPalette,
    allPaletteNamesKebab,
  );
  const darkSys = buildSysColorVars(
    mergedColorsDark,
    prefix,
    lookup,
    tokenToPalette,
    allPaletteNamesKebab,
  );

  return {
    ":root": { ...lightSys, ...tonalVars },
    ".dark": { ...darkSys, ...tonalVars },
  };
}

/**
 * Generate CSS custom properties (light + dark) from the builder context.
 */
export function buildCss(ctx: BuilderContext) {
  const rules = buildCssInJs(ctx);

  function toDeclarations(vars: Record<string, string>) {
    return Object.entries(vars)
      .map(([prop, value]) => `${prop}:${value};`)
      .join(" ");
  }

  return `
:root { ${toDeclarations(rules[":root"])} }
.dark { ${toDeclarations(rules[".dark"])} }
`;
}
