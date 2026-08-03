import { formatHex, oklch, parse } from "culori";
import { describe, expect, it } from "vitest";

import { builder } from "./builder";
import { SHADCN_MAPPING } from "./builder.shadcn";

const SOURCE = "#6750A4";

// The 31 color variables a shadcn theme defines, spelled out rather than
// derived from SHADCN_MAPPING — a dropped mapping row must fail the suite, not
// quietly shrink both sides of the assertion.
// see: https://ui.shadcn.com/docs/theming#list-of-variables
const SHADCN_VARS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
];

function hexOf(value: string) {
  const parsed = parse(value);
  if (!parsed) throw new Error(`not a parseable color: ${value}`);
  return formatHex(parsed);
}

describe("builder › toShadcn()", () => {
  it("should return exactly the light and dark keys", () => {
    expect(Object.keys(builder(SOURCE).toShadcn())).toEqual(["light", "dark"]);
  });

  it("should map every shadcn color variable to an M3 token", () => {
    expect(SHADCN_MAPPING.map(([cssVar]) => cssVar.slice(2)).sort()).toEqual(
      [...SHADCN_VARS].sort(),
    );
  });

  it("should cover every shadcn color variable in both modes", () => {
    const { light, dark } = builder(SOURCE).toShadcn();

    expect(Object.keys(light).sort()).toEqual([...SHADCN_VARS].sort());
    expect(Object.keys(dark).sort()).toEqual([...SHADCN_VARS].sort());
  });

  it("should key on bare variable names, never `--`-prefixed", () => {
    const { light, dark } = builder(SOURCE).toShadcn();

    for (const key of [...Object.keys(light), ...Object.keys(dark)]) {
      expect(key.startsWith("--")).toBe(false);
    }
    expect(light).toHaveProperty("primary");
    expect(light).toHaveProperty("primary-foreground");
    expect(light).toHaveProperty("chart-1");
    expect(light).toHaveProperty("sidebar-accent-foreground");
  });

  it("should emit every value as oklch()", () => {
    const { light, dark } = builder(SOURCE).toShadcn();

    for (const value of [...Object.values(light), ...Object.values(dark)]) {
      expect(value).toMatch(
        /^oklch\(-?\d+(\.\d+)? -?\d+(\.\d+)? -?\d+(\.\d+)?\)$/,
      );
      expect(oklch(parse(value))).toBeDefined();
    }
  });

  it("should emit oklch values that round-trip to the sRGB colors they encode", () => {
    const { light } = builder(SOURCE).toShadcn();

    // Values are the M3 scheme colors of #6750A4, in oklch rather than hex.
    expect(hexOf(light.primary)).toBe("#65558f");
    expect(hexOf(light["primary-foreground"])).toBe("#ffffff");
    expect(hexOf(light.background)).toBe("#fdf7ff");
    expect(hexOf(light.destructive)).toBe("#ba1a1a");
  });

  it("should emit different values for light and dark", () => {
    const { light, dark } = builder(SOURCE).toShadcn();

    for (const key of SHADCN_VARS) {
      expect(dark).toHaveProperty(key);
    }
    expect(light).not.toEqual(dark);
    expect(light.background).not.toBe(dark.background);
    expect(light.primary).not.toBe(dark.primary);
  });

  it("should vary with the scheme option", () => {
    const tonalSpot = builder(SOURCE, { scheme: "tonalSpot" }).toShadcn();
    const vibrant = builder(SOURCE, { scheme: "vibrant" }).toShadcn();

    expect(vibrant.light.primary).not.toBe(tonalSpot.light.primary);
    expect(vibrant.dark.primary).not.toBe(tonalSpot.dark.primary);
  });

  it("should honour each contrast level", () => {
    const reduced = builder(SOURCE, { contrast: -1 }).toShadcn();
    const standard = builder(SOURCE, { contrast: 0 }).toShadcn();
    const medium = builder(SOURCE, { contrast: 0.5 }).toShadcn();
    const high = builder(SOURCE, { contrast: 1 }).toShadcn();

    // The regression test for a silently-inert `contrast` option.
    for (const [a, b] of [
      [reduced, standard],
      [standard, medium],
      [medium, high],
    ] as const) {
      expect(a.light).not.toEqual(b.light);
      expect(a.dark).not.toEqual(b.dark);
    }
  });

  it("should honour an intermediate contrast level rather than snapping", () => {
    const between = builder(SOURCE, { contrast: 0.6 }).toShadcn();

    expect(between).not.toEqual(builder(SOURCE, { contrast: 0.5 }).toShadcn());
    expect(between).not.toEqual(builder(SOURCE, { contrast: 1 }).toShadcn());
  });

  it("should reflect a chromatic primary override", () => {
    const base = builder(SOURCE).toShadcn();
    const overridden = builder(SOURCE, { primary: "#B3261E" }).toShadcn();

    expect(overridden.light.primary).not.toBe(base.light.primary);
    expect(overridden.dark.primary).not.toBe(base.dark.primary);
  });

  it("should throw on an invalid source color", () => {
    expect(() => builder("not-a-color").toShadcn()).toThrow();
  });

  it("should produce deterministic output", () => {
    expect(builder(SOURCE).toShadcn()).toMatchSnapshot();
  });
});
