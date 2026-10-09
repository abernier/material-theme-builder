import {
  blueFromArgb,
  greenFromArgb,
  hexFromArgb,
  redFromArgb,
} from "@material/material-color-utilities";
import { kebabCase, startCase } from "lodash-es";

import type { BuilderContext } from "./builder";
import {
  deriveCustomPaletteName,
  isTokenName,
  STANDARD_TONES,
  tokenDescriptions,
} from "./builder";
import { SHADCN_MAPPING } from "./builder.shadcn";

// ─── Figma token types ───────────────────────────────────────────────────

/** DTCG color value (direct, non-alias) */
export type DtcgColorValue = {
  colorSpace: string;
  components: number[];
  alpha: number;
  hex: string;
};

/** A single DTCG color token */
export type DtcgColorToken = {
  $type: "color";
  $value: string | DtcgColorValue;
  $description?: string;
  $extensions: Record<string, unknown>;
};

/** A palette group: tone number → token */
export type DtcgPaletteGroup = Record<string, DtcgColorToken>;

/** Structure of a single mode file (Light or Dark) */
export type FigmaTokenModeFile = {
  $extensions: { "com.figma.modeName": string };
  ref: {
    palette: Record<string, DtcgPaletteGroup>;
  };
  sys: {
    color: Record<string, DtcgColorToken>;
  };
  shadcn: Record<string, DtcgColorToken>;
};

/** Return type of builder().toFigmaTokens() */
export type FigmaTokens = {
  "Light.tokens.json": FigmaTokenModeFile;
  "Dark.tokens.json": FigmaTokenModeFile;
};

// ─── Figma variable types (derived from toFigmaVariables output) ────────

/** Direct RGBA color value for a Figma variable */
export type FigmaVariableColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

/** Alias reference to another Figma variable by path */
export type FigmaVariableAlias = { alias: string };

/** A per-mode value: either a direct color or an alias */
export type FigmaVariableValue = FigmaVariableColor | FigmaVariableAlias;

/** A flat variable descriptor ready for the Figma Variables API */
export type FigmaVariable = {
  path: string;
  description?: string;
  scopes?: string[];
  values: Record<string, FigmaVariableValue>;
};

/**
 * Build a flat array of Figma variable descriptors from the builder context.
 *
 * This is the primary data source — `buildFigmaTokens` derives the DTCG
 * tree from this list.
 */
export function buildFigmaVariables(ctx: BuilderContext) {
  // Figma Variables compatible format using M3 token architecture:
  //   ref/palette/* — Reference Tokens (Tier 1): raw tonal palette values
  //   sys/color/*   — System Tokens (Tier 2): semantic roles referencing palette tones
  //   shadcn/*      — the shadcn remap, referencing sys roles
  //
  // see: https://m3.material.io/foundations/design-tokens/overview

  const {
    allPalettes,
    mergedColorsLight,
    mergedColorsDark,
    tokenToPalette,
    allPaletteNamesKebab,
  } = ctx;

  const variables: FigmaVariable[] = [];

  // ── ref/palette/* — direct color values, mode-independent ──

  // hex→path lookup grouped by palette, for alias resolution
  const paletteHexMap: Record<string, Record<string, string>> = {};

  for (const [name, palette] of Object.entries(allPalettes)) {
    const paletteName = startCase(name);
    paletteHexMap[paletteName] = {};

    for (const tone of STANDARD_TONES) {
      const argb = palette.tone(tone);
      const path = `ref/palette/${paletteName}/${tone}`;
      const hex = hexFromArgb(argb).toUpperCase();

      paletteHexMap[paletteName][hex] = path;

      const color = {
        r: redFromArgb(argb) / 255,
        g: greenFromArgb(argb) / 255,
        b: blueFromArgb(argb) / 255,
        a: 1,
      };
      variables.push({
        path,
        scopes: ["ALL_SCOPES"],
        values: { Light: color, Dark: color },
      });
    }
  }

  // ── Alias resolution ──
  // Prefers the semantically correct palette via tokenToPalette,
  // falls back to any palette match
  function findAlias(hex: string, tokenName: string) {
    const preferredKebab =
      tokenToPalette[tokenName] ??
      deriveCustomPaletteName(tokenName, allPaletteNamesKebab);
    const preferred = preferredKebab ? startCase(preferredKebab) : undefined;

    if (preferred && paletteHexMap[preferred]?.[hex]) {
      return paletteHexMap[preferred][hex];
    }

    for (const palHexes of Object.values(paletteHexMap)) {
      if (palHexes[hex]) return palHexes[hex];
    }

    return null;
  }

  function resolveValue(argb: number, tokenName: string) {
    const hex = hexFromArgb(argb).toUpperCase();
    const aliasPath = findAlias(hex, tokenName);
    if (aliasPath) return { alias: aliasPath };
    return {
      r: redFromArgb(argb) / 255,
      g: greenFromArgb(argb) / 255,
      b: blueFromArgb(argb) / 255,
      a: 1,
    } satisfies FigmaVariableValue;
  }

  // ── sys/color/* — aliases or direct colors, mode-specific ──

  for (const [name, lightArgb] of Object.entries(mergedColorsLight)) {
    const darkArgb = mergedColorsDark[name] ?? lightArgb;
    const description = isTokenName(name) ? tokenDescriptions[name] : undefined;

    variables.push({
      path: `sys/color/${startCase(name)}`,
      ...(description ? { description } : {}),
      scopes: ["ALL_SCOPES"],
      values: {
        Light: resolveValue(lightArgb, name),
        Dark: resolveValue(darkArgb, name),
      },
    });
  }

  // ── shadcn/* — aliases onto sys/color/*, one alias for both modes ──
  //
  // The third reader of SHADCN_MAPPING, next to `toShadcn()` and
  // `toTailwind({ shadcn: true })`. Designers lay out shadcn components in
  // Figma with the same vocabulary developers write — `Card`, `Muted`,
  // `Chart 1` — and because all three exports read the one table, a name
  // cannot mean one M3 role in Figma and another in the CSS.
  //
  // Aliases rather than values, and the *same* alias in both modes: the sys
  // token they point at is what carries the mode, exactly as
  // `--card: var(--md-sys-color-surface-container-low)` does in the remap.
  // Dark is not a second set of colors here, it is the same reference read
  // under a second mode.

  const sysPaths = new Set(variables.map((v) => v.path));

  for (const [cssVar, m3Token] of SHADCN_MAPPING) {
    const alias = `sys/color/${startCase(m3Token)}`;
    if (!sysPaths.has(alias)) {
      throw new Error(
        `M3 token '${m3Token}' is missing from the scheme, needed by '${cssVar}'. This is likely a bug in the implementation.`,
      );
    }

    variables.push({
      path: `shadcn/${startCase(cssVar.slice(2))}`,
      description: `shadcn ${cssVar}, backed by the M3 ${m3Token} role.`,
      scopes: ["ALL_SCOPES"],
      values: { Light: { alias }, Dark: { alias } },
    });
  }

  return variables;
}

// ── buildFigmaTokens ────────────────────────────────────────────────────
// Derives the DTCG token tree from the flat variable list.
// The flat list (buildFigmaVariables) is the primary data source;
// this reconstructs the nested tree for JSON/DTCG export.

/**
 * Build DTCG-compliant Figma token files (Light + Dark) from the builder context.
 */
export function buildFigmaTokens(ctx: BuilderContext) {
  const { prefix } = ctx;
  const variables = buildFigmaVariables(ctx);

  function rgbToHex(r: number, g: number, b: number) {
    const toHex = (c: number) =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  function toDtcgValue(modeValue: FigmaVariableValue) {
    if ("alias" in modeValue) {
      // "ref/palette/Primary/80" → "{ref.palette.Primary.80}"
      return `{${modeValue.alias.replaceAll("/", ".")}}`;
    }
    return {
      colorSpace: "srgb",
      components: [modeValue.r, modeValue.g, modeValue.b],
      alpha: modeValue.a,
      hex: rgbToHex(modeValue.r, modeValue.g, modeValue.b),
    };
  }

  function toDtcgExtensions(v: FigmaVariable) {
    if (v.path.startsWith("ref/palette/")) {
      return {
        "com.figma.scopes": v.scopes ?? ["ALL_SCOPES"],
        "com.figma.isOverride": true,
      };
    }
    const lastSegment = v.path.split("/").at(-1);
    if (!lastSegment) return { "com.figma.scopes": v.scopes ?? ["ALL_SCOPES"] };
    const tokenName = kebabCase(lastSegment);

    // shadcn's variable names are fixed and unprefixed — `prefix` renames the
    // M3 layer, not the vocabulary M3 is remapped onto. `Chart 1` → `--chart-1`.
    if (v.path.startsWith("shadcn/")) {
      return {
        "com.figma.scopes": v.scopes ?? ["ALL_SCOPES"],
        "css.variable": `--${tokenName}`,
      };
    }

    return {
      "com.figma.scopes": v.scopes ?? ["ALL_SCOPES"],
      "css.variable": `--${prefix}-sys-color-${tokenName}`,
    };
  }

  function buildToken(v: FigmaVariable, modeValue: FigmaVariableValue) {
    return {
      $type: "color" as const,
      $value: toDtcgValue(modeValue),
      ...(v.description ? { $description: v.description } : {}),
      $extensions: toDtcgExtensions(v),
    };
  }

  function parsePath(path: string) {
    const parts = path.split("/");
    if (parts[0] === "ref" && parts[1] === "palette" && parts[2] && parts[3]) {
      return {
        kind: "palette" as const,
        paletteName: parts[2],
        tone: parts[3],
      };
    }
    if (parts[0] === "sys" && parts[1] === "color" && parts[2]) {
      return { kind: "color" as const, tokenName: parts[2] };
    }
    if (parts[0] === "shadcn" && parts[1]) {
      return { kind: "shadcn" as const, tokenName: parts[1] };
    }
    return null;
  }

  function buildModeFile(modeName: string) {
    const palette: Record<string, DtcgPaletteGroup> = {};
    const color: Record<string, DtcgColorToken> = {};
    const shadcn: Record<string, DtcgColorToken> = {};

    for (const v of variables) {
      const modeValue = v.values[modeName];
      if (!modeValue) continue;

      const parsed = parsePath(v.path);
      if (!parsed) continue;

      if (parsed.kind === "palette") {
        const group = (palette[parsed.paletteName] ??= {});
        group[parsed.tone] = buildToken(v, modeValue);
      } else if (parsed.kind === "shadcn") {
        shadcn[parsed.tokenName] = buildToken(v, modeValue);
      } else {
        color[parsed.tokenName] = buildToken(v, modeValue);
      }
    }

    return {
      $extensions: { "com.figma.modeName": modeName },
      ref: { palette },
      sys: { color },
      shadcn,
    };
  }

  return {
    "Light.tokens.json": buildModeFile("Light"),
    "Dark.tokens.json": buildModeFile("Dark"),
  };
}
