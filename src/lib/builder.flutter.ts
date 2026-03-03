import { hexFromArgb } from "@material/material-color-utilities";
import { upperFirst } from "lodash-es";

import type { BuilderContext } from "./builder";

// Flutter ColorScheme property order matching Material Theme Builder export
const FLUTTER_PROPERTIES = [
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
] as const;

// M3 token name → Flutter ColorScheme property name
// Only entries that differ need to be listed
const TOKEN_TO_FLUTTER: Record<string, string> = {
  inverseOnSurface: "onInverseSurface",
};

function toFlutterColor(argb: number) {
  const hex = hexFromArgb(argb).replace("#", "").toUpperCase();
  return `Color(0xFF${hex})`;
}

function flutterPropName(m3Token: string) {
  return TOKEN_TO_FLUTTER[m3Token] ?? m3Token;
}

/**
 * Generate Flutter/Dart `ColorScheme` code from the builder context.
 *
 * Produces a Dart file with `lightColorScheme` and `darkColorScheme`
 * constants, plus additional `Color` constants for any custom colors.
 */
export function buildFlutter(ctx: BuilderContext) {
  const { mergedColorsLight, mergedColorsDark, hexCustomColors } = ctx;

  function buildColorScheme(
    name: string,
    brightness: "light" | "dark",
    colors: Record<string, number>,
  ) {
    const lines: string[] = [];
    lines.push(`const ${name} = ColorScheme(`);
    lines.push(`  brightness: Brightness.${brightness},`);

    for (const token of FLUTTER_PROPERTIES) {
      const argb = colors[token];
      if (argb === undefined) continue;
      lines.push(`  ${flutterPropName(token)}: ${toFlutterColor(argb)},`);
    }

    lines.push(");");
    return lines.join("\n");
  }

  // Custom color constants (outside ColorScheme)
  function buildCustomColors() {
    if (hexCustomColors.length === 0) return "";

    const sections: string[] = [];

    for (const cc of hexCustomColors) {
      const ccName = cc.name;
      const tokens = [
        ccName,
        `on${upperFirst(ccName)}`,
        `${ccName}Container`,
        `on${upperFirst(ccName)}Container`,
      ];

      const lightLines: string[] = [];
      const darkLines: string[] = [];

      for (const token of tokens) {
        const lightArgb = mergedColorsLight[token];
        const darkArgb = mergedColorsDark[token];
        if (lightArgb !== undefined) {
          lightLines.push(
            `const light${upperFirst(token)} = ${toFlutterColor(lightArgb)};`,
          );
        }
        if (darkArgb !== undefined) {
          darkLines.push(
            `const dark${upperFirst(token)} = ${toFlutterColor(darkArgb)};`,
          );
        }
      }

      sections.push([...lightLines, ...darkLines].join("\n"));
    }

    return "\n\n" + sections.join("\n\n");
  }

  const header = "import 'package:flutter/material.dart';";
  const light = buildColorScheme(
    "lightColorScheme",
    "light",
    mergedColorsLight,
  );
  const dark = buildColorScheme("darkColorScheme", "dark", mergedColorsDark);
  const custom = buildCustomColors();

  return `${header}\n\n${light}\n\n${dark}${custom}\n`;
}
