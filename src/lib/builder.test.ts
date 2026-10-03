import {
  argbFromHex,
  Blend,
  Hct,
  hexFromArgb,
} from "@material/material-color-utilities";
import { describe, expect, it } from "vitest";

import { builder, isHexColor, type MtbConfig } from "./builder";

const SOURCE = "#6750A4";

// Material Color Utilities validates hex by length alone, so `banana` used to be
// accepted and themed as `#ba0000` -- the `na` pairs parsing as `NaN` and landing
// as 0. Nothing here tests our regex against itself; what is checked is that
// `builder()` refuses the strings MCU would have quietly reinterpreted, and still
// accepts every form it legitimately reads.
describe("builder() › hex validation", () => {
  it.each([
    // the two that motivated this: 6 and 3 characters, all wrong
    ["banana", "#ba0000"],
    ["zzz", "#000"],
  ])("should refuse %s, which MCU would read as %s", (value) => {
    expect(() => builder(value)).toThrow(`Invalid source: '${value}'`);
  });

  it.each([["bananas"], ["#12345"], ["#zzzzzz"], [""], ["#"]])(
    "should refuse %s",
    (value) => {
      expect(() => builder(value)).toThrow(/^Invalid source:/);
    },
  );

  it("should say what it expected", () => {
    expect(() => builder("banana")).toThrow(
      /Expected a hex color — 3, 6 or 8 hex digits, with or without '#'/,
    );
  });

  // The list that must not shrink: every spelling MCU converts to the color it
  // spells is still ours to accept.
  it.each([
    ["#6750A4"],
    ["6750A4"],
    ["#6750a4"],
    ["#abc"],
    ["abc"],
    ["#6750A4FF"],
    ["6750a4ff"],
    ["#Ff5733"],
  ])("should accept %s", (value) => {
    expect(() => builder(value)).not.toThrow();
  });

  // Each override reaches `argbFromHex` too, and each is a different thing to be
  // told about -- which is why the message names the one that was wrong rather
  // than reporting "invalid color" from somewhere in the middle of a palette.
  it.each([
    ["primary"],
    ["secondary"],
    ["tertiary"],
    ["error"],
    ["neutral"],
    ["neutralVariant"],
  ])("should refuse a bad %s override, and name it", (option) => {
    expect(() => builder(SOURCE, { [option]: "banana" })).toThrow(
      `Invalid ${option}: 'banana'`,
    );
  });

  it("should name the custom color by its index", () => {
    expect(() =>
      builder(SOURCE, {
        customColors: [
          { name: "ok", hex: "#FF5733", blend: true },
          { name: "bad", hex: "banana", blend: true },
        ],
      }),
    ).toThrow("Invalid customColors[1].hex: 'banana'");
  });

  it("should still accept a valid custom color", () => {
    expect(() =>
      builder(SOURCE, {
        customColors: [{ name: "brand", hex: "#FF5733", blend: true }],
      }),
    ).not.toThrow();
  });

  // Storybook's controls, and any color picker, hand back `''` for "cleared"
  // instead of dropping the key -- so an emptied override has to read as no
  // override at all. Only `source` is required, and it keeps refusing `''`
  // (above).
  it.each([
    ["primary"],
    ["secondary"],
    ["tertiary"],
    ["error"],
    ["neutral"],
    ["neutralVariant"],
  ])("should read a blank %s as no override", (option) => {
    expect(builder(SOURCE, { [option]: "" }).toCss()).toEqual(
      builder(SOURCE).toCss(),
    );
  });

  // It throws before any conversion, so a caller cannot get a half-built theme
  // out of a bad input by reaching for a different exporter.
  it("should refuse at the entry, not at an exporter", () => {
    expect(() => builder("banana")).toThrow();
  });
});

describe("isHexColor()", () => {
  it.each([["#6750A4"], ["6750a4"], ["#abc"], ["#6750A4FF"]])(
    "should be true for %s",
    (value) => {
      expect(isHexColor(value)).toBe(true);
    },
  );

  it.each([["banana"], ["bananas"], ["#12345"], ["zzz"], [""], ["#6750A"]])(
    "should be false for %s",
    (value) => {
      expect(isHexColor(value)).toBe(false);
    },
  );
});

// The real case that motivated colorMatch: a brand with a lime source, a
// near-black warm gray as its neutral, and two near-gray custom colors next to
// a saturated one. Off, every one of those grays came out yellow.
describe("builder() › colorMatch", () => {
  const BRAND = "#CAF543";
  const config = {
    scheme: "vibrant",
    neutral: "#36342F", // HCT chroma 3.3
    error: "#FF4980",
    customColors: [
      { name: "neutral-1", hex: "#E6E2DD", blend: false }, // chroma 2.2
      { name: "neutral-2", hex: "#363532", blend: false }, // chroma 2.1
      { name: "accent-1", hex: "#D855F9", blend: false }, // chroma 83.3
    ],
  } satisfies Omit<MtbConfig, "source">;

  const chromaOf = (hex: string) => Hct.fromInt(argbFromHex(hex)).chroma;
  const chromaOfArgb = (argb: number) => Hct.fromInt(argb).chroma;

  // A record entry the test relies on: fails loudly rather than reading on
  // with `undefined`.
  function at<T>(record: Record<string, T>, key: string) {
    const value = record[key];
    if (value === undefined) throw new Error(`missing '${key}'`);
    return value;
  }

  const off = builder(BRAND, config);
  const on = builder(BRAND, { ...config, colorMatch: true });

  it("should keep a neutral override's own chroma", () => {
    expect(on.allPalettes.neutral.chroma).toBeCloseTo(chromaOf("#36342F"), 5);
    // ...where the scheme would have tinted it at its neutral chroma
    expect(off.allPalettes.neutral.chroma).toBe(
      builder(BRAND, { scheme: "vibrant" }).allPalettes.neutral.chroma,
    );
    expect(off.allPalettes.neutral.chroma).toBeGreaterThan(5);
  });

  it("should leave the surfaces near gray", () => {
    for (const merged of [on.mergedColorsLight, on.mergedColorsDark])
      for (const token of ["background", "surface", "onSurface"])
        expect(chromaOfArgb(at(merged, token))).toBeLessThan(4);
  });

  it.each([
    ["neutral-1", "#E6E2DD"],
    ["neutral-2", "#363532"],
  ])("should keep the near-gray custom color %s near gray", (name, hex) => {
    expect(at(on.allPalettes, name).chroma).toBeCloseTo(chromaOf(hex), 5);

    for (const merged of [on.mergedColorsLight, on.mergedColorsDark])
      for (const role of [name, `${name}Container`])
        expect(chromaOfArgb(at(merged, role))).toBeLessThan(4);

    // Off, it inherits the primary's chroma and turns yellow.
    expect(chromaOfArgb(at(off.mergedColorsDark, name))).toBeGreaterThan(30);
  });

  it("should keep a saturated custom color's own chroma", () => {
    expect(at(on.allPalettes, "accent-1").chroma).toBeCloseTo(
      chromaOf("#D855F9"),
      5,
    );
  });

  it("should keep the source's chroma for the primary palette", () => {
    expect(on.allPalettes.primary.chroma).toBeCloseTo(chromaOf(BRAND), 5);
    expect(on.allPalettes.primary.hue).toBeCloseTo(
      Hct.fromInt(argbFromHex(BRAND)).hue,
      5,
    );
  });

  it("should keep a primary override's chroma, rather than the source's", () => {
    const theme = builder(BRAND, { primary: "#6750A4", colorMatch: true });
    expect(theme.allPalettes.primary.chroma).toBeCloseTo(
      chromaOf("#6750A4"),
      5,
    );
  });

  it("should leave the palettes nobody set to the scheme", () => {
    for (const name of ["secondary", "tertiary", "neutral-variant"] as const) {
      expect(on.allPalettes[name].hue).toBe(off.allPalettes[name].hue);
      expect(on.allPalettes[name].chroma).toBe(off.allPalettes[name].chroma);
    }
  });

  // Harmonization moves the hue toward the effective source; color match then
  // keeps the chroma -- of the harmonized color, which is what the palette is
  // drawn from.
  it("should harmonize a blended custom color first, then keep its chroma", () => {
    const hex = "#D855F9";
    const theme = builder(BRAND, {
      customColors: [{ name: "accent", hex, blend: true }],
      colorMatch: true,
    });
    const harmonized = Hct.fromInt(
      Blend.harmonize(argbFromHex(hex), argbFromHex(BRAND)),
    );
    const palette = at(theme.allPalettes, "accent");

    expect(palette.hue).toBeCloseTo(harmonized.hue, 5);
    expect(palette.chroma).toBeCloseTo(harmonized.chroma, 5);
    expect(palette.hue).not.toBeCloseTo(Hct.fromInt(argbFromHex(hex)).hue, 0);
  });

  it("should carry into the JSON export", () => {
    const json = on.toJson();
    const dark = at(json.schemes, "dark");

    expect(chromaOf(at(at(json.palettes, "neutral"), "50"))).toBeLessThan(4);
    expect(chromaOf(at(dark, "surface"))).toBeLessThan(4);
    expect(chromaOf(at(at(json.schemes, "light"), "surface"))).toBeLessThan(4);
    // and changes it, so this is not a pass by default
    expect(at(dark, "surface")).not.toBe(
      at(at(off.toJson().schemes, "dark"), "surface"),
    );
  });

  // Off is the default, and the default has to stay what it was -- every
  // exporter, to the byte.
  it("should change nothing when false", () => {
    const explicit = builder(BRAND, { ...config, colorMatch: false });

    expect(explicit.toCss()).toBe(off.toCss());
    expect(explicit.toJson()).toEqual(off.toJson());
    expect(explicit.toFigmaTokens()).toEqual(off.toFigmaTokens());
    expect(explicit.toFigmaVariables()).toEqual(off.toFigmaVariables());
    expect(explicit.toTailwind()).toBe(off.toTailwind());
    expect(explicit.toShadcn()).toEqual(off.toShadcn());
    expect(explicit.toFlutter()).toBe(off.toFlutter());
  });

  it("should change the theme when true", () => {
    expect(hexFromArgb(at(on.mergedColorsDark, "background"))).not.toBe(
      hexFromArgb(at(off.mergedColorsDark, "background")),
    );
  });
});
