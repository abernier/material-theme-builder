import { describe, expect, it } from "vitest";
import { builder } from "./builder";

describe("builder › toFlutter()", () => {
  it("should generate a Dart file with import and color schemes", () => {
    const result = builder("#6750A4").toFlutter();
    expect(result).toContain("import 'package:flutter/material.dart';");
    expect(result).toContain("const lightColorScheme = ColorScheme(");
    expect(result).toContain("const darkColorScheme = ColorScheme(");
  });

  it("should include brightness for both schemes", () => {
    const result = builder("#6750A4").toFlutter();
    expect(result).toContain("brightness: Brightness.light,");
    expect(result).toContain("brightness: Brightness.dark,");
  });

  it("should include primary color in both schemes", () => {
    const result = builder("#6750A4").toFlutter();
    expect(result).toMatch(/primary: Color\(0xFF[0-9A-F]{6}\),/);
  });

  it("should use onInverseSurface instead of inverseOnSurface", () => {
    const result = builder("#6750A4").toFlutter();
    expect(result).toContain("onInverseSurface:");
    expect(result).not.toContain("inverseOnSurface:");
  });

  it("should have different color values in light and dark schemes", () => {
    const result = builder("#6750A4").toFlutter();
    // Extract primary color values from both schemes
    const primaryColors = [
      ...result.matchAll(/primary: Color\((0xFF[0-9A-F]{6})\)/g),
    ].map((m) => m[1]);

    // At least 2 primary entries (light + dark), and they should differ
    expect(primaryColors.length).toBeGreaterThanOrEqual(2);
    expect(primaryColors[0]).not.toBe(primaryColors[1]);
  });

  it("should include custom color constants", () => {
    const result = builder("#6750A4", {
      customColors: [{ name: "brand", hex: "#FF5733", blend: true }],
    }).toFlutter();
    expect(result).toMatch(/const lightBrand = Color\(0xFF[0-9A-F]{6}\);/);
    expect(result).toMatch(/const darkBrand = Color\(0xFF[0-9A-F]{6}\);/);
    expect(result).toMatch(/const lightOnBrand = Color\(0xFF[0-9A-F]{6}\);/);
    expect(result).toMatch(
      /const lightBrandContainer = Color\(0xFF[0-9A-F]{6}\);/,
    );
    expect(result).toMatch(
      /const lightOnBrandContainer = Color\(0xFF[0-9A-F]{6}\);/,
    );
  });

  it("should not include custom color section when there are no custom colors", () => {
    const result = builder("#6750A4").toFlutter();
    // Only lightColorScheme and darkColorScheme should be present
    const constCount = (result.match(/\bconst\b/g) ?? []).length;
    expect(constCount).toBe(2);
  });
});
