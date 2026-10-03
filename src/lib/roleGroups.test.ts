import {
  argbFromHex,
  Hct,
  SchemeContent,
  SchemeTonalSpot,
} from "@material/material-color-utilities";
import { describe, expect, it } from "vitest";

import { readRoles } from "./roleGroups";

const tone = (argb: number) => Hct.fromInt(argb).tone;
const schemeContent = (hex: string) =>
  new SchemeContent(Hct.fromInt(argbFromHex(hex)), false, 0);

// What colorMatch reads: an overridden group as the *primary* group of
// `SchemeContent(input)`, whose container lands on the input's tone.
describe("readRoles() › from", () => {
  const base = new SchemeTonalSpot(
    Hct.fromInt(argbFromHex("#6750A4")),
    false,
    0,
  );
  const input = "#80CBC4"; // HCT tone 76.9

  it("should read a group off another group of its scheme, slot for slot", () => {
    const roles = readRoles(["tertiaryContainer", "errorContainer"], base, {
      tertiary: { scheme: schemeContent(input), from: "primary" },
      error: { scheme: schemeContent(input), from: "primary" },
    });
    expect(tone(roles.tertiaryContainer)).toBeCloseTo(77, 0);
    expect(tone(roles.errorContainer)).toBeCloseTo(77, 0);
  });

  it("should read every token outside the listed groups from the base", () => {
    const roles = readRoles(["primaryContainer", "surface"], base, {
      tertiary: { scheme: schemeContent(input), from: "primary" },
    });
    // tonalSpot, light, standard contrast: container 90, surface 98
    expect(tone(roles.primaryContainer)).toBeCloseTo(90, 0);
    expect(tone(roles.surface)).toBeCloseTo(98, 0);
  });
});
