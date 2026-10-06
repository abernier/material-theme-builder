import type { Meta } from "@storybook/react-vite";
import { kebabCase } from "lodash-es";
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
import { SHADE_TO_TONE } from "./lib/tokens";
import type { Mtb } from "./Mtb";
import { Poster, Scheme, Shades } from "./Scheme";
import { roleInk, toneInk } from "./Scheme.ink";

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
 * The custom-color roles, as Tailwind utilities.
 *
 * `Scheme` renders custom colors through inline `var(--md-sys-color-*)` styles,
 * because their names only exist at runtime — `bg-${name}` would never be seen
 * by Tailwind's source scanner, so the utility would never be generated. Here
 * the names are known, so the classes can be written literally and actually
 * prove that `bg-myCustomColor1` & co. resolve.
 */
const twCustomColors = [1, 2].map((n): [string, string][] => [
  [`my-custom-color-${n}`, `MyCustomColor${n}`],
  [`on-my-custom-color-${n}`, `On MyCustomColor${n}`],
  [`my-custom-color-${n}-container`, `MyCustomColor${n} Container`],
  [`on-my-custom-color-${n}-container`, `On MyCustomColor${n} Container`],
]);
const twCustomColorClasses: Record<string, string> = {
  "my-custom-color-1": "bg-myCustomColor1",
  "on-my-custom-color-1": "bg-on-myCustomColor1",
  "my-custom-color-1-container": "bg-myCustomColor1-container",
  "on-my-custom-color-1-container": "bg-on-myCustomColor1-container",
  "my-custom-color-2": "bg-myCustomColor2",
  "on-my-custom-color-2": "bg-on-myCustomColor2",
  "my-custom-color-2-container": "bg-myCustomColor2-container",
  "on-my-custom-color-2-container": "bg-on-myCustomColor2-container",
};

function TailwindCustomColors() {
  return (
    <div className="flex flex-col gap-(--gap2)">
      {twCustomColors.map((roles, i) => (
        <div key={i} className="grid grid-cols-4">
          {roles.map(([role, label]) => (
            <div
              key={role}
              className={`h-(--cell) ${twCustomColorClasses[role]}`}
              title={role}
            >
              <p style={{ color: roleInk(role) }}>{label}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * The tonal shades, as Tailwind utilities -- spelled out, for the same
 * scanner, in `SHADE_TO_TONE`'s order.
 */
const twShades = {
  Primary:
    "bg-primary-50 bg-primary-100 bg-primary-200 bg-primary-300 bg-primary-400 bg-primary-500 bg-primary-600 bg-primary-700 bg-primary-800 bg-primary-900 bg-primary-950",
  Secondary:
    "bg-secondary-50 bg-secondary-100 bg-secondary-200 bg-secondary-300 bg-secondary-400 bg-secondary-500 bg-secondary-600 bg-secondary-700 bg-secondary-800 bg-secondary-900 bg-secondary-950",
  Tertiary:
    "bg-tertiary-50 bg-tertiary-100 bg-tertiary-200 bg-tertiary-300 bg-tertiary-400 bg-tertiary-500 bg-tertiary-600 bg-tertiary-700 bg-tertiary-800 bg-tertiary-900 bg-tertiary-950",
  Error:
    "bg-error-50 bg-error-100 bg-error-200 bg-error-300 bg-error-400 bg-error-500 bg-error-600 bg-error-700 bg-error-800 bg-error-900 bg-error-950",
  Neutral:
    "bg-neutral-50 bg-neutral-100 bg-neutral-200 bg-neutral-300 bg-neutral-400 bg-neutral-500 bg-neutral-600 bg-neutral-700 bg-neutral-800 bg-neutral-900 bg-neutral-950",
  "Neutral Variant":
    "bg-neutral-variant-50 bg-neutral-variant-100 bg-neutral-variant-200 bg-neutral-variant-300 bg-neutral-variant-400 bg-neutral-variant-500 bg-neutral-variant-600 bg-neutral-variant-700 bg-neutral-variant-800 bg-neutral-variant-900 bg-neutral-variant-950",
  myCustomColor1:
    "bg-myCustomColor1-50 bg-myCustomColor1-100 bg-myCustomColor1-200 bg-myCustomColor1-300 bg-myCustomColor1-400 bg-myCustomColor1-500 bg-myCustomColor1-600 bg-myCustomColor1-700 bg-myCustomColor1-800 bg-myCustomColor1-900 bg-myCustomColor1-950",
  myCustomColor2:
    "bg-myCustomColor2-50 bg-myCustomColor2-100 bg-myCustomColor2-200 bg-myCustomColor2-300 bg-myCustomColor2-400 bg-myCustomColor2-500 bg-myCustomColor2-600 bg-myCustomColor2-700 bg-myCustomColor2-800 bg-myCustomColor2-900 bg-myCustomColor2-950",
};

function TailwindShades() {
  return (
    <div className="space-y-4">
      {Object.entries(twShades).map(([title, classes]) => (
        <div key={title} className="space-y-2">
          <h4 className="text-sm font-semibold">{title}</h4>
          <div className="grid grid-cols-11 rounded-md overflow-hidden">
            {SHADE_TO_TONE.map(([shade, tone], i) => (
              <div
                key={shade}
                className={`${classes.split(" ")[i]} aspect-square flex items-center justify-center text-center text-xs`}
                style={{ color: toneInk(kebabCase(title), tone) }}
              >
                {shade}
              </div>
            ))}
          </div>
        </div>
      ))}
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
        <TailwindShades />

        <p className="text-sm italic text-center">
          Every color the <code>@plugin</code> declares is shown here as a
          Tailwind utility class
        </p>
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
