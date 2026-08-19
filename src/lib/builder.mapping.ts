import { camelCase } from "lodash-es";

import type { BuilderContext } from "./builder";

/**
 * A projection of the M3 scheme onto a foreign CSS variable vocabulary.
 *
 * Keys are the foreign variable names, values are the M3 sys-color tokens
 * backing them, kebab-case (the CSS spelling). shadcn is the one this package
 * ships — see `SHADCN_MAPPING` — but nothing here knows that: any design system
 * whose colors are CSS custom properties can be pointed at M3 the same way.
 *
 * ```ts
 * const bootstrap: Mapping = {
 *   "--bs-body-bg": "surface",
 *   "--bs-body-color": "on-surface",
 *   "--bs-primary": "primary",
 * };
 * ```
 *
 * Two renderings, from the one mapping: `buildMapping()` emits concrete colors,
 * frozen at build time; `buildMappingAliases()` emits `var()` references into
 * the `--{prefix}-sys-color-*` properties, which follow whichever `<Mtb>` is
 * above them at runtime.
 */
export type Mapping = Record<string, string>;

/**
 * Values keyed by *bare* variable name — `primary`, not `--primary`.
 *
 * The spelling a shadcn registry item's `cssVars` uses, which is why it is the
 * one both renderings return.
 *
 * `Name` is the variable set a known mapping carries — `MappingVars<ShadcnVarName>`
 * spells shadcn's out, so a typo in a lookup is a type error. An arbitrary
 * mapping leaves it open.
 */
export type MappingVars<Name extends string = string> = Record<Name, string>;

/** Options for `buildMappingAliases()`. */
export type MappingAliasesOptions = {
  /**
   * The selectors the block is emitted under, one rule for all of them.
   *
   * Both modes read the same M3 properties — that is where the light/dark split
   * already happened — so a dark-mode selector here is only ever about
   * outranking something *else* that declares these variables in dark mode.
   *
   * @default [":root"]
   */
  selectors?: readonly string[];
};

/** Normalize a variable name to its bare spelling: `--primary` → `primary`. */
function bare(name: string) {
  return name.startsWith("--") ? name.slice(2) : name;
}

/**
 * Merge `overrides` over `preset`, keyed by bare variable name.
 *
 * Partial by design: naming `--primary` changes that one variable and leaves
 * the other thirty alone. A name the preset doesn't have is added rather than
 * refused, so a mapping can grow the vocabulary as well as redirect it.
 *
 * Keys are normalized first, so `primary` and `--primary` are the same variable
 * rather than two — otherwise the friendlier spelling would silently
 * *duplicate* an entry instead of overriding it.
 */
export function resolveMapping(preset: Mapping, overrides?: Mapping): Mapping {
  const normalize = (mapping: Mapping) =>
    Object.entries(mapping).map(([name, token]) => [bare(name), token]);

  return Object.fromEntries([
    ...normalize(preset),
    ...normalize(overrides ?? {}),
  ]);
}

// Every token a mapping names has to exist in the scheme, and the two renderings
// fail differently if one doesn't: the concrete one reads `undefined` out of the
// merged colors, while the alias one happily writes a `var()` nothing declares --
// a variable that resolves to nothing, in a stylesheet that looks right. So both
// go through here first, and fail the same way.
//
// What counts as existing is the merged colors' own keys: the standard sys-color
// tokens *and* this theme's custom colors, which are as mappable as any of them.
// Both modes carry the same keys, and both are read here, so a mapping that
// resolves is one that resolves in light and dark alike.
function resolveEntries(ctx: BuilderContext, mapping: Mapping) {
  return Object.entries(mapping).map(([variable, token]) => {
    // Both spellings are accepted everywhere a mapping is -- `--primary` reads
    // as CSS, `primary` as the key it becomes -- so both are reduced here, once,
    // rather than at each of the two renderings.
    const name = bare(variable);
    const key = camelCase(token);
    const light = ctx.mergedColorsLight[key];
    const dark = ctx.mergedColorsDark[key];

    if (light === undefined || dark === undefined)
      throw new Error(
        `Unknown M3 token '${token}', mapped to '--${name}'. Expected a sys-color token (e.g. 'primary', 'on-surface-variant') or one of this theme's custom colors, kebab-case.`,
      );

    return { name, token, light, dark };
  });
}

// ─── sRGB → OKLCh ────────────────────────────────────────────────────────
//
// A fixed sRGB → linear → OKLab → OKLCh pipeline, in-repo rather than via a
// color library: the package carries no color dependency beyond Material
// Color Utilities, and this conversion does not warrant one.
//
// @see https://bottosson.github.io/posts/oklab/

function srgbToLinear(channel: number) {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

// 3 decimals, trailing zeros trimmed — the precision shadcn's own themes use.
function round(n: number) {
  return String(Number(n.toFixed(3)));
}

function argbToOklch(argb: number) {
  const r = srgbToLinear(((argb >> 16) & 0xff) / 255);
  const g = srgbToLinear(((argb >> 8) & 0xff) / 255);
  const b = srgbToLinear((argb & 0xff) / 255);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const chroma = Math.hypot(a, bb);
  // atan2(0, 0) is meaningless: an achromatic color has no hue.
  const hue =
    Number(chroma.toFixed(3)) === 0
      ? 0
      : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;

  return `oklch(${round(lightness)} ${round(chroma)} ${round(hue)})`;
}

// ─── Renderings ──────────────────────────────────────────────────────────

/**
 * Project the theme onto `mapping` as concrete per-mode colors, in oklch.
 *
 * The result is shaped like a shadcn registry item's `cssVars` field, so it can
 * be served as a `registry:theme` item without rewriting keys or values.
 *
 * Reads the same merged colors as `toCss()`, so `contrast` — and every other
 * option — lands here exactly as it does there, at full resolution. `prefix`
 * has no effect: the mapping replaces the prefixed M3 variable names outright.
 */
export function buildMapping<Name extends string = string>(
  ctx: BuilderContext,
  mapping: Mapping,
) {
  const entries = resolveEntries(ctx, mapping);

  // A fresh object per mode rather than one spread into two: a caller's
  // mutation of one mode has no business reaching the other.
  const vars = (mode: "light" | "dark") =>
    Object.fromEntries(
      entries.map((entry) => [entry.name, argbToOklch(entry[mode])]),
    ) as MappingVars<Name>;

  return { light: vars("light"), dark: vars("dark") };
}

/**
 * The mapping's variables pointing at the `--{prefix}-sys-color-*` custom
 * properties, keyed by bare variable name.
 *
 * The one place the alias values are spelled; both renderings that need them
 * read it, so a CSS block and a registry item generated from the same mapping
 * cannot disagree about what points where.
 *
 * `fallbacks`, when given, goes inside the `var()` as the second argument —
 * what the property resolves to where nothing declares the M3 custom
 * properties. Keyed the same way, so one mode's concrete colors drop straight
 * in.
 */
export function buildMappingAliasVars<Name extends string = string>(
  ctx: BuilderContext,
  mapping: Mapping,
  fallbacks?: MappingVars<Name>,
) {
  // `Name` is the variable set the *caller* knows the mapping carries; the
  // entries below are keyed by plain string, hence the widening.
  const values: Record<string, string | undefined> = fallbacks ?? {};

  const entries = resolveEntries(ctx, mapping).map(({ name, token }) => {
    const property = `--${ctx.prefix}-sys-color-${token}`;
    const fallback = values[name];

    return [
      name,
      fallback ? `var(${property}, ${fallback})` : `var(${property})`,
    ];
  });

  return Object.fromEntries(entries) as MappingVars<Name>;
}

/**
 * Generate the alias block — the mapping's variables pointing at the
 * `--{prefix}-sys-color-*` custom properties `toCss()` / `<Mtb>` emit.
 *
 * The counterpart of `buildMapping()`: same mapping, but `var()` references
 * rather than concrete values, so the colors follow whichever `<Mtb>` is above
 * them in the tree instead of being frozen at build time.
 */
export function buildMappingAliases(
  ctx: BuilderContext,
  mapping: Mapping,
  { selectors = [":root"] }: MappingAliasesOptions = {},
) {
  const lines = Object.entries(buildMappingAliasVars(ctx, mapping)).map(
    ([name, value]) => `--${name}: ${value};`,
  );

  return `${selectors.join(",\n")} {\n  ${lines.join("\n  ")}\n}\n`;
}
