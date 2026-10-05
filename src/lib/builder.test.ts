import { describe, expect, it } from "vitest";

import { builder, DEFAULT_BLEND, isHexColor } from "./builder";

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

// A custom color brings one palette and four roles, all named after it, and
// they used to be spread over whatever already bore those names: one named
// `secondary` replaced `secondary`, `onSecondary`, `secondaryContainer`,
// `onSecondaryContainer` and the `secondary` reference palette, while
// `secondaryFixed`, `secondaryFixedDim` and `toJson().schemes` stayed the core
// color's. What is checked is that `builder()` refuses every name that lands on
// one already taken, compared as the exporters spell it, and no other.
describe("builder() › customColors[].name", () => {
  const custom = (...names: string[]) => ({
    customColors: names.map((name) => ({ name, hex: "#00D68A" })),
  });

  it.each([
    ["secondary", "role 'secondary'", "the system role 'secondary'"],
    ["surface", "role 'surface'", "the system role 'surface'"],
    ["error", "role 'error'", "the system role 'error'"],
    // the spelling is the exporters', not the caller's
    ["Secondary", "role 'Secondary'", "the system role 'secondary'"],
    ["on-surface", "role 'on-surface'", "the system role 'onSurface'"],
    // only a derived role lands on a system one: there is no
    // `primaryFixedVariant`, but there is an `onPrimaryFixedVariant`
    [
      "primaryFixedVariant",
      "role 'onPrimaryFixedVariant'",
      "the system role 'onPrimaryFixedVariant'",
    ],
  ])(
    "should refuse %s, whose role lands on a system role",
    (name, own, taken) => {
      expect(() => builder(SOURCE, custom(name))).toThrow(
        `Invalid customColors[0].name: '${name}'. Its ${own} collides with ${taken}.`,
      );
    },
  );

  // `neutral` and `neutral-variant` are core palettes and no system role, so
  // nothing but the palette collides.
  it.each([
    ["neutral", "neutral"],
    ["neutralVariant", "neutral-variant"],
    ["neutral variant", "neutral-variant"],
  ])("should refuse %s, whose palette is a core palette", (name, palette) => {
    expect(() => builder(SOURCE, custom(name))).toThrow(
      `Invalid customColors[0].name: '${name}'. Its palette '${palette}' collides with the core palette '${palette}'.`,
    );
  });

  it.each([
    ["brand", "Brand", "role 'Brand'", "the role 'brand' of customColors[0]"],
    ["brand", "brand", "role 'brand'", "the role 'brand' of customColors[0]"],
    [
      "brand",
      "brandContainer",
      "role 'brandContainer'",
      "the role 'brandContainer' of customColors[0]",
    ],
    [
      "onBrand",
      "brand",
      "role 'onBrand'",
      "the role 'onBrand' of customColors[0]",
    ],
  ])(
    "should refuse %s and %s together, and name the second",
    (first, second, own, taken) => {
      expect(() => builder(SOURCE, custom(first, second))).toThrow(
        `Invalid customColors[1].name: '${second}'. Its ${own} collides with ${taken}.`,
      );
    },
  );

  // toTailwind() and the Tailwind plugin write the roles and the shades of
  // every palette into one namespace, `--color-*`: `--color-primary-500` is
  // the shade 500 of `primary`, and would also be the role of `primary500`.
  it.each([
    [
      ["primary500"],
      "Invalid customColors[0].name: 'primary500'. Its role 'primary500' collides with the Tailwind shade 'primary-500' of the core palette 'primary'.",
    ],
    [
      ["brand", "brand500"],
      "Invalid customColors[1].name: 'brand500'. Its role 'brand500' collides with the Tailwind shade 'brand-500' of customColors[0].",
    ],
    [
      ["brand500", "brand"],
      "Invalid customColors[1].name: 'brand'. Its Tailwind shade 'brand-500' collides with the role 'brand500' of customColors[0].",
    ],
  ])(
    "should refuse %j, a role landing on a Tailwind shade",
    (names, message) => {
      expect(() => builder(SOURCE, custom(...names))).toThrow(message);
    },
  );

  it("should say what it expected", () => {
    expect(() => builder(SOURCE, custom("secondary"))).toThrow(
      /Expected a name that no system role, core palette or other custom color already uses\.$/,
    );
  });

  // The list that must not shrink: Material Theme Builder's own default names
  // (the fixtures'), the README's, and names that merely contain a taken one.
  it.each([
    [["brand"]],
    [["brand", "success"]],
    [["Custom Color 1", "Custom Color 2"]],
    [["myCustomColor1", "myCustomColor2", "myCustomColor3"]],
    [["customColor1", "customColor2"]],
    [["primaryBrand", "surfaceTintBrand", "neutralBrand"]],
    [["brand", "brand2"]],
  ])("should accept %j", (names) => {
    expect(() => builder(SOURCE, custom(...names))).not.toThrow();
  });

  // A core-color override is not a custom color: it is the supported way to
  // replace a core color, and stays so.
  it("should leave the core-color overrides alone", () => {
    expect(() =>
      builder(SOURCE, { secondary: "#00D68A", ...custom("brand") }),
    ).not.toThrow();
  });
});

// A custom color given without `blend` takes DEFAULT_BLEND, and it has to reach
// the palette, not only the metadata: it used to be reported as harmonized
// (`toJson().extendedColors[].harmonized`) while being rendered unharmonized.
describe("builder() › customColors[].blend", () => {
  const brand = { name: "brand", hex: "#FF5733" };

  it("should harmonize by default", () => {
    expect(DEFAULT_BLEND).toBe(true);
  });

  it("should render an omitted blend exactly like the default", () => {
    expect(builder(SOURCE, { customColors: [brand] }).toCss()).toEqual(
      builder(SOURCE, {
        customColors: [{ ...brand, blend: DEFAULT_BLEND }],
      }).toCss(),
    );
  });

  // Guards the test above: were `blend` to change nothing, an omitted blend
  // would render like the default whatever the default.
  it("should render blend: true and blend: false differently", () => {
    expect(
      builder(SOURCE, {
        customColors: [{ ...brand, blend: true }],
      }).toCss(),
    ).not.toEqual(
      builder(SOURCE, {
        customColors: [{ ...brand, blend: false }],
      }).toCss(),
    );
  });

  it("should report an omitted blend as the default", () => {
    expect(
      builder(SOURCE, { customColors: [brand] }).toJson().extendedColors,
    ).toEqual([expect.objectContaining({ harmonized: DEFAULT_BLEND })]);
  });
});
