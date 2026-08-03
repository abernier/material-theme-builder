import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { builder } from "./lib/builder";
import mtbPlugin, {
  type MaterialThemeBuilderPluginOptions,
} from "./tailwind-plugin";

// Colors the plugin registers for the given `@plugin` options
function pluginColors(options?: MaterialThemeBuilderPluginOptions) {
  const config = mtbPlugin(options).config;
  return config?.theme?.extend?.colors as Record<string, string>;
}

// `--color-X: var(--Y);` pairs of a `@theme inline` CSS block
function themeBlockColors(css: string) {
  const declarations = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .matchAll(/--color-([\w-]+): var\( ?(--[\w-]+) ?\);/g);
  return Object.fromEntries(
    [...declarations].map(([, name, varname]) => [name, `var(${varname})`]),
  );
}

describe("tailwind plugin", () => {
  it("should map standard tokens and shades", () => {
    const colors = pluginColors();
    expect(colors["primary"]).toBe("var(--md-sys-color-primary)");
    expect(colors["on-surface-variant"]).toBe(
      "var(--md-sys-color-on-surface-variant)",
    );
    expect(colors["primary-500"]).toBe("var(--md-ref-palette-primary-50)");
    expect(colors["neutral-variant-950"]).toBe(
      "var(--md-ref-palette-neutral-variant-5)",
    );
  });

  it("should match the static tailwind.css fallback", () => {
    const css = readFileSync(join(import.meta.dirname, "tailwind.css"), "utf8");
    expect(pluginColors()).toEqual(themeBlockColors(css));
  });

  it("should match toTailwind() output, custom colors included", () => {
    const css = builder("#6750A4", {
      customColors: [{ name: "myCustomColor1", hex: "#FF5733", blend: true }],
    }).toTailwind();
    expect(pluginColors({ "custom-colors": "myCustomColor1" })).toEqual(
      themeBlockColors(css),
    );
  });

  it("should accept a list of custom colors", () => {
    const colors = pluginColors({
      "custom-colors": ["myCustomColor1", "myCustomColor2"],
    });
    expect(colors["my-custom-color-1"]).toBe(
      "var(--md-sys-color-my-custom-color-1)",
    );
    expect(colors["on-my-custom-color-1-container"]).toBe(
      "var(--md-sys-color-on-my-custom-color-1-container)",
    );
    expect(colors["my-custom-color-2-300"]).toBe(
      "var(--md-ref-palette-my-custom-color-2-70)",
    );
  });

  it("should respect the prefix option", () => {
    const colors = pluginColors({ prefix: "my" });
    expect(colors["primary"]).toBe("var(--my-sys-color-primary)");
    expect(colors["primary-500"]).toBe("var(--my-ref-palette-primary-50)");
  });
});
