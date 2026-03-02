import { describe, expect, it } from "vitest";
import { default as defaultExport, materialTheme } from "../tailwind-plugin";

type CssInJs = Record<string, Record<string, string>>;

describe("materialTheme()", () => {
  it("should return a tailwind plugin with handler and config", () => {
    const result = materialTheme({ source: "#6750A4" });
    expect(result).toHaveProperty("handler");
    expect(result).toHaveProperty("config");
    expect(typeof result.handler).toBe("function");
  });

  it("should be a withOptions plugin (has __isOptionsFunction)", () => {
    expect(materialTheme).toHaveProperty("__isOptionsFunction", true);
  });

  it("should be the default export", () => {
    expect(defaultExport).toBe(materialTheme);
  });

  it("should work with no options (for @plugin without block)", () => {
    const result = materialTheme();
    expect(result).toHaveProperty("handler");
    expect(result).toHaveProperty("config");

    const colors = result.config?.theme?.extend?.colors as Record<
      string,
      string
    >;
    expect(colors["primary"]).toBe("var(--md-sys-color-primary)");
  });

  it("should normalize kebab-case keys from @plugin blocks", () => {
    // Simulates @plugin { source: "#6750A4"; neutral-variant: "#789ABC"; }
    const result = materialTheme({
      source: "#6750A4",
      "neutral-variant": "#789ABC",
    } as Record<string, unknown>);
    expect(result).toHaveProperty("handler");

    const calls: CssInJs[] = [];
    result.handler({
      addBase: (base: CssInJs) => calls.push(base),
    } as unknown as Parameters<typeof result.handler>[0]);

    // Plugin should process successfully and inject CSS vars
    expect(calls.length).toBe(1);
    const rootVars = (calls[0] as CssInJs)[":root"] as Record<string, string>;
    expect(rootVars).toHaveProperty("--md-ref-palette-neutral-variant-50");
  });

  it("should register standard m3 colors in theme.extend.colors", () => {
    const result = materialTheme({ source: "#6750A4" });
    const colors = result.config?.theme?.extend?.colors as Record<
      string,
      string
    >;

    // Standard sys-color tokens
    expect(colors["primary"]).toBe("var(--md-sys-color-primary)");
    expect(colors["on-primary"]).toBe("var(--md-sys-color-on-primary)");
    expect(colors["surface"]).toBe("var(--md-sys-color-surface)");
    expect(colors["on-surface"]).toBe("var(--md-sys-color-on-surface)");
    expect(colors["background"]).toBe("var(--md-sys-color-background)");
    expect(colors["error"]).toBe("var(--md-sys-color-error)");
    expect(colors["secondary"]).toBe("var(--md-sys-color-secondary)");
    expect(colors["tertiary"]).toBe("var(--md-sys-color-tertiary)");
    expect(colors["scrim"]).toBe("var(--md-sys-color-scrim)");
    expect(colors["shadow"]).toBe("var(--md-sys-color-shadow)");
    expect(colors["outline"]).toBe("var(--md-sys-color-outline)");
    expect(colors["outline-variant"]).toBe(
      "var(--md-sys-color-outline-variant)",
    );
    expect(colors["surface-container-high"]).toBe(
      "var(--md-sys-color-surface-container-high)",
    );
    expect(colors["inverse-primary"]).toBe(
      "var(--md-sys-color-inverse-primary)",
    );
  });

  it("should register core palette shades", () => {
    const result = materialTheme({ source: "#6750A4" });
    const colors = result.config?.theme?.extend?.colors as Record<
      string,
      string
    >;

    // Primary shades
    expect(colors["primary-50"]).toBe("var(--md-ref-palette-primary-95)");
    expect(colors["primary-100"]).toBe("var(--md-ref-palette-primary-90)");
    expect(colors["primary-500"]).toBe("var(--md-ref-palette-primary-50)");
    expect(colors["primary-950"]).toBe("var(--md-ref-palette-primary-5)");

    // Secondary shades
    expect(colors["secondary-50"]).toBe("var(--md-ref-palette-secondary-95)");
    expect(colors["secondary-950"]).toBe("var(--md-ref-palette-secondary-5)");

    // Tertiary shades
    expect(colors["tertiary-50"]).toBe("var(--md-ref-palette-tertiary-95)");

    // Error shades
    expect(colors["error-50"]).toBe("var(--md-ref-palette-error-95)");

    // Neutral shades
    expect(colors["neutral-50"]).toBe("var(--md-ref-palette-neutral-95)");

    // Neutral-variant shades
    expect(colors["neutral-variant-50"]).toBe(
      "var(--md-ref-palette-neutral-variant-95)",
    );
  });

  it("should register custom color mappings", () => {
    const result = materialTheme({
      source: "#6750A4",
      customColors: [
        { name: "myBrand", hex: "#FF5733", blend: true },
        { name: "success", hex: "#28A745", blend: false },
      ],
    });
    const colors = result.config?.theme?.extend?.colors as Record<
      string,
      string
    >;

    // Custom color sys tokens
    expect(colors["myBrand"]).toBe("var(--md-sys-color-my-brand)");
    expect(colors["on-myBrand"]).toBe("var(--md-sys-color-on-my-brand)");
    expect(colors["myBrand-container"]).toBe(
      "var(--md-sys-color-my-brand-container)",
    );
    expect(colors["on-myBrand-container"]).toBe(
      "var(--md-sys-color-on-my-brand-container)",
    );

    // Custom color shades
    expect(colors["myBrand-50"]).toBe("var(--md-ref-palette-my-brand-95)");
    expect(colors["myBrand-950"]).toBe("var(--md-ref-palette-my-brand-5)");

    // Second custom color
    expect(colors["success"]).toBe("var(--md-sys-color-success)");
    expect(colors["success-500"]).toBe("var(--md-ref-palette-success-50)");
  });

  it("should respect custom prefix", () => {
    const result = materialTheme({ source: "#6750A4", prefix: "my" });
    const colors = result.config?.theme?.extend?.colors as Record<
      string,
      string
    >;

    expect(colors["primary"]).toBe("var(--my-sys-color-primary)");
    expect(colors["primary-500"]).toBe("var(--my-ref-palette-primary-50)");
  });

  it("should inject builder CSS variables via addBase", () => {
    const result = materialTheme({ source: "#6750A4" });
    const calls: CssInJs[] = [];

    result.handler({
      addBase: (base: CssInJs) => calls.push(base),
    } as unknown as Parameters<typeof result.handler>[0]);

    // Should have called addBase with :root and .dark rules
    expect(calls.length).toBe(1);
    const rules = calls[0] as CssInJs;
    expect(rules).toHaveProperty(":root");
    expect(rules).toHaveProperty(".dark");

    // Verify some CSS variable presence
    expect(rules[":root"]).toHaveProperty("--md-sys-color-primary");
    expect(rules[".dark"]).toHaveProperty("--md-sys-color-primary");

    // Verify palette vars are present
    expect(rules[":root"]).toHaveProperty("--md-ref-palette-primary-50");
  });

  it("should inject shadcn CSS variables when shadcn option is true", () => {
    const result = materialTheme({ source: "#6750A4", shadcn: true });
    const calls: CssInJs[] = [];

    result.handler({
      addBase: (base: CssInJs) => calls.push(base),
    } as unknown as Parameters<typeof result.handler>[0]);

    // Should have called addBase twice: once for builder CSS, once for shadcn
    expect(calls.length).toBe(2);

    const shadcnRules = calls[1] as CssInJs;
    expect(shadcnRules).toHaveProperty(":root, .dark");

    const vars = shadcnRules[":root, .dark"] as Record<string, string>;
    expect(vars["--background"]).toBe("var(--md-sys-color-surface)");
    expect(vars["--foreground"]).toBe("var(--md-sys-color-on-surface)");
    expect(vars["--primary"]).toBe("var(--md-sys-color-primary)");
    expect(vars["--primary-foreground"]).toBe("var(--md-sys-color-on-primary)");
    expect(vars["--destructive"]).toBe("var(--md-sys-color-error)");
    expect(vars["--border"]).toBe("var(--md-sys-color-outline-variant)");
    expect(vars["--ring"]).toBe("var(--md-sys-color-primary)");
    expect(vars["--sidebar"]).toBe("var(--md-sys-color-surface-container-low)");
  });

  it("should NOT inject shadcn CSS variables when shadcn option is false", () => {
    const result = materialTheme({ source: "#6750A4", shadcn: false });
    const calls: CssInJs[] = [];

    result.handler({
      addBase: (base: CssInJs) => calls.push(base),
    } as unknown as Parameters<typeof result.handler>[0]);

    // Should have called addBase only once: for builder CSS
    expect(calls.length).toBe(1);
  });
});
