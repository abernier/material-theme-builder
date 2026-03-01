import { describe, expect, it } from "vitest";
import { builder } from "./builder";

describe("builder › toCss()", () => {
  it("should generate CSS with toCss()", () => {
    const result = builder("#769CDF").toCss();
    expect(result).toContain(":root {");
    expect(result).toContain(".dark {");
    expect(result).toContain(
      "--md-sys-color-primary:var(--md-ref-palette-primary-",
    );
  });
});
