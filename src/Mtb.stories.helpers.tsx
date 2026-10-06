import type { Meta } from "@storybook/react-vite";
import { useState, type ComponentProps } from "react";
import { Fab } from "./components/m3/Fab";
import { ExportButton } from "./ExportButton";
import {
  DEFAULT_CONTRAST,
  DEFAULT_PREFIX,
  DEFAULT_SCHEME,
  schemeNames,
  type MtbConfig,
} from "./lib/builder";
import type { Mtb } from "./Mtb";
import { Poster, Scheme, Shades } from "./Scheme";

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
  // Disabled while `colorMatch` is on, which takes precedence over it: see
  // `SchemeControlLock` in .storybook/manager.ts
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
  colorMatch: { control: "boolean" },
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
 * Storybook layout wrapper with optional source-color label and export button.
 */
export function Layout({
  notext,
  children,
}: {
  /** Hide the source-color text label. */
  notext?: boolean;
  /** Story content to render inside the layout. */
  children: React.ReactNode;
}) {
  return (
    <Poster notext={notext} className="flex flex-col gap-6 max-w-208 mx-auto">
      {children}
    </Poster>
  );
}

/**
 * Renders every M3 role as a Tailwind utility class: `Scheme` and `Shades`,
 * switched to their `tw` mode, where each swatch takes its color from `bg-*`
 * instead of `var(--md-sys-color-*)`.
 *
 * The utilities they name at runtime -- shades, custom colors -- are listed for
 * Tailwind by an `@source inline()` in `globals.css`.
 */
export function TailwindScheme({
  customColors,
}: Pick<ComponentProps<typeof Scheme>, "customColors">) {
  return (
    <>
      <Scheme
        tw
        theme="light"
        title="Light scheme"
        customColors={customColors}
        fixedAccents
        surfaceTint
        background
        surfaceVariant
      />
      <Scheme
        tw
        theme="dark"
        title="Dark scheme"
        customColors={customColors}
        fixedAccents
        surfaceTint
        background
        surfaceVariant
      />
      <Shades tw customColors={customColors} />

      <p className="text-sm italic text-center">
        Every color the <code>@plugin</code> declares is shown here as a
        Tailwind utility class
      </p>
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
      <Poster notext className="w-160" style={{ zoom: 0.35 }}>
        <Scheme theme={theme} customColors={customColors}>
          <Shades customColors={customColors} noTitle />
        </Scheme>
      </Poster>
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
 * the *changes* made in the controls rather than as a dump of every option. One
 * of the props has no flag at all: `customColors`, which a registry item cannot
 * carry.
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
    // A boolean flag: written bare, and only when it is on
    ...(config.colorMatch ? ["--color-match"] : []),
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
