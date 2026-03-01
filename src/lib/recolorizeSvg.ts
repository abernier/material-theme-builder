import {
  argbFromHex,
  Hct,
  hexFromArgb,
} from "@material/material-color-utilities";
import type { Color, Lab65 } from "culori";
import { converter, differenceCiede2000, parseHex } from "culori";
import { kebabCase } from "lodash-es";
import type { useMcu } from "../Mcu.context";
import { STANDARD_TONES } from "./builder";

/**
 * Options for recolorizeSvg
 */
export type RecolorizeSvgOptions = {
  /**
   * Tone matching tolerance (default: 15.0)
   */
  tolerance?: number;
};

type CandidateInfo = {
  prefix: string;
  palette: { tone: (t: number) => number };
  sourceHue: number;
  isNeutral: boolean;
};

type ToneMatch = { token: string; score: number };

/**
 * Score all candidate palettes against a target color using CIEDE2000.
 * Returns the best matching token and score, or null if no match found.
 */
function scoreCandidates(
  targetHct: Hct,
  targetLab: Color,
  candidates: CandidateInfo[],
  tolerance: number,
  deltaE: (colorA: Color | string, colorB: Color | string) => number,
  rgbToLab: (color: Color | string) => Lab65 | undefined,
) {
  let best: ToneMatch | null = null;
  const targetIsNeutral = targetHct.chroma < 8;

  function matchTone(candidate: CandidateInfo, tone: number) {
    const toneHct = Hct.fromInt(candidate.palette.tone(tone));
    if (Math.abs(targetHct.tone - toneHct.tone) > tolerance) return null;

    const toneRgb = parseHex(hexFromArgb(toneHct.toInt()));
    if (!toneRgb) return null;
    const toneLab = rgbToLab(toneRgb);
    if (!toneLab) return null;

    const distance = deltaE(targetLab, toneLab);
    const neutralMultiplier =
      targetIsNeutral === candidate.isNeutral ? 0.8 : 1.5;
    return {
      token: `var(--md-ref-palette-${candidate.prefix}-${tone})`,
      score: distance * neutralMultiplier,
    };
  }

  for (const c of candidates) {
    for (const tone of STANDARD_TONES) {
      const result = matchTone(c, tone);
      if (result && (!best || result.score < best.score)) {
        best = result;
      }
    }
  }

  return best;
}

/**
 * Find the closest standard tone to a given target tone value.
 */
function findClosestTone(targetTone: number) {
  let bestTone = 50;
  let minToneDist = Infinity;
  for (const t of STANDARD_TONES) {
    const dist = Math.abs(targetTone - t);
    if (dist < minToneDist) {
      minToneDist = dist;
      bestTone = t;
    }
  }
  return bestTone;
}

/**
 * Ultra-optimized SVG recoloring that consumes directly the palettes from the MCU Context.
 * This version reuses pre-computed palettes for maximum performance and perfect synchronization.
 *
 * **Matching Algorithm:**
 * Uses CIEDE2000 (delta-e) for perceptually accurate color matching via the culori library.
 * The algorithm:
 * 1. Converts HCT colors to LAB color space using culori
 * 2. Calculates CIEDE2000 distance (scientifically validated for human perception)
 * 3. Applies bonus/penalty for matching neutral/colored nature
 *
 * This ensures colored SVG elements match to colored palettes (primary, secondary, tertiary, custom)
 * rather than falling back to neutral-variant unnecessarily, using industry-standard color science.
 *
 * To filter palettes, pass a filtered subset of palettes as the second parameter.
 *
 * @param svgString - The SVG content as a string
 * @param palettes - The palettes to use for recoloring. Filter externally if needed.
 * @param options - Optional configuration for tolerance
 * @returns Recolorized SVG string with MCU CSS variables
 *
 * @example
 * // Use all palettes
 * recolorizeSvg(svg, allPalettes)
 *
 * @example
 * // Filter palettes externally
 * const filteredPalettes = { primary: allPalettes.primary, secondary: allPalettes.secondary };
 * recolorizeSvg(svg, filteredPalettes)
 *
 * @example
 * // Use custom tolerance
 * recolorizeSvg(svg, allPalettes, { tolerance: 20 })
 */
export function recolorizeSvg(
  svgString: string,
  palettes: ReturnType<typeof useMcu>["allPalettes"],
  options: RecolorizeSvgOptions = {},
) {
  const { tolerance = 15.0 } = options;

  // Create CIEDE2000 difference function and RGB to LAB converter (reused for all colors)
  const deltaE = differenceCiede2000();
  const rgbToLab = converter("lab65");

  // 1. PREPARE CANDIDATES (Super fast as palettes are already ready)
  const candidates = Object.entries(palettes).map(([name, palette]) => {
    // Sample a representative color (tone 50) to get the palette's hue
    const midHct = Hct.fromInt(palette.tone(50));

    // Auto-detect neutrals based on name or chroma
    const isNeutral = name.includes("neutral") || midHct.chroma < 5;

    return {
      prefix: kebabCase(name), // "neutral-variant", "custom-sand"
      palette: palette,
      sourceHue: midHct.hue,
      isNeutral,
    };
  });
  console.log(`Prepared candidate palettes`, candidates);

  // 2. THE CACHE (To avoid recalculating the same pixel 50 times)
  const tokenCache = new Map<string, string>();

  // 3. SEARCH FUNCTION (Uses prepared candidates)
  const findBestToken = (hexInput: string) => {
    if (!hexInput || hexInput === "none" || hexInput.startsWith("url"))
      return null;
    if (tokenCache.has(hexInput)) return tokenCache.get(hexInput);

    let targetHct;
    try {
      targetHct = Hct.fromInt(argbFromHex(hexInput));
    } catch {
      return null;
    }

    // CIEDE2000-based matching for perceptually accurate color matching
    const targetHex = hexFromArgb(targetHct.toInt());
    const targetRgb = parseHex(targetHex);
    if (!targetRgb) return null;
    const targetLab = rgbToLab(targetRgb);

    const match = scoreCandidates(
      targetHct,
      targetLab,
      candidates,
      tolerance,
      deltaE,
      rgbToLab,
    );
    const bestToken =
      match?.token ??
      `var(--md-ref-palette-neutral-variant-${findClosestTone(targetHct.tone)})`;
    const bestScore = match?.score ?? Infinity;

    tokenCache.set(hexInput, bestToken);
    console.log("bestToken", { hexInput, bestToken, bestScore });
    return bestToken;
  };

  // 4. DOM PARSING (Standard)
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  if (doc.querySelector("parsererror")) return svgString;

  doc.querySelectorAll("*").forEach((el) => {
    ["fill", "stroke", "stop-color"].forEach((attr) => {
      const val = el.getAttribute(attr);
      if (val) {
        const token = findBestToken(val);
        if (token) el.setAttribute(attr, token);
      }
    });

    // Handle inline style
    if (el.hasAttribute("style")) {
      const style = el.getAttribute("style");
      if (style) {
        const recolorizedStyle = style.replace(
          /(fill|stroke|stop-color)\s*:\s*(#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\))/g,
          (match, prop, colorValue) => {
            // Convert rgb/rgba to hex if needed
            let hexValue = colorValue;
            if (colorValue.startsWith("rgb")) {
              const rgbMatch = colorValue.match(/\d+/g);
              if (rgbMatch && rgbMatch.length >= 3) {
                const r = parseInt(rgbMatch[0]);
                const g = parseInt(rgbMatch[1]);
                const b = parseInt(rgbMatch[2]);
                // Ensure each channel is padded to 2 hex digits
                hexValue = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
              }
            }
            const token = findBestToken(hexValue);
            return token ? `${prop}: ${token}` : match;
          },
        );
        el.setAttribute("style", recolorizedStyle);
      }
    }
  });

  return new XMLSerializer().serializeToString(doc);
}
