import type { StorybookConfig } from "@storybook/react-vite";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { tailwindCssFrom } from "../scripts/generate-tailwind-css.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Keep `src/tailwind.css` current while the dev server runs.
 *
 * The file is generated from `toTailwind()` by `pnpm run build`, which fires
 * once — so without this, editing the M3 vocabulary would leave the stories
 * showing the tokens as they were at boot, while everything around them hot
 * reloaded. Reading `builder` through `ssrLoadModule` is what makes it live:
 * it comes from `src/`, through Vite's module graph, so an edit invalidates it
 * the same way it invalidates a component.
 *
 * Dev only. `storybook build` has no server to load modules through, and needs
 * none: `pnpm run build-storybook` builds first.
 */
function generateTailwindCss(): Plugin {
  const target = join(root, "src/tailwind.css");

  return {
    name: "mtb:generate-tailwind-css",
    apply: "serve",

    async configureServer(server) {
      const write = async () => {
        const { builder } = await server.ssrLoadModule("/src/lib/builder.ts");
        const css = await tailwindCssFrom(builder);

        // Writing unconditionally would have every unrelated edit under
        // `src/lib/` invalidate the stylesheet, and with it every utility.
        if (existsSync(target) && readFileSync(target, "utf8") === css) return;

        writeFileSync(target, css);
        server.config.logger.info(`[mtb] regenerated src/tailwind.css`);
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
    config.plugins.push(tsconfigPaths(), generateTailwindCss());
    return config;
  },
};
export default config;
