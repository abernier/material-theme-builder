import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/react-vite";
import tsconfigPaths from "vite-tsconfig-paths";

const dist = fileURLToPath(new URL("../dist", import.meta.url));

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  // Serves dist/ so the Bookmarklet story's dev link can point at the
  // locally-built bundle (run `pnpm build` to refresh it). Conditional:
  // dist/ doesn't exist on CI (Chromatic builds Storybook only), and the
  // built Storybook's link targets jsDelivr anyway.
  staticDirs: existsSync(dist) ? [{ from: "../dist", to: "/dist" }] : [],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-themes",
    "@chromatic-com/storybook",
  ],
  viteFinal(config) {
    config.plugins ??= [];
    config.plugins.push(tsconfigPaths());
    return config;
  },
};
export default config;
