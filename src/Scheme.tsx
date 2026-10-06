"use client";

/**
 * The color-scheme poster of Material Theme Builder's stories -- every M3 role
 * of a theme (`Scheme`) and its tonal palettes (`Shades`), laid out the way the
 * official app's poster is. Exported from `material-theme-builder/react`; the
 * stories draw it too.
 *
 * The swatches read nothing from React: they paint from the
 * `--md-sys-color-*` and `--md-ref-palette-*` custom properties `<Mtb>` (or
 * `toCss()`) declares.
 *
 * Its layout needs no Tailwind: it is shipped compiled, in `node_modules`,
 * where a consumer's Tailwind does not look for class names -- so it is written
 * as inline styles, sized by the custom properties `Poster` declares. Only
 * `Scheme`'s and `Shades`' opt-in `tw` mode uses utilities.
 *
 * @example
 * ```tsx
 * import { Mtb, Poster, Scheme, Shades } from "material-theme-builder/react";
 *
 * <Mtb source="#769CDF">
 *   <Poster style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
 *     <Scheme theme="light" title="Light scheme" />
 *     <Scheme theme="dark" title="Dark scheme" />
 *     <Shades />
 *   </Poster>
 * </Mtb>;
 * ```
 */

import { kebabCase, startCase, upperFirst } from "lodash-es";
import {
  createContext,
  useContext,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  STANDARD_TONES,
  type HexCustomColor,
  type TokenName,
} from "./lib/builder";
import {
  CORE_PALETTES,
  refPaletteVar,
  SHADE_TO_TONE,
  sysColorVar,
} from "./lib/tokens";
import { roleInk, toneInk } from "./Scheme.ink";

/** The class names given, space-separated -- `undefined` if there is none. */
function classNames(...names: (string | false | undefined)[]) {
  return names.filter(Boolean).join(" ") || undefined;
}

/**
 * A grid of `columns` equal columns -- or of that `grid-template-columns`, if a
 * string -- and `rows` equal rows. Equal as Tailwind's `grid-cols-*` makes
 * them: `minmax(0, 1fr)`, so a long label cannot widen its column.
 */
function grid(columns: number | string, rows?: number): CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns:
      typeof columns === "number"
        ? `repeat(${columns}, minmax(0, 1fr))`
        : columns,
    gridTemplateRows: rows ? `repeat(${rows}, minmax(0, 1fr))` : undefined,
  };
}

/** A column of children `gap` apart. */
function column(gap: string): CSSProperties {
  return { display: "flex", flexDirection: "column", gap };
}

/**
 * The height of a tall cell -- a main role, a surface row. `Poster` lowers it
 * on a narrow screen.
 */
const cell: CSSProperties = { height: "var(--cell, 5rem)" };

/** The heading over a scheme or a palette. */
const heading: CSSProperties = {
  margin: 0,
  fontSize: "inherit",
  fontWeight: 700,
  textTransform: "capitalize",
};

function Foo({ children, style, ...props }: ComponentProps<"div">) {
  return (
    <div data-id="Foo" {...props} style={{ ...grid(1), ...style }}>
      {children}
    </div>
  );
}
function FooTop({ children, ...props }: ComponentProps<"div">) {
  return <div {...props}>{children || "FooTop"}</div>;
}
function FooBottom({ children, ...props }: ComponentProps<"div">) {
  return <div {...props}>{children || "FooBottom"}</div>;
}

/**
 * How a `Swatch` paints itself: `false` (the default) uses the raw
 * `var(--md-sys-color-*)`, `true` uses the Tailwind utility.
 *
 * The var is the default on purpose — Tailwind is an *option* of this package,
 * so every story but the Tailwind one must keep working without it, and be seen
 * to.
 */
const TwContext = createContext(false);

/**
 * Each M3 token, mapped to its Tailwind utility.
 *
 * The utility is spelled out — and only the utility, the token list itself
 * being `tokenDescriptions`' — because `bg-${kebabCase(token)}` would never be
 * seen by Tailwind's source scanner, so the class would never be generated.
 * `satisfies` is what keeps this exhaustive: a token added to the library
 * breaks the build here until its utility is written down.
 *
 * `primary`, `secondary` and `background` go through arbitrary values: they
 * are the three names shadcn claims too, and its `@theme inline` outranks the
 * plugin on them -- `bg-secondary` would land on `secondary-container`, and
 * all three on shadcn's own colors without `shadcn.css`. The README's way
 * out, which paints the M3 role whatever else is installed.
 */
const twClasses = {
  primary: "bg-[var(--md-sys-color-primary)]",
  onPrimary: "bg-on-primary",
  primaryContainer: "bg-primary-container",
  onPrimaryContainer: "bg-on-primary-container",
  secondary: "bg-[var(--md-sys-color-secondary)]",
  onSecondary: "bg-on-secondary",
  secondaryContainer: "bg-secondary-container",
  onSecondaryContainer: "bg-on-secondary-container",
  tertiary: "bg-tertiary",
  onTertiary: "bg-on-tertiary",
  tertiaryContainer: "bg-tertiary-container",
  onTertiaryContainer: "bg-on-tertiary-container",

  error: "bg-error",
  onError: "bg-on-error",
  errorContainer: "bg-error-container",
  onErrorContainer: "bg-on-error-container",

  primaryFixed: "bg-primary-fixed",
  primaryFixedDim: "bg-primary-fixed-dim",
  onPrimaryFixed: "bg-on-primary-fixed",
  onPrimaryFixedVariant: "bg-on-primary-fixed-variant",
  secondaryFixed: "bg-secondary-fixed",
  secondaryFixedDim: "bg-secondary-fixed-dim",
  onSecondaryFixed: "bg-on-secondary-fixed",
  onSecondaryFixedVariant: "bg-on-secondary-fixed-variant",
  tertiaryFixed: "bg-tertiary-fixed",
  tertiaryFixedDim: "bg-tertiary-fixed-dim",
  onTertiaryFixed: "bg-on-tertiary-fixed",
  onTertiaryFixedVariant: "bg-on-tertiary-fixed-variant",

  surfaceDim: "bg-surface-dim",
  surface: "bg-surface",
  surfaceBright: "bg-surface-bright",
  surfaceContainerLowest: "bg-surface-container-lowest",
  surfaceContainerLow: "bg-surface-container-low",
  surfaceContainer: "bg-surface-container",
  surfaceContainerHigh: "bg-surface-container-high",
  surfaceContainerHighest: "bg-surface-container-highest",
  onSurface: "bg-on-surface",
  onSurfaceVariant: "bg-on-surface-variant",
  outline: "bg-outline",
  outlineVariant: "bg-outline-variant",

  inverseSurface: "bg-inverse-surface",
  inverseOnSurface: "bg-inverse-on-surface",
  inversePrimary: "bg-inverse-primary",
  scrim: "bg-scrim",
  shadow: "bg-shadow",

  // Dropped from the current spec, still emitted — see `Scheme`'s props
  background: "bg-[var(--md-sys-color-background)]",
  onBackground: "bg-on-background",
  surfaceVariant: "bg-surface-variant",
  surfaceTint: "bg-surface-tint",
} satisfies Record<TokenName, string>;

/** A Tailwind shade of the plugin's: `50`, `100`... `950`. */
type Shade = (typeof SHADE_TO_TONE)[number][0];

/**
 * The eleven shades of each core palette, mapped to their Tailwind utilities
 * -- spelled out for the same reason as `twClasses`: built at runtime,
 * `bg-${palette}-${shade}` would never be seen by the scanner. `satisfies`
 * keeps both axes exhaustive.
 *
 * A custom color's shades cannot be spelled out here: see `Shades`' `tw`.
 */
const shadeClasses = {
  primary: {
    50: "bg-primary-50",
    100: "bg-primary-100",
    200: "bg-primary-200",
    300: "bg-primary-300",
    400: "bg-primary-400",
    500: "bg-primary-500",
    600: "bg-primary-600",
    700: "bg-primary-700",
    800: "bg-primary-800",
    900: "bg-primary-900",
    950: "bg-primary-950",
  },
  secondary: {
    50: "bg-secondary-50",
    100: "bg-secondary-100",
    200: "bg-secondary-200",
    300: "bg-secondary-300",
    400: "bg-secondary-400",
    500: "bg-secondary-500",
    600: "bg-secondary-600",
    700: "bg-secondary-700",
    800: "bg-secondary-800",
    900: "bg-secondary-900",
    950: "bg-secondary-950",
  },
  tertiary: {
    50: "bg-tertiary-50",
    100: "bg-tertiary-100",
    200: "bg-tertiary-200",
    300: "bg-tertiary-300",
    400: "bg-tertiary-400",
    500: "bg-tertiary-500",
    600: "bg-tertiary-600",
    700: "bg-tertiary-700",
    800: "bg-tertiary-800",
    900: "bg-tertiary-900",
    950: "bg-tertiary-950",
  },
  error: {
    50: "bg-error-50",
    100: "bg-error-100",
    200: "bg-error-200",
    300: "bg-error-300",
    400: "bg-error-400",
    500: "bg-error-500",
    600: "bg-error-600",
    700: "bg-error-700",
    800: "bg-error-800",
    900: "bg-error-900",
    950: "bg-error-950",
  },
  neutral: {
    50: "bg-neutral-50",
    100: "bg-neutral-100",
    200: "bg-neutral-200",
    300: "bg-neutral-300",
    400: "bg-neutral-400",
    500: "bg-neutral-500",
    600: "bg-neutral-600",
    700: "bg-neutral-700",
    800: "bg-neutral-800",
    900: "bg-neutral-900",
    950: "bg-neutral-950",
  },
  "neutral-variant": {
    50: "bg-neutral-variant-50",
    100: "bg-neutral-variant-100",
    200: "bg-neutral-variant-200",
    300: "bg-neutral-variant-300",
    400: "bg-neutral-variant-400",
    500: "bg-neutral-variant-500",
    600: "bg-neutral-variant-600",
    700: "bg-neutral-variant-700",
    800: "bg-neutral-variant-800",
    900: "bg-neutral-variant-900",
    950: "bg-neutral-variant-950",
  },
} satisfies Record<(typeof CORE_PALETTES)[number], Record<Shade, string>>;

/** A swatch's label, written in `ink` -- see `Scheme.ink.ts`. */
function Label({ ink, children }: { ink: string; children: ReactNode }) {
  return <p style={{ color: ink }}>{children}</p>;
}

/**
 * One color cell: `name` as `title`, `label` written in `ink`, the color
 * itself from `var(--md-sys-color-<name>)` -- or from `twClass` when under a
 * `tw` `Scheme`.
 */
function Cell({
  name,
  twClass,
  ink,
  label,
  className,
  style,
  ...props
}: {
  /** The kebab-cased role: the `--md-sys-color-*` suffix. */
  name: string;
  /** The Tailwind utility that paints it, for a `tw` `Scheme`. */
  twClass: string;
  /** The label's color -- see `Scheme.ink.ts`. */
  ink: string;
  label: ReactNode;
} & Omit<ComponentProps<"div">, "title" | "children">) {
  const tw = useContext(TwContext);

  return (
    <div
      title={name}
      className={classNames(tw && twClass, className)}
      style={tw ? style : { backgroundColor: sysColorVar(name), ...style }}
      {...props}
    >
      <Label ink={ink}>{label}</Label>
    </div>
  );
}

/** One M3 role's cell: the token as `title`, its human name as label. */
function Swatch({
  role,
  ...props
}: {
  /** The M3 token to paint, named as the library names it. */
  role: TokenName;
} & Omit<ComponentProps<"div">, "title" | "children">) {
  const name = kebabCase(role);

  return (
    <Cell
      name={name}
      twClass={twClasses[role]}
      ink={roleInk(name)}
      label={startCase(role)}
      {...props}
    />
  );
}

/**
 * The gaps, label size and cell heights `Scheme` and `Shades` paint with,
 * `@scope`d to the element this sits in -- `Poster`'s.
 */
function PosterStyle({ notext }: { notext?: boolean }) {
  return (
    <style>{`
      @scope {
        & {
          --gap1: 0.5rem;
          --gap2: 1px;
          --cell: 5rem;
          --tone: 4rem;
          --pad: 1rem;
          --fs: ${notext ? 0 : "0.8rem"};

          @media (max-width: 768px) {
            --gap1: 2px;
            --cell: 45px;
            --tone: 45px;
            --fs: 0;
          }
          @media (width < 48rem) {
            --pad: 0.5rem;
          }

          p {
            font-family: sans-serif;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            font-size: var(--fs);
            margin: 0.35rem;
          }
        }
      }
    `}</style>
  );
}

/**
 * The frame `Scheme` and `Shades` go in: a plain `div` that carries the gaps,
 * label size and cell heights they paint with.
 *
 * Without it they still render, but with no gaps and unstyled labels -- so
 * wrap them all in one, the way the stories do. Lay it out like any `div`,
 * e.g. as a column with some gap between the schemes.
 *
 * It inks only the labels `Scheme` and `Shades` write; whatever else goes in
 * paints its own.
 */
export function Poster({
  notext = false,
  children,
  ...props
}: {
  /** Hide the role and tone labels, leaving the colors alone. */
  notext?: boolean;
} & ComponentProps<"div">) {
  return (
    <div {...props}>
      <PosterStyle notext={notext} />
      {children}
    </div>
  );
}

/**
 * The page colors each `theme` puts behind the poster. They only frame it: the
 * `dark` class `Scheme` adds is what flips the swatches themselves, `<Mtb>`
 * declaring the dark values under `.dark`.
 */
const themeStyles = {
  light: {
    padding: "var(--pad, 1rem)",
    background: "#fbfbfb",
    color: "#1c1b1f",
  },
  dark: {
    padding: "var(--pad, 1rem)",
    background: "#1c1b1f",
    color: "#fbfbfb",
  },
} satisfies Record<"light" | "dark", CSSProperties>;

/**
 * The four roles the current spec no longer lists, as an extra row under
 * `on-surface` — `background`, `on-background`, `surface-variant` and
 * `surface-tint`. They fill the row exactly, one cell each.
 *
 * Kept on a 4-column grid so each cell stays aligned with the row above,
 * whichever subset is displayed.
 *
 * @see https://m3.material.io/styles/color/roles
 */
function SurfaceExtraRoles({
  background = false,
  surfaceVariant = false,
  surfaceTint = false,
}: {
  background?: boolean;
  surfaceVariant?: boolean;
  surfaceTint?: boolean;
}) {
  if (!background && !surfaceVariant && !surfaceTint) return null;

  return (
    <div style={grid(4, 1)}>
      {background && (
        <>
          <Swatch role="background" />
          <Swatch role="onBackground" />
        </>
      )}
      {surfaceVariant && (
        <Swatch role="surfaceVariant" style={{ gridColumnStart: 3 }} />
      )}
      {surfaceTint && (
        <Swatch role="surfaceTint" style={{ gridColumnStart: 4 }} />
      )}
    </div>
  );
}

/**
 * Renders a light or dark color scheme grid with all M3 tokens. Goes in a
 * `Poster`.
 */
export function Scheme({
  theme,
  title = "",
  customColors,
  fixedAccents = true,
  surfaceTint = false,
  background = false,
  surfaceVariant = false,
  tw = false,
  children,
  className,
  style,
  ...props
}: {
  /** Heading displayed above the scheme. */
  title?: string;
  /**
   * Paint the swatches with Tailwind utilities (`bg-on-primary`) instead of
   * the raw `var(--md-sys-color-on-primary)` -- all but `primary`, `secondary`
   * and `background`, which go through an arbitrary value: see `twClasses`.
   *
   * Off by default: Tailwind is optional here, so the stories are better proof
   * of the theme when they do without it. Only the Tailwind story turns it on —
   * that one is precisely about the utilities resolving. Needs the
   * `material-theme-builder/tailwind` plugin, and a Tailwind that scans this
   * package for the utilities -- which it does not do in `node_modules` unless
   * told to: `@source "../node_modules/material-theme-builder/dist/react.js";`
   * (relative to the stylesheet).
   *
   * A custom color's utilities are named at runtime, which no scanner sees:
   * list them, e.g. `@source inline("bg-{,on-}brand{,-container}");`
   * (Tailwind 4.1+).
   */
  tw?: boolean;
  /** The custom colors to show, as `<Mtb>` got them. */
  customColors?: HexCustomColor[];
  /**
   * Show the 12 `*-fixed`, `*-fixed-dim` and `on-*-fixed*` roles, which keep
   * the same color between light and dark themes.
   *
   * Current M3 roles, hence the only extra one on by default — though the spec
   * files them under "add-on color roles", warning that "most products won't
   * need to use these". The official app's poster does not draw them, so pass
   * `false` to match it exactly.
   *
   * @see https://m3.material.io/styles/color/roles#a5f6ea3d-d457-4c5d-94f4-55f3cdf6470b
   */
  fixedAccents?: boolean;
  /**
   * Show `surface-tint`, the elevation tint.
   *
   * *Not* deprecated anywhere, Flutter included, but hollowed out: the spec
   * dropped it from its role pages along with the elevation overlay model it
   * served — "tone-based surface color roles have replaced the previous
   * approach of surfaces at +1 to +5 elevation" (Feb 2023).
   * `material-color-utilities` aliases it straight onto `primary` from spec
   * version 2025 on, and Flutter defaults `surfaceTintColor` to `null`.
   *
   * @see https://m3.material.io/styles/color/system/overview#ca18ba03-a1ec-4bbb-a531-ae5396d3ee4a
   * @see https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/color_spec_2025.ts
   * @see https://github.com/flutter/flutter/issues/115912
   */
  surfaceTint?: boolean;
  /**
   * Show `background` and `on-background`.
   *
   * @deprecated Use `surface` and `on-surface` instead. Neither appears
   * anywhere in the spec's current role pages: the inventory is "26 standard
   * color roles organized into six groups", and these are not among them. Not
   * flagged as deprecated — simply dropped. `material-color-utilities` aliases
   * them onto `surface` / `on-surface` from spec version 2025 on, and Flutter
   * deprecated them in `ColorScheme` after v3.18.
   *
   * Jetpack Compose still exposes them undeprecated, so they will not vanish
   * from every implementation at once.
   * @see https://m3.material.io/styles/color/roles
   * @see https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/color_spec_2025.ts
   * @see https://docs.flutter.dev/release/breaking-changes/new-color-scheme-roles
   */
  background?: boolean;
  /**
   * Show `surface-variant`.
   *
   * Note that its `on-surface-variant` counterpart is very much alive — the
   * spec lists "three surface roles: Surface / On surface / On surface
   * variant", the fill being the one that got dropped. Hence the asymmetry:
   * the ink survives its own background.
   *
   * @deprecated Use `surface-container-highest` instead. The Material Design
   * blog announcing tone-based surfaces states that "Surface Variant becomes
   * Surface Container Highest", and `material-color-utilities` aliases the two
   * from spec version 2025 on.
   *
   * Careful with a blind substitution though: this package generates spec-2021
   * values, where `surface-variant` is still its own neutral-variant tone and
   * does *not* equal `surface-container-highest` (`#E0E2EC` vs `#E2E2E9` for
   * source `#769CDF`). Swapping one for the other changes the color today.
   * @see https://m3.material.io/styles/color/roles#89f972b1-e372-494c-aabc-69aea34ed591
   * @see https://m3.material.io/blog/tone-based-surface-color-m3
   * @see https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/color_spec_2025.ts
   */
  surfaceVariant?: boolean;
  /**
   * Which of the theme's two schemes to show, on a matching background. Left
   * out, the poster reads whichever one the page is in, on no background.
   *
   * `"dark"` works anywhere: it sets the `dark` class `<Mtb>` keys the dark
   * values on. `"light"` cannot unset an ancestor's, so on a page already in
   * `.dark` it shows the dark values too.
   */
  theme?: "light" | "dark";
} & Omit<ComponentProps<"div">, "title">) {
  return (
    <TwContext.Provider value={tw}>
      <div
        className={classNames(theme === "dark" && "dark", className)}
        style={{
          ...column("1rem"),
          ...(theme && themeStyles[theme]),
          ...style,
        }}
        {...props}
      >
        {title && <h3 style={heading}>{title}</h3>}

        <div style={{ ...grid("3fr 1fr"), gap: "var(--gap1)" }}>
          {
            //
            //  █████
            // ██   ██
            // ███████
            // ██   ██
            // ██   ██
            //
          }

          <div style={{ ...grid(3, 2), gap: "var(--gap2)" }}>
            <Foo>
              <Swatch role="primary" style={cell} />
              <Swatch role="onPrimary" />
            </Foo>
            <Foo>
              <Swatch role="secondary" style={cell} />
              <Swatch role="onSecondary" />
            </Foo>
            <Foo>
              <Swatch role="tertiary" style={cell} />
              <Swatch role="onTertiary" />
            </Foo>
            <Foo>
              <Swatch role="primaryContainer" style={cell} />
              <Swatch role="onPrimaryContainer" />
            </Foo>
            <Foo>
              <Swatch role="secondaryContainer" style={cell} />
              <Swatch role="onSecondaryContainer" />
            </Foo>
            <Foo>
              <Swatch role="tertiaryContainer" style={cell} />
              <Swatch role="onTertiaryContainer" />
            </Foo>
          </div>

          {
            //
            // ██████
            // ██   ██
            // ██████
            // ██   ██
            // ██████
            //
          }

          <div style={{ ...grid(1, 2), gap: "var(--gap2)" }}>
            <Foo>
              <Swatch role="error" style={cell} />
              <Swatch role="onError" />
            </Foo>
            <Foo>
              <Swatch role="errorContainer" style={cell} />
              <Swatch role="onErrorContainer" />
            </Foo>
          </div>

          {
            //
            //  ██████
            // ██
            // ██
            // ██
            //  ██████
            //
          }

          {fixedAccents && (
            <>
              <div style={{ ...grid(3, 1), gap: "var(--gap2)" }}>
                <Foo>
                  <FooTop style={{ ...cell, ...grid(2, 1) }}>
                    <Swatch role="primaryFixed" />
                    <Swatch role="primaryFixedDim" />
                  </FooTop>
                  <FooBottom style={grid(1, 2)}>
                    <Swatch role="onPrimaryFixed" />
                    <Swatch role="onPrimaryFixedVariant" />
                  </FooBottom>
                </Foo>
                <Foo>
                  <FooTop style={{ ...cell, ...grid(2, 1) }}>
                    <Swatch role="secondaryFixed" />
                    <Swatch role="secondaryFixedDim" />
                  </FooTop>
                  <FooBottom style={grid(1, 2)}>
                    <Swatch role="onSecondaryFixed" />
                    <Swatch role="onSecondaryFixedVariant" />
                  </FooBottom>
                </Foo>
                <Foo>
                  <FooTop style={{ ...cell, ...grid(2, 1) }}>
                    <Swatch role="tertiaryFixed" />
                    <Swatch role="tertiaryFixedDim" />
                  </FooTop>
                  <FooBottom style={grid(1, 2)}>
                    <Swatch role="onTertiaryFixed" />
                    <Swatch role="onTertiaryFixedVariant" />
                  </FooBottom>
                </Foo>
              </div>

              {
                //
                // ██████
                // ██   ██
                // ██   ██
                // ██   ██
                // ██████
                //
              }

              <div></div>
            </>
          )}

          {
            //
            // ███████
            // ██
            // █████
            // ██
            // ███████
            //
          }

          <div style={{ ...grid(1), gap: "var(--gap2)" }}>
            <div style={{ ...cell, ...grid(3, 1) }}>
              <Swatch role="surfaceDim" />
              <Swatch role="surface" />
              <Swatch role="surfaceBright" />
            </div>
            <div style={{ ...cell, ...grid(5, 1) }}>
              <Swatch role="surfaceContainerLowest" />
              <Swatch role="surfaceContainerLow" />
              <Swatch role="surfaceContainer" />
              <Swatch role="surfaceContainerHigh" />
              <Swatch role="surfaceContainerHighest" />
            </div>
            <div style={grid(4, 1)}>
              <Swatch role="onSurface" />
              <Swatch role="onSurfaceVariant" />
              <Swatch role="outline" />
              <Swatch role="outlineVariant" />
            </div>
            <SurfaceExtraRoles
              background={background}
              surfaceVariant={surfaceVariant}
              surfaceTint={surfaceTint}
            />
          </div>

          {
            //
            // ███████
            // ██
            // █████
            // ██
            // ██
            //
          }

          <div style={column("0.25rem")}>
            <Foo>
              <Swatch role="inverseSurface" style={cell} />
              <Swatch role="inverseOnSurface" />
            </Foo>
            <Foo>
              <Swatch role="inversePrimary" />
            </Foo>
            <div style={{ ...grid(2), gap: "var(--gap2)" }}>
              <Swatch role="scrim" />
              <Swatch role="shadow" />
            </div>
          </div>
        </div>
        {
          //
          //  ██████ ██    ██ ███████ ████████  ██████  ███    ███      ██████  ██████  ██       ██████  ██████  ███████
          // ██      ██    ██ ██         ██    ██    ██ ████  ████     ██      ██    ██ ██      ██    ██ ██   ██ ██
          // ██      ██    ██ ███████    ██    ██    ██ ██ ████ ██     ██      ██    ██ ██      ██    ██ ██████  ███████
          // ██      ██    ██      ██    ██    ██    ██ ██  ██  ██     ██      ██    ██ ██      ██    ██ ██   ██      ██
          //  ██████  ██████  ███████    ██     ██████  ██      ██      ██████  ██████  ███████  ██████  ██   ██ ███████
          //
        }
        {customColors && customColors.length > 0 && (
          <div style={column("var(--gap2)")}>
            {customColors.map(({ name }) => {
              const role = kebabCase(name);
              const label = upperFirst(name);

              // Each of the four roles, the one it is read against (its ink),
              // and its utility -- which keeps the declared spelling, as the
              // plugin registers it.
              const cells = [
                {
                  role,
                  ink: `on-${role}`,
                  twClass: `bg-${name}`,
                  label,
                },
                {
                  role: `on-${role}`,
                  ink: role,
                  twClass: `bg-on-${name}`,
                  label: `On ${label}`,
                },
                {
                  role: `${role}-container`,
                  ink: `on-${role}-container`,
                  twClass: `bg-${name}-container`,
                  label: `${label} Container`,
                },
                {
                  role: `on-${role}-container`,
                  ink: `${role}-container`,
                  twClass: `bg-on-${name}-container`,
                  label: `On ${label} Container`,
                },
              ];

              return (
                <div key={name} style={grid(4)}>
                  {cells.map((c) => (
                    <Foo key={c.role}>
                      <Cell
                        name={c.role}
                        twClass={c.twClass}
                        ink={sysColorVar(c.ink)}
                        label={c.label}
                        style={cell}
                      />
                    </Foo>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {children}
      </div>
    </TwContext.Provider>
  );
}

/**
 * Renders tonal palette shades for all core and custom palettes. Goes in a
 * `Poster`.
 */
export function Shades({
  customColors,
  noTitle,
  tw: twProp,
}: {
  /** Hide the palette group titles. */
  noTitle?: boolean;
  /** The custom colors to show, as `<Mtb>` got them. */
  customColors?: HexCustomColor[];
  /**
   * Paint the plugin's eleven Tailwind shades (`bg-primary-500`) instead of
   * every tone from `var(--md-ref-palette-*)`, as `Scheme`'s `tw` does -- and
   * follows it, when nested in one.
   *
   * The core palettes' utilities are spelled out (`shadeClasses`); a custom
   * color's are named at runtime, which no scanner sees: list them, e.g.
   * `@source inline("bg-brand-{50,{100..900..100},950}");` (Tailwind 4.1+).
   */
  tw?: boolean;
}) {
  const twContext = useContext(TwContext);
  const tw = twProp ?? twContext;

  const palettes = [
    ...CORE_PALETTES.map((name) => ({
      name,
      palette: name,
      title: name.replace("-", " "),
      shadeClass: (shade: Shade) => shadeClasses[name][shade],
    })),
    ...(customColors ?? []).map(({ name }) => ({
      name,
      palette: kebabCase(name),
      title: upperFirst(name),
      // Named at runtime -- see `tw`
      shadeClass: (shade: Shade) => `bg-${name}-${shade}`,
    })),
  ];

  return (
    <div style={column("var(--gap2)")}>
      {palettes.map(({ name, palette, title, shadeClass }) => {
        // A row: the plugin's eleven shades, or every standard tone
        const cells = tw
          ? SHADE_TO_TONE.map(([shade, tone]) => ({
              tone,
              label: shade,
              className: shadeClass(shade),
              tooltip: `${palette}-${tone} (${shadeClass(shade)})`,
            }))
          : STANDARD_TONES.slice()
              .reverse()
              .map((tone) => ({
                tone,
                label: tone,
                className: undefined,
                tooltip: `${palette}-${tone}`,
              }));

        return (
          <div key={name}>
            {!noTitle && <h3 style={heading}>{title}</h3>}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
              }}
            >
              {cells.map(({ tone, label, className, tooltip }) => (
                <div
                  key={tone}
                  title={tooltip}
                  className={className}
                  style={{
                    height: "var(--tone, 4rem)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: tw
                      ? undefined
                      : refPaletteVar(palette, tone),
                  }}
                >
                  <Label ink={toneInk(palette, tone)}>{label}</Label>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
