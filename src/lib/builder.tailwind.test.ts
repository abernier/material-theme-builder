import { describe, expect, it } from "vitest";
import { builder } from "./builder";

describe("builder › toTailwind()", () => {
  it("should generate a @theme inline block", () => {
    const result = builder("#769CDF").toTailwind();
    expect(result).toContain("@theme inline {");
    expect(result).toContain("}");
  });

  it("should include scheme color tokens", () => {
    const result = builder("#769CDF").toTailwind();
    expect(result).toContain("--color-primary: var(--md-sys-color-primary);");
    expect(result).toContain(
      "--color-on-primary: var(--md-sys-color-on-primary);",
    );
    expect(result).toContain(
      "--color-surface-container-high: var(--md-sys-color-surface-container-high);",
    );
  });

  it("should include shade mappings for core palettes", () => {
    const result = builder("#769CDF").toTailwind();
    expect(result).toContain(
      "--color-primary-50: var(--md-ref-palette-primary-95);",
    );
    expect(result).toContain(
      "--color-primary-500: var(--md-ref-palette-primary-50);",
    );
    expect(result).toContain(
      "--color-primary-950: var(--md-ref-palette-primary-5);",
    );
    expect(result).toContain(
      "--color-secondary-100: var(--md-ref-palette-secondary-90);",
    );
    expect(result).toContain(
      "--color-neutral-variant-700: var(--md-ref-palette-neutral-variant-30);",
    );
  });

  it("should include custom color scheme tokens", () => {
    const result = builder("#6750A4", {
      customColors: [{ name: "brand", hex: "#FF5733", blend: true }],
    }).toTailwind();
    expect(result).toContain("--color-brand: var(--md-sys-color-brand);");
    expect(result).toContain("--color-on-brand: var(--md-sys-color-on-brand);");
    expect(result).toContain(
      "--color-brand-container: var(--md-sys-color-brand-container);",
    );
    expect(result).toContain(
      "--color-on-brand-container: var(--md-sys-color-on-brand-container);",
    );
  });

  it("should include custom color shade mappings", () => {
    const result = builder("#6750A4", {
      customColors: [{ name: "brand", hex: "#FF5733", blend: true }],
    }).toTailwind();
    expect(result).toContain(
      "--color-brand-50: var(--md-ref-palette-brand-95);",
    );
    expect(result).toContain(
      "--color-brand-500: var(--md-ref-palette-brand-50);",
    );
    expect(result).toContain(
      "--color-brand-950: var(--md-ref-palette-brand-5);",
    );
  });

  it("should respect the prefix option", () => {
    const result = builder("#769CDF", { prefix: "my" }).toTailwind();
    expect(result).toContain("--color-primary: var(--my-sys-color-primary);");
    expect(result).toContain(
      "--color-primary-500: var(--my-ref-palette-primary-50);",
    );
  });
});
