"use client";

import { cn } from "@/lib/utils";
import { kebabCase, startCase, upperFirst } from "lodash-es";
import {
  CORE_PALETTES,
  DEFAULT_PREFIX,
  STANDARD_TONES,
  type MtbConfig,
  type TokenName,
} from "material-theme-builder";
import { MtbContext } from "material-theme-builder/react";
import {
  createContext,
  useContext,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";

// The poster: `<Scheme>` and `<Shades>`, the two views of a generated theme
// that Material Theme Builder itself draws -- and the parts they are made of.
//
// Distributed as a shadcn registry item (the root `registry.json` points at
// this very file), not exported from the npm package: whoever installs it owns
// the source. Hence the shape -- Tailwind utilities merged through `cn`, every
// part exported and taking `className`, a `data-slot` on each -- and hence the
// imports, which are spelled the way a *consumer* resolves them.
//
// Nothing drifts for being copied: the colors are not in here. Every cell
// paints from a CSS variable the theme declares, and the vocabulary -- token
// names, tones, palette names -- is imported from the package.

/**
 * What the parts need to know about the theme they draw, none of which a CSS
 * variable can tell them.
 */
type SchemeConfig = {
  /**
   * The custom colors to draw after the standard ones. Defaults to those of
   * the enclosing `<Mtb>`; pass `[]` to draw none.
   */
  customColors?: MtbConfig["customColors"];
  /**
   * The CSS custom-property prefix the theme was generated with. Defaults to
   * that of the enclosing `<Mtb>`, else to `md`.
   */
  prefix?: string;
  /**
   * Extra classes for the swatch of a given token, keyed like `Swatch`'s
   * `token` -- which is how one cell of the pre-composed poster gets restyled
   * without recomposing it.
   *
   * A `bg-*` utility in there replaces the swatch's own color, `cn` seeing to
   * the conflict.
   */
  swatchClassNames?: { [token in TokenName]?: string } & {
    [custom: string]: string | undefined;
  };
};

/** What a root resolved, for the parts under it. Empty outside any root. */
const SchemeContext = createContext<SchemeConfig>({});

/**
 * What a part goes by: its own props, else the root it sits in, else the
 * enclosing `<Mtb>`.
 *
 * `<Mtb>` is read with a bare `useContext` and not `useMtb`, which throws
 * outside a provider. The poster paints from CSS variables, so it works
 * anywhere those are declared -- next to a server-rendered `toCss()`, or over
 * a page whose `<Mtb>` sits elsewhere in the tree.
 */
function useSchemeConfig(props: SchemeConfig = {}) {
  const root = useContext(SchemeContext);
  const mtb = useContext(MtbContext)?.mtbConfig;

  return {
    customColors:
      props.customColors ?? root.customColors ?? mtb?.customColors ?? [],
    prefix: props.prefix ?? root.prefix ?? mtb?.prefix ?? DEFAULT_PREFIX,
    swatchClassNames: props.swatchClassNames ?? root.swatchClassNames,
  } satisfies SchemeConfig;
}

// The height of a color cell, as opposed to an `on-` one, which is only as
// tall as its label. Shorter on a phone, where the labels are gone too.
const TALL = "h-20 max-md:h-[45px]";

/**
 * An inline `--swatch`, for `bg-(--swatch)` to paint with.
 *
 * A variable and a utility rather than an inline `background-color`, which no
 * class could ever outrank: this way a `bg-*` passed as `className` wins, like
 * on any other part.
 */
function swatchStyle(color: string, style?: CSSProperties) {
  return { "--swatch": color, ...style } as CSSProperties;
}

/**
 * The name written on a swatch. Drawn in white with `mix-blend-difference`,
 * which is what keeps it legible on any color without knowing it.
 *
 * Hidden on a phone by a font size of zero rather than by `hidden`, so an
 * `on-` cell keeps the sliver of height its margins give it.
 */
export function SwatchLabel({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="swatch-label"
      className={cn(
        "m-[.35rem] truncate font-[family-name:sans-serif] text-[.8rem] text-white mix-blend-difference max-md:text-[0px]",
        className,
      )}
      {...props}
    />
  );
}

/**
 * One color cell: painted from `var(--md-sys-color-<token>)`, the token as
 * `title`, its human name as label.
 *
 * The unit everything else here is made of, and usable on its own — it needs
 * no `Scheme` around it.
 *
 * @example
 * <Swatch token="primaryContainer" className="h-32 rounded-xl" />
 * @example
 * <Swatch token="on-brand">
 *   <SwatchLabel>On brand</SwatchLabel>
 * </Swatch>
 */
export function Swatch({
  token,
  className,
  style,
  children,
  ...props
}: {
  /**
   * The color to paint: an M3 token as the library names it (`onPrimary`), or
   * a custom color's (`brand`, `on-brand`, `brand-container`…). Kebab-cased
   * either way to get the variable name.
   *
   * Not `role`, the M3 word for it: these props are spread onto a `<div>`,
   * where `role` is the ARIA attribute.
   */
  token: TokenName | (string & {});
} & ComponentProps<"div">) {
  const { prefix, swatchClassNames } = useSchemeConfig();
  const name = kebabCase(token);

  return (
    <div
      data-slot="swatch"
      title={name}
      className={cn("bg-(--swatch)", swatchClassNames?.[token], className)}
      style={swatchStyle(`var(--${prefix}-sys-color-${name})`, style)}
      {...props}
    >
      {children ?? <SwatchLabel>{startCase(token)}</SwatchLabel>}
    </div>
  );
}

/** A color above its `on-` counterpart. */
function Pair({ color, on }: { color: TokenName; on: TokenName }) {
  return (
    <div className="grid grid-cols-1">
      <Swatch token={color} className={TALL} />
      <Swatch token={on} />
    </div>
  );
}

/** One accent's four fixed roles, the two fills over the two inks. */
function FixedAccent({
  fixed,
  fixedDim,
  onFixed,
  onFixedVariant,
}: Record<"fixed" | "fixedDim" | "onFixed" | "onFixedVariant", TokenName>) {
  return (
    <div className="grid grid-cols-1">
      <div className={cn("grid grid-cols-2 grid-rows-1", TALL)}>
        <Swatch token={fixed} />
        <Swatch token={fixedDim} />
      </div>
      <div className="grid grid-cols-1 grid-rows-2">
        <Swatch token={onFixed} />
        <Swatch token={onFixedVariant} />
      </div>
    </div>
  );
}

/**
 * The poster's frame, and nothing in it: the optional light or dark card, and
 * what the parts under it read their `prefix`, `customColors` and
 * `swatchClassNames` from.
 *
 * `Scheme` is this with the official layout already inside. Reach for the
 * root when the layout is the thing to change.
 *
 * @example
 * <SchemeRoot theme="dark" className="rounded-xl">
 *   <SchemeTitle>Brand</SchemeTitle>
 *   <SchemeRoles className="grid-cols-1">
 *     <SchemeAccents />
 *     <SchemeSurfaces />
 *   </SchemeRoles>
 *   <SchemeCustomColors />
 * </SchemeRoot>
 */
export function SchemeRoot({
  theme,
  customColors,
  prefix,
  swatchClassNames,
  className,
  ...props
}: {
  /**
   * Draw the poster on a light or dark card of its own. `"dark"` also sets the
   * `dark` class, which is what switches the variables to their dark values.
   *
   * Left out, the poster is bare and follows the page.
   *
   * `"light"` cannot undo a dark page: the generated CSS declares the light
   * values on `:root` and the dark ones on `.dark`, so under a `.dark`
   * ancestor a light card would still read the dark values.
   */
  theme?: "light" | "dark";
} & SchemeConfig &
  ComponentProps<"div">) {
  const config = useSchemeConfig({ customColors, prefix, swatchClassNames });

  return (
    <SchemeContext.Provider value={config}>
      <div
        data-slot="scheme"
        className={cn(
          "flex flex-col gap-4",
          theme && "p-2 md:p-4",
          theme === "light" && "bg-[#fbfbfb] text-[#1c1b1f]",
          theme === "dark" && "dark bg-[#1c1b1f] text-[#fbfbfb]",
          className,
        )}
        {...props}
      />
    </SchemeContext.Provider>
  );
}

/**
 * The heading above a scheme.
 */
export function SchemeTitle({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="scheme-title"
      className={cn("font-bold capitalize", className)}
      {...props}
    />
  );
}

/**
 * The official poster's grid: a wide column for the accents and surfaces, a
 * narrow one for errors and inverse roles.
 *
 * Each group below names its own column, so leaving one out -- the fixed
 * accents, which the official poster does not draw -- shifts nothing sideways.
 */
export function SchemeRoles({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="scheme-roles"
      className={cn("grid grid-cols-[3fr_1fr] gap-2 max-md:gap-0.5", className)}
      {...props}
    />
  );
}

//
//  █████
// ██   ██
// ███████
// ██   ██
// ██   ██
//

/**
 * Primary, secondary and tertiary: each color and its container, over their
 * `on-` inks.
 */
export function SchemeAccents({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="scheme-accents"
      className={cn(
        "col-start-1 grid grid-cols-3 grid-rows-2 gap-px",
        className,
      )}
      {...props}
    >
      <Pair color="primary" on="onPrimary" />
      <Pair color="secondary" on="onSecondary" />
      <Pair color="tertiary" on="onTertiary" />
      <Pair color="primaryContainer" on="onPrimaryContainer" />
      <Pair color="secondaryContainer" on="onSecondaryContainer" />
      <Pair color="tertiaryContainer" on="onTertiaryContainer" />
    </div>
  );
}

//
// ██████
// ██   ██
// ██████
// ██   ██
// ██████
//

/**
 * Error and its container, over their `on-` inks.
 */
export function SchemeErrors({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="scheme-errors"
      className={cn(
        "col-start-2 grid grid-cols-1 grid-rows-2 gap-px",
        className,
      )}
      {...props}
    >
      <Pair color="error" on="onError" />
      <Pair color="errorContainer" on="onErrorContainer" />
    </div>
  );
}

//
//  ██████
// ██
// ██
// ██
//  ██████
//

/**
 * The 12 `*-fixed`, `*-fixed-dim` and `on-*-fixed*` roles, which keep the same
 * color between light and dark themes.
 *
 * Current M3 roles, though the spec files them under "add-on color roles",
 * warning that "most products won't need to use these" — and the official
 * app's poster does not draw them.
 *
 * @see https://m3.material.io/styles/color/roles#a5f6ea3d-d457-4c5d-94f4-55f3cdf6470b
 */
export function SchemeFixedAccents({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="scheme-fixed-accents"
      className={cn(
        "col-start-1 grid grid-cols-3 grid-rows-1 gap-px",
        className,
      )}
      {...props}
    >
      <FixedAccent
        fixed="primaryFixed"
        fixedDim="primaryFixedDim"
        onFixed="onPrimaryFixed"
        onFixedVariant="onPrimaryFixedVariant"
      />
      <FixedAccent
        fixed="secondaryFixed"
        fixedDim="secondaryFixedDim"
        onFixed="onSecondaryFixed"
        onFixedVariant="onSecondaryFixedVariant"
      />
      <FixedAccent
        fixed="tertiaryFixed"
        fixedDim="tertiaryFixedDim"
        onFixed="onTertiaryFixed"
        onFixedVariant="onTertiaryFixedVariant"
      />
    </div>
  );
}

//
// ███████
// ██
// █████
// ██
// ███████
//

type DroppedRoles = {
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
};

/**
 * The surfaces, their containers and the inks that go on them — plus, on
 * request, the four roles the current spec no longer lists, as an extra row.
 *
 * That row is kept on a 4-column grid so each cell stays aligned with the one
 * above, whichever subset is displayed.
 *
 * @see https://m3.material.io/styles/color/roles
 */
export function SchemeSurfaces({
  surfaceTint = false,
  background = false,
  surfaceVariant = false,
  className,
  ...props
}: DroppedRoles & ComponentProps<"div">) {
  return (
    <div
      data-slot="scheme-surfaces"
      className={cn("col-start-1 grid grid-cols-1 gap-px", className)}
      {...props}
    >
      <div className={cn("grid grid-cols-3 grid-rows-1", TALL)}>
        <Swatch token="surfaceDim" />
        <Swatch token="surface" />
        <Swatch token="surfaceBright" />
      </div>
      <div className={cn("grid grid-cols-5 grid-rows-1", TALL)}>
        <Swatch token="surfaceContainerLowest" />
        <Swatch token="surfaceContainerLow" />
        <Swatch token="surfaceContainer" />
        <Swatch token="surfaceContainerHigh" />
        <Swatch token="surfaceContainerHighest" />
      </div>
      <div className="grid grid-cols-4 grid-rows-1">
        <Swatch token="onSurface" />
        <Swatch token="onSurfaceVariant" />
        <Swatch token="outline" />
        <Swatch token="outlineVariant" />
      </div>
      {(background || surfaceVariant || surfaceTint) && (
        <div className="grid grid-cols-4 grid-rows-1">
          {background && (
            <>
              <Swatch token="background" />
              <Swatch token="onBackground" />
            </>
          )}
          {surfaceVariant && (
            <Swatch token="surfaceVariant" className="col-start-3" />
          )}
          {surfaceTint && (
            <Swatch token="surfaceTint" className="col-start-4" />
          )}
        </div>
      )}
    </div>
  );
}

//
// ███████
// ██
// █████
// ██
// ██
//

/**
 * The inverse surface and its inks, then scrim and shadow.
 */
export function SchemeInverse({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="scheme-inverse"
      className={cn("col-start-2 flex flex-col gap-1", className)}
      {...props}
    >
      <Pair color="inverseSurface" on="inverseOnSurface" />
      <div className="grid grid-cols-1">
        <Swatch token="inversePrimary" />
      </div>
      <div className="grid grid-cols-2 gap-px">
        <Swatch token="scrim" />
        <Swatch token="shadow" />
      </div>
    </div>
  );
}

//
//  ██████ ██    ██ ███████ ████████  ██████  ███    ███
// ██      ██    ██ ██         ██    ██    ██ ████  ████
// ██      ██    ██ ███████    ██    ██    ██ ██ ████ ██
// ██      ██    ██      ██    ██    ██    ██ ██  ██  ██
//  ██████  ██████  ███████    ██     ██████  ██      ██
//

/**
 * The custom colors, one row each: the color, its container, and their inks —
 * labelled with the name the color was given.
 *
 * Renders nothing when there are none.
 */
export function SchemeCustomColors({
  customColors,
  className,
  ...props
}: Pick<SchemeConfig, "customColors"> & ComponentProps<"div">) {
  const config = useSchemeConfig({ customColors });

  if (config.customColors.length === 0) return null;

  return (
    <div
      data-slot="scheme-custom-colors"
      className={cn("flex flex-col gap-px", className)}
      {...props}
    >
      {config.customColors.map(({ name }) => {
        const label = upperFirst(name);

        return (
          <div key={name} className="grid grid-cols-4">
            <Swatch token={name} className={TALL}>
              <SwatchLabel>{label}</SwatchLabel>
            </Swatch>
            <Swatch token={`on-${name}`} className={TALL}>
              <SwatchLabel>On {label}</SwatchLabel>
            </Swatch>
            <Swatch token={`${name}-container`} className={TALL}>
              <SwatchLabel>{label} Container</SwatchLabel>
            </Swatch>
            <Swatch token={`on-${name}-container`} className={TALL}>
              <SwatchLabel>On {label} Container</SwatchLabel>
            </Swatch>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The color scheme as Material Theme Builder draws it: every M3 role, laid out
 * on the official poster's grid, followed by the custom colors.
 *
 * Paints from the `--md-sys-color-*` variables, so it shows whatever theme is
 * in effect where it is rendered. Inside an `<Mtb>` it picks up that theme's
 * `customColors` and `prefix` on its own.
 *
 * It is `SchemeRoot` with every part already in place. To restyle one, target
 * its `data-slot` or edit it — the file is yours; to rearrange them, compose
 * the parts yourself.
 *
 * @example
 * <Mtb source="#769CDF" customColors={[{ name: "brand", hex: "#FF5733" }]}>
 *   <Scheme theme="light" title="Light scheme" />
 *   <Scheme theme="dark" title="Dark scheme" />
 * </Mtb>
 */
export function Scheme({
  title = "",
  fixedAccents = true,
  surfaceTint,
  background,
  surfaceVariant,
  children,
  ...props
}: {
  /** Heading displayed above the scheme. */
  title?: string;
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
} & DroppedRoles &
  Omit<ComponentProps<typeof SchemeRoot>, "title">) {
  return (
    <SchemeRoot {...props}>
      {title && <SchemeTitle>{title}</SchemeTitle>}

      <SchemeRoles>
        <SchemeAccents />
        <SchemeErrors />
        {fixedAccents && <SchemeFixedAccents />}
        <SchemeSurfaces
          surfaceTint={surfaceTint}
          background={background}
          surfaceVariant={surfaceVariant}
        />
        <SchemeInverse />
      </SchemeRoles>

      <SchemeCustomColors />

      {children}
    </SchemeRoot>
  );
}

//
// ███████ ██   ██  █████  ██████  ███████ ███████
// ██      ██   ██ ██   ██ ██   ██ ██      ██
// ███████ ███████ ███████ ██   ██ █████   ███████
//      ██ ██   ██ ██   ██ ██   ██ ██           ██
// ███████ ██   ██ ██   ██ ██████  ███████ ███████
//

/**
 * The frame of `Shades`, and nothing in it — for drawing a chosen set of
 * `Palette`s instead of all of them.
 *
 * @example
 * <ShadesRoot className="gap-4">
 *   <Palette name="primary" title="Primary" />
 *   <Palette name="brand" title="Brand" />
 * </ShadesRoot>
 */
export function ShadesRoot({
  customColors,
  prefix,
  className,
  ...props
}: Pick<SchemeConfig, "customColors" | "prefix"> & ComponentProps<"div">) {
  const config = useSchemeConfig({ customColors, prefix });

  return (
    <SchemeContext.Provider value={config}>
      <div
        data-slot="shades"
        className={cn("flex flex-col gap-px", className)}
        {...props}
      />
    </SchemeContext.Provider>
  );
}

/**
 * The heading above a palette.
 */
export function PaletteTitle({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="palette-title"
      className={cn("font-bold capitalize", className)}
      {...props}
    />
  );
}

/**
 * One tone of one palette, painted from `var(--md-ref-palette-<palette>-<tone>)`
 * and labelled with the tone.
 */
export function PaletteTone({
  palette,
  tone,
  className,
  style,
  children,
  ...props
}: {
  /**
   * The palette the tone belongs to: a core one (`primary`,
   * `neutral-variant`…) or a custom color's name. Kebab-cased to get the
   * variable name.
   */
  palette: string;
  /** The tone, from 0 (black) to 100 (white). */
  tone: number;
} & ComponentProps<"div">) {
  const { prefix } = useSchemeConfig();
  const name = `${kebabCase(palette)}-${tone}`;

  return (
    <div
      data-slot="palette-tone"
      title={name}
      className={cn(
        "flex h-16 items-center justify-center bg-(--swatch) max-md:h-[45px]",
        className,
      )}
      style={swatchStyle(`var(--${prefix}-ref-palette-${name})`, style)}
      {...props}
    >
      {children ?? <SwatchLabel>{tone}</SwatchLabel>}
    </div>
  );
}

/**
 * One tonal palette: every standard tone from 100 down to 0.
 *
 * The tones share the row through `auto-cols-[1fr]` and not a column count, so
 * nothing here has to know how many standard tones there are.
 */
export function Palette({
  name,
  title,
  className,
  ...props
}: {
  /**
   * The palette to draw: a core one (`primary`, `neutral-variant`…) or a
   * custom color's name.
   */
  name: string;
  /** Heading displayed above the tones. Left out, there is none. */
  title?: ReactNode;
} & Omit<ComponentProps<"div">, "title">) {
  return (
    <div data-slot="palette" className={className} {...props}>
      {title && <PaletteTitle>{title}</PaletteTitle>}

      <div
        data-slot="palette-tones"
        className="grid auto-cols-[1fr] grid-flow-col"
      >
        {[...STANDARD_TONES].reverse().map((tone) => (
          <PaletteTone key={tone} palette={name} tone={tone} />
        ))}
      </div>
    </div>
  );
}

/**
 * The tonal palettes behind a scheme — one row per palette, core then custom,
 * every standard tone from 100 down to 0.
 *
 * Paints from the `--md-ref-palette-*` variables. Like `Scheme`, it picks up
 * the enclosing `<Mtb>`'s `customColors` and `prefix` when there is one — or
 * those of the `Scheme` it is a child of.
 *
 * @example
 * <Mtb source="#769CDF">
 *   <Shades />
 * </Mtb>
 */
export function Shades({
  customColors,
  prefix,
  noTitle,
  ...props
}: {
  /** Hide the palette titles. */
  noTitle?: boolean;
} & ComponentProps<typeof ShadesRoot>) {
  const config = useSchemeConfig({ customColors, prefix });

  return (
    <ShadesRoot
      customColors={config.customColors}
      prefix={config.prefix}
      {...props}
    >
      {CORE_PALETTES.map((name) => (
        <Palette
          key={name}
          name={name}
          title={noTitle ? undefined : name.replace("-", " ")}
        />
      ))}
      {config.customColors.map(({ name }) => (
        <Palette
          key={name}
          name={name}
          title={noTitle ? undefined : upperFirst(name)}
        />
      ))}
    </ShadesRoot>
  );
}
