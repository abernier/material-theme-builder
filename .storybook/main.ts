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
 * Keep `src/tailwind.css` and `src/shadcn.css` current while the dev server
 * runs.
 *
 * They are generated from their exporters by `pnpm run build`, which fires
 * once — so without this, editing the M3 vocabulary would leave the stories
 * showing the tokens as they were at boot, while everything around them hot
 * reloaded. Reading `builder` through `ssrLoadModule` is what makes it live:
 * it comes from `src/`, through Vite's module graph, so an edit invalidates it
 * the same way it invalidates a component.
 *
 * Dev only. `storybook build` has no server to load modules through, and needs
 * none: `pnpm run build-storybook` builds first.
 */
function generateCss(): Plugin {
  return {
    name: "mtb:generate-css",
    apply: "serve",

    async configureServer(server) {
      const write = async () => {
        const { builder } = await server.ssrLoadModule("/src/lib/builder.ts");

        for (const name of STYLESHEETS) {
          const css = await outputFrom(name, builder);

          if (writeIfChanged(join(root, "src", name), css)) {
            server.config.logger.info(`[mtb] regenerated src/${name}`);
          }
        }
      };

      // Before the first request, so a fresh clone needs no prior build.
      await write();

      server.watcher.on("change", async (file) => {
        if (file.startsWith(join(root, "src/lib"))) await write();
      });
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
