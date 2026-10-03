import { Hct, hexFromArgb } from "@material/material-color-utilities";
import { describe, expect, it } from "vitest";

import customColorsFixture from "../fixtures/material-theme-builder/color-match-04.custom-colors.json";
import customColorsFixture5 from "../fixtures/material-theme-builder/color-match-05.custom-colors.json";
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

// Color match is MTB's, so the JSON export is held to MTB's own output
// (builder.json.test.ts). What is checked here is that every other output
// follows it -- the scheme colors the CSS, Figma, Tailwind, shadcn and Flutter
// outputs are built from -- and that custom colors match MTB's.
describe("builder() › colorMatch", () => {
  const BRAND = "#CAF543";
  const customColors = [
    { name: "neutral-1", hex: "#E6E2DD", blend: false },
    { name: "neutral-2", hex: "#363532", blend: false },
    { name: "accent-1", hex: "#D855F9", blend: false },
  ];
  const config = {
    neutral: "#36342F",
    error: "#FF4980",
    customColors,
  } satisfies Omit<MtbConfig, "source">;

  const chromaOfArgb = (argb: number) => Hct.fromInt(argb).chroma;
  const hex = (argb: number) => hexFromArgb(argb).toUpperCase();

  // A record entry the test relies on: fails loudly rather than reading on
  // with `undefined`.
  function at<T>(record: Record<string, T>, key: string) {
    const value = record[key];
    if (value === undefined) throw new Error(`missing '${key}'`);
    return value;
  }

  const off = builder(BRAND, config);
  const on = builder(BRAND, { ...config, colorMatch: true });

  it.each([
    ["light", 0, "light"],
    ["dark", 0, "dark"],
    ["light", 0.5, "light-medium-contrast"],
    ["dark", 1, "dark-high-contrast"],
  ] as const)(
    "should give the %s scheme at contrast %s the colors of the JSON export's %s",
    (mode, contrast, jsonScheme) => {
      const theme = builder(BRAND, {
        ...config,
        secondary: "#B03A3A",
        tertiary: "#2138D2",
        neutralVariant: "#007EDF",
        contrast,
        colorMatch: true,
      });
      const merged =
        mode === "light" ? theme.mergedColorsLight : theme.mergedColorsDark;
      const json = at(theme.toJson().schemes, jsonScheme);

      for (const [token, value] of Object.entries(json))
        expect([token, hex(at(merged, token))]).toEqual([token, value]);
    },
  );

  // The four roles of a custom color, named as MTB's export names them.
  function customRoles(merged: Record<string, number>, name: string) {
    const cap = name.charAt(0).toUpperCase() + name.slice(1);
    return {
      color: hexFromArgb(at(merged, name)),
      onColor: hexFromArgb(at(merged, `on${cap}`)),
      colorContainer: hexFromArgb(at(merged, `${name}Container`)),
      onColorContainer: hexFromArgb(at(merged, `on${cap}Container`)),
    };
  }

  it.each([
    ["as picked", on, customColorsFixture],
    [
      "harmonized or not",
      builder("#F766FF", {
        tertiary: "#7BF600",
        error: "#311E00",
        neutralVariant: "#002726",
        colorMatch: true,
        customColors: [
          { name: "Custom Color 1", hex: "#F69C83", blend: true },
          { name: "Custom Color 2", hex: "#8DCCF8", blend: false },
        ],
      }),
      customColorsFixture5,
    ],
  ])("should match MTB's custom colors, %s", (_, theme, fixture) => {
    for (const [name, want] of Object.entries(fixture)) {
      expect(customRoles(theme.mergedColorsLight, name)).toEqual(want.light);
      expect(customRoles(theme.mergedColorsDark, name)).toEqual(want.dark);
    }
  });

  it("should keep the near-gray inputs near gray", () => {
    for (const merged of [on.mergedColorsLight, on.mergedColorsDark]) {
      for (const token of ["surface", "onSurface", "surfaceContainer"])
        expect(chromaOfArgb(at(merged, token))).toBeLessThan(4);
      for (const token of ["neutral-1", "neutral-1Container", "neutral-2"])
        expect(chromaOfArgb(at(merged, token))).toBeLessThan(4);
    }
    // ...where without it, they turn the source's yellow-green
    expect(chromaOfArgb(at(off.mergedColorsDark, "neutral-1"))).toBeGreaterThan(
      30,
    );
  });

  // MTB's own quirk, reproduced: the neutral gives the surfaces, but
  // `background` and `onBackground` stay the source's.
  it("should take background from the source, even with a neutral", () => {
    const sourceOnly = builder(BRAND, { colorMatch: true });
    for (const token of ["background", "onBackground"]) {
      expect(at(on.mergedColorsDark, token)).toBe(
        at(sourceOnly.mergedColorsDark, token),
      );
    }
    expect(at(on.mergedColorsDark, "surface")).not.toBe(
      at(sourceOnly.mergedColorsDark, "surface"),
    );
  });

  it("should take the place of `scheme`, which MTB does not have", () => {
    expect(
      builder(BRAND, {
        ...config,
        scheme: "vibrant",
        colorMatch: true,
      }).toCss(),
    ).toBe(on.toCss());
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
});
