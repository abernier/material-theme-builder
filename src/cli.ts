#!/usr/bin/env node

// @example
//
// Pre-requisite: `pnpm run build`
//
// ```sh
// $ node dist/cli.js '#6750A4'
// $ node dist/cli.js '#6750A4' --format css
// $ node dist/cli.js '#6750A4' --format shadcn
// ```

import * as fs from "node:fs";
import * as path from "node:path";

import { Command, Option } from "commander";
import { z } from "zod";
import {
  builder,
  DEFAULT_BLEND,
  DEFAULT_CONTRAST,
  DEFAULT_PREFIX,
  DEFAULT_SCHEME,
  type HexCustomColor,
  schemeNames,
} from "./lib/builder";

const customColorSchema = z.array(
  z.object({
    name: z.string(),
    hex: z.string(),
    blend: z.boolean().default(DEFAULT_BLEND),
  }),
) satisfies z.ZodType<HexCustomColor[]>;

type Theme = ReturnType<typeof builder>;

function writeFigmaTokens(theme: Theme, outputDir: string) {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const [filename, content] of Object.entries(theme.toFigmaTokens())) {
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n");
    console.error(`wrote ${filePath}`);
  }
}

function writeOutput(
  theme: Theme,
  opts: { format: string; output?: string; shadcn?: boolean },
) {
  const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";

  switch (opts.format) {
    case "css":
      return process.stdout.write(theme.toCss());
    case "tailwind":
      return process.stdout.write(theme.toTailwind({ shadcn: opts.shadcn }));
    case "shadcn":
      return process.stdout.write(json(theme.toShadcn()));
    case "flutter":
      return process.stdout.write(theme.toFlutter());
    case "figma":
      return writeFigmaTokens(theme, opts.output ?? "material-theme");
    default:
      return process.stdout.write(json(theme.toJson()));
  }
}

const program = new Command();

program
  .name("material-theme-builder")
  .description("Generate a color theme from a source color")
  .argument("<source>", "Source color in hex format (e.g. #6750A4)")
  .addOption(
    new Option("--scheme <name>", "Color scheme variant")
      .choices(schemeNames)
      .default(DEFAULT_SCHEME),
  )
  .option(
    "--contrast <number>",
    "Contrast level from -1.0 to 1.0",
    parseFloat,
    DEFAULT_CONTRAST,
  )
  .option("--primary <hex>", "Primary color override")
  .option("--secondary <hex>", "Secondary color override")
  .option("--tertiary <hex>", "Tertiary color override")
  .option("--error <hex>", "Error color override")
  .option("--neutral <hex>", "Neutral color override")
  .option("--neutral-variant <hex>", "Neutral variant color override")
  .option(
    "--custom-colors <json>",
    'Custom colors as JSON array (e.g. \'[{"name":"brand","hex":"#FF5733","blend":true}]\')',
  )
  .option(
    "--format <type>",
    "Output format: json, css, figma, tailwind, shadcn, or flutter",
    "figma",
  )
  .option("--output <dir>", "Output directory (required for figma format)")
  .option(
    "--shadcn",
    "Append the shadcn var() alias block to --format tailwind (for concrete values, use --format shadcn)",
  )
  .option(
    "--prefix <string>",
    "CSS variable prefix (e.g. md → --md-sys-color-*, --md-ref-palette-*)",
    DEFAULT_PREFIX,
  )
  .action((source: string, opts) => {
    // --shadcn only ever modified the tailwind output; silently dropping it
    // elsewhere is now a likelier mistake, --format shadcn being one keystroke away.
    if (opts.shadcn && opts.format !== "tailwind") {
      console.error(
        "Error: --shadcn only applies to --format tailwind. For concrete color values, use --format shadcn.",
      );
      process.exit(1);
    }

    let customColors: HexCustomColor[] = [];
    if (opts.customColors) {
      const result = customColorSchema.safeParse(JSON.parse(opts.customColors));
      if (!result.success) {
        console.error("Error: --custom-colors must be valid JSON");
        process.exit(1);
      }
      customColors = result.data;
    }

    const result = builder(source, {
      scheme: opts.scheme,
      contrast: opts.contrast,
      primary: opts.primary,
      secondary: opts.secondary,
      tertiary: opts.tertiary,
      error: opts.error,
      neutral: opts.neutral,
      neutralVariant: opts.neutralVariant,
      customColors,
      prefix: opts.prefix,
    });

    writeOutput(result, opts);
  });

program.parse();
