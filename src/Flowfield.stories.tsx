import type { Meta, StoryObj } from "@storybook/react-vite";
import { Flowfield } from "./Flowfield";
import { FlowfieldScene } from "./Flowfield.stories.helpers";
import { Mcu } from "./Mcu";

const customColor1 = "#00D68A";
const customColor2 = "#FFE16B";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  component: Flowfield,
  parameters: {
    layout: "fullscreen",
    chromatic: { disable: true },
  },
} satisfies Meta<typeof Flowfield>;

export default meta;

export const FlowfieldSt: StoryObj<typeof Flowfield> = {
  name: "Default",
  args: {
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
  render: (args) => (
    <Mcu
      source="#769CDF"
      customColors={[
        { name: "myCustomColor1", hex: customColor1, blend: true },
        { name: "myCustomColor2", hex: customColor2, blend: true },
      ]}
    >
      <div className="h-dvh">
        <FlowfieldScene {...args} />
      </div>
    </Mcu>
  ),
};
