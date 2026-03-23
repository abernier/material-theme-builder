import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Mcu } from "./Mcu";

/**
 * Basic smoke tests for Mcu component
 *
 * This is a simple test suite that verifies the core functionality works.
 * For comprehensive RSC-specific tests, see Mcu.rsc.test.tsx
 */
describe("Mcu", () => {
  afterEach(() => {
    cleanup();
    // Also manually remove any leftover style tags
    document.querySelectorAll("#mcu-styles").forEach((el) => el.remove());
  });

  it("should inject style tag with --md-sys-color-* CSS variables", () => {
    render(
      <Mcu source="#6750A4" scheme="tonalSpot" contrast={0} customColors={[]}>
        <div>Test content</div>
      </Mcu>,
    );

    // Check that the style tag exists
    const styleTag = document.querySelector("#mcu-styles");
    expect(styleTag).toBeTruthy();
    expect(styleTag?.tagName).toBe("STYLE");

    // Check that the style content includes CSS variables
    const styleContent = styleTag?.textContent || "";
    expect(styleContent).toContain("--md-sys-color-primary");
    expect(styleContent).toContain("--md-sys-color-on-primary");
    expect(styleContent).toContain("--md-sys-color-surface");
    expect(styleContent).toContain("--md-sys-color-background");
  });

  it("should remove custom color CSS variables when customColors are removed", () => {
    // First render with custom colors
    const { rerender } = render(
      <Mcu
        source="#6750A4"
        customColors={[
          { name: "brand", hex: "#FF5733", blend: true },
          { name: "success", hex: "#28A745", blend: false },
        ]}
      >
        <div>Test content</div>
      </Mcu>,
    );

    // Check that custom color variables are present
    let styleTag = document.querySelector("#mcu-styles");
    let styleContent = styleTag?.textContent || "";

    expect(styleContent).toContain("--md-sys-color-brand");
    expect(styleContent).toContain("--md-sys-color-success");

    // Rerender with only one custom color (removing "success")
    rerender(
      <Mcu
        source="#6750A4"
        customColors={[{ name: "brand", hex: "#FF5733", blend: true }]}
      >
        <div>Test content</div>
      </Mcu>,
    );

    // Check that "success" variables are removed
    styleTag = document.querySelector("#mcu-styles");
    styleContent = styleTag?.textContent || "";

    // "brand" should still be there
    expect(styleContent).toContain("--md-sys-color-brand");

    // "success" should be gone
    expect(styleContent).not.toContain("--md-sys-color-success");

    // Rerender with no custom colors (empty array)
    rerender(
      <Mcu source="#6750A4" customColors={[]}>
        <div>Test content</div>
      </Mcu>,
    );

    // Check that all custom color variables are removed
    styleTag = document.querySelector("#mcu-styles");
    styleContent = styleTag?.textContent || "";

    expect(styleContent).not.toContain("--md-sys-color-brand");

    // Rerender without customColors prop at all (should use default empty array)
    rerender(
      <Mcu source="#6750A4">
        <div>Test content</div>
      </Mcu>,
    );

    // Check that custom colors are still not present
    styleTag = document.querySelector("#mcu-styles");
    styleContent = styleTag?.textContent || "";

    expect(styleContent).not.toContain("--md-sys-color-brand");
  });
});
