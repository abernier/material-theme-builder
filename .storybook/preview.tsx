import type { Preview } from "@storybook/react-vite";
import seedrandom from "seedrandom";
import "../src/styles/globals.css";
import "./preview.css";

seedrandom("deterministic-random-for-storybook", { global: true }); // deterministic Math.random()

import { withThemeByClassName } from "@storybook/addon-themes";
import { TooltipProvider } from "../src/components/ui/tooltip";
import type { MtbConfig } from "../src/lib/builder";
import { Fabs, SchemeOverlay } from "../src/Mtb.stories.helpers";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  /**
   * Off by default -- and a global rather than an arg, because the poster is a
   * way of *looking* at any story, like the theme switcher next to it, not a
   * prop of the one being looked at. Its toolbar button is in `manager.ts`.
   *
   * It switches the poster and nothing else: the FABs below are always there,
   * the way they were when `Layout` drew the export one.
   */
  initialGlobals: {
    schemeOverlay: "hidden",
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
    (Story, { args, globals }) => (
      <>
        <Story />
        {globals.schemeOverlay === "shown" && (
          <SchemeOverlay
            theme={globals.theme === "dark" ? "dark" : "light"}
            customColors={args.customColors}
          />
        )}
        <Fabs config={args as MtbConfig} />
      </>
    ),
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
