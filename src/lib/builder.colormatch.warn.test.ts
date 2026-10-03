import { afterEach, describe, expect, it, vi } from "vitest";

import { builder } from "./builder";

// In a file of its own: `builder()` remembers which scheme values it already
// warned about for the life of the module, and vitest gives each test file a
// fresh one.

const SOURCE = "#6750A4";

describe("builder() › colorMatch › ignored scheme warning", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should not warn without an explicit scheme", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    builder(SOURCE, { colorMatch: true });
    expect(warn).not.toHaveBeenCalled();
  });

  it("should not warn for the content scheme, the one colorMatch forces", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    builder(SOURCE, { colorMatch: true, scheme: "content" });
    expect(warn).not.toHaveBeenCalled();
  });

  it("should not warn with colorMatch off", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    builder(SOURCE, { scheme: "vibrant" });
    builder(SOURCE, { colorMatch: false, scheme: "vibrant" });
    expect(warn).not.toHaveBeenCalled();
  });

  it("should warn that another scheme is ignored, once per scheme", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    builder(SOURCE, { colorMatch: true, scheme: "vibrant" });
    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('`scheme: "vibrant"` is ignored'),
    );

    // `builder()` runs on every render: the same scheme again stays quiet
    builder(SOURCE, { colorMatch: true, scheme: "vibrant" });
    expect(warn).toHaveBeenCalledOnce();
  });
});
