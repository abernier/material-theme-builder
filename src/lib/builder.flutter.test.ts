import { describe, expect, it } from "vitest";
import { builder } from "./builder";

describe("builder › toFlutter()", () => {
  it("should generate valid Dart output", () => {
    const result = builder("#6750A4").toFlutter();
    expect(result).toContain("import 'package:flutter/material.dart';");
    expect(result).toContain("const lightColorScheme = ColorScheme(");
    expect(result).toContain("const darkColorScheme = ColorScheme(");
    expect(result).toContain("onInverseSurface:");
    expect(result).not.toContain("inverseOnSurface:");
  });

  it("should produce deterministic output", () => {
    expect(builder("#6750A4").toFlutter()).toMatchSnapshot();
  });

  it("should produce deterministic output with custom colors", () => {
    expect(
      builder("#6750A4", {
        customColors: [{ name: "brand", hex: "#FF5733", blend: true }],
      }).toFlutter(),
    ).toMatchSnapshot();
  });
});
