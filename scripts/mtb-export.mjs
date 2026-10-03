// Material Theme Builder's own JSON export, computed by MTB itself -- for the
// fixtures in `src/fixtures/material-theme-builder/` that cannot be clicked out
// of the website by hand in a reasonable time, and to re-check any of them.
//
// MTB web is a Flutter app, compiled to one `main.dart.js`. Its color code is
// plain JavaScript in there, so this loads the file in a Node `vm` (no DOM, the
// app never starts) and calls the same function MTB's "Export > JSON" button
// does, on a theme model built from the arguments.
//
//   curl -sLO https://material-foundation.github.io/material-theme-builder/main.dart.js
//   node scripts/mtb-export.mjs main.dart.js '{"seed":"#CAF543","neutral":"#36342F","colorMatch":true}'
//
// The config takes `seed` (MTB's primary), `secondary`, `tertiary`, `error`,
// `neutral`, `neutralVariant`, `colorMatch`, and `customColors` as
// `[{ name, hex, blend }]`.
//
// The JSON export carries no roles for custom colors. With `--custom-colors`,
// this prints them instead, as MTB's Flutter export computes them: per custom
// color, `color`, `onColor`, `colorContainer` and `onColorContainer`, light and
// dark.
//
// The names below are dart2js's minified ones, so they hold for one build of
// MTB only: the one with this sha256, fetched 2026-10-03.
//
//   1a8b8b05bab6814fa5a4b235928d3caba2fe54748cfe68299eacc4b76c673a1b
//
// Against that build, this reproduces `try-01.json` to `try-05.json` -- exported
// from the website by hand -- byte for byte, `description` aside (it carries
// the export date).

import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";

const [bundlePath, configJson, mode] = process.argv.slice(2);
if (!bundlePath || !configJson) {
  console.error("usage: node scripts/mtb-export.mjs <main.dart.js> '<config>'");
  process.exit(1);
}

// Keep the program from running `main()`, and hand its holders out instead.
const MAIN =
  'var s=A.b5y\nif(typeof dartMainRunner==="function"){dartMainRunner(s,[])}else{s([])}';
const source = readFileSync(bundlePath, "utf8");
if (!source.includes(MAIN)) {
  console.error("Not the MTB build this script knows -- see its header.");
  process.exit(1);
}

const sandbox = { console, Date, Math, Uint8Array, setTimeout, clearTimeout };
sandbox.globalThis = sandbox;
sandbox.self = sandbox;
createContext(sandbox);
runInContext(source.replace(MAIN, "globalThis.__dart={A:A,B:B}"), sandbox);
const { A, B } = sandbox.__dart;

/** A Dart `Color` from a hex string, or null. */
function color(hex) {
  if (!hex) return null;
  const n = parseInt(hex.replace("#", ""), 16);
  return A.an(255, (n >> 16) & 255, (n >> 8) & 255, n & 255);
}

const config = JSON.parse(configJson);

// MTB's theme model, reduced to what its JSON export reads: `f` primary, `r`
// secondary, `w` tertiary, `x` error, `y` neutral, `z` neutral variant, `e`
// color match, `CW` custom colors. The three getters are copied from it.
const theme = {
  f: color(config.seed),
  r: color(config.secondary),
  w: color(config.tertiary),
  x: color(config.error),
  y: color(config.neutral),
  z: color(config.neutralVariant),
  e: Boolean(config.colorMatch),
  d: "material-theme",
  CW: (config.customColors ?? []).map((c) => ({
    a: c.name,
    b: null,
    c: c.blend,
    d: color(c.hex),
  })),
  gdc() {
    const t = this;
    return A.bdr(B.b, t.e, t.x, true, false, t.y, t.z, t.f, t.r, t.w);
  },
  gd8() {
    const t = this;
    return A.bdr(B.a_, t.e, t.x, true, false, t.y, t.z, t.f, t.r, t.w);
  },
  gtW() {
    const t = this;
    return A.bdp(false, t.x, t.y, t.z, t.f, t.r, t.w);
  },
};

/** `#rrggbb` from a Dart `Color`. */
function hex(dartColor) {
  return "#" + (A.aE(dartColor) & 0xffffff).toString(16).padStart(6, "0");
}

if (mode === "--custom-colors") {
  // MTB's custom color class (`Kx`: name, description, harmonized, color), and
  // the light/dark getters its Flutter export reads: each returns the scheme
  // of the (harmonized) color, of which the four primary roles are used.
  const roles = (scheme) => ({
    color: hex(scheme.b),
    onColor: hex(scheme.c),
    colorContainer: hex(scheme.d ?? scheme.b),
    onColorContainer: hex(scheme.e ?? scheme.c),
  });
  const customColors = Object.fromEntries(
    theme.CW.map((c) => {
      const kx = new A.Kx(c.a, null, c.c, c.d);
      return [
        c.a,
        {
          light: roles(kx.awH(theme.f, theme.e)),
          dark: roles(kx.aso(theme.f, theme.e)),
        },
      ];
    }),
  );
  process.stdout.write(JSON.stringify(customColors, null, 2) + "\n");
} else {
  // MTB's JSON exporter, and the method its export button calls.
  const exporter = Object.create(A.aEr.prototype);
  process.stdout.write(exporter.atZ(theme) + "\n");
}
