import { describe, expect, it } from "vitest";
import { builder } from "./builder";

/** Parse a `ColorScheme(...)` block into a property→value map. */
function parseSchemeBlock(lines: string[]) {
  const props: Record<string, string> = {};
  for (const line of lines.slice(1)) {
    if (line === ");" || line === "") continue;
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    props[line.slice(0, colonIdx).trim()] = line
      .slice(colonIdx + 1)
      .trim()
      .replace(/,$/, "");
  }
  return props;
}

/** Parse standalone `const <name> = Color(...);` lines. */
function parseConstLines(lines: string[]) {
  const constants: Record<string, string> = {};
  for (const line of lines) {
    if (!line.startsWith("const ") || !line.includes(" = Color(")) continue;
    const eqIdx = line.indexOf(" = ");
    constants[line.slice(6, eqIdx)] = line.slice(eqIdx + 3).replace(/;$/, "");
  }
  return constants;
}

/**
 * Parse the Dart output into structured data for assertions.
 *
 * Returns `{ schemes, constants }` where:
 * - `schemes` maps scheme names (e.g. "lightColorScheme") to their property→value pairs
 * - `constants` maps constant names (e.g. "lightBrand") to their Color values
 */
function parseDartOutput(dart: string) {
  const schemes: Record<string, Record<string, string>> = {};
  let constants: Record<string, string> = {};

  for (const block of dart.split("\n\n")) {
    const lines = block.split("\n").map((l) => l.trim());
    const header = lines[0] ?? "";

    if (header.startsWith("const ") && header.includes("ColorScheme(")) {
      const name = header.replace("const ", "").replace(" = ColorScheme(", "");
      schemes[name] = parseSchemeBlock(lines);
    } else {
      constants = { ...constants, ...parseConstLines(lines) };
    }
  }

  return { schemes, constants };
}

describe("builder › toFlutter()", () => {
  it("should generate a Dart file with import and color schemes", () => {
    const result = builder("#6750A4").toFlutter();
    expect(result).toContain("import 'package:flutter/material.dart';");
    expect(result).toContain("const lightColorScheme = ColorScheme(");
    expect(result).toContain("const darkColorScheme = ColorScheme(");
  });

  it("should include brightness for both schemes", () => {
    const { schemes } = parseDartOutput(builder("#6750A4").toFlutter());
    const light = schemes["lightColorScheme"];
    const dark = schemes["darkColorScheme"];
    expect(light).toBeDefined();
    expect(dark).toBeDefined();
    if (!light || !dark) return;
    expect(light["brightness"]).toBe("Brightness.light");
    expect(dark["brightness"]).toBe("Brightness.dark");
  });

  it("should include primary color in both schemes", () => {
    const { schemes } = parseDartOutput(builder("#6750A4").toFlutter());
    const light = schemes["lightColorScheme"];
    const dark = schemes["darkColorScheme"];
    expect(light).toBeDefined();
    expect(dark).toBeDefined();
    if (!light || !dark) return;
    expect(light["primary"]).toBe("Color(0xFF65558F)");
    expect(dark["primary"]).toBe("Color(0xFFCFBDFE)");
  });

  it("should use onInverseSurface instead of inverseOnSurface", () => {
    const { schemes } = parseDartOutput(builder("#6750A4").toFlutter());
    for (const scheme of Object.values(schemes)) {
      expect(scheme).toHaveProperty("onInverseSurface");
      expect(scheme).not.toHaveProperty("inverseOnSurface");
    }
  });

  it("should have different color values in light and dark schemes", () => {
    const { schemes } = parseDartOutput(builder("#6750A4").toFlutter());
    const light = schemes["lightColorScheme"];
    const dark = schemes["darkColorScheme"];
    expect(light).toBeDefined();
    expect(dark).toBeDefined();
    if (!light || !dark) return;
    expect(light["primary"]).not.toBe(dark["primary"]);
  });

  it("should include custom color constants", () => {
    const { constants } = parseDartOutput(
      builder("#6750A4", {
        customColors: [{ name: "brand", hex: "#FF5733", blend: true }],
      }).toFlutter(),
    );
    expect(constants).toHaveProperty("lightBrand");
    expect(constants).toHaveProperty("darkBrand");
    expect(constants).toHaveProperty("lightOnBrand");
    expect(constants).toHaveProperty("lightBrandContainer");
    expect(constants).toHaveProperty("lightOnBrandContainer");
  });

  it("should not include custom color section when there are no custom colors", () => {
    const { constants } = parseDartOutput(builder("#6750A4").toFlutter());
    expect(Object.keys(constants)).toHaveLength(0);
  });

  it("should produce deterministic output", () => {
    const result = builder("#6750A4").toFlutter();
    expect(result).toMatchSnapshot();
  });
});
