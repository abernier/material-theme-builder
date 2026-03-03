import { describe, expect, it } from "vitest";
import { builder } from "./builder";

describe("builder › toTailwind()", () => {
  it("should generate a @theme inline block", () => {
    const result = builder("#769CDF").toTailwind();
    expect(result).toContain("@theme inline {");
    expect(result).toContain("}");
  });

  it("should produce deterministic output", () => {
    expect(builder("#6750A4").toTailwind()).toMatchSnapshot();
  });

  it("should produce deterministic output with custom colors", () => {
    expect(
      builder("#6750A4", {
        customColors: [{ name: "brand", hex: "#FF5733", blend: true }],
      }).toTailwind(),
    ).toMatchSnapshot();
  });

  it("should respect the prefix option", () => {
    const result = builder("#769CDF", { prefix: "my" }).toTailwind();
    expect(result).toContain("--color-primary: var(--my-sys-color-primary);");
    expect(result).toContain(
      "--color-primary-500: var(--my-ref-palette-primary-50);",
    );
  });
});

describe("builder › toTailwind({ shadcn: true })", () => {
  it("should append a :root, .dark block", () => {
    const result = builder("#769CDF").toTailwind({ shadcn: true });
    expect(result).toContain("@theme inline {");
    expect(result).toContain(":root,\n.dark {");
  });

  it("should map shadcn variables to M3 tokens", () => {
    const result = builder("#769CDF").toTailwind({ shadcn: true });
    expect(result).toContain("--background: var(--md-sys-color-surface);");
    expect(result).toContain("--primary: var(--md-sys-color-primary);");
    expect(result).toContain("--destructive: var(--md-sys-color-error);");
  });

  it("should respect the prefix option", () => {
    const result = builder("#769CDF", { prefix: "my" }).toTailwind({
      shadcn: true,
    });
    expect(result).toContain("--primary: var(--my-sys-color-primary);");
    expect(result).toContain("--background: var(--my-sys-color-surface);");
  });

  it("should produce deterministic output", () => {
    expect(builder("#6750A4").toTailwind({ shadcn: true })).toMatchSnapshot();
  });
});
