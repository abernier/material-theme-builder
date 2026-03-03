import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo } from "react";
import { allModes } from "../.storybook/modes";
import { type McuConfig, schemeNames } from "./lib/builder";
import { recolorizeSvg } from "./lib/recolorizeSvg";
import { Mcu } from "./Mcu";
import { useMcu } from "./Mcu.context";
import { Layout, Scheme, Shades, TailwindScheme } from "./Mcu.stories.helpers";

import exampleSvg from "./assets/example.svg?raw";

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
