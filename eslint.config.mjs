import jsdoc from "eslint-plugin-jsdoc";
import reactHooks from "eslint-plugin-react-hooks";
import sonarjs from "eslint-plugin-sonarjs";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const SOURCE_FILES = ["src/**/*.{ts,tsx}", ".storybook/**/*.{ts,tsx}"];

export default defineConfig([
  {
    ignores: [
      "dist/**",
      "storybook-static/**",
      "node_modules/**",
      "src/figma-plugin/**",
    ],
  },
  {
    ...reactHooks.configs.flat.recommended,
    files: SOURCE_FILES,
  },
  ...tseslint.configs.strict.map((config) => ({
    ...config,
    files: SOURCE_FILES,
  })),
  {
    files: SOURCE_FILES,
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
  {
    files: SOURCE_FILES,
    ignores: [
      "src/**/*.stories.{ts,tsx}",
      ".storybook/**",
      "src/components/ui/**/*.tsx",
    ],
    plugins: {
      jsdoc,
    },
    rules: {
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          require: {
            MethodDefinition: true, // export class X { method() {} }
          },
          contexts: [
            "ExportNamedDeclaration > VariableDeclaration", // export const … (variables, constants, arrow fns)
          ],
        },
      ],
    },
  },
  {
    files: SOURCE_FILES,
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
