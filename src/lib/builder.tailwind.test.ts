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
