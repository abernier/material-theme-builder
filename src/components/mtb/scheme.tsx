"use client";

/**
 * The color-scheme poster of Material Theme Builder's stories -- every M3 role
 * of a theme (`Scheme`) and its tonal palettes (`Shades`), laid out the way the
 * official app's poster is.
 *
 * Also published as a shadcn registry item, so a project can install this very
 * file rather than hand-roll a copy of it:
 *
 * ```sh
 * npx shadcn@latest add https://unpkg.com/material-theme-builder/r/scheme.json
 * ```
 *
 * Hence the imports: only what a consumer resolves too -- `cn` from the `utils`
 * registry item, and the package itself by name. The stories import it from
 * here, so they and the registry ship the same component.
 *
 * The swatches read nothing from React: they paint from the
 * `--md-sys-color-*` and `--md-ref-palette-*` custom properties `<Mtb>` (or
 * `toCss()`) declares. Tailwind v4 is needed for the layout classes.
 *
 * @example
 * ```tsx
 * import { Mtb } from "material-theme-builder/react";
 * import { Poster, Scheme, Shades } from "@/components/mtb/scheme";
 *
 * <Mtb source="#769CDF">
 *   <Poster className="flex flex-col gap-6">
 *     <Scheme theme="light" title="Light scheme" />
 *     <Scheme theme="dark" title="Dark scheme" />
 *     <Shades />
 *   </Poster>
 * </Mtb>;
 * ```
 */

import { kebabCase, startCase, upperFirst } from "lodash-es";
import {
  STANDARD_TONES,
  type HexCustomColor,
  type TokenName,
} from "material-theme-builder";
import { createContext, useContext, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Foo({ children, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-id="Foo"
      {...props}
      className={cn("grid grid-cols-1 gap-0", props.className)}
    >
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
      className={cn(tw && twClasses[role], className)}
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
          --gap1:0.5rem;
          --gap2:1px;

          --fs:${notext ? 0 : ".8rem"};
          @media (max-width: 768px) {--fs:0;}

          @media (max-width: 768px) {
            --gap1:2px;
          }


          p {
            font-family:sans-serif;
            color:white;mix-blend-mode:difference;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;

            font-size:var(--fs);
            margin:.35rem;

          }

          [class*="h-20"],[class*="h-16"] {
            @media (max-width: 768px) {
              height:45px;
            }
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
 * wrap them all in one, the way the stories do. Lay it out with `className`
 * like any `div`, e.g. `flex flex-col gap-6`.
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
 * The page colors each `theme` puts behind the poster. The `dark` class is
 * what flips the swatches themselves: `<Mtb>` declares the dark values under
 * `.dark`.
 */
const themeClasses = {
  light: "p-2 md:p-4 bg-[var(--light)] text-[var(--dark)]",
  dark: "dark p-2 md:p-4 bg-[var(--dark)] text-[var(--light)]",
} satisfies Record<"light" | "dark", string>;

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
    <div className="grid grid-cols-4 grid-rows-1">
      {background && (
        <>
          <Swatch role="background" />
          <Swatch role="onBackground" />
        </>
      )}
      {surfaceVariant && (
        <Swatch role="surfaceVariant" className="col-start-3" />
      )}
      {surfaceTint && <Swatch role="surfaceTint" className="col-start-4" />}
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
   * `material-theme-builder/tailwind` plugin.
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
        className={cn(
          "flex flex-col gap-4 [--light:#fbfbfb] [--dark:#1c1b1f]",
          theme && themeClasses[theme],
          className,
        )}
        {...props}
      >
        {title && <h3 className="font-bold capitalize">{title}</h3>}

        <div className="grid grid-cols-[3fr_1fr] gap-(--gap1)">
          {
            //
            //  █████
            // ██   ██
            // ███████
            // ██   ██
            // ██   ██
            //
          }

          <div className="grid grid-cols-3 grid-rows-2 gap-(--gap2)">
            <Foo>
              <Swatch role="primary" className="h-20" />
              <Swatch role="onPrimary" />
            </Foo>
            <Foo>
              <Swatch role="secondary" className="h-20" />
              <Swatch role="onSecondary" />
            </Foo>
            <Foo>
              <Swatch role="tertiary" className="h-20" />
              <Swatch role="onTertiary" />
            </Foo>
            <Foo>
              <Swatch role="primaryContainer" className="h-20" />
              <Swatch role="onPrimaryContainer" />
            </Foo>
            <Foo>
              <Swatch role="secondaryContainer" className="h-20" />
              <Swatch role="onSecondaryContainer" />
            </Foo>
            <Foo>
              <Swatch role="tertiaryContainer" className="h-20" />
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

          <div className="grid grid-cols-1 grid-rows-2 gap-(--gap2)">
            <Foo>
              <Swatch role="error" className="h-20" />
              <Swatch role="onError" />
            </Foo>
            <Foo>
              <Swatch role="errorContainer" className="h-20" />
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
              <div className="grid grid-cols-3 grid-rows-1 gap-(--gap2)">
                <Foo>
                  <FooTop className="h-20 grid grid-cols-2 grid-rows-1">
                    <Swatch role="primaryFixed" />
                    <Swatch role="primaryFixedDim" />
                  </FooTop>
                  <FooBottom className="grid grid-cols-1 grid-rows-2">
                    <Swatch role="onPrimaryFixed" />
                    <Swatch role="onPrimaryFixedVariant" />
                  </FooBottom>
                </Foo>
                <Foo>
                  <FooTop className="h-20 grid grid-cols-2 grid-rows-1">
                    <Swatch role="secondaryFixed" />
                    <Swatch role="secondaryFixedDim" />
                  </FooTop>
                  <FooBottom className="grid grid-cols-1 grid-rows-2">
                    <Swatch role="onSecondaryFixed" />
                    <Swatch role="onSecondaryFixedVariant" />
                  </FooBottom>
                </Foo>
                <Foo>
                  <FooTop className="h-20 grid grid-cols-2 grid-rows-1">
                    <Swatch role="tertiaryFixed" />
                    <Swatch role="tertiaryFixedDim" />
                  </FooTop>
                  <FooBottom className="grid grid-cols-1 grid-rows-2">
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

          <div className="grid grid-cols-1 gap-(--gap2)">
            <div className="h-20 grid grid-cols-3 grid-rows-1">
              <Swatch role="surfaceDim" />
              <Swatch role="surface" />
              <Swatch role="surfaceBright" />
            </div>
            <div className="h-20 grid grid-cols-5 grid-rows-1">
              <Swatch role="surfaceContainerLowest" />
              <Swatch role="surfaceContainerLow" />
              <Swatch role="surfaceContainer" />
              <Swatch role="surfaceContainerHigh" />
              <Swatch role="surfaceContainerHighest" />
            </div>
            <div className="grid grid-cols-4 grid-rows-1">
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

          <div className="flex flex-col gap-1">
            <Foo>
              <Swatch role="inverseSurface" className="h-20" />
              <Swatch role="inverseOnSurface" />
            </Foo>
            <Foo>
              <Swatch role="inversePrimary" />
            </Foo>
            <div className="grid grid-cols-2 gap-(--gap2)">
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
          <div className="flex flex-col gap-(--gap2)">
            {customColors?.map((customColor) => (
              <div key={customColor.name} className="grid grid-cols-4">
                <Foo>
                  <FooTop
                    title={kebabCase(customColor.name)}
                    className="h-20"
                    style={{
                      backgroundColor: `var(--md-sys-color-${kebabCase(customColor.name)})`,
                    }}
                  >
                    <p>{upperFirst(customColor.name)}</p>
                  </FooTop>
                </Foo>
                <Foo>
                  <FooTop
                    title={`on-${kebabCase(customColor.name)}`}
                    className="h-20"
                    style={{
                      backgroundColor: `var(--md-sys-color-on-${kebabCase(customColor.name)})`,
                    }}
                  >
                    <p>On {upperFirst(customColor.name)}</p>
                  </FooTop>
                </Foo>
                <Foo>
                  <FooTop
                    title={`${kebabCase(customColor.name)}-container`}
                    className="h-20"
                    style={{
                      backgroundColor: `var(--md-sys-color-${kebabCase(customColor.name)}-container)`,
                    }}
                  >
                    <p>{upperFirst(customColor.name)} Container</p>
                  </FooTop>
                </Foo>
                <Foo>
                  <FooTop
                    title={`on-${kebabCase(customColor.name)}-container`}
                    className="h-20"
                    style={{
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
    <div className="flex flex-col gap-(--gap2)">
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
            <h3 className="font-bold capitalize">
              {isCustom ? upperFirst(name) : name.replace("-", " ")}
            </h3>
          )}

          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${STANDARD_TONES.length}, 1fr)`,
            }}
          >
            {STANDARD_TONES.slice()
              .reverse()
              .map((tone) => (
                <div
                  key={tone}
                  title={`${isCustom ? kebabCase(name) : name}-${tone}`}
                  className="h-16 flex items-center justify-center"
                  style={{
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
