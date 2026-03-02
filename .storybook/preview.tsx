import type { Preview } from "@storybook/react-vite";
import seedrandom from "seedrandom";
import "../src/styles/globals.css";
import "./preview.css";

seedrandom("deterministic-random-for-storybook", { global: true }); // deterministic Math.random()

import { withThemeByClassName } from "@storybook/addon-themes";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: "light",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
  ],
};

export default preview;
