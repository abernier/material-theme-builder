import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { kebabCase } from "lodash-es";
import { builder } from "./lib/builder";
import { SHADCN_MAPPING } from "./lib/builder.shadcn";
import { tokenNames } from "./lib/tokens";
import mtbPlugin, { mtbColors, type MtbPluginOptions } from "./tailwind";

// Flatten the Tailwind color theme the way Tailwind itself does: a scale
// becomes `<name>-<shade>`, its `DEFAULT` the bare `<name>`. The result is the
// set of `--color-*` names the plugin ends up defining.
function colorVarNames(options?: MtbPluginOptions) {
  const names: string[] = [];
  for (const [name, value] of Object.entries(mtbColors(options))) {
    if (typeof value === "string") {
      names.push(name);
      continue;
    }
    for (const shade of Object.keys(value)) {
      names.push(shade === "DEFAULT" ? name : `${name}-${shade}`);
    }
  }
  return names;
}

describe("tailwind plugin › mtbColors()", () => {
  it("should register every M3 scheme token", () => {
    const colors = mtbColors();
    for (const token of tokenNames) {
      const value = colors[kebabCase(token)];
      const resolved = typeof value === "string" ? value : value?.DEFAULT;
      expect(resolved).toBe(`var(--md-sys-color-${kebabCase(token)})`);
    }
  });

  it("should register the same colors as toTailwind()", () => {
    // The hand-written `@theme inline` block and the plugin are two spellings
    // of one theme -- this is what keeps them from drifting apart.
    const emitted = [
      ...builder("#6750A4")
        .toTailwind()
        .matchAll(/--color-([\w-]+):/g),
    ].map(([, name]) => name);

    expect(colorVarNames().sort()).toEqual(emitted.sort());
  });

  it("should map shades onto tonal palette tones", () => {
    const primary = mtbColors().primary;
    expect(primary).toMatchObject({
      DEFAULT: "var(--md-sys-color-primary)",
      50: "var(--md-ref-palette-primary-95)",
      500: "var(--md-ref-palette-primary-50)",
      950: "var(--md-ref-palette-primary-5)",
    });
  });

  it("should leave Tailwind's own palettes alone when shades are off", () => {
    const colors = mtbColors({ shades: false });
    expect(colors.neutral).toBeUndefined();
    expect(colors.primary).toBe("var(--md-sys-color-primary)");
  });

  it("should read option names however they are spelled", () => {
    // Prettier lowercases CSS declaration names, so a formatted stylesheet
    // hands us `customcolors` -- it still has to work.
    const expected = mtbColors({ customColors: "brand" });

    expect(mtbColors({ "custom-colors": "brand" } as MtbPluginOptions)).toEqual(
      expected,
    );
    expect(mtbColors({ customcolors: "brand" } as MtbPluginOptions)).toEqual(
      expected,
    );
  });

  it("should refuse an option it does not know", () => {
    expect(() =>
      mtbColors({ customColor: "brand" } as MtbPluginOptions),
    ).toThrow(/Unknown option 'customColor'/);
  });

  it("should respect the prefix option", () => {
    const colors = mtbColors({ prefix: "my" });
    expect(colors["on-primary"]).toBe("var(--my-sys-color-on-primary)");
    expect(colors.primary).toMatchObject({
      500: "var(--my-ref-palette-primary-50)",
    });
  });

  describe("custom colors", () => {
    it("should register the four M3 roles, kebab-cased", () => {
      const colors = mtbColors({ customColors: "myCustomColor1" });
      expect(colors["my-custom-color-1"]).toMatchObject({
        DEFAULT: "var(--md-sys-color-my-custom-color-1)",
        300: "var(--md-ref-palette-my-custom-color-1-70)",
      });
      expect(colors["on-my-custom-color-1"]).toBe(
        "var(--md-sys-color-on-my-custom-color-1)",
      );
      expect(colors["my-custom-color-1-container"]).toBe(
        "var(--md-sys-color-my-custom-color-1-container)",
      );
      expect(colors["on-my-custom-color-1-container"]).toBe(
        "var(--md-sys-color-on-my-custom-color-1-container)",
      );
    });

    it("should also accept the name as written", () => {
      const colors = mtbColors({ customColors: "myCustomColor1" });
      expect(colors.myCustomColor1).toMatchObject({
        DEFAULT: "var(--md-sys-color-my-custom-color-1)",
      });
      expect(colors["on-myCustomColor1"]).toBe(
        "var(--md-sys-color-on-my-custom-color-1)",
      );
    });

    it("should not duplicate a name already kebab-cased", () => {
      const colors = mtbColors({ customColors: "brand" });
      expect(Object.keys(colors).filter((k) => k.includes("brand"))).toEqual([
        "brand",
        "on-brand",
        "brand-container",
        "on-brand-container",
      ]);
    });

    it("should accept a list, and tolerate CSS-authored scalars", () => {
      // `@plugin { customColors: a, b }` yields an array; a lone value yields
      // a scalar, numeric-looking if it can be.
      expect(colorVarNames({ customColors: ["brand", "success"] })).toEqual(
        expect.arrayContaining(["brand", "on-success-container"]),
      );
      expect(mtbColors({ customColors: 1 })["on-1"]).toBe(
        "var(--md-sys-color-on-1)",
      );
    });
  });
});

describe("tailwind plugin › default export", () => {
  it("should be an options-taking Tailwind plugin", () => {
    expect(mtbPlugin.__isOptionsFunction).toBe(true);
  });

  it("should expose the colors through its config", () => {
    const { handler, config } = mtbPlugin({ customColors: "brand" });

    expect(handler).toBeTypeOf("function");
    expect(config).toEqual({
      theme: { extend: { colors: mtbColors({ customColors: "brand" }) } },
    });
  });

  it("should work without options", () => {
    expect(mtbPlugin().config).toEqual({
      theme: { extend: { colors: mtbColors() } },
    });
  });
});

// The shipped stylesheets predate the plugin and stay for backwards
// compatibility -- so they have to keep saying the same thing it does.
describe("shipped stylesheets", () => {
  it("tailwind.css should define every color the plugin registers", () => {
    const css = readFileSync("src/tailwind.css", "utf8");
    const declared = new Set(
      [...css.matchAll(/--color-([\w-]+):/g)].map(([, name]) => name),
    );

    expect(colorVarNames().filter((name) => !declared.has(name))).toEqual([]);
  });

  it("shadcn.css should remap every shadcn variable", () => {
    const css = readFileSync("src/shadcn.css", "utf8");

    for (const [cssVar, token] of SHADCN_MAPPING) {
      expect(css).toContain(`${cssVar}: var(--md-sys-color-${token});`);
    }
  });
});
