import { readFileSync } from "node:fs";
import { join } from "node:path";

import Ajv from "ajv";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";
import darkThemeFixture from "../fixtures/theme/Dark.tokens.json";
import lightThemeFixture from "../fixtures/theme/Light.tokens.json";
import type {
  DtcgColorValue,
  FigmaVariableAlias,
  FigmaVariableValue,
} from "./builder";
import { builder, STANDARD_TONES } from "./builder";

function isDtcgColorValue(v: string | DtcgColorValue): v is DtcgColorValue {
  return typeof v !== "string";
}

function isAlias(v: FigmaVariableValue): v is FigmaVariableAlias {
  return "alias" in v;
}

describe("builder › toFigmaVariables()", () => {
  it("should return a flat array of variable descriptors", () => {
    const variables = builder("#6750A4").toFigmaVariables();

    expect(Array.isArray(variables)).toBe(true);
    expect(variables.length).toBeGreaterThan(0);

    for (const v of variables) {
      expect(v).toHaveProperty("path");
      expect(v).toHaveProperty("values");
      expect(v.values).toHaveProperty("Light");
      expect(v.values).toHaveProperty("Dark");
    }
  });

  it("should include ref palette variables with direct color values", () => {
    const variables = builder("#6750A4").toFigmaVariables();
    const refVar = variables.find((v) => v.path === "ref/palette/Primary/40");
    expect(refVar).toBeDefined();
    if (!refVar) return;

    const light = refVar.values["Light"];
    expect(light).toBeDefined();
    if (!light) return;
    expect(light).toHaveProperty("r");
    expect(light).toHaveProperty("g");
    expect(light).toHaveProperty("b");
    expect(light).toHaveProperty("a");
  });

  it("should include sys color variables with alias values", () => {
    const variables = builder("#6750A4").toFigmaVariables();
    const sysVar = variables.find((v) => v.path === "sys/color/Primary");
    expect(sysVar).toBeDefined();
    if (!sysVar) return;

    expect(sysVar.description).toBeDefined();
    const light = sysVar.values["Light"];
    expect(light).toBeDefined();
    if (!light) return;
    expect(isAlias(light)).toBe(true);
    if (isAlias(light)) {
      expect(light.alias).toMatch(/^ref\/palette\/.+\/\d+$/);
    }
  });

  it("should have different aliases for light and dark modes", () => {
    const variables = builder("#6750A4").toFigmaVariables();
    const sysVar = variables.find((v) => v.path === "sys/color/Primary");
    expect(sysVar).toBeDefined();
    if (!sysVar) return;

    const light = sysVar.values["Light"];
    const dark = sysVar.values["Dark"];
    expect(light).toBeDefined();
    expect(dark).toBeDefined();
    if (!light || !dark) return;
    expect(isAlias(light)).toBe(true);
    expect(isAlias(dark)).toBe(true);
    if (isAlias(light) && isAlias(dark)) {
      expect(light.alias).not.toBe(dark.alias);
    }
  });

  it("should include custom color variables", () => {
    const variables = builder("#6750A4", {
      customColors: [{ name: "brand", hex: "#FF5733", blend: true }],
    }).toFigmaVariables();

    expect(variables.some((v) => v.path.startsWith("ref/palette/Brand/"))).toBe(
      true,
    );
    expect(variables.some((v) => v.path === "sys/color/Brand")).toBe(true);
  });

  it("should have same ref palette values in both modes", () => {
    const variables = builder("#6750A4").toFigmaVariables();
    const refVars = variables.filter((v) => v.path.startsWith("ref/palette/"));

    for (const v of refVars) {
      expect(v.values["Light"]).toEqual(v.values["Dark"]);
    }
  });
});

describe("builder › toFigmaTokens()", () => {
  // DTCG schemas are downloaded by scripts/download-dtcg-schemas.sh (via pretest hook)
  function loadSchema(relativePath: string) {
    const schemasDir = join(import.meta.dirname, "../fixtures/.dtcg-schemas");
    return JSON.parse(readFileSync(join(schemasDir, relativePath), "utf-8"));
  }

  function createDtcgValidator() {
    const ajv = new Ajv({ strict: false, allErrors: true });
    addFormats(ajv);

    // Register all sub-schemas (leaves before roots)
    ajv.addSchema(loadSchema("format/tokenType.json"));
    ajv.addSchema(loadSchema("format/values/color.json"));
    ajv.addSchema(loadSchema("format/values/dimension.json"));
    ajv.addSchema(loadSchema("format/values/fontFamily.json"));
    ajv.addSchema(loadSchema("format/values/fontWeight.json"));
    ajv.addSchema(loadSchema("format/values/duration.json"));
    ajv.addSchema(loadSchema("format/values/cubicBezier.json"));
    ajv.addSchema(loadSchema("format/values/number.json"));
    ajv.addSchema(loadSchema("format/values/strokeStyle.json"));
    ajv.addSchema(loadSchema("format/values/border.json"));
    ajv.addSchema(loadSchema("format/values/transition.json"));
    ajv.addSchema(loadSchema("format/values/shadow.json"));
    ajv.addSchema(loadSchema("format/values/gradient.json"));
    ajv.addSchema(loadSchema("format/values/typography.json"));
    ajv.addSchema(loadSchema("format/token.json"));
    ajv.addSchema(loadSchema("format/groupOrToken.json"));
    ajv.addSchema(loadSchema("format/group.json"));

    return ajv.compile(loadSchema("format.json"));
  }

  it("should produce valid DTCG tokens for each mode file", () => {
    const validate = createDtcgValidator();
    const files = builder("#6750A4").toFigmaTokens();

    for (const [filename, content] of Object.entries(files)) {
      const valid = validate(content);
      if (!valid) {
        console.error(
          `DTCG validation errors in ${filename}:`,
          validate.errors,
        );
      }
      expect(valid, `${filename} should be valid DTCG`).toBe(true);
    }
  });

  it("should match CLI-generated #6750A4 fixtures", () => {
    const result = builder("#6750A4").toFigmaTokens();

    expect(result["Light.tokens.json"]).toEqual(lightThemeFixture);
    expect(result["Dark.tokens.json"]).toEqual(darkThemeFixture);
  });

  it("should produce valid DTCG tokens with custom colors", () => {
    const validate = createDtcgValidator();
    const files = builder("#6750A4", {
      customColors: [
        { name: "brand", hex: "#FF5733", blend: true },
        { name: "success", hex: "#28A745", blend: false },
      ],
    }).toFigmaTokens();

    for (const [filename, content] of Object.entries(files)) {
      const valid = validate(content);
      if (!valid) {
        console.error(
          `DTCG validation errors in ${filename}:`,
          validate.errors,
        );
      }
      expect(valid, `${filename} should be valid DTCG`).toBe(true);
    }
  });

  it("should return Light.tokens.json and Dark.tokens.json files", () => {
    const result = builder("#6750A4").toFigmaTokens();

    expect(result).toHaveProperty("Light.tokens.json");
    expect(result).toHaveProperty("Dark.tokens.json");
    expect(Object.keys(result)).toHaveLength(2);
  });

  it("should contain ref.palette and sys.color groups in each mode file", () => {
    const result = builder("#6750A4").toFigmaTokens();

    for (const key of ["Light.tokens.json", "Dark.tokens.json"] as const) {
      const file = result[key];
      expect(file.ref).toBeDefined();
      expect(file.ref.palette).toBeDefined();
      expect(file.sys).toBeDefined();
      expect(file.sys.color).toBeDefined();
    }
  });

  it("should use Title Case names for scheme tokens", () => {
    const result = builder("#6750A4").toFigmaTokens();
    const sysColor = result["Light.tokens.json"].sys.color;

    expect(sysColor).toHaveProperty("Primary");
    expect(sysColor).toHaveProperty("On Primary");
    expect(sysColor).toHaveProperty("Surface Container High");
  });

  it("should use Title Case names for palette groups", () => {
    const result = builder("#6750A4").toFigmaTokens();
    const refPalette = result["Light.tokens.json"].ref.palette;

    expect(refPalette).toHaveProperty("Primary");
    expect(refPalette).toHaveProperty("Secondary");
    expect(refPalette).toHaveProperty("Tertiary");
    expect(refPalette).toHaveProperty("Error");
    expect(refPalette).toHaveProperty("Neutral");
    expect(refPalette).toHaveProperty("Neutral Variant");
  });

  it("should include all standard tones in each palette", () => {
    const result = builder("#6750A4").toFigmaTokens();
    const primaryPalette = result["Light.tokens.json"].ref.palette["Primary"];
    expect(primaryPalette).toBeDefined();
    if (!primaryPalette) return;

    for (const tone of STANDARD_TONES) {
      expect(primaryPalette).toHaveProperty(tone.toString());
    }
  });

  it("should produce Figma-compatible ref palette tokens with color objects", () => {
    const result = builder("#6750A4").toFigmaTokens();
    const primaryPalette = result["Light.tokens.json"].ref.palette["Primary"];
    expect(primaryPalette).toBeDefined();
    if (!primaryPalette) return;
    const tone40 = primaryPalette["40"];
    expect(tone40).toBeDefined();
    if (!tone40) return;

    expect(tone40.$type).toBe("color");
    expect(isDtcgColorValue(tone40.$value)).toBe(true);

    if (isDtcgColorValue(tone40.$value)) {
      expect(tone40.$value.colorSpace).toBe("srgb");
      expect(tone40.$value.components).toHaveLength(3);
      for (const c of tone40.$value.components) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
      expect(tone40.$value.alpha).toBe(1);
      expect(tone40.$value.hex).toMatch(/^#[0-9A-F]{6}$/);
    }

    expect(tone40.$extensions["com.figma.scopes"]).toEqual(["ALL_SCOPES"]);
  });

  it("should produce sys tokens with alias references in each mode file", () => {
    const result = builder("#6750A4").toFigmaTokens();
    const lightPrimary = result["Light.tokens.json"].sys.color["Primary"];
    const darkPrimary = result["Dark.tokens.json"].sys.color["Primary"];
    expect(lightPrimary).toBeDefined();
    expect(darkPrimary).toBeDefined();
    if (!lightPrimary || !darkPrimary) return;

    expect(lightPrimary.$type).toBe("color");
    expect(lightPrimary.$value).toMatch(/^\{ref\.palette\..+\}$/);
    expect(lightPrimary.$description).toBeDefined();
    expect(lightPrimary.$extensions["com.figma.scopes"]).toEqual([
      "ALL_SCOPES",
    ]);
    expect(lightPrimary.$extensions["css.variable"]).toBe(
      "--md-sys-color-primary",
    );

    expect(darkPrimary.$type).toBe("color");
    expect(darkPrimary.$value).toMatch(/^\{ref\.palette\..+\}$/);

    // Light and Dark should reference different tones
    expect(lightPrimary.$value).not.toBe(darkPrimary.$value);
  });

  it("should have different aliases for scheme tokens across modes", () => {
    const result = builder("#6750A4").toFigmaTokens();
    const lightPrimary = result["Light.tokens.json"].sys.color["Primary"];
    const darkPrimary = result["Dark.tokens.json"].sys.color["Primary"];
    expect(lightPrimary).toBeDefined();
    expect(darkPrimary).toBeDefined();
    if (!lightPrimary || !darkPrimary) return;

    // Primary is tone 40 in Light, tone 80 in Dark
    expect(lightPrimary.$value).not.toBe(darkPrimary.$value);
  });

  it("should produce mode-independent ref palette tones", () => {
    // ref palette is always the same in both mode files
    const result = builder("#6750A4").toFigmaTokens();

    // Both mode files should share the same ref palette
    expect(result["Light.tokens.json"].ref.palette).toEqual(
      result["Dark.tokens.json"].ref.palette,
    );
  });

  it("should include custom color palettes and scheme tokens", () => {
    const result = builder("#6750A4", {
      customColors: [{ name: "brand", hex: "#FF5733", blend: true }],
    }).toFigmaTokens();

    for (const key of ["Light.tokens.json", "Dark.tokens.json"] as const) {
      const file = result[key];

      // Custom color should appear in ref palette
      expect(file.ref.palette).toHaveProperty("Brand");

      // Custom color scheme tokens in sys.color
      expect(file.sys.color).toHaveProperty("Brand");
      expect(file.sys.color).toHaveProperty("On Brand");
      expect(file.sys.color).toHaveProperty("Brand Container");
      expect(file.sys.color).toHaveProperty("On Brand Container");
    }
  });

  it("should contain com.figma.modeName in each mode file", () => {
    const result = builder("#6750A4").toFigmaTokens();

    expect(result["Light.tokens.json"].$extensions["com.figma.modeName"]).toBe(
      "Light",
    );
    expect(result["Dark.tokens.json"].$extensions["com.figma.modeName"]).toBe(
      "Dark",
    );
  });
});
