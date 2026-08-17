import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { builder } from "./lib/builder";

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

/** Extract the `--color-*` variable names declared in a CSS chunk. */
const colorVars = (css: string) =>
  [...css.matchAll(/^\s*(--color-[\w-]+)\s*:/gm)]
    .flatMap((m) => (m[1] ? [m[1]] : []))
    .sort();

/** The first `@theme inline { … }` block found in a markdown file. */
const themeBlock = (md: string) => {
  const start = md.indexOf("@theme inline {");
  expect(start).toBeGreaterThanOrEqual(0);
  const end = md.indexOf("\n}", start);
  return md.slice(start, end);
};

// The reference: every `--color-*` name `toTailwind()` actually emits (no
// custom colors, default `md` prefix — same shape as the shipped stylesheet).
const generated = colorVars(builder("#6750A4").toTailwind());

// The hand-written sources that must keep up with it. Both are supersets: they
// additionally declare the demo custom colors (myCustomColor1/2).
const sources = [
  { name: "tailwind.css", vars: colorVars(read("./tailwind.css")) },
  {
    name: "README › Tailwind block",
    vars: colorVars(themeBlock(read("../README.md"))),
  },
] as const;

describe.each(sources)("$name", ({ vars }) => {
  it("should declare every role emitted by toTailwind()", () => {
    // reported as a single list of what is missing
    expect(generated.filter((name) => !vars.includes(name))).toEqual([]);
  });

  it.each(generated)("should declare %s", (name) => {
    expect(vars).toContain(name);
  });
});

// The Tailwind story is the visual counterpart: every role the stylesheet
// declares — including the demo custom colors — must be shown there, as a
// `bg-*`, `text-*` or `border-*` utility.
const declared = colorVars(read("./tailwind.css")).map((v) =>
  v.replace("--color-", ""),
);
const storyUtilities = new Set(
  [
    ...read("./Mtb.stories.helpers.tsx").matchAll(
      /\b(?:bg|text|border)-([A-Za-z0-9-]+)/g,
    ),
  ].flatMap((m) => (m[1] ? [m[1]] : [])),
);

describe("Mtb.stories › Tailwind", () => {
  it("should showcase every role declared in tailwind.css", () => {
    expect(declared.filter((name) => !storyUtilities.has(name))).toEqual([]);
  });

  it.each(declared)("should showcase %s", (name) => {
    expect([...storyUtilities]).toContain(name);
  });
});
