import { formatHex, oklch, parse } from "culori";
import { describe, expect, it } from "vitest";

import { builder } from "./builder";
import { SHADCN_MAPPING } from "./builder.shadcn";

const SOURCE = "#6750A4";

// The 31 color variables a shadcn theme defines, spelled out rather than
// derived from SHADCN_MAPPING — a dropped mapping row must fail the suite, not
// quietly shrink both sides of the assertion.
// see: https://ui.shadcn.com/docs/theming#list-of-variables
const SHADCN_VARS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
];

// Takes `string | undefined` because a mapping's variable set is open -- every
// lookup outside the shadcn preset is optional -- and an absent variable is a
// failed test either way.
function hexOf(value: string | undefined) {
  const parsed = value === undefined ? undefined : parse(value);
  if (!parsed) throw new Error(`not a parseable color: ${value}`);
  return formatHex(parsed);
}

describe("builder › toShadcn()", () => {
  it("should return exactly the light and dark keys", () => {
    expect(Object.keys(builder(SOURCE).toShadcn())).toEqual(["light", "dark"]);
  });

  it("should map every shadcn color variable to an M3 token", () => {
    expect(
      Object.keys(SHADCN_MAPPING)
        .map((cssVar) => cssVar.slice(2))
        .sort(),
    ).toEqual([...SHADCN_VARS].sort());
  });

  it("should cover every shadcn color variable in both modes", () => {
    const { light, dark } = builder(SOURCE).toShadcn();

    expect(Object.keys(light).sort()).toEqual([...SHADCN_VARS].sort());
    expect(Object.keys(dark).sort()).toEqual([...SHADCN_VARS].sort());
  });

  it("should key on bare variable names, never `--`-prefixed", () => {
    const { light, dark } = builder(SOURCE).toShadcn();

    for (const key of [...Object.keys(light), ...Object.keys(dark)]) {
      expect(key.startsWith("--")).toBe(false);
    }
    expect(light).toHaveProperty("primary");
    expect(light).toHaveProperty("primary-foreground");
    expect(light).toHaveProperty("chart-1");
    expect(light).toHaveProperty("sidebar-accent-foreground");
  });

  it("should emit every value as oklch()", () => {
    const { light, dark } = builder(SOURCE).toShadcn();

    for (const value of [...Object.values(light), ...Object.values(dark)]) {
      expect(value).toMatch(
        /^oklch\(-?\d+(\.\d+)? -?\d+(\.\d+)? -?\d+(\.\d+)?\)$/,
      );
      expect(oklch(parse(value))).toBeDefined();
    }
  });

  it("should emit oklch values that round-trip to the sRGB colors they encode", () => {
    const { light } = builder(SOURCE).toShadcn();

    // Values are the M3 scheme colors of #6750A4, in oklch rather than hex.
    expect(hexOf(light.primary)).toBe("#65558f");
    expect(hexOf(light["primary-foreground"])).toBe("#ffffff");
    expect(hexOf(light.background)).toBe("#fdf7ff");
    expect(hexOf(light.destructive)).toBe("#ba1a1a");
  });

  it("should emit different values for light and dark", () => {
    const { light, dark } = builder(SOURCE).toShadcn();

    for (const key of SHADCN_VARS) {
      expect(dark).toHaveProperty(key);
    }
    expect(light).not.toEqual(dark);
    expect(light.background).not.toBe(dark.background);
    expect(light.primary).not.toBe(dark.primary);
  });

  it("should vary with the scheme option", () => {
    const tonalSpot = builder(SOURCE, { scheme: "tonalSpot" }).toShadcn();
    const vibrant = builder(SOURCE, { scheme: "vibrant" }).toShadcn();

    expect(vibrant.light.primary).not.toBe(tonalSpot.light.primary);
    expect(vibrant.dark.primary).not.toBe(tonalSpot.dark.primary);
  });

  it("should honour each contrast level", () => {
    const reduced = builder(SOURCE, { contrast: -1 }).toShadcn();
    const standard = builder(SOURCE, { contrast: 0 }).toShadcn();
    const medium = builder(SOURCE, { contrast: 0.5 }).toShadcn();
    const high = builder(SOURCE, { contrast: 1 }).toShadcn();

    // The regression test for a silently-inert `contrast` option.
    for (const [a, b] of [
      [reduced, standard],
      [standard, medium],
      [medium, high],
    ] as const) {
      expect(a.light).not.toEqual(b.light);
      expect(a.dark).not.toEqual(b.dark);
    }
  });

  it("should honour an intermediate contrast level rather than snapping", () => {
    const between = builder(SOURCE, { contrast: 0.6 }).toShadcn();

    expect(between).not.toEqual(builder(SOURCE, { contrast: 0.5 }).toShadcn());
    expect(between).not.toEqual(builder(SOURCE, { contrast: 1 }).toShadcn());
  });

  it("should reflect a chromatic primary override", () => {
    const base = builder(SOURCE).toShadcn();
    const overridden = builder(SOURCE, { primary: "#B3261E" }).toShadcn();

    expect(overridden.light.primary).not.toBe(base.light.primary);
    expect(overridden.dark.primary).not.toBe(base.dark.primary);
  });

  it("should throw on an invalid source color", () => {
    expect(() => builder("not-a-color").toShadcn()).toThrow();
  });

  it("should produce deterministic output", () => {
    expect(builder(SOURCE).toShadcn()).toMatchSnapshot();
  });
});

describe("builder › toShadcnAliases()", () => {
  /** Every variable the block declares, `--` stripped. */
  const declared = (css: string) =>
    [...css.matchAll(/^ +--([\w-]+):/gm)].map(([, name]) => name);

  it("should declare every shadcn variable in a :root:root, .dark.dark block", () => {
    const css = builder(SOURCE).toShadcnAliases();

    expect(css).toContain(":root:root,\n.dark.dark {");
    expect(declared(css).sort()).toEqual([...SHADCN_VARS].sort());
  });

  it("should point at the M3 properties rather than at concrete colors", () => {
    // What separates it from `toShadcn()`: the values follow whichever `<Mtb>`
    // is above them at runtime instead of being frozen at build time.
    const css = builder(SOURCE).toShadcnAliases();

    expect(css).toContain("--background: var(--md-sys-color-surface);");
    expect(css).not.toMatch(/oklch|#[0-9a-f]{6}/i);
  });

  it("should respect the prefix option", () => {
    expect(builder(SOURCE, { prefix: "my" }).toShadcnAliases()).toContain(
      "--background: var(--my-sys-color-surface);",
    );
  });

  it("should not depend on the theme", () => {
    // It names variables, never colors -- which is what lets one static file
    // serve every theme, and what makes `shadcn.css` shippable at all.
    expect(
      builder("#FF5722", { scheme: "vibrant", contrast: 1 }).toShadcnAliases(),
    ).toBe(builder(SOURCE).toShadcnAliases());
  });

  it("should be exactly what toTailwind({ shadcn: true }) appends", () => {
    // One mapping, so an inlined copy and the shipped `shadcn.css` cannot say
    // different things.
    const theme = builder(SOURCE);

    expect(theme.toTailwind({ shadcn: true })).toBe(
      `${theme.toTailwind()}\n${theme.toShadcnAliases()}`,
    );
  });
});

describe("builder › toShadcnRegistryItem()", () => {
  it("should be a valid registry:theme item", () => {
    const item = builder(SOURCE).toShadcnRegistryItem();

    expect(item.$schema).toBe(
      "https://ui.shadcn.com/schema/registry-item.json",
    );
    expect(item.type).toBe("registry:theme");
    // `name` and `type` are the schema's only required fields.
    expect(item.name).toBe("material-theme-builder");
  });

  it("should carry every shadcn variable in both modes", () => {
    const { cssVars } = builder(SOURCE).toShadcnRegistryItem();

    expect(Object.keys(cssVars).sort()).toEqual(["dark", "light"]);
    expect(Object.keys(cssVars.light).sort()).toEqual([...SHADCN_VARS].sort());
    expect(Object.keys(cssVars.dark).sort()).toEqual([...SHADCN_VARS].sort());
  });

  it("should key on bare variable names, as the CLI expects", () => {
    // `update-css-vars-v4` re-adds the `--` itself; a `--`-prefixed key here
    // would come out as `----card`.
    const { cssVars } = builder(SOURCE).toShadcnRegistryItem();

    for (const name of Object.keys(cssVars.light)) {
      expect(name).not.toMatch(/^--/);
    }
  });

  it("should say the same thing as toShadcnAliases()", () => {
    // The point of sharing `toShadcnAliasVars()`: whichever half a consumer
    // installs, the same variable points at the same M3 token.
    const theme = builder(SOURCE);
    const css = theme.toShadcnAliases();

    for (const [name, value] of Object.entries(
      theme.toShadcnRegistryItem().cssVars.light,
    )) {
      expect(css).toContain(`--${name}: ${value};`);
    }
  });

  it("should give light and dark the same values", () => {
    // Both modes read the same M3 properties -- the light/dark split already
    // happened there. The CLI writes each into its own block, so they cannot be
    // collapsed into one.
    const { cssVars } = builder(SOURCE).toShadcnRegistryItem();

    expect(cssVars.dark).toEqual(cssVars.light);
    // ...but not the same object: a caller mutating one must not touch the other.
    expect(cssVars.dark).not.toBe(cssVars.light);
  });

  it("should point at the M3 properties rather than at concrete colors", () => {
    const item = builder(SOURCE).toShadcnRegistryItem();

    expect(item.cssVars.light["card"]).toBe(
      "var(--md-sys-color-surface-container-low)",
    );
    expect(JSON.stringify(item.cssVars)).not.toMatch(/oklch|#[0-9a-f]{6}/i);
  });

  it("should respect the prefix option", () => {
    expect(
      builder(SOURCE, { prefix: "my" }).toShadcnRegistryItem().cssVars.light[
        "background"
      ],
    ).toBe("var(--my-sys-color-surface)");
  });

  it("should not depend on the theme", () => {
    expect(
      builder("#FF5722", {
        scheme: "vibrant",
        contrast: 1,
      }).toShadcnRegistryItem().cssVars,
    ).toEqual(builder(SOURCE).toShadcnRegistryItem().cssVars);
  });
});

describe("builder › toShadcnRegistryItem({ fallback: true })", () => {
  // The `, oklch(...)` tail, as the fallback variant appends it.
  const FALLBACK_TAIL = /, oklch\([^)]*\)\)$/;

  it("should be off by default", () => {
    // What keeps the published `registry-item.json` colorless: it is generated
    // from an arbitrary source, so a baked fallback there would ship a theme
    // nobody asked for.
    expect(builder(SOURCE).toShadcnRegistryItem().cssVars).toEqual(
      builder(SOURCE).toShadcnRegistryItem({ fallback: false }).cssVars,
    );
  });

  it("should give every variable an oklch fallback, in both modes", () => {
    const { cssVars } = builder(SOURCE).toShadcnRegistryItem({
      fallback: true,
    });

    for (const mode of ["light", "dark"] as const) {
      expect(Object.keys(cssVars[mode]).sort()).toEqual(
        [...SHADCN_VARS].sort(),
      );

      for (const value of Object.values(cssVars[mode])) {
        expect(value).toMatch(FALLBACK_TAIL);
      }
    }
  });

  it("should fall back to exactly what toShadcn() says", () => {
    // The two exporters cannot disagree about the color a variable takes when
    // no `<Mtb>` is mounted.
    const theme = builder(SOURCE, { scheme: "expressive", contrast: 0.5 });
    const concrete = theme.toShadcn();
    const { cssVars } = theme.toShadcnRegistryItem({ fallback: true });

    // `Object.entries` widens the key to `string`, which cannot index either
    // record -- and both are keyed the same way, which is the point here.
    const names = Object.keys(
      concrete.light,
    ) as (keyof typeof concrete.light)[];

    for (const mode of ["light", "dark"] as const) {
      for (const name of names) {
        expect(FALLBACK_TAIL.exec(cssVars[mode][name])?.[0]).toBe(
          `, ${concrete[mode][name]})`,
        );
      }
    }
  });

  it("should point at the same M3 properties as without a fallback", () => {
    // Strip the tails and the plain item comes back: `fallback` adds a second
    // `var()` argument and changes nothing else.
    const plain = builder(SOURCE).toShadcnRegistryItem().cssVars.light;
    const stripped = Object.fromEntries(
      Object.entries(
        builder(SOURCE).toShadcnRegistryItem({ fallback: true }).cssVars.light,
      ).map(([name, value]) => [name, value.replace(FALLBACK_TAIL, ")")]),
    );

    expect(stripped).toEqual(plain);
  });

  it("should give light and dark different values", () => {
    // Unlike the plain item: each mode now falls back to its own colors.
    const { cssVars } = builder(SOURCE).toShadcnRegistryItem({
      fallback: true,
    });

    expect(cssVars.dark).not.toEqual(cssVars.light);
  });

  it("should depend on the theme", () => {
    // The whole reason this variant is the CLI's default rather than the
    // package's: it can only be generated once a source color is known.
    expect(
      builder("#FF5722", {
        scheme: "vibrant",
        contrast: 1,
      }).toShadcnRegistryItem({ fallback: true }).cssVars,
    ).not.toEqual(
      builder(SOURCE).toShadcnRegistryItem({ fallback: true }).cssVars,
    );
  });

  it("should respect the prefix option", () => {
    expect(
      builder(SOURCE, { prefix: "my" }).toShadcnRegistryItem({ fallback: true })
        .cssVars.light["background"],
    ).toMatch(/^var\(--my-sys-color-surface, oklch\(/);
  });

  it("should say so in its description", () => {
    // A reader of the installed item can tell which variant they have.
    const withFallback = builder(SOURCE).toShadcnRegistryItem({
      fallback: true,
    });

    expect(withFallback.description).not.toBe(
      builder(SOURCE).toShadcnRegistryItem().description,
    );
    expect(withFallback.description).toContain("Falls back");
  });
});

describe("builder › toShadcn*({ mapping })", () => {
  const OVERRIDE = { "--primary": "tertiary" };

  it("should redirect the named variable and leave the rest alone", () => {
    const theme = builder(SOURCE);
    const base = theme.toShadcn();
    const overridden = theme.toShadcn({ mapping: OVERRIDE });

    expect(hexOf(overridden.light.primary)).toBe(
      hexOf(theme.toMapping({ "--x": "tertiary" }).light.x),
    );
    expect(hexOf(overridden.light.primary)).not.toBe(hexOf(base.light.primary));

    // The other thirty are untouched -- that is what makes it an override and
    // not a replacement.
    const rest = (vars: Record<string, string>) =>
      Object.fromEntries(
        Object.entries(vars).filter(([name]) => name !== "primary"),
      );
    expect(rest(overridden.light)).toEqual(rest(base.light));
  });

  it("should add a variable shadcn does not have", () => {
    const { light } = builder(SOURCE, {
      customColors: [{ name: "brand", hex: "#FF5733", blend: false }],
    }).toShadcn({ mapping: { "--brand": "brand" } });

    expect(light).toHaveProperty("brand");
    expect(Object.keys(light)).toHaveLength(SHADCN_VARS.length + 1);
  });

  it("should say the same thing in every rendering", () => {
    // The whole point of one preset behind the three exporters: an override
    // reaches the CSS block, the registry item and the tailwind block alike.
    const theme = builder(SOURCE);
    const options = { mapping: OVERRIDE };

    expect(theme.toShadcnAliases(options)).toContain(
      "--primary: var(--md-sys-color-tertiary);",
    );
    expect(theme.toShadcnRegistryItem(options).cssVars.light.primary).toBe(
      "var(--md-sys-color-tertiary)",
    );
    expect(theme.toTailwind({ shadcn: options })).toContain(
      theme.toShadcnAliases(options),
    );
  });

  it("should fall back to the overridden color, not the default one", () => {
    const theme = builder(SOURCE);
    const { cssVars } = theme.toShadcnRegistryItem({
      fallback: true,
      mapping: OVERRIDE,
    });

    expect(cssVars.light.primary).toBe(
      `var(--md-sys-color-tertiary, ${theme.toShadcn({ mapping: OVERRIDE }).light.primary})`,
    );
  });

  it("should read a variable name with or without the leading dashes", () => {
    // Otherwise the friendlier spelling would *add* a variable rather than
    // override one -- silently, and with the default still in place.
    expect(
      builder(SOURCE).toShadcn({ mapping: { primary: "tertiary" } }),
    ).toEqual(builder(SOURCE).toShadcn({ mapping: OVERRIDE }));
  });

  it("should leave every rendering untouched when no mapping is given", () => {
    const theme = builder(SOURCE);

    expect(theme.toShadcn({})).toEqual(theme.toShadcn());
    expect(theme.toShadcnAliases({})).toBe(theme.toShadcnAliases());
    expect(theme.toTailwind({ shadcn: {} })).toBe(
      theme.toTailwind({ shadcn: true }),
    );
  });
});
