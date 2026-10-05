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
 * `Scheme`'s opt-in `tw` mode uses utilities.
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
} from "react";
import {
  STANDARD_TONES,
  type HexCustomColor,
  type TokenName,
} from "./lib/builder";

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
 */
const twClasses = {
  primary: "bg-primary",
  onPrimary: "bg-on-primary",
  primaryContainer: "bg-primary-container",
  onPrimaryContainer: "bg-on-primary-container",
  secondary: "bg-secondary",
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
  background: "bg-background",
  onBackground: "bg-on-background",
  surfaceVariant: "bg-surface-variant",
  surfaceTint: "bg-surface-tint",
} satisfies Record<TokenName, string>;

/**
 * One color cell: the role as `title`, its human name as label, the color
 * itself from `var(--md-sys-color-<role>)` — or from the Tailwind utility when
 * under a `tw` `Scheme`.
 */
function Swatch({
  role,
  className,
  style,
  children,
  ...props
}: {
  /** The M3 token to paint, named as the library names it. */
  role: TokenName;
} & ComponentProps<"div">) {
  const tw = useContext(TwContext);
  const name = kebabCase(role);

  return (
    <div
      title={name}
      className={classNames(tw && twClasses[role], className)}
      style={
        tw
          ? style
          : { backgroundColor: `var(--md-sys-color-${name})`, ...style }
      }
      {...props}
    >
      {children ?? <p>{startCase(role)}</p>}
    </div>
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
            color: white;
            mix-blend-mode: difference;
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
   * Paint the swatches with Tailwind utilities (`bg-primary`) instead of the
   * raw `var(--md-sys-color-primary)`.
   *
   * Off by default: Tailwind is optional here, so the stories are better proof
   * of the theme when they do without it. Only the Tailwind story turns it on —
   * that one is precisely about the utilities resolving. Needs the
   * `material-theme-builder/tailwind` plugin, and a Tailwind that scans this
   * package for the utilities -- which it does not do in `node_modules` unless
   * told to: `@source "../node_modules/material-theme-builder/dist/react.js";`
   * (relative to the stylesheet).
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
            {customColors?.map((customColor) => (
              <div key={customColor.name} style={grid(4)}>
                <Foo>
                  <FooTop
                    title={kebabCase(customColor.name)}
                    style={{
                      ...cell,
                      backgroundColor: `var(--md-sys-color-${kebabCase(customColor.name)})`,
                    }}
                  >
                    <p>{upperFirst(customColor.name)}</p>
                  </FooTop>
                </Foo>
                <Foo>
                  <FooTop
                    title={`on-${kebabCase(customColor.name)}`}
                    style={{
                      ...cell,
                      backgroundColor: `var(--md-sys-color-on-${kebabCase(customColor.name)})`,
                    }}
                  >
                    <p>On {upperFirst(customColor.name)}</p>
                  </FooTop>
                </Foo>
                <Foo>
                  <FooTop
                    title={`${kebabCase(customColor.name)}-container`}
                    style={{
                      ...cell,
                      backgroundColor: `var(--md-sys-color-${kebabCase(customColor.name)}-container)`,
                    }}
                  >
                    <p>{upperFirst(customColor.name)} Container</p>
                  </FooTop>
                </Foo>
                <Foo>
                  <FooTop
                    title={`on-${kebabCase(customColor.name)}-container`}
                    style={{
                      ...cell,
                      backgroundColor: `var(--md-sys-color-on-${kebabCase(customColor.name)}-container)`,
                    }}
                  >
                    <p>On {upperFirst(customColor.name)} Container</p>
                  </FooTop>
                </Foo>
              </div>
            ))}
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
}: {
  /** Hide the palette group titles. */
  noTitle?: boolean;
  /** The custom colors to show, as `<Mtb>` got them. */
  customColors?: HexCustomColor[];
}) {
  return (
    <div style={column("var(--gap2)")}>
      {[
        ...[
          "primary",
          "secondary",
          "tertiary",
          "error",
          "neutral",
          "neutral-variant",
        ].map((name) => ({ name, isCustom: false })),
        ...(customColors?.map((cc) => ({ name: cc.name, isCustom: true })) ||
          []),
      ].map(({ name, isCustom }) => (
        <div key={name}>
          {!noTitle && (
            <h3 style={heading}>
              {isCustom ? upperFirst(name) : name.replace("-", " ")}
            </h3>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${STANDARD_TONES.length}, 1fr)`,
            }}
          >
            {STANDARD_TONES.slice()
              .reverse()
              .map((tone) => (
                <div
                  key={tone}
                  title={`${isCustom ? kebabCase(name) : name}-${tone}`}
                  style={{
                    height: "var(--tone, 4rem)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: `var(--md-ref-palette-${isCustom ? kebabCase(name) : name}-${tone})`,
                  }}
                >
                  <p>{tone}</p>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
