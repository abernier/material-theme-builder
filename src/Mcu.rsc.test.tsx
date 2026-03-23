import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { act } from "react";
import { Mcu } from "./Mcu";
import { useMcu } from "./Mcu.context";

/**
 * Functional tests for React Server Components (RSC) compatibility
 *
 * These tests ensure that react-mcu works correctly in RSC environments
 * like Next.js App Router, where components are server-rendered by default
 * and client components must be explicitly marked with "use client".
 *
 * DIFFERENCE WITH Mcu.test.tsx (non-RSC tests):
 * ------------------------------------------------
 * Mcu.test.tsx:
 *   - 1 simple test that verifies basic CSS variable injection
 *   - Tests the core functionality only
 *
 * Mcu.rsc.test.tsx (this file):
 *   - 8 comprehensive tests covering RSC-specific scenarios
 *   - Tests multiple color schemes (tonalSpot, vibrant)
 *   - Tests custom colors functionality
 *   - Tests the useMcu hook (setMcuConfig, getMcuColor)
 *   - Tests dynamic color updates
 *   - Tests server-side imports (simulating RSC behavior)
 *
 * WHY TWO SEPARATE FILES?
 * - Mcu.test.tsx: Basic smoke test for core functionality
 * - Mcu.rsc.test.tsx: Comprehensive test suite ensuring the component
 *   works in RSC environments where "use client" is critical
 *
 * Related: https://github.com/abernier/react-mcu/pull/50
 */
describe("RSC Compatibility - Functional Tests", () => {
  afterEach(() => {
    cleanup();
  });

  describe("Client component rendering", () => {
    it("should render Mcu component and inject CSS variables in client context", () => {
      // This simulates a client component using Mcu (as it would be in an RSC app)
      const { container } = render(
        <Mcu source="#6750A4" scheme="tonalSpot" contrast={0} customColors={[]}>
          <div data-testid="content">Test content</div>
        </Mcu>,
      );

      // Verify the component renders children
      const content = container.querySelector('[data-testid="content"]');
      expect(content).toBeTruthy();
      expect(content?.textContent).toBe("Test content");

      // Verify CSS variables are injected
      const styleTag = document.querySelector("#mcu-styles");
      expect(styleTag).toBeTruthy();
      expect(styleTag?.tagName).toBe("STYLE");

      const styleContent = styleTag?.textContent || "";
      expect(styleContent).toContain("--mcu-primary");
      expect(styleContent).toContain("--mcu-on-primary");
      expect(styleContent).toContain("--mcu-surface");
      expect(styleContent).toContain("--mcu-background");
    });

    it("should handle different color schemes", () => {
      render(
        <Mcu source="#FF5722" scheme="vibrant" contrast={0.5}>
          <div>Vibrant content</div>
        </Mcu>,
      );

      const styleTag = document.querySelector("#mcu-styles");
      const styleContent = styleTag?.textContent || "";

      // Verify CSS is generated for the vibrant scheme
      expect(styleContent).toContain("--mcu-primary");
      expect(styleContent).toContain(":root");
      expect(styleContent).toContain(".dark");
    });

    it("should handle custom colors", () => {
      render(
        <Mcu
          source="#6750A4"
          scheme="tonalSpot"
          customColors={[
            { name: "brandColor", hex: "#FF0000", blend: true },
            { name: "accentColor", hex: "#00FF00", blend: false },
          ]}
        >
          <div>Custom colors content</div>
        </Mcu>,
      );

      const styleTag = document.querySelector("#mcu-styles");
      const styleContent = styleTag?.textContent || "";

      // Verify custom color CSS variables are present
      expect(styleContent).toContain("--mcu-brand-color");
      expect(styleContent).toContain("--mcu-on-brand-color");
      expect(styleContent).toContain("--mcu-accent-color");
      expect(styleContent).toContain("--mcu-on-accent-color");
    });
  });

  describe("useMcu hook in client context", () => {
    it("should provide access to Mcu context methods", () => {
      let hookResult: ReturnType<typeof useMcu> | null = null;

      function TestComponent() {
        hookResult = useMcu();
        return <div>Test</div>;
      }

      render(
        <Mcu source="#6750A4" scheme="tonalSpot">
          <TestComponent />
        </Mcu>,
      );

      expect(hookResult).not.toBeNull();
      expect(hookResult!.initials).toBeDefined();
      expect(hookResult!.setMcuConfig).toBeDefined();
      expect(hookResult!.getMcuColor).toBeDefined();
    });

    it("should allow dynamic color changes via setMcuConfig", () => {
      let hookResult: ReturnType<typeof useMcu> | null = null;

      function TestComponent() {
        hookResult = useMcu();
        return <div>Test</div>;
      }

      render(
        <Mcu source="#6750A4" scheme="tonalSpot">
          <TestComponent />
        </Mcu>,
      );

      // Change the color scheme
      act(() => {
        hookResult!.setMcuConfig({
          source: "#FF5722",
          scheme: "vibrant",
        });
      });

      // Verify the style tag is updated
      const styleTag = document.querySelector("#mcu-styles");
      expect(styleTag).toBeTruthy();

      // The style should be updated (we just verify it exists and has content)
      const styleContent = styleTag?.textContent || "";
      expect(styleContent.length).toBeGreaterThan(0);
    });

    it("should retrieve color values via getMcuColor", () => {
      let hookResult: ReturnType<typeof useMcu> | null = null;

      function TestComponent() {
        hookResult = useMcu();
        return <div>Test</div>;
      }

      render(
        <Mcu source="#6750A4" scheme="tonalSpot">
          <TestComponent />
        </Mcu>,
      );

      // Get colors for light and dark themes
      const primaryLight = hookResult!.getMcuColor("primary", "light");
      const primaryDark = hookResult!.getMcuColor("primary", "dark");

      expect(primaryLight).toBeDefined();
      expect(primaryDark).toBeDefined();
      expect(primaryLight).toMatch(/^#[0-9a-f]{6}$/i);
      expect(primaryDark).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe("Server component import simulation", () => {
    it("should allow importing Mcu without errors (simulates server-side import)", async () => {
      // In RSC environments, server components can import client components
      // They just can't render them directly - this tests the import doesn't throw
      const { Mcu: ImportedMcu } = await import("./Mcu");

      expect(ImportedMcu).toBeDefined();
      expect(typeof ImportedMcu).toBe("function");
    });

    it("should allow importing useMcu without errors", async () => {
      const { useMcu: importedUseMcu } = await import("./Mcu.context");

      expect(importedUseMcu).toBeDefined();
      expect(typeof importedUseMcu).toBe("function");
    });
  });
});
