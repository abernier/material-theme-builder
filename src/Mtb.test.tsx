import { cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { Mcu, Mtb } from "./Mtb";

describe("Mtb", () => {
  afterEach(() => {
    cleanup();
    // Also manually remove any leftover style tags
    document.querySelectorAll("#mcu-styles").forEach((el) => el.remove());
  });

  it("should inject style tag with --md-sys-color-* CSS variables", () => {
    render(
      <Mtb source="#6750A4" scheme="tonalSpot" contrast={0} customColors={[]}>
        <div>Test content</div>
      </Mtb>,
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
      <Mtb
        source="#6750A4"
        customColors={[
          { name: "brand", hex: "#FF5733", blend: true },
          { name: "success", hex: "#28A745", blend: false },
        ]}
      >
        <div>Test content</div>
      </Mtb>,
    );

    // Check that custom color variables are present
    let styleTag = document.querySelector("#mcu-styles");
    let styleContent = styleTag?.textContent || "";

    expect(styleContent).toContain("--md-sys-color-brand");
    expect(styleContent).toContain("--md-sys-color-success");

    // Rerender with only one custom color (removing "success")
    rerender(
      <Mtb
        source="#6750A4"
        customColors={[{ name: "brand", hex: "#FF5733", blend: true }]}
      >
        <div>Test content</div>
      </Mtb>,
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
      <Mtb source="#6750A4" customColors={[]}>
        <div>Test content</div>
      </Mtb>,
    );

    // Check that all custom color variables are removed
    styleTag = document.querySelector("#mcu-styles");
    styleContent = styleTag?.textContent || "";

    expect(styleContent).not.toContain("--md-sys-color-brand");

    // Rerender without customColors prop at all (should use default empty array)
    rerender(
      <Mtb source="#6750A4">
        <div>Test content</div>
      </Mtb>,
    );

    // Check that custom colors are still not present
    styleTag = document.querySelector("#mcu-styles");
    styleContent = styleTag?.textContent || "";

    expect(styleContent).not.toContain("--md-sys-color-brand");
  });

  it("should render the CSS variables into the server markup", () => {
    // The whole point of rendering the <style> rather than injecting it from
    // an effect: effects don't run on the server, so anything rendered there
    // used to reach the browser with no colors at all and paint an unthemed
    // first frame.
    const html = renderToStaticMarkup(
      <Mtb source="#6750A4">
        <div>Test content</div>
      </Mtb>,
    );

    const open = '<style id="mcu-styles">';
    expect(html).toContain(open);

    const css = html.slice(
      html.indexOf(open) + open.length,
      html.indexOf("</style>"),
    );
    expect(css).toContain("--md-sys-color-primary");
    expect(css).toContain("--md-sys-color-surface");
    // Light in :root, dark in .dark -- both halves have to be there, since
    // the scheme is picked by a class the app sets before paint.
    expect(css).toContain(":root {");
    expect(css).toContain(".dark {");
    // Rendered through `dangerouslySetInnerHTML`, not as children: React
    // escapes text children, which would turn a `&` or `>` in a selector into
    // an entity and break the sheet.
    expect(css).not.toMatch(/&(amp|gt|lt|quot|#x27);/);
  });

  it("should keep `Mcu` as a deprecated alias of `Mtb`", () => {
    expect(Mcu).toBe(Mtb);
  });
});
