import {
  argbFromHex,
  Hct,
  hexFromArgb,
} from "@material/material-color-utilities";
import { describe, expect, it } from "vitest";

import { builder, isHexColor } from "./builder";

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

  it.each([["secondary"], ["tertiary"], ["error"]])(
    "should read a blank %s as no override in toJson() too",
    (option) => {
      expect(builder(SOURCE, { [option]: "" }).toJson().schemes).toEqual(
        builder(SOURCE).toJson().schemes,
      );
    },
  );

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

// Each overridden core color's role group is read from a scheme built on that
// override, not from one scheme sourced on the primary with the override's
// palette swapped in. The two only disagree where a role reads the scheme's
// source color: under `fidelity` and `content`, a container lands on the tone
// of its scheme's source -- so `tertiaryContainer` must land on the tertiary
// input's tone (#80CBC4, tone ~77), not on the primary's (#6750A4, tone ~40).
describe("builder() › role groups", () => {
  const TERTIARY = "#80CBC4"; // HCT tone 76.9

  function tone(color: number | string | undefined) {
    if (color === undefined) throw new Error("token missing from the theme");
    return Hct.fromInt(typeof color === "string" ? argbFromHex(color) : color)
      .tone;
  }

  it.each([["content"], ["fidelity"]] as const)(
    "should land %s tertiaryContainer on the tertiary input's tone (CSS path)",
    (scheme) => {
      const { mergedColorsLight } = builder(SOURCE, {
        scheme,
        tertiary: TERTIARY,
      });
      expect(tone(mergedColorsLight.tertiaryContainer)).toBeCloseTo(77, 0);
    },
  );

  it.each([["content"], ["fidelity"]] as const)(
    "should land %s tertiaryContainer on the tertiary input's tone (JSON path)",
    (scheme) => {
      const { schemes } = builder(SOURCE, {
        scheme,
        tertiary: TERTIARY,
      }).toJson();
      expect(tone(schemes.light?.tertiaryContainer)).toBeCloseTo(77, 0);
    },
  );
});

// colorMatch -- "Color match: stay true to my color inputs" in the official
// Material Theme Builder, which builds `SchemeContent` instead of
// `SchemeTonalSpot`, one scheme per input color. Each overridden core color takes
// the *primary* role group of `SchemeContent(input)`, whose container lands on
// the input's own tone: at standard contrast, `XContainer` is the input itself.
// MCU still moves a tone in [50, 60) out of that band, and contrast curves move
// it away from standard contrast.
describe("builder() › colorMatch", () => {
  // The try-02 fixture's primary, the one its official export was captured with
  const PRIMARY = "#CAB337";

  it.each([
    // try-02's secondary and tertiary, both clear of [50, 60)
    ["secondary", "#B03A3A"], // tone 42.1
    ["tertiary", "#2138D2"], // tone 33.6
    // try-02's error (#479200) is in the band (below), so M3's baseline error
    ["error", "#B3261E"], // tone 39.7
  ] as const)(
    "should land %sContainer on its input (%s), light and dark",
    (name, hex) => {
      const { mergedColorsLight, mergedColorsDark } = builder(PRIMARY, {
        colorMatch: true,
        [name]: hex,
      });
      const container = `${name}Container` as const;
      expect(hexOf(mergedColorsLight[container])).toBe(hex);
      expect(hexOf(mergedColorsDark[container])).toBe(hex);
    },
  );

  it("should force the content variant, whatever scheme says", () => {
    const content = builder(PRIMARY, { scheme: "content" }).toCss();
    expect(builder(PRIMARY, { colorMatch: true }).toCss()).toBe(content);
    expect(
      builder(PRIMARY, { colorMatch: true, scheme: "vibrant" }).toCss(),
    ).toBe(content);
  });

  // try-02's neutral (#957FF1, chroma 58.1) and neutral variant (#007EDF,
  // chroma 60.2), at the chromas `SchemeContent` gives its own neutrals: C/8
  // and C/8 + 4
  it("should keep the neutrals' hue, at chroma C/8 and C/8 + 4", () => {
    const { allPalettes } = builder(PRIMARY, {
      colorMatch: true,
      neutral: "#957FF1",
      neutralVariant: "#007EDF",
    });
    expect(allPalettes.neutral.hue).toBeCloseTo(295.0, 1);
    expect(allPalettes.neutral.chroma).toBeCloseTo(58.1 / 8, 1);
    expect(allPalettes["neutral-variant"].hue).toBeCloseTo(257.7, 1);
    expect(allPalettes["neutral-variant"].chroma).toBeCloseTo(60.2 / 8 + 4, 1);
  });

  // try-02's error, tone 53.9: pushed down to 49 in light, up to 60 in dark
  it("should still move a container tone out of [50, 60)", () => {
    const { mergedColorsLight, mergedColorsDark } = builder(PRIMARY, {
      colorMatch: true,
      error: "#479200",
    });
    expect(tone(mergedColorsLight.errorContainer)).toBeCloseTo(49, 0);
    expect(tone(mergedColorsDark.errorContainer)).toBeCloseTo(60, 0);
  });

  // Every core color overridden, as in try-02
  describe("snapshots", () => {
    const theme = builder(PRIMARY, {
      colorMatch: true,
      primary: PRIMARY,
      secondary: "#B03A3A",
      tertiary: "#2138D2",
      error: "#479200",
      neutral: "#957FF1",
      neutralVariant: "#007EDF",
    });

    it("toCss()", () => {
      expect(theme.toCss()).toMatchSnapshot();
    });

    it("toFlutter()", () => {
      expect(theme.toFlutter()).toMatchSnapshot();
    });
  });
});

function hexOf(argb: number | undefined) {
  if (argb === undefined) throw new Error("token missing from the theme");
  return hexFromArgb(argb).toUpperCase();
}

function tone(argb: number | undefined) {
  if (argb === undefined) throw new Error("token missing from the theme");
  return Hct.fromInt(argb).tone;
}
