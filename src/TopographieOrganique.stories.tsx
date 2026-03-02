import type { Meta, StoryObj } from "@storybook/react-vite";

import { TopographieOrganique } from "./TopographieOrganique";

const meta = {
  component: TopographieOrganique,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TopographieOrganique>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default fullscreen story with three peaks. */
export const Default: Story = {};
