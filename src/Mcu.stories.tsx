import { hexFromArgb } from "@material/material-color-utilities";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { kebabCase } from "lodash-es";
import { useMemo } from "react";
import { allModes } from "../.storybook/modes";
import { Flowfield, type Peak } from "./Flowfield";
import { type McuConfig, schemeNames } from "./lib/builder";
import { recolorizeSvg } from "./lib/recolorizeSvg";
import { Mcu } from "./Mcu";
import { useMcu } from "./Mcu.context";
import { Layout, Scheme, Shades, TailwindScheme } from "./Mcu.stories.helpers";

import { X } from "lucide-react";
import { type ComponentProps, useRef } from "react";
import { useDebounceCallback } from "usehooks-ts";
import exampleSvg from "./assets/example.svg?raw";
import { Button } from "./components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./components/ui/tooltip";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  component: Mcu,
  parameters: {
    // layout: "centered",
    chromatic: {
      // modes: {
      //   light: allModes["light"],
      //   dark: allModes["dark"],
      // },
    },
  },
  globals: {
    // backgrounds: { grid: true },
  },
  // args: {
  //   source: "#769CDF",
  //   scheme: DEFAULT_SCHEME,
  //   contrast: DEFAULT_CONTRAST,
  //   colorMatch: DEFAULT_COLOR_MATCH,
  //   primary: "#63A002",
  //   secondary: "#85976E",
  //   tertiary: "#4D9D98",
  //   error: "#FF5449",
  //   neutral: "#91918B",
  //   neutralVariant: "#8F9285",
  //   customColors: [
  //     { name: "myCustomColor1", hex: "#6C8A0C", blend: true },
  //     { name: "myCustomColor2", hex: "#E126C6", blend: true },
  //     { name: "myCustomColor3", hex: "#E126C6", blend: false },
  //   ],
  // },
  argTypes: {
    source: {
      control: "color",
    },
    scheme: {
      control: "select",
      options: schemeNames,
    },
    contrast: {
      control: { type: "range", min: -1, max: 1, step: 0.1 },
    },
    primary: {
      control: "color",
    },
    secondary: {
      control: "color",
    },
    tertiary: {
      control: "color",
    },
    error: {
      control: "color",
    },
    neutral: {
      control: "color",
    },
    neutralVariant: {
      control: "color",
    },
    children: {
      table: { disable: true }, // hide
    },
  },
} satisfies Meta<typeof Mcu>;

export default meta;
type Story = StoryObj<typeof meta>;

const customColor1 = "#00D68A";
const customColor2 = "#FFE16B";

//
// ███████ ██       ██████  ██     ██ ███████ ██ ███████ ██      ██████
// ██      ██      ██    ██ ██     ██ ██      ██ ██      ██      ██   ██
// █████   ██      ██    ██ ██  █  ██ █████   ██ █████   ██      ██   ██
// ██      ██      ██    ██ ██ ███ ██ ██      ██ ██      ██      ██   ██
// ██      ███████  ██████   ███ ███  ██      ██ ███████ ███████ ██████
//

/**
 * Color pill
 */
function ColorButton({
  color,
  onChange,
  ...rest
}: {
  /** Current color (hex string). */
  color?: string;
  /** Called with the newly picked hex color. */
  onChange: (hex: string) => void;
} & Omit<React.ComponentProps<typeof Button>, "color" | "onChange">) {
  const inputColorRef = useRef<HTMLInputElement>(null);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => {
        inputColorRef.current?.click();
      }}
      {...rest}
    >
      <span
        className="size-6 rounded-full border overflow-hidden shrink-0"
        style={{
          backgroundColor: color ?? "transparent",
          // backgroundImage: color
          //   ? undefined
          //   : `url('data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill-opacity=".5"><rect x="200" width="200" height="200" /><rect y="200" width="200" height="200" /></svg>')}')`, // https://codepen.io/pascalvgaal/pen/jPXPNP
          // backgroundSize: "6px",
        }}
      >
        <input
          tabIndex={-1}
          ref={inputColorRef}
          type="color"
          value={color ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="opacity-0"
        />
      </span>
    </Button>
  );
}

export function FlowfieldScene({ ...props }: ComponentProps<typeof Flowfield>) {
  const {
    allPalettes,
    mcuConfig,
    setMcuConfig: _setMcuConfig,
    initials,
  } = useMcu();

  const setMcuConfig = useDebounceCallback(_setMcuConfig, 50);

  const pendingAddIndexRef = useRef<number | null>(null);

  const baseColors = useMemo<Record<number, string>>(
    () => ({
      100: "var(--md-sys-color-surface-container-lowest)",
      200: "var(--md-sys-color-surface-container-low)",
      300: "var(--md-sys-color-surface-container)",
      400: "var(--md-sys-color-surface-container-high)",
      500: "var(--md-sys-color-surface-container-highest)",
    }),
    [],
  );

  const peaks = useMemo<Peak[]>(() => {
    const peakKeys = Object.keys(allPalettes).filter(
      (k) => k !== "neutral" && k !== "neutral-variant",
    );

    return peakKeys.flatMap((key) => {
      const palette = allPalettes[key];
      if (!palette) return [];

      const kebab = kebabCase(key);
      const colors: Record<number, string> = {
        600: `var(--md-sys-color-on-${kebab})`,
        700: `var(--md-sys-color-${kebab}-container)`,
        800: `var(--md-sys-color-${kebab})`,
        900: `var(--md-sys-color-on-${kebab}-container)`,
      };

      return {
        id: key,
        colors,
      };
    });
  }, [allPalettes]);

  return (
    <>
      <Flowfield peaks={peaks} baseColors={baseColors} {...props} />
      <div className="fixed bottom-0 left-0 m-6 flex flex-col-reverse">
        {(
          [
            {
              key: "primary",
              label: "Primary",
              color: mcuConfig.primary ?? initials.source,
            },
            {
              key: "secondary",
              label: "Secondary",
              color: mcuConfig.secondary,
            },
            { key: "tertiary", label: "Tertiary", color: mcuConfig.tertiary },
            { key: "error", label: "Error", color: mcuConfig.error },
            { key: "neutral", label: "Neutral", color: mcuConfig.neutral },
            {
              key: "neutralVariant",
              label: "Neutral variant",
              color: mcuConfig.neutralVariant,
            },
          ] as const
        ).map(({ key, label, color }) => {
          const paletteKey = kebabCase(key);
          const isInferred = mcuConfig[key] === undefined;
          const inferredHex = isInferred
            ? hexFromArgb(allPalettes[paletteKey]?.keyColor.toInt() ?? 0)
            : undefined;

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <ColorButton
                  color={color}
                  onChange={(hex) => {
                    setMcuConfig({
                      ...mcuConfig,
                      [key]: hex,
                    });
                  }}
                />
              </TooltipTrigger>
              <TooltipContent side="right">
                <span className="flex items-center gap-1">
                  {!isInferred && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        setMcuConfig({ ...mcuConfig, [key]: undefined })
                      }
                      className="-ml-1"
                    >
                      <X />
                    </Button>
                  )}
                  {label}
                  {inferredHex && (
                    <span
                      className="inline-block size-3 rounded-full ring-1 ring-white/20 shrink-0"
                      style={{ backgroundColor: inferredHex }}
                    />
                  )}
                </span>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Custom color */}

        <hr className="my-1 border-t border-outline-variant" />

        {(mcuConfig.customColors ?? []).map(({ name, hex }, i) => (
          <Tooltip key={name}>
            <TooltipTrigger asChild>
              <ColorButton
                color={hex}
                onChange={(newHex) => {
                  const updated = (mcuConfig.customColors ?? []).map((c, j) =>
                    j === i ? { ...c, hex: newHex } : c,
                  );
                  setMcuConfig({
                    ...mcuConfig,
                    customColors: updated,
                  });
                }}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              <span className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    const updated = (mcuConfig.customColors ?? []).filter(
                      (_, j) => j !== i,
                    );
                    setMcuConfig({ ...mcuConfig, customColors: updated });
                  }}
                  className="-ml-1"
                >
                  <X />
                </Button>
                {name}
              </span>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Add new custom color */}

        <Tooltip>
          <TooltipTrigger asChild>
            <ColorButton
              onClick={() => {
                pendingAddIndexRef.current = null;
              }}
              onChange={(hex) => {
                const existing = mcuConfig.customColors ?? [];
                const idx = pendingAddIndexRef.current;

                if (idx !== null && idx < existing.length) {
                  // update the color being picked
                  const updated = existing.map((c, j) =>
                    j === idx ? { ...c, hex } : c,
                  );
                  setMcuConfig({ ...mcuConfig, customColors: updated });
                } else {
                  // first change of this pick session — add a new color
                  pendingAddIndexRef.current = existing.length;
                  setMcuConfig({
                    ...mcuConfig,
                    customColors: [
                      ...existing,
                      {
                        name: `customColor${existing.length + 1}`,
                        hex,
                        blend: true,
                      },
                    ],
                  });
                }
              }}
            />
          </TooltipTrigger>
          <TooltipContent side="right">Add custom color</TooltipContent>
        </Tooltip>
      </div>
    </>
  );
}

export const FlowfieldSt: StoryObj<
  Meta<typeof Mcu & ((props: ComponentProps<typeof FlowfieldScene>) => void)>
> = {
  name: "Flowfield",
  parameters: {
    layout: "fullscreen",
  },
  args: {
    // MCU args
    source: "#769CDF",
    customColors: [
      { name: "myCustomColor1", hex: customColor1, blend: true },
      { name: "myCustomColor2", hex: customColor2, blend: true },
    ],
    // Flowfield args
    gridScale: 15,
    defaultWeight: 0.65,
    smoothing: 2,
    driftAmplitude: 1100,
    noiseFrequency: 0.002,
    timeSpeed: 0.002,
  },
  argTypes: {
    gridScale: { control: { type: "range", min: 2, max: 50, step: 1 } },
    defaultWeight: {
      control: { type: "range", min: 0, max: 2, step: 0.05 },
    },
    noiseFrequency: { control: { type: "number", step: 0.0001 } },
    timeSpeed: { control: { type: "number", step: 0.0001 } },
    driftAmplitude: {
      control: { type: "range", min: 0, max: 2000, step: 10 },
    },
    smoothing: { control: { type: "range", min: 0, max: 10, step: 1 } },
  },
  render: (args) => {
    const {
      gridScale,
      defaultWeight,
      noiseFrequency,
      timeSpeed,
      driftAmplitude,
      smoothing,
      ...mcuArgs
    } = args as Record<string, unknown>;

    return (
      <FlowfieldStory
        mcuArgs={mcuArgs as ComponentProps<typeof Mcu>}
        gridScale={gridScale as number}
        defaultWeight={defaultWeight as number}
        noiseFrequency={noiseFrequency as number}
        timeSpeed={timeSpeed as number}
        driftAmplitude={driftAmplitude as number}
        smoothing={smoothing as number}
      />
    );
  },
};

/**
 * Wrapper component for the Flowfield story so we can use hooks (useState).
 */
function FlowfieldStory({
  mcuArgs,
  ...flowfieldProps
}: {
  mcuArgs: ComponentProps<typeof Mcu>;
} & ComponentProps<typeof FlowfieldScene>) {
  return (
    <Mcu {...mcuArgs}>
      <div className="h-dvh">
        <FlowfieldScene {...flowfieldProps} />
      </div>
    </Mcu>
  );
}

export const St2: Story = {
  name: "Minimal",
  parameters: {
    // layout: "centered",
  },
  args: {
    source: "#769CDF",
    contrast: 0,
  },
  render: (args) => (
    <Mcu {...args}>
      <Layout notext>
        <Scheme customColors={args.customColors}>
          <Shades customColors={args.customColors} noTitle />
        </Scheme>
      </Layout>
    </Mcu>
  ),
};

export const St1: Story = {
  name: "Default",
  args: {
    source: "#769CDF",
  },
  render: (args) => (
    <Mcu {...args}>
      <Layout>
        <Scheme
          theme="light"
          title="Light scheme"
          customColors={args.customColors}
        />

        <Scheme
          theme="dark"
          title="Dark scheme"
          customColors={args.customColors}
        />
        <Shades customColors={args.customColors} />
      </Layout>
    </Mcu>
  ),
};

//
// ███████  ██████ ██   ██ ███████ ███    ███ ███████
// ██      ██      ██   ██ ██      ████  ████ ██
// ███████ ██      ███████ █████   ██ ████ ██ █████
//      ██ ██      ██   ██ ██      ██  ██  ██ ██
// ███████  ██████ ██   ██ ███████ ██      ██ ███████
//

export const MonochromeSt: Story = {
  name: "[scheme=monochrome]",
  args: {
    source: "#769CDF",
    scheme: "monochrome",
  },
  render: (args) => (
    <Mcu {...args}>
      <Layout>
        <Scheme
          theme="light"
          title="Light scheme"
          customColors={args.customColors}
        />

        <Scheme
          theme="dark"
          title="Dark scheme"
          customColors={args.customColors}
        />
        <Shades customColors={args.customColors} />
      </Layout>
    </Mcu>
  ),
};

export const NeutralSt: Story = {
  name: "[scheme=neutral]",
  args: {
    source: "#769CDF",
    scheme: "neutral",
  },
  render: (args) => (
    <Mcu {...args}>
      <Layout>
        <Scheme
          theme="light"
          title="Light scheme"
          customColors={args.customColors}
        />

        <Scheme
          theme="dark"
          title="Dark scheme"
          customColors={args.customColors}
        />
        <Shades customColors={args.customColors} />
      </Layout>
    </Mcu>
  ),
};

export const VibrantSt: Story = {
  name: "[scheme=vibrant]",
  args: {
    source: "#769CDF",
    scheme: "vibrant",
  },
  render: (args) => (
    <Mcu {...args}>
      <Layout>
        <Scheme
          theme="light"
          title="Light scheme"
          customColors={args.customColors}
        />

        <Scheme
          theme="dark"
          title="Dark scheme"
          customColors={args.customColors}
        />
        <Shades customColors={args.customColors} />
      </Layout>
    </Mcu>
  ),
};

export const ExpressiveSt: Story = {
  name: "[scheme=expressive]",
  args: {
    source: "#769CDF",
    scheme: "expressive",
  },
  render: (args) => (
    <Mcu {...args}>
      <Layout>
        <Scheme
          theme="light"
          title="Light scheme"
          customColors={args.customColors}
        />

        <Scheme
          theme="dark"
          title="Dark scheme"
          customColors={args.customColors}
        />
        <Shades customColors={args.customColors} />
      </Layout>
    </Mcu>
  ),
};

export const FidelitySt: Story = {
  name: "[scheme=fidelity]",
  args: {
    source: "#769CDF",
    scheme: "fidelity",
  },
  render: (args) => (
    <Mcu {...args}>
      <Layout>
        <Scheme
          theme="light"
          title="Light scheme"
          customColors={args.customColors}
        />

        <Scheme
          theme="dark"
          title="Dark scheme"
          customColors={args.customColors}
        />
        <Shades customColors={args.customColors} />
      </Layout>
    </Mcu>
  ),
};

export const ContentSt: Story = {
  name: "[scheme=content]",
  args: {
    source: "#769CDF",
    scheme: "content",
  },
  render: (args) => (
    <Mcu {...args}>
      <Layout>
        <Scheme
          theme="light"
          title="Light scheme"
          customColors={args.customColors}
        />

        <Scheme
          theme="dark"
          title="Dark scheme"
          customColors={args.customColors}
        />
        <Shades customColors={args.customColors} />
      </Layout>
    </Mcu>
  ),
};

//
//  ██████  ██████  ███    ██ ████████ ██████   █████  ███████ ████████
// ██      ██    ██ ████   ██    ██    ██   ██ ██   ██ ██         ██
// ██      ██    ██ ██ ██  ██    ██    ██████  ███████ ███████    ██
// ██      ██    ██ ██  ██ ██    ██    ██   ██ ██   ██      ██    ██
//  ██████  ██████  ██   ████    ██    ██   ██ ██   ██ ███████    ██
//

export const ContrastLowSt: Story = {
  name: "[contrast] low",
  args: {
    source: "#769CDF",
    contrast: -1,
  },
  render: (args) => (
    <Mcu {...args}>
      <Layout>
        <Scheme
          theme="light"
          title="Light scheme"
          customColors={args.customColors}
        />

        <Scheme
          theme="dark"
          title="Dark scheme"
          customColors={args.customColors}
        />
        <Shades customColors={args.customColors} />
      </Layout>
    </Mcu>
  ),
};

export const ContrastMediumSt: Story = {
  name: "[contrast] medium",
  args: {
    source: "#769CDF",
    contrast: 0,
  },
  render: (args) => (
    <Mcu {...args}>
      <Layout>
        <Scheme
          theme="light"
          title="Light scheme"
          customColors={args.customColors}
        />

        <Scheme
          theme="dark"
          title="Dark scheme"
          customColors={args.customColors}
        />
        <Shades customColors={args.customColors} />
      </Layout>
    </Mcu>
  ),
};

export const ContrastHighSt: Story = {
  name: "[contrast] high",
  args: {
    source: "#769CDF",
    contrast: 1,
  },
  render: (args) => (
    <Mcu {...args}>
      <Layout>
        <Scheme
          theme="light"
          title="Light scheme"
          customColors={args.customColors}
        />

        <Scheme
          theme="dark"
          title="Dark scheme"
          customColors={args.customColors}
        />
        <Shades customColors={args.customColors} />
      </Layout>
    </Mcu>
  ),
};

//
//  ██████  ██████  ██████  ███████
// ██      ██    ██ ██   ██ ██
// ██      ██    ██ ██████  █████
// ██      ██    ██ ██   ██ ██
//  ██████  ██████  ██   ██ ███████
//

export const PrimarySt: Story = {
  name: "[primary]",
  args: {
    source: "#769CDF", // keep source because required (but primary will be considered effective one)
    primary: "#cab337",
  },
  render: (args) => (
    <Mcu {...args}>
      <Layout>
        <Scheme
          theme="light"
          title="Light scheme"
          customColors={args.customColors}
        />

        <Scheme
          theme="dark"
          title="Dark scheme"
          customColors={args.customColors}
        />
        <Shades customColors={args.customColors} />
      </Layout>
    </Mcu>
  ),
};

//

export const PrimarySecondarySt: Story = {
  name: "[primary][secondary]",
  args: {
    source: "#769CDF", // keep source because required (but primary will be considered effective one)
    primary: "#cab337",
    secondary: "#b03a3a",
  },
  render: (args) => (
    <Mcu {...args}>
      <Layout>
        <Scheme
          theme="light"
          title="Light scheme"
          customColors={args.customColors}
        />

        <Scheme
          theme="dark"
          title="Dark scheme"
          customColors={args.customColors}
        />
        <Shades customColors={args.customColors} />
      </Layout>
    </Mcu>
  ),
};

//

export const PrimarySecondaryTertiarySt: Story = {
  name: "[primary][secondary][tertiary]",
  args: {
    source: "#769CDF", // keep source because required (but primary will be considered effective one)
    primary: "#cab337",
    secondary: "#b03a3a",
    tertiary: "#2138d2",
  },
  render: (args) => (
    <Mcu {...args}>
      <Layout>
        <Scheme
          theme="light"
          title="Light scheme"
          customColors={args.customColors}
        />

        <Scheme
          theme="dark"
          title="Dark scheme"
          customColors={args.customColors}
        />
        <Shades customColors={args.customColors} />
      </Layout>
    </Mcu>
  ),
};

//

export const PrimarySecondaryTertiaryErrorSt: Story = {
  name: "[primary][secondary][tertiary][error]",
  args: {
    source: "#769CDF", // keep source because required (but primary will be considered effective one)
    primary: "#cab337",
    secondary: "#b03a3a",
    tertiary: "#2138d2",
    error: "#479200",
  },
  render: (args) => (
    <Mcu {...args}>
      <Layout>
        <Scheme
          theme="light"
          title="Light scheme"
          customColors={args.customColors}
        />

        <Scheme
          theme="dark"
          title="Dark scheme"
          customColors={args.customColors}
        />
        <Shades customColors={args.customColors} />
      </Layout>
    </Mcu>
  ),
};

//

export const PrimarySecondaryTertiaryErrorNeutralSt: Story = {
  name: "[primary][secondary][tertiary][error][neutral]",
  args: {
    source: "#769CDF", // keep source because required (but primary will be considered effective one)
    primary: "#cab337",
    secondary: "#b03a3a",
    tertiary: "#2138d2",
    error: "#479200",
    neutral: "#957FF1",
  },
  render: (args) => (
    <Mcu {...args}>
      <Layout>
        <Scheme
          theme="light"
          title="Light scheme"
          customColors={args.customColors}
        />

        <Scheme
          theme="dark"
          title="Dark scheme"
          customColors={args.customColors}
        />
        <Shades customColors={args.customColors} />
      </Layout>
    </Mcu>
  ),
};

//

export const PrimarySecondaryTertiaryErrorNeutralNeutralVariantSt: Story = {
  name: "[primary][secondary][tertiary][error][neutral][neutralVariant]",
  args: {
    source: "#769CDF", // keep source because required (but primary will be considered effective one)
    primary: "#cab337",
    secondary: "#b03a3a",
    tertiary: "#2138d2",
    error: "#479200",
    neutral: "#957FF1",
    neutralVariant: "#007EDF",
  },
  render: (args) => (
    <Mcu {...args}>
      <Layout>
        <Scheme
          theme="light"
          title="Light scheme"
          customColors={args.customColors}
        />

        <Scheme
          theme="dark"
          title="Dark scheme"
          customColors={args.customColors}
        />
        <Shades customColors={args.customColors} />
      </Layout>
    </Mcu>
  ),
};

//

// export const PrimarySecondaryTertiaryErrorNeutralNeutralVariantColorMatchSt: Story =
//   {
//     name: "[primary][secondary][tertiary][error][neutral][neutralVariant][colorMatch]",
//     args: {
//       source: "#769CDF", // keep source because required (but primary will be considered effective one)
//       primary: "#cab337",
//       secondary: "#b03a3a",
//       tertiary: "#2138d2",
//       error: "#479200",
//       neutral: "#957FF1",
//       neutralVariant: "#007EDF",
//       colorMatch: true,
//     },
//     render: (args) => (
//       <Mcu {...args}>
//         <Bar customColors={args.customColors} />
//       </Mcu>
//     ),
//   };

//
//  ██████ ██    ██ ███████ ████████  ██████  ███    ███
// ██      ██    ██ ██         ██    ██    ██ ████  ████
// ██      ██    ██ ███████    ██    ██    ██ ██ ████ ██
// ██      ██    ██      ██    ██    ██    ██ ██  ██  ██
//  ██████  ██████  ███████    ██     ██████  ██      ██
//

export const CustomColorsSt: Story = {
  name: "Custom colors",
  args: {
    source: "#769CDF",
    customColors: [
      { name: "myCustomColor1", hex: customColor1, blend: true },
      { name: "myCustomColor2", hex: customColor2, blend: true },
    ],
  },
  render: St1.render,
};

export const CustomColorsHarmonizedSt: Story = {
  name: "Custom colors (no harmonization)",
  args: {
    source: "#769CDF",
    customColors: [
      { name: "myCustomColor1", hex: customColor1, blend: false },
      { name: "myCustomColor2", hex: customColor2, blend: false },
    ],
  },
  render: St1.render,
};

//
// ████████  █████  ██ ██      ██     ██ ██ ███    ██ ██████
//    ██    ██   ██ ██ ██      ██     ██ ██ ████   ██ ██   ██
//    ██    ███████ ██ ██      ██  █  ██ ██ ██ ██  ██ ██   ██
//    ██    ██   ██ ██ ██      ██ ███ ██ ██ ██  ██ ██ ██   ██
//    ██    ██   ██ ██ ███████  ███ ███  ██ ██   ████ ██████
//

export const TailwindSt: Story = {
  name: "Tailwind",
  args: CustomColorsSt.args,
  render: (args) => (
    <Mcu {...args}>
      <TailwindScheme />
    </Mcu>
  ),
};

//
// ██████  ███████  ██████  ██████  ██       ██████  ██████
// ██   ██ ██      ██      ██    ██ ██      ██    ██ ██   ██
// ██████  █████   ██      ██    ██ ██      ██    ██ ██████
// ██   ██ ██      ██      ██    ██ ██      ██    ██ ██   ██
// ██   ██ ███████  ██████  ██████  ███████  ██████  ██   ██
//

const RecolorizedIllustration = ({
  svgContent,
  palettes,
}: {
  svgContent: string;
  palettes: ReturnType<typeof useMcu>["allPalettes"];
}) => {
  const recoloredSvg = useMemo(() => {
    return recolorizeSvg(svgContent, palettes);
  }, [svgContent, palettes]);

  return <div dangerouslySetInnerHTML={{ __html: recoloredSvg }} />;
};

function Scene({
  svgContent = exampleSvg,
  customColors,
  includedPalettesNames = [], // if empty, use all palettes
  excludedPalettesNames = [], // palettes to exclude
}: {
  svgContent?: string;
  customColors?: McuConfig["customColors"];
  includedPalettesNames?: string[];
  excludedPalettesNames?: string[];
}) {
  const { allPalettes } = useMcu();

  let palettes = allPalettes;

  // Only include specified palettes / otherwise use all
  if (includedPalettesNames.length > 0) {
    palettes = Object.fromEntries(
      Object.entries(allPalettes).filter(([name]) =>
        includedPalettesNames.includes(name),
      ),
    );
  }
  // Exclude specified palettes
  if (excludedPalettesNames.length > 0) {
    palettes = Object.fromEntries(
      Object.entries(palettes).filter(
        ([name]) => !excludedPalettesNames.includes(name),
      ),
    );
  }

  return (
    <Layout notext>
      <div className="space-y-4 grid grid-cols-2 gap-2">
        <div>
          <h3 className="text-lg font-bold mb-2">Original SVG</h3>
          <div dangerouslySetInnerHTML={{ __html: svgContent }} />
        </div>

        <div>
          <h3 className="text-lg font-bold mb-2">Recolorized SVG</h3>
          <RecolorizedIllustration
            svgContent={svgContent}
            palettes={palettes}
          />
        </div>
      </div>

      <Scheme customColors={customColors}>
        <Shades customColors={customColors} noTitle />
      </Scheme>
    </Layout>
  );
}

export const RecolorizeSvgSt1: Story = {
  name: "Recolorized SVG",
  parameters: {
    chromatic: {
      modes: {
        light: allModes["light"],
        dark: allModes["dark"],
      },
    },
  },
  args: {
    source: "#769CDF",
  },
  render: (args) => (
    <Mcu {...args}>
      <Scene
        customColors={args.customColors}
        // includedPalettesNames={[
        //   "primary",
        //   "secondary",
        //   "tertiary"
        // ]}
        excludedPalettesNames={["error"]}
      />
    </Mcu>
  ),
};

export const RecolorizeSvgSt2: Story = {
  name: "Recolorized SVG with custom-colors",
  parameters: {
    chromatic: {
      modes: {
        light: allModes["light"],
        dark: allModes["dark"],
      },
    },
  },
  args: {
    source: "#769CDF",
    customColors: [
      { name: "myCustomColor1", hex: customColor1, blend: true },
      { name: "myCustomColor2", hex: customColor2, blend: true },
    ],
  },
  render: (args) => (
    <Mcu {...args}>
      <Scene
        customColors={args.customColors}
        // includedPalettesNames={[
        //   "primary",
        //   "secondary",
        //   "tertiary"
        // ]}
        excludedPalettesNames={["error"]}
      />
    </Mcu>
  ),
};
