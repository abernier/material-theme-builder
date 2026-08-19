import type { BuilderContext } from "./builder";
import {
  buildMapping,
  buildMappingAliasVars,
  buildMappingAliases,
  resolveMapping,
  type Mapping,
  type MappingVars,
} from "./builder.mapping";

/**
 * shadcn CSS variable → M3 sys-color token mapping.
 *
 * The preset the three `toShadcn*()` exporters start from: `toShadcn()` reads it
 * to emit concrete values, `toShadcnAliases()` and `toShadcnRegistryItem()` read
 * it to emit `var()` aliases. Neither can name a variable the other doesn't.
 *
 * Exported so a caller can extend it, or read it to see what the defaults are.
 * To *change* one, pass a partial `mapping` to any of the three — it is merged
 * over this, so naming `--primary` leaves the other thirty alone.
 *
 * Token names are kebab-case (the CSS spelling); the camelCase spelling the
 * scheme objects use is derived from them in `builder.mapping`.
 *
 * @see https://ui.shadcn.com/docs/theming#list-of-variables
 */
export const SHADCN_MAPPING = {
  "--background": "surface",
  "--foreground": "on-surface",
  "--card": "surface-container-low",
  "--card-foreground": "on-surface",
  "--popover": "surface-container-high",
  "--popover-foreground": "on-surface",
  "--primary": "primary",
  "--primary-foreground": "on-primary",
  "--secondary": "secondary-container",
  "--secondary-foreground": "on-secondary-container",
  "--muted": "surface-container-highest",
  "--muted-foreground": "on-surface-variant",
  "--accent": "secondary-container",
  "--accent-foreground": "on-secondary-container",
  "--destructive": "error",
  "--border": "outline-variant",
  "--input": "outline",
  "--ring": "primary",
  "--chart-1": "primary-fixed",
  "--chart-2": "secondary-fixed",
  "--chart-3": "tertiary-fixed",
  "--chart-4": "primary-fixed-dim",
  "--chart-5": "secondary-fixed-dim",
  "--sidebar": "surface-container-low",
  "--sidebar-foreground": "on-surface",
  "--sidebar-primary": "primary",
  "--sidebar-primary-foreground": "on-primary",
  "--sidebar-accent": "secondary-container",
  "--sidebar-accent-foreground": "on-secondary-container",
  "--sidebar-border": "outline-variant",
  "--sidebar-ring": "primary",
} as const satisfies Mapping;

// Distributes over the union of CSS variable names, stripping each `--`.
type StripDashes<T extends string> = T extends `--${infer Bare}` ? Bare : never;

/** A bare shadcn color variable name, e.g. `primary` or `chart-1`. */
export type ShadcnVarName = StripDashes<keyof typeof SHADCN_MAPPING>;

/**
 * Concrete shadcn colors, split by mode.
 *
 * Shaped exactly like a shadcn registry item's `cssVars` field, so it can be
 * assigned there without rewriting keys or values.
 */
export type ShadcnTheme = {
  light: MappingVars<ShadcnVarName>;
  dark: MappingVars<ShadcnVarName>;
};

/** What every `toShadcn*()` takes. */
export type ShadcnOptions = {
  /**
   * Variables to map differently, merged over `SHADCN_MAPPING`.
   *
   * Name only what changes — `{ "--primary": "tertiary" }` redirects that one
   * variable and leaves the rest of the preset alone. A name shadcn doesn't
   * have is added rather than refused, so the same option grows the vocabulary
   * as well as redirects it.
   *
   * Values are M3 sys-color tokens, kebab-case, and may name one of this
   * theme's custom colors. An unknown one throws.
   */
  mapping?: Mapping;
};

/**
 * A shadcn registry item carrying the alias mapping, as
 * `toShadcnRegistryItem()` returns it.
 *
 * @see https://ui.shadcn.com/schema/registry-item.json
 */
export type ShadcnRegistryItem = {
  $schema: string;
  name: string;
  type: "registry:theme";
  title: string;
  description: string;
  cssVars: ShadcnTheme;
};

/** Options for `toShadcnRegistryItem()`. */
export type ShadcnRegistryItemOptions = ShadcnOptions & {
  /**
   * Embed this theme's concrete colors as the `var()` fallbacks, so the item
   * also works where nothing declares the M3 custom properties. Off by default
   * — see `buildShadcnRegistryItem()` for why.
   *
   * @default false
   */
  fallback?: boolean;
};

/**
 * The selectors the alias block is emitted under.
 *
 * `:root` *and* `.dark` rather than one or the other: both modes read the same
 * M3 properties, which is where the light/dark split already happened, so the
 * block has to win in both of shadcn's own blocks.
 *
 * Each is doubled -- the duplication MDN documents under "Increasing
 * specificity by duplicating selector" -- so the block outranks shadcn's `:root`
 * and `.dark` on specificity rather than on source order. Order would mean
 * importing this below shadcn's blocks, which is below other rules, which CSS
 * forbids: a conforming parser drops such an `@import`, and one in the chain
 * already did. Specificity lets the `@import` sit where imports go.
 */
const SHADCN_SELECTORS = [":root:root", ".dark.dark"];

/**
 * Generate the shadcn alias block — shadcn's variables pointing at the
 * `--{prefix}-sys-color-*` custom properties `toCss()` / `<Mtb>` emit.
 *
 * The counterpart of `buildShadcn()`: same mapping, but `var()` references
 * rather than concrete values, so the colors follow whichever `<Mtb>` is above
 * them in the tree instead of being frozen at build time. This is what
 * `material-theme-builder/shadcn.css` is generated from, and what
 * `toTailwind({ shadcn: true })` appends.
 */
export function buildShadcnAliases(
  ctx: BuilderContext,
  { mapping }: ShadcnOptions = {},
) {
  return buildMappingAliases(ctx, resolveMapping(SHADCN_MAPPING, mapping), {
    selectors: SHADCN_SELECTORS,
  });
}

/**
 * Generate the same alias mapping as `toShadcnAliases()`, shaped as a shadcn
 * registry item — installable with `shadcn add`.
 *
 * Why both: the stylesheet is one `@import`, the registry item is the gesture
 * every other shadcn theme uses — the CLI rewrites the values inside shadcn's
 * existing blocks, in place, so nothing is layered over anything. It is also
 * the only one of the two that can carry fallbacks.
 *
 * The values stay `var()` references, so this is not `toShadcn()` in a
 * wrapper: the colors still follow whichever `<Mtb>` is above them at runtime,
 * where `toShadcn()` freezes them at build time.
 *
 * With `fallback`, this theme's concrete colors go inside those `var()`s as the
 * second argument — so the item keeps following `<Mtb>` where one is mounted,
 * and resolves to these colors where nothing declares the M3 properties, rather
 * than to nothing at all. That is worth having, and it is also why it is off by
 * default: the item the package publishes is generated from an arbitrary source
 * color, so baked fallbacks there would ship one theme nobody asked for. Turn
 * it on when the source color came from the caller — which is what the CLI's
 * `--format registry-item` does.
 *
 * Without `fallback`, `light` and `dark` carry the same values, since both read
 * the same M3 properties — see `buildShadcnAliases()`. The CLI writes each into
 * its own block, so they cannot be collapsed into one; with `fallback` they
 * genuinely differ, each mode falling back to its own colors.
 */
export function buildShadcnRegistryItem(
  ctx: BuilderContext,
  { fallback = false, mapping }: ShadcnRegistryItemOptions = {},
): ShadcnRegistryItem {
  const resolved = resolveMapping(SHADCN_MAPPING, mapping);
  const concrete = fallback
    ? buildMapping<ShadcnVarName>(ctx, resolved)
    : undefined;

  // Called once per mode rather than spread from one object: each mode needs
  // its own fallbacks, and a fresh object per call also keeps a caller's
  // mutation of one mode out of the other.
  const vars = (mode: keyof ShadcnTheme) =>
    buildMappingAliasVars<ShadcnVarName>(ctx, resolved, concrete?.[mode]);

  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "material-theme-builder",
    type: "registry:theme",
    title: "Material Theme Builder",
    description: `Points shadcn's CSS variables at the M3 custom properties \`<Mtb>\` emits, so every shadcn component follows whichever theme is above it in the tree.${
      fallback
        ? " Falls back to this theme's own colors where no `<Mtb>` is mounted."
        : ""
    }`,
    cssVars: { light: vars("light"), dark: vars("dark") },
  };
}

/**
 * Generate a shadcn theme — concrete per-mode color values keyed by bare
 * shadcn variable name — from the builder context.
 *
 * The result matches the shape of a shadcn registry item's `cssVars` field,
 * so it can be served as a `registry:theme` or `registry:base` item and
 * installed with the standard `shadcn` CLI.
 *
 * Reads the same merged colors as `toCss()`, so `contrast` — and every other
 * option — lands here exactly as it does there, at full resolution.
 *
 * `prefix` has no effect here: the mapping replaces the prefixed M3 variable
 * names with shadcn ones. `customColors` reach this only through `mapping` —
 * shadcn's variable set is fixed, so no component reads one until something
 * points a shadcn variable at it.
 */
export function buildShadcn(
  ctx: BuilderContext,
  { mapping }: ShadcnOptions = {},
): ShadcnTheme {
  return buildMapping<ShadcnVarName>(
    ctx,
    resolveMapping(SHADCN_MAPPING, mapping),
  );
}
