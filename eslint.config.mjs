import jsdoc from "eslint-plugin-jsdoc";
import reactHooks from "eslint-plugin-react-hooks";
import sonarjs from "eslint-plugin-sonarjs";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const SOURCE_FILES = ["src/**/*.{ts,tsx}", ".storybook/**/*.{ts,tsx}"];

// shadcn's own output. `components.json` sends it to exactly these three
// places -- the `components`, `ui` and `hooks` aliases -- and `shadcn add`
// rewrites them wholesale, so the repo's *conventions* (JSDoc on every export,
// complexity ceilings) can only ever be satisfied by editing files the next
// `add` overwrites. Vendored, not authored: exempt. `src/components/m3/` is
// ours and stays in, as does everything at the `src/` root.
//
// Correctness rules -- typescript-eslint strict, react-hooks -- deliberately
// still apply: nothing there asks for an edit that a regeneration undoes.
const SHADCN_FILES = [
  "src/components/*.tsx", // blocks, e.g. `dashboard-01`'s
  "src/components/ui/**/*.tsx",
  "src/hooks/*.ts",
];

export default defineConfig([
  {
    ignores: ["dist/**", "storybook-static/**", "node_modules/**"],
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
    ignores: ["src/**/*.stories.{ts,tsx}", ".storybook/**", ...SHADCN_FILES],
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
    ignores: SHADCN_FILES,
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
