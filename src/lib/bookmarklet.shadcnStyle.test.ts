import { describe, expect, it } from "vitest";

import { shadcnStyleSheet } from "./bookmarklet.shadcnStyle";
import { builder } from "./builder";
import { SHADCN_MAPPING } from "./builder.shadcn";

const SOURCE = "#6750A4";

describe("shadcnStyleSheet()", () => {
  const css = shadcnStyleSheet(builder(SOURCE).toShadcn());

  it("should emit a :root block and a .dark block, in that order", () => {
    const rootIndex = css.indexOf(":root {");
    const darkIndex = css.indexOf(".dark {");
    expect(rootIndex).toBeGreaterThanOrEqual(0);
    expect(darkIndex).toBeGreaterThan(rootIndex);
  });

  it("should declare every shadcn variable in both blocks", () => {
    for (const [cssVar] of SHADCN_MAPPING) {
      const occurrences = css.split(`${cssVar}: `).length - 1;
      expect(occurrences, cssVar).toBe(2);
    }
  });

  it("should emit plain declarations by default (globals.css snippet)", () => {
    expect(css).not.toContain("!important");
  });

  it("should not wrap anything in @layer (unlayered wins the cascade)", () => {
    expect(css).not.toContain("@layer");
  });
});

describe("shadcnStyleSheet({ important: true })", () => {
  const css = shadcnStyleSheet(builder(SOURCE).toShadcn(), {
    important: true,
  });

  it("should mark every declaration !important", () => {
    const declarations = css.match(/--[a-z1-5-]+: [^;]+;/g) ?? [];
    expect(declarations.length).toBe(2 * SHADCN_MAPPING.length);
    for (const declaration of declarations) {
      expect(declaration).toMatch(/ !important;$/);
    }
  });
});
