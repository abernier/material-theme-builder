import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "tailwindcss";
import { beforeAll, describe, expect, it } from "vitest";

import { formatOutput } from "../scripts/generate.mjs";
import { builder } from "./lib/builder";
import mtbTailwindPlugin, {
  mtbColors,
  type MtbTailwindPluginOptions,
} from "./tailwind-plugin";

const here = path.dirname(fileURLToPath(import.meta.url));
const require_ = createRequire(import.meta.url);

/** `tailwind.css` as the generator writes it. */
const generateStylesheet = (source = "#6750A4") =>
  formatOutput("tailwind.css", builder(source).toTailwind());

/**
 * shadcn's `@theme inline` block — the names it claims — read out of
 * `styles/globals.css`.
 *
 * That file is the one `components.json` names, so its top half is what the
 * shadcn CLI writes and maintains -- the authority on the question. Only the one block, though: around it the file `@import`s
 * tailwindcss, an animation library and a webfont, none of which the harness
 * below has any business resolving. Extracted rather than kept as a fixture of
 * its own, so upstream lives in the repo once — a second copy is how "which
 * names does shadcn claim?" came to be answered by a file a major behind.
 */
const shadcnTheme = () => {
  const css = fs.readFileSync(path.join(here, "styles/globals.css"), "utf8");
  // Everything inside the block is indented, so the first `}` at column 0
  // closes it.
  const block = /^@theme inline \{$[\s\S]*?^\}$/m.exec(css)?.[0];

  if (!block) throw new Error("no `@theme inline` block in styles/globals.css");

  return block;
};

/**
 * shadcn's own `:root` and `.dark` blocks, out of the same file.
 *
 * In a scaffolded project these sit inline in `globals.css` -- the arrangement
 * the README's shadcn section shows, and the one our stylesheet has to win
 * against.
 */
const shadcnBlocks = () => {
  const css = fs.readFileSync(path.join(here, "styles/globals.css"), "utf8");
  const blocks = css.match(/^(?::root|\.dark) \{$[\s\S]*?^\}$/gm);

  if (blocks?.length !== 2) {
    throw new Error(
      "expected one `:root` and one `.dark` in styles/globals.css",
    );
  }

  return blocks.join("\n\n");
};

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
  // the stylesheet would have won. Which is why the standard tokens are left
  // to the stylesheet, and why the README documents that pairing alone.
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

  // `styles/globals.css` pins one order, and so does every other test here, so
  // nothing would notice if another stopped working.
  it("should not depend on the order of the three lines", async () => {
    const lines: Record<string, string> = {
      tailwind: TAILWIND,
      stylesheet: `@import "${stylesheetPath}";\n`,
      plugin: `@plugin "./tailwind-plugin" {\n  custom-colors: myCustomColor1;\n}\n`,
    };
    const orders = [
      ["tailwind", "stylesheet", "plugin"],
      ["tailwind", "plugin", "stylesheet"],
      ["stylesheet", "tailwind", "plugin"],
      ["stylesheet", "plugin", "tailwind"],
      ["plugin", "tailwind", "stylesheet"],
      ["plugin", "stylesheet", "tailwind"],
    ];
    const candidates = ["bg-primary", "bg-primary-300", "bg-myCustomColor1"];

    const [reference, ...rest] = await Promise.all(
      orders.map((order) =>
        build(order.map((name) => lines[name]).join(""), candidates),
      ),
    );

    // Equality alone would hold just as well over six empty stylesheets.
    expect(reference).toContain(
      "background-color: var(--md-sys-color-primary)",
    );
    expect(reference).toContain(
      "background-color: var(--md-sys-color-my-custom-color-1)",
    );

    for (const css of rest) expect(css).toBe(reference);
  });

  // The recipe the README leads with, against a nominal shadcn scaffold: the
  // stylesheet carries the standard tokens, the plugin carries only what the
  // stylesheet cannot know. Neither half needs a hand-written block, and
  // shadcn changes nothing.
  it("should need no @theme of its own when the stylesheet carries the standard tokens", async () => {
    const theme = shadcnTheme();
    const candidates = [
      ...stylesheetNames().map((name) => `bg-${name}`),
      "bg-myCustomColor1",
      "text-on-myCustomColor2-container",
    ];

    const css = await build(
      `${TAILWIND}@import "${stylesheetPath}";\n${theme}\n@plugin "./tailwind-plugin" {\n  custom-colors: myCustomColor1, myCustomColor2;\n}\n`,
      candidates,
    );

    // Three names are claimed by both `@theme inline` blocks, and shadcn's is
    // the later one, so those three go through its aliases -- which the
    // mapping in `shadcn.css` then points back at M3. Everything else lands on
    // its M3 role directly.
    for (const name of ["background", "primary", "secondary"]) {
      expect(css).toContain(`background-color: var(--${name})`);
    }
    for (const name of ["surface", "tertiary", "error", "outline-variant"]) {
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

/**
 * The specificity of the selector on the rule that declares `needle`.
 *
 * Counting `.class` and `:pseudo` tokens is enough for the selectors in play
 * here -- `:root`, `.dark`, and the doubled forms the alias block ships.
 */
const specificityOf = (css: string, needle: string) => {
  const rule = css.slice(0, css.indexOf(needle));
  const selector = rule.slice(rule.lastIndexOf("}") + 1, rule.lastIndexOf("{"));

  // Per selector in the list, not across it: `:root, .dark` is two selectors
  // of specificity one, which is exactly what the doubled form has to beat.
  return Math.max(
    ...selector
      .split(",")
      .map((one) => (one.match(/[.:][\w-]+/g) ?? []).length),
  );
};

describe("shadcn.css", () => {
  it("should make shadcn's own utilities resolve to the M3 properties", async () => {
    // The file is generated from `toShadcnAliases()`, so what is checked here
    // is the end of the chain rather than the mapping: shadcn's `@theme
    // inline` aliases `--color-card` to `--card`, and the block we ship points
    // `--card` at an M3 property. `bg-card` has to come out following `<Mtb>`.
    const shadcnCss = await formatOutput(
      "shadcn.css",
      builder("#6750A4").toShadcnAliases(),
    );

    const css = await build(`${TAILWIND}${shadcnTheme()}\n${shadcnCss}`, [
      "bg-card",
      "text-muted-foreground",
    ]);

    expect(css).toContain("--card: var(--md-sys-color-surface-container-low);");
    expect(css).toContain("background-color: var(--card)");
    expect(css).toContain(
      "--muted-foreground: var(--md-sys-color-on-surface-variant);",
    );
    expect(css).toContain("color: var(--muted-foreground)");
  });

  // The README's recipe, against the file layout a scaffold actually leaves:
  // shadcn's blocks inline. Ours wins on specificity, so it wins from either
  // side of them -- which is what lets the `@import` sit with the others, where
  // CSS requires it. The colors themselves are checked end to end by the
  // `Shadcn/dashboard-01` story.
  it.each([
    ["after", true],
    ["before", false],
  ] as const)(
    "should outrank shadcn's own blocks, imported %s them",
    async (_, ourImportLast) => {
      const shadcnCss = await formatOutput(
        "shadcn.css",
        builder("#6750A4").toShadcnAliases(),
      );
      const ourPath = path.join(path.dirname(stylesheetPath), "ours.css");
      fs.writeFileSync(ourPath, shadcnCss);

      const parts = [`@import "${ourPath}";\n`, `${shadcnBlocks()}\n`];

      const css = await build(
        TAILWIND +
          shadcnTheme() +
          "\n" +
          (ourImportLast ? parts : parts.reverse()).join(""),
        ["bg-card"],
      );

      expect(specificityOf(css, "--card: var(--md-sys-color-")).toBeGreaterThan(
        specificityOf(css, "--card: oklch("),
      );
    },
  );
});

describe("styles/globals.css", () => {
  it("should keep every @import ahead of the first rule", () => {
    // The repo dogfoods the arrangement the README documents. CSS drops an
    // `@import` that follows a rule, and one tool in the chain -- the
    // `postcss-import` Vite prepends -- does exactly that, silently: the file
    // still compiles, minus whichever half was imported too late.
    const css = fs.readFileSync(path.join(here, "styles/globals.css"), "utf8");
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");

    const lastImport = stripped.lastIndexOf("@import ");
    const firstRule = stripped.search(
      /^\s*(?:@(?:custom-variant|theme|layer)\b|[.:#\\w])/m,
    );

    expect(lastImport).toBeGreaterThan(-1);
    expect(firstRule).toBeGreaterThan(-1);
    expect(lastImport).toBeLessThan(firstRule);
  });
});

describe("mtbColors()", () => {
  it("should be callable directly, for a hand-written Tailwind config", () => {
    const colors = mtbColors({ customColors: ["brand"], prefix: "my" });

    expect(colors["primary"]).toBe("var(--my-sys-color-primary)");
    expect(colors["brand"]).toBe("var(--my-sys-color-brand)");
  });
});
