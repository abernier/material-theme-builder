import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "tailwindcss";
import { beforeAll, describe, expect, it } from "vitest";

import { formatTailwindCss } from "../scripts/generate-tailwind-css.mjs";
import { builder } from "./lib/builder";
import mtbTailwindPlugin, {
  mtbColors,
  type MtbTailwindPluginOptions,
} from "./tailwind-plugin";

const here = path.dirname(fileURLToPath(import.meta.url));
const require_ = createRequire(import.meta.url);

/** `tailwind.css` as the generator writes it. */
const generateStylesheet = (source = "#6750A4") =>
  formatTailwindCss(builder(source).toTailwind());

// Generated here rather than read from disk: the file is a build artifact, and
// the suite has to pass without a build having run.
let stylesheet: string;
let stylesheetPath: string;

beforeAll(async () => {
  stylesheet = await generateStylesheet();
  stylesheetPath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "mtb-tailwind-")),
    "tailwind.css",
  );
  fs.writeFileSync(stylesheetPath, stylesheet);
});

/** Every color name the stylesheet declares. */
const stylesheetNames = () =>
  [...stylesheet.matchAll(/--color-([\w-]+):/g)]
    .map(([, name]) => name ?? "")
    // the banner's `@plugin` example mentions custom colors in prose
    .filter((name) => name && !name.startsWith("myCustomColor"));

/** The `theme.extend.colors` map the plugin hands Tailwind for given options. */
function colorsFor(options?: MtbTailwindPluginOptions) {
  const config = mtbTailwindPlugin(options).config;
  return (config?.theme?.extend?.colors ?? {}) as Record<string, string>;
}

/**
 * Compile a stylesheet the way a consumer's bundler would, and return the CSS
 * for `candidates`.
 */
async function build(css: string, candidates: string[]) {
  const compiler = await compile(css, {
    base: here,
    loadModule: async (id, base) => {
      const resolved = id.startsWith(".")
        ? path.resolve(base, id)
        : require_.resolve(id);
      const mod = await import(/* @vite-ignore */ resolved);
      return {
        path: resolved,
        base: path.dirname(resolved),
        module: mod.default ?? mod,
      };
    },
    loadStylesheet: async (id, base) => {
      const resolved = id.startsWith(".")
        ? path.resolve(base, id)
        : require_.resolve(id);
      return {
        path: resolved,
        base: path.dirname(resolved),
        content: fs.readFileSync(resolved, "utf8"),
      };
    },
  });

  return compiler.build(candidates);
}

const TAILWIND = `@import "tailwindcss/theme.css";\n@import "tailwindcss/utilities.css";\n`;

describe("tailwind plugin › colors", () => {
  it("should map scheme tokens onto the sys-color properties", () => {
    const colors = colorsFor();

    expect(colors["primary"]).toBe("var(--md-sys-color-primary)");
    expect(colors["on-primary-container"]).toBe(
      "var(--md-sys-color-on-primary-container)",
    );
    expect(colors["surface-container-highest"]).toBe(
      "var(--md-sys-color-surface-container-highest)",
    );
  });

  it("should map shades onto the ref-palette properties", () => {
    const colors = colorsFor();

    expect(colors["primary-50"]).toBe("var(--md-ref-palette-primary-95)");
    expect(colors["primary-950"]).toBe("var(--md-ref-palette-primary-5)");
    expect(colors["neutral-variant-500"]).toBe(
      "var(--md-ref-palette-neutral-variant-50)",
    );
  });

  it("should emit no custom colors by default", () => {
    expect(Object.keys(colorsFor())).not.toContain("myCustomColor1");
  });

  it("should respect the prefix option", () => {
    const colors = colorsFor({ prefix: "my" });

    expect(colors["primary"]).toBe("var(--my-sys-color-primary)");
    expect(colors["primary-500"]).toBe("var(--my-ref-palette-primary-50)");
  });
});

describe("tailwind plugin › custom-colors", () => {
  // Tailwind parses the `@plugin` block as CSS declarations: `a, b` arrives as
  // an array, a lone `a` as a string.
  it.each([
    ["a comma-separated list", ["myCustomColor1", "myCustomColor2"]],
    ["a single name", "myCustomColor1"],
    ["a whitespace-separated string", "myCustomColor1 myCustomColor2"],
    ["a quoted string", '"myCustomColor1, myCustomColor2"'],
  ] as const)("should accept %s", (_, value) => {
    const colors = colorsFor({ "custom-colors": value as string | string[] });

    expect(colors["myCustomColor1"]).toBe(
      "var(--md-sys-color-my-custom-color-1)",
    );
  });

  it("should emit the four scheme roles and eleven shades per color", () => {
    const colors = colorsFor({ "custom-colors": ["myCustomColor1"] });

    expect(colors["myCustomColor1"]).toBe(
      "var(--md-sys-color-my-custom-color-1)",
    );
    expect(colors["on-myCustomColor1"]).toBe(
      "var(--md-sys-color-on-my-custom-color-1)",
    );
    expect(colors["myCustomColor1-container"]).toBe(
      "var(--md-sys-color-my-custom-color-1-container)",
    );
    expect(colors["on-myCustomColor1-container"]).toBe(
      "var(--md-sys-color-on-my-custom-color-1-container)",
    );

    expect(colors["myCustomColor1-50"]).toBe(
      "var(--md-ref-palette-my-custom-color-1-95)",
    );
    expect(colors["myCustomColor1-950"]).toBe(
      "var(--md-ref-palette-my-custom-color-1-5)",
    );
  });

  it("should leave an already-kebab-cased name alone", () => {
    const colors = colorsFor({ "custom-colors": "brand" });

    expect(colors["brand"]).toBe("var(--md-sys-color-brand)");
    expect(colors["on-brand-container"]).toBe(
      "var(--md-sys-color-on-brand-container)",
    );
  });
});

describe("tailwind plugin › compiled output", () => {
  it("should resolve utilities straight to the M3 property, with no --color-* indirection", async () => {
    const css = await build(
      `${TAILWIND}@plugin "./tailwind-plugin";\n`,
      // `bg-primary/50` is the interesting one: an inlined value still has to
      // survive the opacity modifier.
      ["bg-primary", "text-on-surface", "bg-primary/50"],
    );

    expect(css).toContain("background-color: var(--md-sys-color-primary)");
    expect(css).toContain("color: var(--md-sys-color-on-surface)");
    expect(css).toContain("var(--md-sys-color-primary) 50%");
    // `@theme inline` is what avoids this, and so must the plugin: a
    // `--color-primary` declared on `:root` would resolve against `:root`,
    // out of reach of a nested `<Mtb>` re-declaring the M3 properties.
    expect(css).not.toContain("--color-primary:");
  });

  it("should override Tailwind's own palette where the names collide", async () => {
    const css = await build(`${TAILWIND}@plugin "./tailwind-plugin";\n`, [
      "bg-neutral-50",
    ]);

    expect(css).toContain("background-color: var(--md-ref-palette-neutral-95)");
  });

  // The one place the plugin is not interchangeable with the stylesheet:
  // theme values a plugin contributes are defaults, so an `@theme` block of
  // your own wins over them whatever the order -- where a later `@import` of
  // the stylesheet would have won.
  it.each([
    ["before", (theme: string, plugin: string) => plugin + theme],
    ["after", (theme: string, plugin: string) => theme + plugin],
  ] as const)(
    "should yield to a CSS @theme declared %s it",
    async (_, order) => {
      const css = await build(
        TAILWIND +
          order(
            `@theme inline {\n  --color-primary: var(--mine);\n}\n`,
            `@plugin "./tailwind-plugin";\n`,
          ),
        ["bg-primary"],
      );

      expect(css).toContain("background-color: var(--mine)");
    },
  );

  // ...and the remedy the README documents. The list is short because names
  // have to collide to be at risk, and against a nominal shadcn scaffold --
  // not `styles/shadcn.css`, which is our own remapped copy -- exactly three
  // do. See `fixtures/shadcn/README.md` for how the fixture is regenerated.
  it("should be winnable back by an @theme of the consumer's own", async () => {
    const shadcnTheme = fs.readFileSync(
      path.join(here, "fixtures/shadcn/theme.css"),
      "utf8",
    );
    const claimed = new Set(
      [...shadcnTheme.matchAll(/--color-([\w-]+):/g)].map(([, name]) => name),
    );
    const collisions = Object.keys(mtbColors()).filter((name) =>
      claimed.has(name),
    );

    expect(collisions).toEqual(["background", "primary", "secondary"]);

    const handBack = `@theme inline {\n${collisions
      .map((name) => `  --color-${name}: var(--md-sys-color-${name});`)
      .join("\n")}\n}\n`;

    // The fixture verbatim, so the recipe is checked against what shadcn
    // actually emits rather than a hand-written stand-in for it.
    const css = await build(
      `${TAILWIND}${shadcnTheme}\n@plugin "./tailwind-plugin";\n${handBack}`,
      collisions.map((name) => `bg-${name}`),
    );

    for (const name of collisions) {
      expect(css).toContain(`background-color: var(--md-sys-color-${name})`);
    }
  });

  it("should generate custom color utilities from the @plugin options", async () => {
    const css = await build(
      `${TAILWIND}@plugin "./tailwind-plugin" {\n  custom-colors: myCustomColor1, myCustomColor2;\n}\n`,
      ["bg-myCustomColor1", "text-on-myCustomColor2-container"],
    );

    expect(css).toContain(
      "background-color: var(--md-sys-color-my-custom-color-1)",
    );
    expect(css).toContain(
      "color: var(--md-sys-color-on-my-custom-color-2-container)",
    );
  });

  it("should compile to what tailwind.css compiles to", async () => {
    // Either half can carry the standard tokens, so the two have to agree
    // across every name the stylesheet declares.
    const candidates = stylesheetNames().map((name) => `bg-${name}`);

    expect(candidates.length).toBeGreaterThan(100);

    const [viaStylesheet, viaPlugin] = await Promise.all([
      build(`${TAILWIND}@import "${stylesheetPath}";\n`, candidates),
      build(`${TAILWIND}@plugin "./tailwind-plugin";\n`, candidates),
    ]);

    // The stylesheet is Prettier-formatted, so its longest `var()` calls come
    // out wrapped over several lines. Only the whitespace differs.
    const normalize = (css: string) =>
      css.replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")");

    expect(normalize(viaPlugin)).toBe(normalize(viaStylesheet));
  });

  // The recipe the README leads with, against a nominal shadcn scaffold: the
  // stylesheet carries the standard tokens and wins the collisions by import
  // order, the plugin carries only what the stylesheet cannot know. Neither
  // half needs a hand-written block, and shadcn changes nothing.
  it("should need no @theme of its own when the stylesheet carries the standard tokens", async () => {
    const shadcnTheme = fs.readFileSync(
      path.join(here, "fixtures/shadcn/theme.css"),
      "utf8",
    );
    const candidates = [
      ...stylesheetNames().map((name) => `bg-${name}`),
      "bg-myCustomColor1",
      "text-on-myCustomColor2-container",
    ];

    const css = await build(
      `${TAILWIND}${shadcnTheme}\n@import "${stylesheetPath}";\n@plugin "./tailwind-plugin" {\n  custom-colors: myCustomColor1, myCustomColor2;\n}\n`,
      candidates,
    );

    // the three names shadcn also claims
    for (const name of ["background", "primary", "secondary"]) {
      expect(css).toContain(`background-color: var(--md-sys-color-${name})`);
    }
    expect(css).toContain(
      "background-color: var(--md-sys-color-my-custom-color-1)",
    );
    expect(css).toContain(
      "color: var(--md-sys-color-on-my-custom-color-2-container)",
    );
  });
});

describe("tailwind.css", () => {
  it("should not depend on the source color", async () => {
    // It names variables, never colors -- which is what lets one static file
    // serve every theme, and what makes the generator's arbitrary source
    // choice harmless.
    expect(await generateStylesheet("#FF5722")).toBe(
      await generateStylesheet("#6750A4"),
    );
  });

  it("should carry no custom colors", () => {
    // They depend on the config, so they are the plugin's job. A stylesheet
    // that shipped example ones taught people to copy-paste the block. Read
    // raw rather than through `stylesheetNames()`, which filters them out.
    const declarations = stylesheet
      .split("\n")
      .filter((line) => line.trimStart().startsWith("--color-"));

    expect(declarations.length).toBe(115);
    expect(
      declarations.filter((line) => /--color-\w*[A-Z]/.test(line)),
    ).toEqual([]);
  });
});

describe("styles/globals.css", () => {
  it("should keep every @import ahead of the @plugin block", () => {
    // CSS requires imports to come first, and PostCSS only says so while
    // Storybook is running -- which `pnpm run lgtm` never does. Cheap to
    // assert here instead of finding out from a warning in a build log.
    const statements = fs
      .readFileSync(path.join(here, "styles/globals.css"), "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("@"));

    const firstOther = statements.findIndex(
      (line) => !line.startsWith("@import"),
    );

    expect(firstOther).toBeGreaterThan(0);
    expect(
      statements.slice(firstOther).filter((line) => line.startsWith("@import")),
    ).toEqual([]);
  });
});

describe("mtbColors()", () => {
  it("should be callable directly, for a hand-written Tailwind config", () => {
    const colors = mtbColors({ customColors: ["brand"], prefix: "my" });

    expect(colors["primary"]).toBe("var(--my-sys-color-primary)");
    expect(colors["brand"]).toBe("var(--my-sys-color-brand)");
  });
});
