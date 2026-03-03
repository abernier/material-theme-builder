import { describe, expect, it } from "vitest";
import { builder } from "./builder";

describe("builder › toShadcn()", () => {
  it("should generate a :root, .dark block", () => {
    const result = builder("#769CDF").toShadcn();
    expect(result).toContain(":root,\n.dark {");
    expect(result).toContain("}");
  });

  it("should map shadcn variables to M3 tokens", () => {
    const result = builder("#769CDF").toShadcn();
    expect(result).toContain("--background: var(--md-sys-color-surface);");
    expect(result).toContain("--foreground: var(--md-sys-color-on-surface);");
    expect(result).toContain("--primary: var(--md-sys-color-primary);");
    expect(result).toContain(
      "--primary-foreground: var(--md-sys-color-on-primary);",
    );
    expect(result).toContain("--destructive: var(--md-sys-color-error);");
    expect(result).toContain("--border: var(--md-sys-color-outline-variant);");
    expect(result).toContain(
      "--sidebar: var(--md-sys-color-surface-container-low);",
    );
  });

  it("should respect the prefix option", () => {
    const result = builder("#769CDF", { prefix: "my" }).toShadcn();
    expect(result).toContain("--primary: var(--my-sys-color-primary);");
    expect(result).toContain("--background: var(--my-sys-color-surface);");
  });

  it("should produce deterministic output", () => {
    expect(builder("#6750A4").toShadcn()).toMatchSnapshot();
  });
});
