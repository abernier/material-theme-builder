/*
 * Draws the Chrome extension's icon and rasterizes it to the four sizes the
 * manifest asks for.
 *
 * The mark is the tool in one shape: a solid seed disc, ringed by three
 * tones the library derives from it. Both come out of `builder()` itself,
 * so the icon can't drift from what the extension actually produces.
 *
 *   node scripts/make-extension-icons.mjs
 *
 * Needs ImageMagick (`brew install imagemagick`). Run it by hand — the
 * output is committed, so neither the build nor CI depends on it.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { builder } from "../dist/index.js";

const SEED = "#769CDF";
const SIZES = [16, 32, 48, 128];
const ICONS = resolve(dirname(fileURLToPath(import.meta.url)), "../chrome-extension/icons"); // prettier-ignore

const { primary } = builder(SEED).toJson().palettes;

const CX = 64;
const CY = 64;
const OUTER = 60;
const INNER = 40;
const SEED_RADIUS = 30;

const point = (radius, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CX + radius * Math.cos(rad), CY + radius * Math.sin(rad)].map((n) =>
    n.toFixed(2),
  );
};

// One 120° slice of the ring: out along the outer arc, back along the inner.
const slice = (from, to, fill) => {
  const [ax, ay] = point(OUTER, from);
  const [bx, by] = point(OUTER, to);
  const [cx, cy] = point(INNER, to);
  const [dx, dy] = point(INNER, from);
  return (
    `  <path fill="${fill}" d="M${ax} ${ay} A${OUTER} ${OUTER} 0 0 1 ${bx} ${by} ` +
    `L${cx} ${cy} A${INNER} ${INNER} 0 0 0 ${dx} ${dy} Z" />`
  );
};

const svg = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">',
  slice(0, 120, primary[30]),
  slice(120, 240, primary[50]),
  slice(240, 360, primary[80]),
  `  <circle cx="${CX}" cy="${CY}" r="${SEED_RADIUS}" fill="${SEED}" />`,
  "</svg>",
  "",
].join("\n");

mkdirSync(ICONS, { recursive: true });
writeFileSync(resolve(ICONS, "icon.svg"), svg);

for (const size of SIZES) {
  execFileSync("magick", [
    "-background",
    "none",
    "-density",
    String(size * 4),
    resolve(ICONS, "icon.svg"),
    "-resize",
    `${size}x${size}`,
    resolve(ICONS, `icon-${size}.png`),
  ]);
}

console.log(`Wrote icon.svg + ${SIZES.map((s) => `icon-${s}.png`).join(", ")}`);
