import type { Meta } from "@storybook/react-vite";
import { useState, type ComponentProps } from "react";
import { Fab } from "./components/m3/Fab";
import { Scheme, Shades, SwatchLabel } from "./components/m3/scheme";
import { ExportButton } from "./ExportButton";
import {
  DEFAULT_CONTRAST,
  DEFAULT_PREFIX,
  DEFAULT_SCHEME,
  schemeNames,
  type MtbConfig,
  type TokenName,
} from "./lib/builder";
import { cn } from "./lib/utils";
import type { Mtb } from "./Mtb";

// The poster is not drawn here: it is the `scheme` registry item, the very
// file `shadcn add` copies into other projects. Re-exported so the stories
// keep one import for everything they draw with.
export { Scheme, Shades };

/**
 * `<Mtb>`'s props as controls, shared by every story that themes with them.
 *
 * Every color gets a picker. Left to infer, a `string` prop renders as a "Set
 * string" button whose first click hands the builder `''` -- a color to pick is
 * both the better control and the one that cannot produce a value the prop has
 * no reading for.
 *
 * `scheme` and `customColors` also spell out their `type`. A URL `args=` param
 * is checked against `type`, not against `control`, and what docgen infers for
 * these two -- a type alias, an array of an intersection -- comes out as
 * `other`, which Storybook drops from the URL without a word. The controls
 * worked either way; a shared link with `scheme:vibrant` did not.
 */
export const mtbArgTypes = {
  source: { control: "color" },
  scheme: {
    type: { name: "enum", value: [...schemeNames] },
    control: "select",
    options: schemeNames,
  },
  customColors: {
    type: {
      name: "array",
      value: {
        name: "object",
        value: {
          name: { name: "string" },
          hex: { name: "string" },
          blend: { name: "boolean" },
        },
      },
    },
    control: "object",
  },
  contrast: { control: { type: "range", min: -1, max: 1, step: 0.1 } },
  primary: { control: "color" },
  secondary: { control: "color" },
  tertiary: { control: "color" },
  error: { control: "color" },
  neutral: { control: "color" },
  neutralVariant: { control: "color" },
  children: {
    table: { disable: true }, // hide
  },
} satisfies Meta<typeof Mtb>["argTypes"];

/**
 * Same reason, for the one prop a picker cannot cover: an unset `object`
 * control is a "Set object" button that clicks to `{}`, which is not a list of
 * custom colors. Starting it at `[]` -- the builder's own default -- opens the
 * array editor instead, and changes nothing about what is rendered.
 */
export const mtbArgs = {
  customColors: [],
} satisfies Partial<ComponentProps<typeof Mtb>>;

/**
 * Each color of the Tailwind story, mapped to its Tailwind utility — what
 * `TailwindScheme` hands `Scheme` as `swatchClassNames`, to paint with instead
 * of the raw `var(--md-sys-color-*)`.
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
 * Same, for the custom colors — keyed as `Scheme` names their four roles,
 * which is also how the plugin names their utilities.
 *
 * Only these two: they are the ones `globals.css` declares to the `@plugin`,
 * and the ones the Tailwind story's `<Mtb>` is given. Any other custom color
 * typed into the controls has no utility to be painted with, and falls back
 * on its variable like in every other story.
 */
const twCustomClasses = {
  myCustomColor1: "bg-myCustomColor1",
  "on-myCustomColor1": "bg-on-myCustomColor1",
  "myCustomColor1-container": "bg-myCustomColor1-container",
  "on-myCustomColor1-container": "bg-on-myCustomColor1-container",

  myCustomColor2: "bg-myCustomColor2",
  "on-myCustomColor2": "bg-on-myCustomColor2",
  "myCustomColor2-container": "bg-myCustomColor2-container",
  "on-myCustomColor2-container": "bg-on-myCustomColor2-container",
};

/**
 * Hides every swatch label under the element it is set on, for the stories
 * that show the poster as pure color.
 *
 * A font size of zero and not `hidden`, like the labels do for themselves on a
 * phone: the `on-` cells are only as tall as their label, margins included.
 */
const NO_LABELS = "**:data-[slot=swatch-label]:text-[0px]";

/**
 * Storybook layout wrapper with optional source-color label and export button.
 */
export function Layout({
  notext,
  children,
}: {
  /** Hide the swatch labels. */
  notext?: boolean;
  /** Story content to render inside the layout. */
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 max-w-208 mx-auto",
        notext && NO_LABELS,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Renders every M3 role as a Tailwind utility class.
 *
 * Reuses `Scheme` as is — handing it `swatchClassNames`, so that each swatch
 * takes its color from `bg-*` instead of `var(--md-sys-color-*)` — and
 * completes it with what `Scheme` does not draw: the Tailwind shades, which
 * are the plugin's own scale and not the M3 tones `Shades` shows.
 *
 * The custom colors come from the story's `<Mtb>`, like anywhere else.
 */
export function TailwindScheme() {
  const swatchClassNames = { ...twClasses, ...twCustomClasses };

  return (
    <>
      <Scheme
        swatchClassNames={swatchClassNames}
        theme="light"
        title="Light scheme"
        fixedAccents
        surfaceTint
        background
        surfaceVariant
      />

      <Scheme
        swatchClassNames={swatchClassNames}
        theme="dark"
        title="Dark scheme"
        fixedAccents
        surfaceTint
        background
        surfaceVariant
      />

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

        {/* Set like a swatch label, which is how it has always come out:
            the stylesheet that used to style the labels caught every `<p>`
            under `Layout`, this one included. */}
        <SwatchLabel className="text-center leading-(--text-sm--line-height) italic">
          Every color the <code>@plugin</code> declares is shown here as a
          Tailwind utility class
        </SwatchLabel>
      </div>
    </>
  );
}

/**
 * The poster, docked in a corner of the canvas — the generated scheme, right
 * next to whatever the story paints with it.
 *
 * Reads nothing from `<Mtb>`: the swatches paint from `--md-sys-color-*`, and
 * the story's own provider declares those on `:root`/`.dark` for the whole
 * document. That is what lets a global decorator render this from *outside*
 * the provider, over any story.
 *
 * `theme` has to be told, and has to match the class on `<html>`: those two
 * blocks are the only place the light and dark values differ, so a light
 * poster inside a dark page would read the dark ones and lie.
 */
export function SchemeOverlay({
  theme,
  customColors,
}: {
  /** Which of the two scheme blocks to read — the page's own theme. */
  theme: "light" | "dark";
  /** Custom colors, as the story's `<Mtb>` got them. */
  customColors?: ComponentProps<typeof Mtb>["customColors"];
}) {
  return (
    <div className="fixed bottom-2 left-2 z-50 overflow-hidden rounded shadow-2xl ring-1 ring-neutral-500/50">
      {/* Scaled as a whole rather than re-sized cell by cell, so the poster
          stays the poster. `zoom` and not `transform`, which would leave the
          wrapper reserving all 40rem of it. */}
      <div className="w-160" style={{ zoom: 0.35 }}>
        <Scheme theme={theme} customColors={customColors} className={NO_LABELS}>
          <Shades customColors={customColors} noTitle />
        </Scheme>
      </div>
    </div>
  );
}

/**
 * `name value`, unless the value is blank or already what the CLI defaults to.
 *
 * An empty string counts as blank on purpose: that is what a cleared color
 * picker hands over, and `builder()` reads it as no override rather than as a
 * color.
 */
function cliFlag(name: string, value?: string | number, fallback?: unknown) {
  if (value === undefined || value === "" || value === fallback) return [];

  return [
    typeof value === "string" ? `${name} "${value}"` : `${name} ${value}`,
  ];
}

/**
 * The `shadcn-apply` invocation for a theme — the same theme, spelled as the
 * CLI takes it.
 *
 * Only what differs from the defaults is written out, so the command reads as
 * the *changes* made in the controls rather than as a dump of every option. Two
 * of the props have no flag at all: `customColors`, which a registry item
 * cannot carry, and `colorMatch`, which is not a CLI option.
 *
 * @see https://github.com/abernier/material-theme-builder#shadcn-apply
 */
function shadcnApplyCommand(config: MtbConfig) {
  return [
    `npx material-theme-builder@latest shadcn-apply "${config.source}"`,
    ...cliFlag("--scheme", config.scheme, DEFAULT_SCHEME),
    ...cliFlag("--contrast", config.contrast, DEFAULT_CONTRAST),
    ...cliFlag("--primary", config.primary),
    ...cliFlag("--secondary", config.secondary),
    ...cliFlag("--tertiary", config.tertiary),
    ...cliFlag("--error", config.error),
    ...cliFlag("--neutral", config.neutral),
    ...cliFlag("--neutral-variant", config.neutralVariant),
    ...cliFlag("--prefix", config.prefix, DEFAULT_PREFIX),
  ].join(" ");
}

/**
 * FAB that copies the CLI command for the theme currently in the controls.
 *
 * The point of the stories is to find a theme by moving the controls around;
 * this is what carries the one you settled on out of Storybook and into a
 * project, without transcribing eight hex values by hand.
 *
 */
function ShadcnApplyFab({ config }: { config: MtbConfig }) {
  const [copied, setCopied] = useState(false);
  const command = shadcnApplyCommand(config);

  return (
    <Fab
      color="tertiary-container"
      title={command}
      aria-label={`Copy: ${command}`}
      onClick={async () => {
        await navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {/* The shadcn mark, next to the Figma one on the FAB below: the pair
          reads as the two places a theme can go, which a shell prompt did
          not. The tick takes its place while the command sits on the
          clipboard -- the only feedback a copy button gets. */}
      {copied ? (
        <span aria-hidden className="font-mono text-2xl leading-none">
          ✓
        </span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 256 256"
          fill="none"
          stroke="currentColor"
          strokeWidth="32"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <line x1="208" y1="128" x2="128" y2="208" />
          <line x1="192" y1="40" x2="40" y2="192" />
        </svg>
      )}
    </Fab>
  );
}

/**
 * The story's floating actions, bottom-right: take this theme away as a CLI
 * command, or as Figma tokens.
 *
 * One fixed container holding both, rather than two FABs each placing itself:
 * placed separately, the second one lands on the first, and only on the stories
 * that happen to draw both.
 */
export function Fabs({ config }: { config: MtbConfig }) {
  return (
    <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-1">
      <ShadcnApplyFab config={config} />
      <ExportButton config={config} />
    </div>
  );
}
