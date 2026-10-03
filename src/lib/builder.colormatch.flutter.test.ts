import { hexFromArgb } from "@material/material-color-utilities";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import fixture2 from "../fixtures/material-theme-builder/try-02.json";
import fixture5 from "../fixtures/material-theme-builder/try-05.json";
import { builder } from "./builder";

// Official Material Theme Builder Flutter exports (`theme.dart`), kept
// verbatim. Unlike the JSON export, they carry each custom color's four roles
// for every contrast level, in an `ExtendedColor` block per custom color.

const VARIANTS = [
  { name: "light", contrast: 0, isDark: false },
  { name: "lightMediumContrast", contrast: 0.5, isDark: false },
  { name: "lightHighContrast", contrast: 1, isDark: false },
  { name: "dark", contrast: 0, isDark: true },
  { name: "darkMediumContrast", contrast: 0.5, isDark: true },
  { name: "darkHighContrast", contrast: 1, isDark: true },
];

/** `name: Color(0xffrrggbb)` pairs, as `{ name: "#RRGGBB" }`. */
function readColors(dart: string) {
  const colors: Record<string, string> = {};
  for (const [, name = "", rgb = ""] of dart.matchAll(
    /(\w+): Color\(0xff([0-9a-f]{6})\)/gi,
  )) {
    colors[name] = `#${rgb.toUpperCase()}`;
  }
  return colors;
}

/**
 * Each `ExtendedColor` block of a `theme.dart`, by custom color name, as
 * `{ [variant]: { color, onColor, colorContainer, onColorContainer } }`.
 */
function readExtendedColors(dart: string) {
  const extendedColors: Record<
    string,
    Record<string, Record<string, string>>
  > = {};
  // Each block is preceded by a `/// <name>` doc comment.
  const blocks = dart.matchAll(
    /\/\/\/ (.+)\n\s+static const \w+ = ExtendedColor\(([\s\S]*?)\n\s+\);/g,
  );
  for (const [, name = "", body = ""] of blocks) {
    const families: Record<string, Record<string, string>> = {};
    for (const [, variant = "", family = ""] of body.matchAll(
      /(\w+): ColorFamily\(([\s\S]*?)\n\s+\),/g,
    )) {
      families[variant] = readColors(family);
    }
    extendedColors[name] = families;
  }
  return extendedColors;
}

const readDart = (file: string) =>
  readFileSync(
    join(import.meta.dirname, "../fixtures/material-theme-builder", file),
    "utf8",
  );

/** The `builder()` options a `try-0N.json` fixture was exported from. */
const optionsOf = (fixture: typeof fixture2 | typeof fixture5) => ({
  ...fixture.coreColors,
  customColors: fixture.extendedColors.map((color) => ({
    name: color.name,
    hex: color.color,
    blend: color.harmonized,
  })),
});

/** A role of `mergedColorsLight` / `mergedColorsDark`, as "#RRGGBB". */
function roleHex(colors: Record<string, number>, role: string) {
  const argb = colors[role];
  return argb === undefined ? undefined : hexFromArgb(argb).toUpperCase();
}

describe("builder › custom colors › official Flutter export", () => {
  describe.each([
    {
      dart: "try-02.colormatch.theme.dart",
      fixture: fixture2,
      colorMatch: true,
    },
    {
      dart: "try-05.colormatch.theme.dart",
      fixture: fixture5,
      colorMatch: true,
    },
    // Control: the same inputs with colorMatch off.
    { dart: "try-02.theme.dart", fixture: fixture2, colorMatch: false },
  ])("$dart (colorMatch: $colorMatch)", ({ dart, fixture, colorMatch }) => {
    const extendedColors = readExtendedColors(readDart(dart));

    it("should parse every custom color of the fixture", () => {
      expect(Object.keys(extendedColors)).toEqual(
        fixture.extendedColors.map((color) => color.name),
      );
    });

    it.each(VARIANTS)(
      "should match the official custom-color roles in $name",
      ({ name, contrast, isDark }) => {
        const theme = builder(fixture.seed, {
          ...optionsOf(fixture),
          colorMatch,
          contrast,
        });
        const merged = isDark
          ? theme.mergedColorsDark
          : theme.mergedColorsLight;

        for (const [colorName, families] of Object.entries(extendedColors)) {
          const capitalized =
            colorName.charAt(0).toUpperCase() + colorName.slice(1);
          expect({
            color: roleHex(merged, colorName),
            onColor: roleHex(merged, `on${capitalized}`),
            colorContainer: roleHex(merged, `${colorName}Container`),
            onColorContainer: roleHex(merged, `on${capitalized}Container`),
          }).toEqual(families[name]);
        }
      },
    );
  });
});
