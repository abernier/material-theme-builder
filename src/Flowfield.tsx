import * as d3 from "d3";
import { useCallback, useEffect, useRef } from "react";
import { createNoise2D, createNoise3D } from "simplex-noise";

export interface Peak {
  /** Unique identifier for the peak. */
  id: string;
  /** Normalized size weight (0–1). 1 means the peak covers the full viewport diagonal. Defaults to `0.5`. */
  weight?: number;
  /** Elevation-to-color mapping. Keys are altitude thresholds, values are colors. */
  colors: Record<number, string>;
}

const DEFAULT_PEAKS: Peak[] = [
  {
    id: "Bleu",
    weight: 0.1,
    colors: {
      500: "#bae6fd",
      600: "#8ecae6",
      700: "#62afd0",
      800: "#3694ba",
      900: "#0284c7",
    },
  },
  {
    id: "Vert",
    weight: 0.55,
    colors: {
      500: "#bbf7d0",
      600: "#8eecb0",
      700: "#61e090",
      800: "#3bcd6f",
      900: "#27b858",
      1000: "#1ea647",
      1100: "#16a34a",
      1200: "#16a34a",
    },
  },
  {
    id: "Rose",
    weight: 0.6,
    colors: {
      500: "#fbcfe8",
      600: "#f9b0d8",
      700: "#f591c7",
      800: "#f172b6",
      900: "#ec4899",
      1000: "#e63d8e",
      1100: "#e03283",
      1200: "#db2777",
      1300: "#db2777",
      1400: "#db2777",
    },
  },
];

const DEFAULT_BASE_COLORS: Record<number, string> = {
  100: "#fef9c3",
  200: "#fef08a",
  300: "#fde047",
  400: "#facc15",
};

interface RuntimePeak extends Peak {
  /** Derived from the highest key in `colors`. */
  h: number;
  /** Absolute radius derived from `weight` and viewport diagonal. */
  r: number;
  /** Derived from the array index. */
  seed: number;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
}

/**
 * Organic topographic SVG visualization driven by a 3D Simplex Noise field.
 *
 * Returns only an `<svg>` element. All visual parameters are exposed as props
 * so the component can be tuned from Storybook controls or consuming code.
 */
export function Flowfield({
  width = 1100,
  height = 750,
  gridScale = 5,
  peaks = DEFAULT_PEAKS,
  baseColors = DEFAULT_BASE_COLORS,
  defaultWeight = 0.5,
  noiseFrequency = 0.0025,
  timeSpeed = 0.0025,
  driftAmplitude = 150,
  smoothing = 0,
  cursorRadius = 200,
  cursorStrength = 800,
  cursorTrail = 0.95,
}: {
  /** SVG viewBox width. */
  width?: number;
  /** SVG viewBox height. */
  height?: number;
  /** Grid cell size — lower is sharper but slower. */
  gridScale?: number;
  /** Mountain definitions. */
  peaks?: Peak[];
  /** Color lookup keyed by base-elevation threshold. */
  baseColors?: Record<number, string>;
  /** Fallback weight applied to peaks that don't specify one (0–1). */
  defaultWeight?: number;
  /** Spatial noise sampling frequency. */
  noiseFrequency?: number;
  /** Time increment per animation frame. */
  timeSpeed?: number;
  /** Maximum drift distance for peak centres. */
  driftAmplitude?: number;
  /** Number of blur passes applied to the grid before contouring (0 = no smoothing). */
  smoothing?: number;
  /** Influence radius of cursor interactions in viewBox units. */
  cursorRadius?: number;
  /** Maximum elevation added at the cursor position. */
  cursorStrength?: number;
  /** Fraction of cursor influence retained per frame (0 = no trail, 0.99 = long trail). */
  cursorTrail?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const noise2DRef = useRef<ReturnType<typeof createNoise2D>>(null);
  const noise3DRef = useRef<ReturnType<typeof createNoise3D>>(null);
  const timeRef = useRef(0);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());

  const toViewBox = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const pos = toViewBox(e.clientX, e.clientY);
      if (pos) pointersRef.current.set(e.pointerId, pos);
    },
    [toViewBox],
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      pointersRef.current.delete(e.pointerId);
    },
    [],
  );

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const gridW = Math.ceil(width / gridScale);
    const gridH = Math.ceil(height / gridScale);

    if (!noise2DRef.current) noise2DRef.current = createNoise2D();
    if (!noise3DRef.current) noise3DRef.current = createNoise3D();
    const noise2D = noise2DRef.current;
    const noise3D = noise3DRef.current;
    let animId = 0;

    // Derive deterministic base positions from each peak's seed
    function seededRandom(s: number) {
      const x = Math.sin(s * 9301 + 49297) * 233280;
      return x - Math.floor(x);
    }

    const diagonal = Math.hypot(width, height);

    const runtimePeaks = peaks.map((p, i) => {
      const seed = (i + 1) * 10;
      const margin = 0.15;
      const bx = (margin + seededRandom(seed) * (1 - 2 * margin)) * width;
      const by = (margin + seededRandom(seed + 1) * (1 - 2 * margin)) * height;
      const weight = p.weight ?? defaultWeight;
      const h = Math.max(...Object.keys(p.colors).map(Number));
      const r = weight * diagonal;
      return { ...p, weight, h, r, seed, baseX: bx, baseY: by, x: bx, y: by };
    });

    const svg = d3.select(svgEl);
    const pathGroup = svg.append("g");
    const pathGenerator = d3.geoPath(d3.geoIdentity().scale(gridScale));

    function getRawElevation(p: RuntimePeak, x: number, y: number, t: number) {
      const dx = x - p.x;
      const dy = y - p.y;
      const baseDist = Math.sqrt(dx * dx + dy * dy);

      const noiseVal = noise3D(
        x * noiseFrequency,
        y * noiseFrequency,
        t * 0.8 + p.seed,
      );
      const distortedDist = baseDist - noiseVal * (p.r * 0.25);

      if (distortedDist >= p.r) return 0;
      if (distortedDist <= 0) return p.h;

      const factor = 1 - distortedDist / p.r;
      return p.h * Math.pow(factor, 1.5);
    }

    const baseValues = new Array<number>(gridW * gridH).fill(0);
    const peakValues = runtimePeaks.map(() =>
      new Array<number>(gridW * gridH).fill(0),
    );
    const rawElev = new Array<number>(runtimePeaks.length).fill(0);
    const cursorHeat = new Array<number>(gridW * gridH).fill(0);
    const baseThresholds = Object.keys(baseColors)
      .map(Number)
      .sort((a, b) => a - b);

    interface ContourDatum {
      coordinates: d3.ContourMultiPolygon["coordinates"][number];
      value: number;
      color: string;
      isPeakBase: boolean;
    }

    function updateCursorHeat() {
      for (let i = 0; i < cursorHeat.length; i++) {
        cursorHeat[i] = (cursorHeat[i] ?? 0) * cursorTrail;
      }
      for (const pos of pointersRef.current.values()) {
        const minI = Math.max(
          0,
          Math.floor((pos.x - cursorRadius) / gridScale),
        );
        const maxI = Math.min(
          gridW - 1,
          Math.ceil((pos.x + cursorRadius) / gridScale),
        );
        const minJ = Math.max(
          0,
          Math.floor((pos.y - cursorRadius) / gridScale),
        );
        const maxJ = Math.min(
          gridH - 1,
          Math.ceil((pos.y + cursorRadius) / gridScale),
        );
        for (let j = minJ; j <= maxJ; ++j) {
          for (let i = minI; i <= maxI; ++i) {
            const dx = i * gridScale - pos.x;
            const dy = j * gridScale - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < cursorRadius) {
              const factor = 1 - dist / cursorRadius;
              const influence = cursorStrength * factor * factor;
              const idx = j * gridW + i;
              cursorHeat[idx] = Math.max(cursorHeat[idx] ?? 0, influence);
            }
          }
        }
      }
    }

    function computeGrid() {
      for (const p of runtimePeaks) {
        p.x = p.baseX + noise2D(p.seed, timeRef.current * 0.3) * driftAmplitude;
        p.y =
          p.baseY +
          noise2D(p.seed + 100, timeRef.current * 0.3) * driftAmplitude;
      }

      updateCursorHeat();

      for (let j = 0; j < gridH; ++j) {
        for (let i = 0; i < gridW; ++i) {
          computeCell(i * gridScale, j * gridScale, j * gridW + i);
        }
      }
    }

    function computeCell(realX: number, realY: number, idx: number) {
      let maxElev = 0;
      for (let k = 0; k < runtimePeaks.length; k++) {
        const peak = runtimePeaks[k] as RuntimePeak;
        const elev = getRawElevation(peak, realX, realY, timeRef.current);
        rawElev[k] = elev;
        if (elev > maxElev) maxElev = elev;
      }

      const heat = cursorHeat[idx] as number;
      baseValues[idx] = maxElev + heat;

      // Boost each peak's raw elevation by cursor heat so peaks are affected
      if (heat > 0) {
        for (let k = 0; k < runtimePeaks.length; k++) {
          rawElev[k] = (rawElev[k] ?? 0) + heat;
        }
      }

      const pow = 8;
      let sum = 0.1;
      for (const e of rawElev) {
        sum += Math.pow(e, pow);
      }
      for (let k = 0; k < runtimePeaks.length; k++) {
        const e = rawElev[k] as number;
        (peakValues[k] as number[])[idx] = e * (Math.pow(e, pow) / sum);
      }
    }

    function blurGrid(values: number[]) {
      if (smoothing <= 0) return values;
      const copy = Float64Array.from(values);
      d3.blur2({ data: copy, width: gridW }, smoothing);
      return Array.from(copy);
    }

    function buildContours() {
      const pathData: ContourDatum[] = [];

      d3.contours()
        .size([gridW, gridH])
        .thresholds(baseThresholds)(blurGrid(baseValues))
        .forEach((contour) => {
          for (const poly of contour.coordinates) {
            pathData.push({
              coordinates: poly,
              value: contour.value,
              color: baseColors[contour.value] ?? "#fef9c3",
              isPeakBase: false,
            });
          }
        });

      runtimePeaks.forEach((p, pIdx) => {
        const peakThresholds = Object.keys(p.colors)
          .map(Number)
          .sort((a, b) => a - b);
        const lowestThreshold = peakThresholds[0] ?? 500;
        const fallbackColor = p.colors[lowestThreshold] ?? "#ccc";
        const values = peakValues[pIdx] as number[];

        d3.contours()
          .size([gridW, gridH])
          .thresholds(peakThresholds)(blurGrid(values))
          .forEach((contour) => {
            for (const poly of contour.coordinates) {
              pathData.push({
                coordinates: poly,
                value: contour.value,
                color: p.colors[contour.value] ?? fallbackColor,
                isPeakBase: contour.value === lowestThreshold,
              });
            }
          });
      });

      return pathData.sort((a, b) => a.value - b.value);
    }

    function renderFrame() {
      timeRef.current += timeSpeed;
      computeGrid();
      const pathData = buildContours();

      const paths = pathGroup
        .selectAll<SVGPathElement, ContourDatum>("path")
        .data(pathData);
      paths
        .enter()
        .append("path")
        .style("pointer-events", "none")
        .style("stroke-linejoin", "round")
        .merge(paths)
        .attr("d", (d) =>
          pathGenerator({
            type: "Polygon",
            coordinates: d.coordinates,
          }),
        )
        .attr("fill", (d) => d.color);
      paths.exit().remove();

      animId = requestAnimationFrame(renderFrame);
    }

    renderFrame();

    return () => {
      cancelAnimationFrame(animId);
      pathGroup.remove();
    };
  }, [
    width,
    height,
    gridScale,
    peaks,
    baseColors,
    defaultWeight,
    noiseFrequency,
    timeSpeed,
    driftAmplitude,
    smoothing,
    cursorRadius,
    cursorStrength,
    cursorTrail,
  ]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        touchAction: "none",
      }}
      onPointerDown={handlePointerMove}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    />
  );
}
