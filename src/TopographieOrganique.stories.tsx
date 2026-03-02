import type { Meta, StoryObj } from "@storybook/react-vite";

import { Mcu } from "./Mcu";
import { TopographieOrganique } from "./TopographieOrganique";

const meta = {
  component: TopographieOrganique,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <Mcu source="#769CDF">
        <div style={{ width: "100vw", height: "100vh" }}>
          <Story />
        </div>
      </Mcu>
    ),
  ],
} satisfies Meta<typeof TopographieOrganique>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default fullscreen story with three peaks. */
export const Default: Story = {};
