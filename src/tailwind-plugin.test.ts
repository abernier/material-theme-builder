import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "tailwindcss";
import { describe, expect, it } from "vitest";

import { formatOutput } from "../scripts/generate.mjs";
import { builder } from "./lib/builder";
import mtbTailwindPlugin, {
  mtbColors,
  type MtbTailwindPluginOptions,
} from "./tailwind-plugin";

const here = path.dirname(fileURLToPath(import.meta.url));
const require_ = createRequire(import.meta.url);

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
 * the README's shadcn section shows, and the one our alias block has to win
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
    // They depend on the config, so they only ever come from the options. The
    // `tailwind.css` this replaced shipped example ones, and taught people to
    // copy-paste the block.
    expect(
      Object.keys(colorsFor()).filter((name) => /[A-Z]/.test(name)),
    ).toEqual([]);
  });

  it("should declare 115 names", () => {
    // 49 scheme tokens, plus eleven Tailwind shades for each of the six core
    // palettes. The shipped vocabulary -- this number moving is a breaking
    // change, not a refactor.
    expect(Object.keys(colorsFor())).toHaveLength(115);
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

  // The one thing to know about carrying the vocabulary in a plugin rather
  // than in a stylesheet: theme values a plugin contributes are defaults, so
  // an `@theme` block of your own wins over them whatever the order -- where a
  // later `@import` would have had to come after. Which is how shadcn keeps
  // the three names both claim, and what the README documents.
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

  // `styles/globals.css` pins one order, and every other test here puts the
  // `@plugin` line last, so nothing would notice if the other stopped working.
  it("should not depend on where the @plugin line sits", async () => {
    const tailwind = TAILWIND;
    const plugin = `@plugin "./tailwind-plugin" {\n  custom-colors: myCustomColor1;\n}\n`;
    const candidates = ["bg-primary", "bg-primary-300", "bg-myCustomColor1"];

    const [after, before] = await Promise.all([
      build(tailwind + plugin, candidates),
      build(plugin + tailwind, candidates),
    ]);

    // Equality alone would hold just as well over two empty stylesheets.
    expect(after).toContain("background-color: var(--md-sys-color-primary)");
    expect(after).toContain(
      "background-color: var(--md-sys-color-my-custom-color-1)",
    );

    expect(before).toBe(after);
  });

  // The recipe the README leads with, against a nominal shadcn scaffold: one
  // `@plugin` line carries the whole vocabulary, standard tokens and custom
  // colors alike. No hand-written block anywhere, and shadcn changes nothing.
  it("should need no @theme of its own", async () => {
    const theme = shadcnTheme();
    const candidates = [
      ...Object.keys(colorsFor()).map((name) => `bg-${name}`),
      "bg-myCustomColor1",
      "text-on-myCustomColor2-container",
    ];

    expect(candidates.length).toBeGreaterThan(100);

    const css = await build(
      `${TAILWIND}${theme}\n@plugin "./tailwind-plugin" {\n  custom-colors: myCustomColor1, myCustomColor2;\n}\n`,
      candidates,
    );

    // Three names are claimed by shadcn's `@theme inline` too, and a plugin's
    // theme values are defaults, so those three go through its aliases --
    // which the mapping in `shadcn.css` then points back at M3. Everything
    // else lands on its M3 role directly.
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
      const ourPath = path.join(
        fs.mkdtempSync(path.join(os.tmpdir(), "mtb-shadcn-")),
        "ours.css",
      );
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
