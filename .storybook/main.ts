import type { StorybookConfig } from "@storybook/react-vite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import {
  outputFrom,
  STYLESHEETS,
  writeIfChanged,
} from "../scripts/generate.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Generate the stylesheets the stories `@import`, so a fresh clone needs no
 * prior build. Dev only -- `build-storybook` builds first.
 */
function generateCss(): Plugin {
  return {
    name: "mtb:generate-css",
    apply: "serve",

    async configureServer(server) {
      const { builder } = await server.ssrLoadModule("/src/lib/builder.ts");

      for (const name of STYLESHEETS) {
        writeIfChanged(
          join(root, "src", name),
          await outputFrom(name, builder),
        );
      }
    },
  };
}

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-themes",
    "@chromatic-com/storybook",
  ],
  viteFinal(config) {
    config.plugins ??= [];
    config.plugins.push(tsconfigPaths(), generateCss());
    return config;
  },
};
export default config;
