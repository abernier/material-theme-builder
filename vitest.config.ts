import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // The aliases in `tsconfig.json`, which the `scheme` registry item is written
  // against -- `@/lib/utils`, and the package's own name.
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
