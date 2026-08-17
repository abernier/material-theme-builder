import { cva, type VariantProps } from "class-variance-authority";
import { kebabCase, startCase, upperFirst } from "lodash-es";
import { createContext, useContext, type ComponentProps } from "react";
import { ExportButton } from "./ExportButton";
import { STANDARD_TONES, type TokenName } from "./lib/builder";
import { cn } from "./lib/utils";
import type { Mtb } from "./Mtb";
import { useMtb } from "./Mtb.context";

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
 * Storybook layout wrapper with optional source-color label and export button.
 */
export function Layout({
  notext,
  noExport,
  children,
}: {
  /** Hide the source-color text label. */
  notext?: boolean;
  /** Hide the export button. */
  noExport?: boolean;
  /** Story content to render inside the layout. */
  children: React.ReactNode;
}) {
  const { initials } = useMtb();

  return (
    <div className="flex flex-col gap-6 max-w-208 mx-auto">
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
      {!noExport && <ExportButton config={initials} />}
      {children}
    </div>
  );
}

const schemeVariants = cva(
  "flex flex-col gap-4 [--light:#fbfbfb] [--dark:#1c1b1f]",
  {
    variants: {
      theme: {
        light: "bg-[var(--light)] text-[var(--dark)]",
        dark: ["dark", "bg-[var(--dark)] text-[var(--light)]"],
      },
    },
    compoundVariants: [
      {
        theme: ["light", "dark"],
        className: "p-2 md:p-4",
      },
    ],
  },
);

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
 * Renders a light or dark color scheme grid with all M3 tokens.
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
   * that one is precisely about the utilities resolving.
   */
  tw?: boolean;
  /** Custom colors forwarded to the inner `<Mtb>`. */
  customColors?: ComponentProps<typeof Mtb>["customColors"];
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
} & VariantProps<typeof schemeVariants> &
  Omit<ComponentProps<"div">, "title">) {
  return (
    <TwContext.Provider value={tw}>
      <div className={cn(schemeVariants({ theme }), className)} {...props}>
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
 * Renders tonal palette shades for all core and custom palettes.
 */
export function Shades({
  customColors,
  noTitle,
}: {
  /** Hide the palette group titles. */
  noTitle?: boolean;
  /** Custom colors forwarded to the inner `<Mtb>`. */
  customColors?: ComponentProps<typeof Mtb>["customColors"];
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

/**
 * The custom-color roles, as Tailwind utilities.
 *
 * `Scheme` renders custom colors through inline `var(--md-sys-color-*)` styles,
 * because their names only exist at runtime — `bg-${name}` would never be seen
 * by Tailwind's source scanner, so the utility would never be generated. Here
 * the names are known, so the classes can be written literally and actually
 * prove that `bg-myCustomColor1` & co. resolve.
 */
function TailwindCustomColors() {
  return (
    <div className="flex flex-col gap-(--gap2)">
      <div className="grid grid-cols-4">
        <Foo>
          <FooTop className="h-20 bg-myCustomColor1" title="myCustomColor1">
            <p>MyCustomColor1</p>
          </FooTop>
        </Foo>
        <Foo>
          <FooTop
            className="h-20 bg-on-myCustomColor1"
            title="on-myCustomColor1"
          >
            <p>On MyCustomColor1</p>
          </FooTop>
        </Foo>
        <Foo>
          <FooTop
            className="h-20 bg-myCustomColor1-container"
            title="myCustomColor1-container"
          >
            <p>MyCustomColor1 Container</p>
          </FooTop>
        </Foo>
        <Foo>
          <FooTop
            className="h-20 bg-on-myCustomColor1-container"
            title="on-myCustomColor1-container"
          >
            <p>On MyCustomColor1 Container</p>
          </FooTop>
        </Foo>
      </div>
      <div className="grid grid-cols-4">
        <Foo>
          <FooTop className="h-20 bg-myCustomColor2" title="myCustomColor2">
            <p>MyCustomColor2</p>
          </FooTop>
        </Foo>
        <Foo>
          <FooTop
            className="h-20 bg-on-myCustomColor2"
            title="on-myCustomColor2"
          >
            <p>On MyCustomColor2</p>
          </FooTop>
        </Foo>
        <Foo>
          <FooTop
            className="h-20 bg-myCustomColor2-container"
            title="myCustomColor2-container"
          >
            <p>MyCustomColor2 Container</p>
          </FooTop>
        </Foo>
        <Foo>
          <FooTop
            className="h-20 bg-on-myCustomColor2-container"
            title="on-myCustomColor2-container"
          >
            <p>On MyCustomColor2 Container</p>
          </FooTop>
        </Foo>
      </div>
    </div>
  );
}

/**
 * Renders every M3 role as a Tailwind utility class.
 *
 * Reuses the `Scheme` layout — switched to its `tw` mode, where each swatch
 * takes its color from `bg-*` instead of `var(--md-sys-color-*)` — and
 * completes it with what `Scheme` cannot express as classes: the custom colors,
 * and the tonal shades.
 */
export function TailwindScheme() {
  return (
    <>
      <Scheme
        tw
        theme="light"
        title="Light scheme"
        fixedAccents
        surfaceTint
        background
        surfaceVariant
      >
        <TailwindCustomColors />
      </Scheme>

      <Scheme
        tw
        theme="dark"
        title="Dark scheme"
        fixedAccents
        surfaceTint
        background
        surfaceVariant
      >
        <TailwindCustomColors />
      </Scheme>

      <div className="p-6 space-y-6">
        {/* Shades */}
        <div className="space-y-4">
          {/* Primary Shades */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Primary</h4>
            <div className="grid grid-cols-11 rounded-md overflow-hidden">
              <div className="bg-primary-50 aspect-square flex items-center justify-center text-center text-xs">
                50
              </div>
              <div className="bg-primary-100 aspect-square flex items-center justify-center text-center text-xs">
                100
              </div>
              <div className="bg-primary-200 aspect-square flex items-center justify-center text-center text-xs">
                200
              </div>
              <div className="bg-primary-300 aspect-square flex items-center justify-center text-center text-xs">
                300
              </div>
              <div className="bg-primary-400 aspect-square flex items-center justify-center text-center text-xs">
                400
              </div>
              <div className="bg-primary-500 aspect-square flex items-center justify-center text-center text-xs">
                500
              </div>
              <div className="bg-primary-600 aspect-square flex items-center justify-center text-center text-xs">
                600
              </div>
              <div className="bg-primary-700 aspect-square flex items-center justify-center text-center text-xs">
                700
              </div>
              <div className="bg-primary-800 aspect-square flex items-center justify-center text-center text-xs">
                800
              </div>
              <div className="bg-primary-900 aspect-square flex items-center justify-center text-center text-xs">
                900
              </div>
              <div className="bg-primary-950 aspect-square flex items-center justify-center text-center text-xs">
                950
              </div>
            </div>
          </div>

          {/* Secondary Shades */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Secondary</h4>
            <div className="grid grid-cols-11 rounded-md overflow-hidden">
              <div className="bg-secondary-50 aspect-square flex items-center justify-center text-center text-xs">
                50
              </div>
              <div className="bg-secondary-100 aspect-square flex items-center justify-center text-center text-xs">
                100
              </div>
              <div className="bg-secondary-200 aspect-square flex items-center justify-center text-center text-xs">
                200
              </div>
              <div className="bg-secondary-300 aspect-square flex items-center justify-center text-center text-xs">
                300
              </div>
              <div className="bg-secondary-400 aspect-square flex items-center justify-center text-center text-xs">
                400
              </div>
              <div className="bg-secondary-500 aspect-square flex items-center justify-center text-center text-xs">
                500
              </div>
              <div className="bg-secondary-600 aspect-square flex items-center justify-center text-center text-xs">
                600
              </div>
              <div className="bg-secondary-700 aspect-square flex items-center justify-center text-center text-xs">
                700
              </div>
              <div className="bg-secondary-800 aspect-square flex items-center justify-center text-center text-xs">
                800
              </div>
              <div className="bg-secondary-900 aspect-square flex items-center justify-center text-center text-xs">
                900
              </div>
              <div className="bg-secondary-950 aspect-square flex items-center justify-center text-center text-xs">
                950
              </div>
            </div>
          </div>

          {/* Tertiary Shades */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Tertiary</h4>
            <div className="grid grid-cols-11 rounded-md overflow-hidden">
              <div className="bg-tertiary-50 aspect-square flex items-center justify-center text-center text-xs">
                50
              </div>
              <div className="bg-tertiary-100 aspect-square flex items-center justify-center text-center text-xs">
                100
              </div>
              <div className="bg-tertiary-200 aspect-square flex items-center justify-center text-center text-xs">
                200
              </div>
              <div className="bg-tertiary-300 aspect-square flex items-center justify-center text-center text-xs">
                300
              </div>
              <div className="bg-tertiary-400 aspect-square flex items-center justify-center text-center text-xs">
                400
              </div>
              <div className="bg-tertiary-500 aspect-square flex items-center justify-center text-center text-xs">
                500
              </div>
              <div className="bg-tertiary-600 aspect-square flex items-center justify-center text-center text-xs">
                600
              </div>
              <div className="bg-tertiary-700 aspect-square flex items-center justify-center text-center text-xs">
                700
              </div>
              <div className="bg-tertiary-800 aspect-square flex items-center justify-center text-center text-xs">
                800
              </div>
              <div className="bg-tertiary-900 aspect-square flex items-center justify-center text-center text-xs">
                900
              </div>
              <div className="bg-tertiary-950 aspect-square flex items-center justify-center text-center text-xs">
                950
              </div>
            </div>
          </div>

          {/* Error Shades */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Error</h4>
            <div className="grid grid-cols-11 rounded-md overflow-hidden">
              <div className="bg-error-50 aspect-square flex items-center justify-center text-center text-xs">
                50
              </div>
              <div className="bg-error-100 aspect-square flex items-center justify-center text-center text-xs">
                100
              </div>
              <div className="bg-error-200 aspect-square flex items-center justify-center text-center text-xs">
                200
              </div>
              <div className="bg-error-300 aspect-square flex items-center justify-center text-center text-xs">
                300
              </div>
              <div className="bg-error-400 aspect-square flex items-center justify-center text-center text-xs">
                400
              </div>
              <div className="bg-error-500 aspect-square flex items-center justify-center text-center text-xs">
                500
              </div>
              <div className="bg-error-600 aspect-square flex items-center justify-center text-center text-xs">
                600
              </div>
              <div className="bg-error-700 aspect-square flex items-center justify-center text-center text-xs">
                700
              </div>
              <div className="bg-error-800 aspect-square flex items-center justify-center text-center text-xs">
                800
              </div>
              <div className="bg-error-900 aspect-square flex items-center justify-center text-center text-xs">
                900
              </div>
              <div className="bg-error-950 aspect-square flex items-center justify-center text-center text-xs">
                950
              </div>
            </div>
          </div>

          {/* Neutral Shades */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Neutral</h4>
            <div className="grid grid-cols-11 rounded-md overflow-hidden">
              <div className="bg-neutral-50 aspect-square flex items-center justify-center text-center text-xs">
                50
              </div>
              <div className="bg-neutral-100 aspect-square flex items-center justify-center text-center text-xs">
                100
              </div>
              <div className="bg-neutral-200 aspect-square flex items-center justify-center text-center text-xs">
                200
              </div>
              <div className="bg-neutral-300 aspect-square flex items-center justify-center text-center text-xs">
                300
              </div>
              <div className="bg-neutral-400 aspect-square flex items-center justify-center text-center text-xs">
                400
              </div>
              <div className="bg-neutral-500 aspect-square flex items-center justify-center text-center text-xs">
                500
              </div>
              <div className="bg-neutral-600 aspect-square flex items-center justify-center text-center text-xs">
                600
              </div>
              <div className="bg-neutral-700 aspect-square flex items-center justify-center text-center text-xs">
                700
              </div>
              <div className="bg-neutral-800 aspect-square flex items-center justify-center text-center text-xs">
                800
              </div>
              <div className="bg-neutral-900 aspect-square flex items-center justify-center text-center text-xs">
                900
              </div>
              <div className="bg-neutral-950 aspect-square flex items-center justify-center text-center text-xs">
                950
              </div>
            </div>
          </div>

          {/* Neutral Variant Shades */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Neutral Variant</h4>
            <div className="grid grid-cols-11 rounded-md overflow-hidden">
              <div className="bg-neutral-variant-50 aspect-square flex items-center justify-center text-center text-xs">
                50
              </div>
              <div className="bg-neutral-variant-100 aspect-square flex items-center justify-center text-center text-xs">
                100
              </div>
              <div className="bg-neutral-variant-200 aspect-square flex items-center justify-center text-center text-xs">
                200
              </div>
              <div className="bg-neutral-variant-300 aspect-square flex items-center justify-center text-center text-xs">
                300
              </div>
              <div className="bg-neutral-variant-400 aspect-square flex items-center justify-center text-center text-xs">
                400
              </div>
              <div className="bg-neutral-variant-500 aspect-square flex items-center justify-center text-center text-xs">
                500
              </div>
              <div className="bg-neutral-variant-600 aspect-square flex items-center justify-center text-center text-xs">
                600
              </div>
              <div className="bg-neutral-variant-700 aspect-square flex items-center justify-center text-center text-xs">
                700
              </div>
              <div className="bg-neutral-variant-800 aspect-square flex items-center justify-center text-center text-xs">
                800
              </div>
              <div className="bg-neutral-variant-900 aspect-square flex items-center justify-center text-center text-xs">
                900
              </div>
              <div className="bg-neutral-variant-950 aspect-square flex items-center justify-center text-center text-xs">
                950
              </div>
            </div>
          </div>

          {/* myCustomColor1 Shades */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">myCustomColor1</h4>
            <div className="grid grid-cols-11 rounded-md overflow-hidden">
              <div className="bg-myCustomColor1-50 aspect-square flex items-center justify-center text-center text-xs">
                50
              </div>
              <div className="bg-myCustomColor1-100 aspect-square flex items-center justify-center text-center text-xs">
                100
              </div>
              <div className="bg-myCustomColor1-200 aspect-square flex items-center justify-center text-center text-xs">
                200
              </div>
              <div className="bg-myCustomColor1-300 aspect-square flex items-center justify-center text-center text-xs">
                300
              </div>
              <div className="bg-myCustomColor1-400 aspect-square flex items-center justify-center text-center text-xs">
                400
              </div>
              <div className="bg-myCustomColor1-500 aspect-square flex items-center justify-center text-center text-xs">
                500
              </div>
              <div className="bg-myCustomColor1-600 aspect-square flex items-center justify-center text-center text-xs">
                600
              </div>
              <div className="bg-myCustomColor1-700 aspect-square flex items-center justify-center text-center text-xs">
                700
              </div>
              <div className="bg-myCustomColor1-800 aspect-square flex items-center justify-center text-center text-xs">
                800
              </div>
              <div className="bg-myCustomColor1-900 aspect-square flex items-center justify-center text-center text-xs">
                900
              </div>
              <div className="bg-myCustomColor1-950 aspect-square flex items-center justify-center text-center text-xs">
                950
              </div>
            </div>
          </div>

          {/* myCustomColor2 Shades */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">myCustomColor2</h4>
            <div className="grid grid-cols-11 rounded-md overflow-hidden">
              <div className="bg-myCustomColor2-50 aspect-square flex items-center justify-center text-center text-xs">
                50
              </div>
              <div className="bg-myCustomColor2-100 aspect-square flex items-center justify-center text-center text-xs">
                100
              </div>
              <div className="bg-myCustomColor2-200 aspect-square flex items-center justify-center text-center text-xs">
                200
              </div>
              <div className="bg-myCustomColor2-300 aspect-square flex items-center justify-center text-center text-xs">
                300
              </div>
              <div className="bg-myCustomColor2-400 aspect-square flex items-center justify-center text-center text-xs">
                400
              </div>
              <div className="bg-myCustomColor2-500 aspect-square flex items-center justify-center text-center text-xs">
                500
              </div>
              <div className="bg-myCustomColor2-600 aspect-square flex items-center justify-center text-center text-xs">
                600
              </div>
              <div className="bg-myCustomColor2-700 aspect-square flex items-center justify-center text-center text-xs">
                700
              </div>
              <div className="bg-myCustomColor2-800 aspect-square flex items-center justify-center text-center text-xs">
                800
              </div>
              <div className="bg-myCustomColor2-900 aspect-square flex items-center justify-center text-center text-xs">
                900
              </div>
              <div className="bg-myCustomColor2-950 aspect-square flex items-center justify-center text-center text-xs">
                950
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm italic text-center">
          Every <code>--color-*</code> declared in <code>tailwind.css</code> is
          shown here as a Tailwind utility class
        </p>
      </div>
    </>
  );
}
