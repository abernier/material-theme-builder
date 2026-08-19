import { formatHex, parse } from "culori";
import { describe, expect, it } from "vitest";

import { builder } from "./builder";

const SOURCE = "#6750A4";

// A vocabulary that is not shadcn's, deliberately: what these exercise is that
// nothing in the mapping machinery knows about shadcn.
const BOOTSTRAP = {
  "--bs-body-bg": "surface",
  "--bs-body-color": "on-surface",
  "--bs-primary": "primary",
};

// Takes `string | undefined` because a mapping's variable set is open -- every
// lookup outside the shadcn preset is optional -- and an absent variable is a
// failed test either way.
function hexOf(value: string | undefined) {
  const parsed = value === undefined ? undefined : parse(value);
  if (!parsed) throw new Error(`not a parseable color: ${value}`);
  return formatHex(parsed);
}

describe("builder › toMapping()", () => {
  it("should project the theme onto the given variables, both modes", () => {
    const { light, dark } = builder(SOURCE).toMapping(BOOTSTRAP);

    expect(Object.keys(light)).toEqual([
      "bs-body-bg",
      "bs-body-color",
      "bs-primary",
    ]);
    expect(Object.keys(dark)).toEqual(Object.keys(light));
    expect(hexOf(light["bs-primary"])).not.toBe(hexOf(dark["bs-primary"]));
  });

  it("should emit the same color the M3 token carries", () => {
    const theme = builder(SOURCE);
    const { light } = theme.toMapping({ "--bs-primary": "primary" });

    expect(hexOf(light["bs-primary"])).toBe(
      hexOf(theme.toShadcn().light.primary),
    );
  });

  it("should read a variable name with or without the leading dashes", () => {
    expect(builder(SOURCE).toMapping({ "bs-primary": "primary" })).toEqual(
      builder(SOURCE).toMapping({ "--bs-primary": "primary" }),
    );
  });

  it("should map a custom color like any other token", () => {
    const theme = builder(SOURCE, {
      customColors: [{ name: "brand", hex: "#FF5733", blend: false }],
    });

    expect(hexOf(theme.toMapping({ "--x": "brand" }).light.x)).not.toBe(
      hexOf(theme.toMapping({ "--x": "primary" }).light.x),
    );
    // And only where it was declared: the check is against this theme's tokens.
    expect(() => builder(SOURCE).toMapping({ "--x": "brand" })).toThrow(
      /brand/,
    );
  });

  it("should refuse an M3 token that does not exist, naming both sides", () => {
    expect(() =>
      builder(SOURCE).toMapping({ "--bs-primary": "primarly" }),
    ).toThrow(/primarly.*--bs-primary/);
  });
});

describe("builder › toMappingAliases()", () => {
  it("should point every variable at the M3 custom properties", () => {
    const css = builder(SOURCE).toMappingAliases(BOOTSTRAP);

    expect(css).toContain("--bs-body-bg: var(--md-sys-color-surface);");
    expect(css).toContain("--bs-primary: var(--md-sys-color-primary);");
    // What separates it from `toMapping()`: no color is frozen in.
    expect(css).not.toMatch(/oklch/);
  });

  it("should follow the prefix", () => {
    expect(
      builder(SOURCE, { prefix: "my" }).toMappingAliases(BOOTSTRAP),
    ).toContain("var(--my-sys-color-primary)");
  });

  it("should say the same thing whatever the theme is", () => {
    // The aliases describe the mapping, not the colors -- the source color and
    // every other theme option land in the properties they point at.
    expect(
      builder("#FF5722", { scheme: "vibrant", contrast: 1 }).toMappingAliases(
        BOOTSTRAP,
      ),
    ).toBe(builder(SOURCE).toMappingAliases(BOOTSTRAP));
  });

  it("should emit under :root, and under the given selectors instead", () => {
    expect(builder(SOURCE).toMappingAliases(BOOTSTRAP)).toMatch(/^:root \{/);

    expect(
      builder(SOURCE).toMappingAliases(BOOTSTRAP, {
        selectors: [":root", "[data-bs-theme=dark]"],
      }),
    ).toMatch(/^:root,\n\[data-bs-theme=dark\] \{/);
  });

  it("should refuse an M3 token that does not exist", () => {
    // The alias rendering cannot fail on its own -- `var()` takes any name --
    // so an unchecked typo would ship a stylesheet that resolves to nothing.
    expect(() =>
      builder(SOURCE).toMappingAliases({ "--bs-primary": "primarly" }),
    ).toThrow(/primarly/);
  });
});
