import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { createNoise2D, createNoise3D } from "simplex-noise";

export interface Peak {
  /** Unique identifier for the peak. */
  id: string;
  /** Base X position in SVG units. */
  baseX: number;
  /** Base Y position in SVG units. */
  baseY: number;
  /** Maximum elevation value. */
  h: number;
  /** Radius of influence. */
  r: number;
  /** Seed offset for noise variation. */
  seed: number;
  /** Gradient color range from light to dark. */
  colorRange: [string, string];
  /** Label and marker color. */
  labelColor: string;
}

const DEFAULT_PEAKS: Peak[] = [
  {
    id: "Bleu",
    baseX: 350,
    baseY: 350,
    h: 920,
    r: 650,
    seed: 10,
    colorRange: ["#bae6fd", "#0284c7"],
    labelColor: "#0369a1",
  },
  {
    id: "Vert",
    baseX: 700,
    baseY: 250,
    h: 1220,
    r: 700,
    seed: 20,
    colorRange: ["#bbf7d0", "#16a34a"],
    labelColor: "#15803d",
  },
  {
    id: "Rose",
    baseX: 600,
    baseY: 550,
    h: 1420,
    r: 750,
    seed: 30,
    colorRange: ["#fbcfe8", "#db2777"],
    labelColor: "#be185d",
  },
];

const DEFAULT_BASE_COLORS: Record<number, string> = {
  100: "#fef9c3",
  200: "#fef08a",
  300: "#fde047",
  400: "#facc15",
};

interface RuntimePeak extends Peak {
  x: number;
  y: number;
}

/**
 * Organic topographic SVG visualization driven by a 3D Simplex Noise field.
 *
 * Returns only an `<svg>` element. All visual parameters are exposed as props
 * so the component can be tuned from Storybook controls or consuming code.
 */
export function TopographieOrganique({
  width = 1100,
  height = 750,
  gridScale = 5,
  peaks = DEFAULT_PEAKS,
  baseColors = DEFAULT_BASE_COLORS,
  noiseFrequency = 0.0025,
  timeSpeed = 0.0025,
  driftAmplitude = 150,
  labelStrokeColor = "#fefce8",
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
  /** Spatial noise sampling frequency. */
  noiseFrequency?: number;
  /** Time increment per animation frame. */
  timeSpeed?: number;
  /** Maximum drift distance for peak centres. */
  driftAmplitude?: number;
  /** Stroke color behind peak labels for readability. */
  labelStrokeColor?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const gridW = Math.ceil(width / gridScale);
    const gridH = Math.ceil(height / gridScale);

    const noise2D = createNoise2D();
    const noise3D = createNoise3D();
    let time = 0;
    let animId = 0;

    const runtimePeaks: RuntimePeak[] = peaks.map((p) => ({
      ...p,
      x: p.baseX,
      y: p.baseY,
    }));

    const svg = d3.select(svgEl);
    const pathGroup = svg.append("g");
    const labelGroup = svg.append("g");
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
    const baseThresholds = Object.keys(baseColors)
      .map(Number)
      .sort((a, b) => a - b);

    interface ContourDatum {
      coordinates: d3.ContourMultiPolygon["coordinates"][number];
      value: number;
      color: string;
      isPeakBase: boolean;
    }

    function computeGrid() {
      for (const p of runtimePeaks) {
        p.x = p.baseX + noise2D(p.seed, time * 0.3) * driftAmplitude;
        p.y = p.baseY + noise2D(p.seed + 100, time * 0.3) * driftAmplitude;
      }

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
        const elev = getRawElevation(peak, realX, realY, time);
        rawElev[k] = elev;
        if (elev > maxElev) maxElev = elev;
      }
      baseValues[idx] = maxElev;

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

    function buildContours() {
      const pathData: ContourDatum[] = [];

      d3.contours()
        .size([gridW, gridH])
        .thresholds(baseThresholds)(baseValues)
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
        const peakThresholds = d3.range(500, p.h, 100);
        const colorScale = d3
          .scaleLinear<string>()
          .domain([500, p.h - 20])
          .range(p.colorRange);
        const values = peakValues[pIdx] as number[];

        d3.contours()
          .size([gridW, gridH])
          .thresholds(peakThresholds)(values)
          .forEach((contour) => {
            for (const poly of contour.coordinates) {
              pathData.push({
                coordinates: poly,
                value: contour.value,
                color: colorScale(contour.value),
                isPeakBase: contour.value === 500,
              });
            }
          });
      });

      return pathData.sort((a, b) => a.value - b.value);
    }

    function renderFrame() {
      time += timeSpeed;
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
        .attr("fill", (d) => d.color)
        .attr("stroke", (d) =>
          d.isPeakBase ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.08)",
        )
        .attr("stroke-width", (d) => (d.isPeakBase ? 1.5 : 0.8));
      paths.exit().remove();

      const circles = labelGroup
        .selectAll<SVGCircleElement, RuntimePeak>(".peak-marker")
        .data(runtimePeaks);
      circles
        .enter()
        .append("circle")
        .attr("class", "peak-marker")
        .attr("r", 4)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1.5)
        .merge(circles)
        .attr("fill", (d) => d.labelColor)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);

      const labels = labelGroup
        .selectAll<SVGTextElement, RuntimePeak>(".peak-label")
        .data(runtimePeaks);
      labels
        .enter()
        .append("text")
        .attr("class", "peak-label")
        .attr("text-anchor", "middle")
        .style("font-family", "system-ui, -apple-system, sans-serif")
        .style("font-size", "14px")
        .style("font-weight", "800")
        .style("paint-order", "stroke")
        .style("stroke", labelStrokeColor)
        .style("stroke-width", "4px")
        .style("stroke-linecap", "round")
        .style("stroke-linejoin", "round")
        .style("pointer-events", "none")
        .text((d) => `${d.h - 20}m`)
        .merge(labels)
        .attr("fill", (d) => d.labelColor)
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y - 12);

      animId = requestAnimationFrame(renderFrame);
    }

    renderFrame();

    return () => {
      cancelAnimationFrame(animId);
      pathGroup.remove();
      labelGroup.remove();
    };
  }, [
    width,
    height,
    gridScale,
    peaks,
    baseColors,
    noiseFrequency,
    timeSpeed,
    driftAmplitude,
    labelStrokeColor,
  ]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
