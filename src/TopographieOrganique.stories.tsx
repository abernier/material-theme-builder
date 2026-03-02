import { hexFromArgb } from "@material/material-color-utilities";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo } from "react";

import { schemeNames } from "./lib/builder";
import { Mcu } from "./Mcu";
import { useMcu } from "./Mcu.context";
import { TopographieOrganique, type Peak } from "./TopographieOrganique";

const meta = {
  component: Mcu,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    source: { control: "color" },
    scheme: { control: "select", options: schemeNames },
    contrast: { control: { type: "range", min: -1, max: 1, step: 0.1 } },
    primary: { control: "color" },
    secondary: { control: "color" },
    tertiary: { control: "color" },
    error: { control: "color" },
    neutral: { control: "color" },
    neutralVariant: { control: "color" },
    children: { table: { disable: true } },
  },
} satisfies Meta<typeof Mcu>;

export default meta;
type Story = StoryObj<typeof meta>;

const VIEWBOX_W = 1100;
const VIEWBOX_H = 750;

function McuTopographieOrganique() {
  const { getMcuColor, allPalettes } = useMcu();

  const baseColors = useMemo<Record<number, string>>(
    () => ({
      100: getMcuColor("surfaceContainerLowest", "light"),
      200: getMcuColor("surfaceContainerLow", "light"),
      300: getMcuColor("surfaceContainer", "light"),
      400: getMcuColor("surfaceContainerHigh", "light"),
    }),
    [getMcuColor],
  );

  const labelStrokeColor = useMemo(
    () => getMcuColor("surface", "light"),
    [getMcuColor],
  );

  const peaks = useMemo<Peak[]>(() => {
    const peakKeys = Object.keys(allPalettes).filter(
      (k) => k !== "neutral" && k !== "neutral-variant",
    );

    const n = peakKeys.length;
    const cols = Math.ceil(Math.sqrt(n * (VIEWBOX_W / VIEWBOX_H)));
    const rows = Math.ceil(n / cols);
    const cellW = VIEWBOX_W / (cols + 1);
    const cellH = VIEWBOX_H / (rows + 1);

    return peakKeys.flatMap((key, i) => {
      const palette = allPalettes[key];
      if (!palette) return [];

      const col = i % cols;
      const row = Math.floor(i / cols);

      return {
        id: key,
        baseX: cellW * (col + 1),
        baseY: cellH * (row + 1),
        h: 920 + i * 120,
        r: 650 + i * 20,
        seed: (i + 1) * 10,
        colorRange: [
          hexFromArgb(palette.tone(90)),
          hexFromArgb(palette.tone(40)),
        ] as [string, string],
        labelColor: hexFromArgb(palette.tone(30)),
      };
    });
  }, [allPalettes]);

  return (
    <TopographieOrganique
      peaks={peaks}
      baseColors={baseColors}
      labelStrokeColor={labelStrokeColor}
    />
  );
}

/** Default fullscreen story driven by MCU theme colors. */
export const Default: Story = {
  args: {
    source: "#769CDF",
  },
  render: (args) => (
    <Mcu {...args}>
      <div style={{ width: "100vw", height: "100vh" }}>
        <McuTopographieOrganique />
      </div>
    </Mcu>
  ),
};
