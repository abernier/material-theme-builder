import reactHooks from "eslint-plugin-react-hooks";
import sonarjs from "eslint-plugin-sonarjs";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: ["dist/**", "storybook-static/**", "node_modules/**"],
  },
  {
    ...reactHooks.configs.flat.recommended,
    files: ["src/**/*.{ts,tsx}", ".storybook/**/*.{ts,tsx}"],
  },
  ...tseslint.configs.strict.map((config) => ({
    ...config,
    files: ["src/**/*.{ts,tsx}", ".storybook/**/*.{ts,tsx}"],
  })),
  {
    files: ["src/**/*.{ts,tsx}", ".storybook/**/*.{ts,tsx}"],
    plugins: {
      sonarjs,
    },
    rules: {
      "sonarjs/cognitive-complexity": "error",
      "sonarjs/cyclomatic-complexity": "error",
      "sonarjs/expression-complexity": "warn",
      "sonarjs/regex-complexity": "warn",
    },
  },
]);
