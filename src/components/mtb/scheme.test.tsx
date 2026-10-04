import { cleanup, render } from "@testing-library/react";
import { kebabCase } from "lodash-es";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { registrySchema } from "shadcn/schema";
import { afterEach, describe, expect, it } from "vitest";

import { STANDARD_TONES } from "../../lib/builder";
import { CORE_PALETTES, tokenNames } from "../../lib/tokens";
import { Mtb } from "../../Mtb";
import {
  Palette,
  Scheme,
  SchemeAccents,
  SchemeCustomColors,
  SchemeRoles,
  SchemeRoot,
  SchemeTitle,
  Shades,
  ShadesRoot,
  Swatch,
  SwatchLabel,
} from "./scheme";

const here = path.dirname(fileURLToPath(import.meta.url));

const cells = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("[title]"));

const titles = (container: HTMLElement) =>
  cells(container).map((el) => el.getAttribute("title"));

/** What each cell paints with: the `--swatch` its `bg-(--swatch)` reads. */
const colors = (container: HTMLElement) =>
  cells(container).map((el) => el.style.getPropertyValue("--swatch"));

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot=${name}]`);

const brandTeal = [{ name: "brandTeal", hex: "#00A39B", blend: true }];

describe("Scheme", () => {
  afterEach(cleanup);

  it("draws every token the library knows, once the dropped roles are on", () => {
    const { container } = render(
      <Scheme surfaceTint background surfaceVariant />,
    );

    expect(titles(container).sort()).toEqual(tokenNames.map(kebabCase).sort());
  });

  it("leaves the dropped roles out by default, and the fixed accents on request", () => {
    const dropped = [
      "background",
      "on-background",
      "surface-variant",
      "surface-tint",
    ];

    const byDefault = titles(render(<Scheme />).container);
    expect(byDefault).toContain("primary-fixed-dim");
    for (const token of dropped) expect(byDefault).not.toContain(token);

    cleanup();

    const poster = titles(render(<Scheme fixedAccents={false} />).container);
    expect(poster.filter((token) => token?.includes("fixed"))).toEqual([]);
  });

  it("renders outside any <Mtb>, painting from the default prefix", () => {
    // `useMtb` would throw here. The Storybook overlay is drawn exactly so,
    // from a decorator that sits outside the story's provider.
    const { container } = render(<Scheme />);

    expect(colors(container)).toContain("var(--md-sys-color-primary)");
    expect(slot(container, "scheme-custom-colors")).toBeNull();
  });

  it("picks up the enclosing <Mtb>'s custom colors and prefix", () => {
    const { container } = render(
      <Mtb source="#769CDF" prefix="acme" customColors={brandTeal}>
        <Scheme />
      </Mtb>,
    );

    expect(titles(container)).toEqual(
      expect.arrayContaining([
        "brand-teal",
        "on-brand-teal",
        "brand-teal-container",
        "on-brand-teal-container",
      ]),
    );
    expect(container.textContent).toContain("On BrandTeal Container");
    expect(colors(container)).toEqual(
      expect.arrayContaining([
        "var(--acme-sys-color-primary)",
        "var(--acme-sys-color-on-brand-teal-container)",
      ]),
    );
  });

  it("lets props override what <Mtb> provides", () => {
    const { container } = render(
      <Mtb source="#769CDF" customColors={brandTeal}>
        <Scheme customColors={[]} prefix="other" />
      </Mtb>,
    );

    expect(titles(container)).not.toContain("brand-teal");
    expect(colors(container)).toContain("var(--other-sys-color-primary)");
  });

  it("hands its config down to a <Shades> passed as children", () => {
    const { container } = render(
      <Scheme prefix="acme" customColors={brandTeal}>
        <Shades noTitle />
      </Scheme>,
    );

    expect(colors(container)).toContain(
      "var(--acme-ref-palette-brand-teal-40)",
    );
  });

  it("sets the `dark` class on a dark card only", () => {
    const dark = render(<Scheme theme="dark" title="Dark scheme" />);
    const card = slot(dark.container, "scheme");
    expect(card?.classList.contains("dark")).toBe(true);
    expect(slot(dark.container, "scheme-title")?.textContent).toBe(
      "Dark scheme",
    );

    cleanup();

    const light = render(<Scheme theme="light" />);
    expect(light.container.querySelector(".dark")).toBeNull();
  });

  it("forwards className, style and children to the root", () => {
    const { container } = render(
      <Scheme
        className="mine gap-8"
        style={{ maxWidth: 320 }}
        data-testid="poster"
      >
        <span>extra</span>
      </Scheme>,
    );

    const root = container.querySelector<HTMLElement>("[data-testid=poster]");
    expect(root?.classList.contains("mine")).toBe(true);
    // `cn`, not concatenation: the override replaces the default it conflicts
    // with instead of racing it in the stylesheet.
    expect(root?.classList.contains("gap-8")).toBe(true);
    expect(root?.classList.contains("gap-4")).toBe(false);
    expect(root?.style.maxWidth).toBe("320px");
    expect(root?.textContent).toContain("extra");
  });

  it("paints a swatch with a `bg-*` utility instead, when given one", () => {
    // The Tailwind story's whole point. `bg-(--swatch)` has to be *gone*, not
    // merely followed: both are single-class utilities, so which one won
    // would otherwise be up to their order in the generated stylesheet.
    const { container } = render(
      <Scheme
        customColors={brandTeal}
        swatchClassNames={{
          primary: "bg-primary",
          "on-brandTeal": "bg-on-brandTeal",
        }}
      />,
    );

    const classes = (title: string) =>
      Array.from(
        container.querySelector(`[title=${title}]`)?.classList ?? [],
      ).filter((name) => name.startsWith("bg-"));

    expect(classes("primary")).toEqual(["bg-primary"]);
    expect(classes("on-brand-teal")).toEqual(["bg-on-brandTeal"]);
    expect(classes("secondary")).toEqual(["bg-(--swatch)"]);
  });

  it("server-renders, inside an <Mtb> and without one", () => {
    const inside = renderToStaticMarkup(
      <Mtb source="#769CDF">
        <Scheme theme="dark" />
      </Mtb>,
    );
    expect(inside).toContain("var(--md-sys-color-on-primary-container)");

    expect(renderToStaticMarkup(<Scheme />)).toContain(
      "var(--md-sys-color-on-primary-container)",
    );
  });
});

describe("the parts", () => {
  afterEach(cleanup);

  it("compose into a poster of one's own, each taking className", () => {
    const { container } = render(
      <SchemeRoot theme="light" customColors={brandTeal} className="rounded-xl">
        <SchemeTitle className="text-2xl">Brand</SchemeTitle>
        <SchemeRoles className="grid-cols-1">
          <SchemeAccents className="gap-2" />
        </SchemeRoles>
        <SchemeCustomColors className="gap-2" />
      </SchemeRoot>,
    );

    expect(slot(container, "scheme")?.classList.contains("rounded-xl")).toBe(
      true,
    );
    expect(slot(container, "scheme-title")?.className).toBe(
      "font-bold capitalize text-2xl",
    );

    const roles = slot(container, "scheme-roles");
    expect(roles?.classList.contains("grid-cols-1")).toBe(true);
    expect(roles?.classList.contains("grid-cols-[3fr_1fr]")).toBe(false);

    const accents = slot(container, "scheme-accents");
    expect(accents?.classList.contains("gap-2")).toBe(true);
    expect(accents?.classList.contains("gap-px")).toBe(false);

    // Only what was composed: no errors, no surfaces -- and the custom colors
    // the root was given.
    expect(titles(container)).toHaveLength(12 + 4);
    expect(slot(container, "scheme-errors")).toBeNull();
    expect(titles(container)).toContain("brand-teal-container");
  });

  it("draw a <Swatch> on its own, labelled or relabelled", () => {
    const { container } = render(
      <>
        <Swatch token="onPrimaryContainer" className="h-32 bg-red-500" />
        <Swatch token="on-brand" style={{ opacity: 0.5 }}>
          <SwatchLabel className="text-base">Ink</SwatchLabel>
        </Swatch>
      </>,
    );

    const [role, custom] = cells(container);

    expect(role?.title).toBe("on-primary-container");
    expect(role?.textContent).toBe("On Primary Container");
    expect(role?.className).toBe("h-32 bg-red-500");
    expect(role?.style.getPropertyValue("--swatch")).toBe(
      "var(--md-sys-color-on-primary-container)",
    );

    expect(custom?.textContent).toBe("Ink");
    expect(custom?.style.opacity).toBe("0.5");
    expect(custom?.style.getPropertyValue("--swatch")).toBe(
      "var(--md-sys-color-on-brand)",
    );

    const label = custom?.querySelector("[data-slot=swatch-label]");
    expect(label?.classList.contains("text-base")).toBe(true);
    expect(label?.classList.contains("text-[.8rem]")).toBe(false);
    // The color survives a font-size override: `text-white` is a different
    // `text-*`, and `cn` knows.
    expect(label?.classList.contains("text-white")).toBe(true);
  });
});

describe("Shades", () => {
  afterEach(cleanup);

  it("draws every standard tone of every core palette, lightest first", () => {
    const { container } = render(<Shades />);

    const drawn = titles(container);
    expect(drawn).toHaveLength(CORE_PALETTES.length * STANDARD_TONES.length);
    expect(drawn.slice(0, 2)).toEqual(["primary-100", "primary-99"]);
    expect(drawn).toContain("neutral-variant-0");
    expect(colors(container)).toContain(
      "var(--md-ref-palette-neutral-variant-0)",
    );
  });

  it("adds a palette per custom color, from <Mtb> or from props", () => {
    const fromContext = render(
      <Mtb source="#769CDF" customColors={brandTeal}>
        <Shades />
      </Mtb>,
    );
    expect(titles(fromContext.container)).toContain("brand-teal-40");
    expect(
      Array.from(
        fromContext.container.querySelectorAll("[data-slot=palette-title]"),
      ).map((el) => el.textContent),
    ).toEqual([
      "primary",
      "secondary",
      "tertiary",
      "error",
      "neutral",
      "neutral variant",
      "BrandTeal",
    ]);

    cleanup();

    const fromProps = render(
      <Shades
        noTitle
        prefix="acme"
        customColors={[{ name: "brand", hex: "#00A39B", blend: false }]}
      />,
    );
    expect(slot(fromProps.container, "palette-title")).toBeNull();
    expect(colors(fromProps.container)).toContain(
      "var(--acme-ref-palette-brand-40)",
    );
  });

  it("draws a chosen set of palettes from its parts", () => {
    const { container } = render(
      <ShadesRoot prefix="acme" className="gap-4">
        <Palette name="primary" title="Primary" className="rounded" />
        <Palette name="brandTeal" />
      </ShadesRoot>,
    );

    expect(slot(container, "shades")?.className).toBe("flex flex-col gap-4");
    expect(container.querySelectorAll("[data-slot=palette]")).toHaveLength(2);
    expect(slot(container, "palette")?.className).toBe("rounded");
    expect(titles(container)).toHaveLength(2 * STANDARD_TONES.length);
    expect(colors(container)).toEqual(
      expect.arrayContaining([
        "var(--acme-ref-palette-primary-100)",
        "var(--acme-ref-palette-brand-teal-0)",
      ]),
    );
  });
});

describe("the `scheme` registry item", () => {
  // The root registry.json is the item: `shadcn add
  // abernier/material-theme-builder/scheme` reads it off GitHub, and the
  // component from the path it gives.
  const root = path.join(here, "../../..");
  const registry = registrySchema.parse(
    JSON.parse(fs.readFileSync(path.join(root, "registry.json"), "utf8")),
  );
  const item = registry.items.find(({ name }) => name === "scheme");

  it("is declared by a registry the CLI accepts from GitHub", () => {
    // Parsed above by the schema `shadcn add` itself applies. A root registry
    // lacking either of these two is refused.
    expect(registry.name).toBe("material-theme-builder");
    expect(registry.homepage).toBe(
      "https://github.com/abernier/material-theme-builder",
    );
    expect(item?.type).toBe("registry:component");
  });

  it("points at the component Storybook draws with", () => {
    // One implementation: what the stories show is what gets installed.
    expect(item?.files).toEqual([
      { path: "src/components/mtb/scheme.tsx", type: "registry:component" },
    ]);
    expect(fs.existsSync(path.join(here, "scheme.tsx"))).toBe(true);
  });

  it("declares every package the component imports", () => {
    // The file lands in someone else's project: an import that only resolves
    // here -- a relative one, a devDependency of ours -- is a broken install.
    const content = fs.readFileSync(path.join(here, "scheme.tsx"), "utf8");

    const imported = Array.from(
      content.matchAll(/^} from "([^"]+)";$|^import .* from "([^"]+)";$/gm),
      (match) => match[1] ?? match[2] ?? "",
    );

    // What every shadcn project has: React, and the `utils` alias the CLI
    // rewrites to the project's own.
    const given = ["react", "@/lib/utils"];
    const packages = imported
      .filter((specifier) => !given.includes(specifier))
      .map((specifier) => specifier.split("/")[0]);
    const declared = (item?.dependencies ?? []).map(
      (dependency) => dependency.split("@")[0],
    );

    expect(imported).toContain("material-theme-builder/react");
    expect([...new Set(packages)].sort()).toEqual(declared.sort());
  });

  it("asks for a version of the package that exports what it imports", () => {
    // Unversioned, a project already on 5.0.0 would keep it -- pnpm does not
    // upgrade an in-range install -- and the copied file would not compile.
    expect(item?.dependencies).toContain("material-theme-builder@^5.1.0");
  });
});
