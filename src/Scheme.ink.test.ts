/**
 * `roleInk()` and `toneInk()` answer with a `var()` of a property they never
 * see declared -- `toCss()` declares them, elsewhere. A `var()` of a property
 * nobody declares paints nothing and throws nothing, so a typo'd key in the
 * `exceptions` table, or a token the library grows later and the `on-` rule
 * takes in, would only ever show as a label that cannot be read. This pins
 * every ink the poster can ask for to a property `toCss()` emits.
 */

import { kebabCase } from "lodash-es";
import { describe, expect, it } from "vitest";

import { builder, STANDARD_TONES } from "./lib/builder";
import { CORE_PALETTES, tokenNames } from "./lib/tokens";
import { roleInk, toneInk } from "./Scheme.ink";

/** The custom properties `css` declares, by name. */
function declaredProperties(css: string) {
  return new Set(
    css.match(/--md-(?:sys-color|ref-palette)-[a-z0-9-]+(?=:)/g) ?? [],
  );
}

/** The property a `var(--x)` reads -- `undefined` for any other ink. */
function propertyOf(ink: string) {
  return /^var\((--[a-z0-9-]+)\)$/.exec(ink)?.[1];
}

const brand = { name: "brand", hex: "#00D68A" };
const roles = tokenNames.map((name) => kebabCase(name));

describe("roleInk()", () => {
  const declared = declaredProperties(builder("#769CDF").toCss());

  it("should ink every scheme role with a declared role, or white", () => {
    const undeclared = roles
      .map((role) => [role, roleInk(role)] as const)
      .filter(
        ([, ink]) => ink !== "white" && !declared.has(propertyOf(ink) ?? ""),
      );

    expect(undeclared).toEqual([]);
  });

  it("should ink only scrim and shadow with white", () => {
    // The two roles black in both themes, when no role is white in both
    expect(roles.filter((role) => roleInk(role) === "white").sort()).toEqual([
      "scrim",
      "shadow",
    ]);
  });

  // A custom color's four roles, paired the way `Scheme` pairs them: it names
  // the inks itself, so what has to hold is that both sides are declared.
  it.each([
    ["brand", "on-brand"],
    ["on-brand", "brand"],
    ["brand-container", "on-brand-container"],
    ["on-brand-container", "brand-container"],
  ])("should find a custom color's %s and its ink %s declared", (role, ink) => {
    const withBrand = declaredProperties(
      builder("#769CDF", { customColors: [brand] }).toCss(),
    );

    expect(withBrand.has(`--md-sys-color-${role}`)).toBe(true);
    expect(withBrand.has(`--md-sys-color-${ink}`)).toBe(true);
  });

  it("should not read the exceptions table through its prototype", () => {
    // `exceptions` is a plain object: looked up as is, `constructor` would
    // come back as `Object`, and `Object.hasOwn` is what keeps it out.
    expect(roleInk("constructor")).toBe("var(--md-sys-color-on-constructor)");
  });
});

describe("toneInk()", () => {
  const declared = declaredProperties(
    builder("#769CDF", { customColors: [brand] }).toCss(),
  );

  it("should ink every tone of every palette with a declared tone", () => {
    const undeclared = [...CORE_PALETTES, "brand"]
      .flatMap((palette) =>
        STANDARD_TONES.map(
          (tone) => [palette, tone, toneInk(palette, tone)] as const,
        ),
      )
      .filter(([, , ink]) => !declared.has(propertyOf(ink) ?? ""));

    expect(undeclared).toEqual([]);
  });

  it.each([
    [0, 100],
    [50, 100],
    [60, 10],
    [100, 10],
  ])("should ink tone %i with tone %i", (tone, ink) => {
    // The cut sits at 50: the dark half takes the palette's white, the light
    // half its black.
    expect(toneInk("primary", tone)).toBe(
      `var(--md-ref-palette-primary-${ink})`,
    );
  });
});
