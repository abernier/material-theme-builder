#!/usr/bin/env node

// @example
//
// Pre-requisite: `pnpm run build`
//
// ```sh
// $ node dist/cli.js '#6750A4'
// $ node dist/cli.js '#6750A4' --format css
// $ node dist/cli.js '#6750A4' --format shadcn
// $ node dist/cli.js '#6750A4' --format registry-item
// $ node dist/cli.js shadcn-apply '#6750A4'
// ```

import * as fs from "node:fs";
import * as path from "node:path";

import { Command } from "commander";
import { z } from "zod";
import {
  addSourceArgument,
  addThemeOptions,
  builderOptions,
} from "./cli.options";
import { addChainOptions, runApply } from "./cli.shadcn";
import {
  builder,
  DEFAULT_BLEND,
  isHexColor,
  type HexCustomColor,
} from "./lib/builder";

// `hex` is refined rather than left a bare string, so that a bad color inside the
// JSON is reported as a bad color and not as valid JSON that happens to theme
// itself wrong -- the same rule `parseHexColor()` states for the flags, said in
// the vocabulary this input arrives in.
const customColorSchema = z.array(
  z.object({
    name: z.string(),
    hex: z
      .string()
      .refine(
        isHexColor,
        "must be a hex color — 3, 6 or 8 hex digits, with or without '#' (e.g. #FF5733)",
      ),
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
  opts: {
    format: string;
    output?: string;
    shadcn?: boolean;
    fallback?: boolean;
  },
) {
  const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";

  switch (opts.format) {
    case "css":
      return process.stdout.write(theme.toCss());
    case "tailwind":
      return process.stdout.write(theme.toTailwind({ shadcn: opts.shadcn }));
    case "shadcn":
      return process.stdout.write(json(theme.toShadcn()));
    case "registry-item":
      return process.stdout.write(
        json(theme.toShadcnRegistryItem({ fallback: opts.fallback })),
      );
    case "flutter":
      return process.stdout.write(theme.toFlutter());
    case "figma":
      return writeFigmaTokens(theme, opts.output ?? "material-theme");
    default:
      return process.stdout.write(json(theme.toJson()));
  }
}

const program = new Command();

addThemeOptions(
  addSourceArgument(
    program
      .name("material-theme-builder")
      .description("Generate a color theme from a source color"),
  )
    // Required now that the theme options are declared on the subcommand too:
    // without it, commander matches an option against the program first, so
    // `shadcn-apply '#x' --scheme vibrant` would set the *program's* `--scheme`
    // and hand the subcommand a default theme. Positional options recognize an
    // option only where it was declared, which stops at the subcommand name.
    // Nothing about the root command's own parsing changes -- the rule only
    // applies to the operand that names a subcommand.
    .enablePositionalOptions(),
)
  // The root command's own: `--custom-colors` because only its formats can carry
  // them, and the three that say what to do with the theme rather than what it
  // is.
  .option(
    "--custom-colors <json>",
    'Custom colors as JSON array (e.g. \'[{"name":"brand","hex":"#FF5733","blend":true}]\')',
  )
  .option(
    "--format <type>",
    "Output format: json, css, figma, tailwind, shadcn, registry-item, or flutter",
    "figma",
  )
  .option("--output <dir>", "Output directory (required for figma format)")
  .option(
    "--shadcn",
    "Append the shadcn var() alias block to --format tailwind (for concrete values, use --format shadcn)",
  )
  .action((source: string, opts, command: Command) => {
    // --shadcn only ever modified the tailwind output; silently dropping it
    // elsewhere is now a likelier mistake, --format shadcn being one keystroke away.
    if (opts.shadcn && opts.format !== "tailwind") {
      console.error(
        "Error: --shadcn only applies to --format tailwind. For concrete color values, use --format shadcn.",
      );
      process.exit(1);
    }

    // Same reasoning, and the source matters more here: someone who asked for
    // no fallbacks and got a format that has none anyway would think they had
    // opted out of something. `fallback` defaults to true, so only an explicit
    // --no-fallback counts.
    if (
      command.getOptionValueSource("fallback") === "cli" &&
      opts.format !== "registry-item"
    ) {
      console.error(
        "Error: --no-fallback only applies to --format registry-item.",
      );
      process.exit(1);
    }

    let customColors: HexCustomColor[] = [];
    if (opts.customColors) {
      // `JSON.parse` throws its own `SyntaxError`, which used to reach the
      // terminal as a stack trace -- the same wrong answer to a typo that
      // `parseHexColor()` exists to avoid, one layer out.
      let parsed: unknown;
      try {
        parsed = JSON.parse(opts.customColors);
      } catch {
        console.error("Error: --custom-colors must be valid JSON");
        process.exit(1);
      }

      const result = customColorSchema.safeParse(parsed);
      if (!result.success) {
        // Zod's first issue, with the path it came from: `0.hex` says which
        // color of the array, where "must be valid JSON" said nothing.
        const issue = result.error.issues[0];
        const where = issue?.path.length ? ` at ${issue.path.join(".")}` : "";
        console.error(
          `Error: --custom-colors${where}: ${issue?.message ?? "is invalid"}`,
        );
        process.exit(1);
      }
      customColors = result.data;
    }

    const result = builder(source, {
      ...builderOptions(opts),
      customColors,
    });

    writeOutput(result, opts);
  });

// The subcommand lives alongside the program's own action rather than turning it
// into `.command(..., { isDefault: true })`: commander looks for a subcommand in
// the first operand before reaching its own handler, so `<source>` keeps working
// exactly as it did -- no hex color can collide with a subcommand name -- and
// `--help` gains a Commands section without every existing invocation moving one
// level down.
//
// `[shadcn-args...]` collects whatever follows the `--`. Commander classifies
// everything after the separator as operands, never as options, so those arrive
// here untouched -- which is what `allowUnknownOption()` would *not* have given
// us: it would also swallow a typo in one of our own flags and forward it
// downstream, silently.
//
// It carries the theme options too. It generates a registry item, and a command
// that could only ever generate the default theme would reproduce, inside the
// command meant to remove the by-hand recipe, the very limitation that motivated
// it -- the published item is impersonal precisely because it cannot be asked
// for a scheme.

addChainOptions(
  addThemeOptions(
    addSourceArgument(
      program
        .command("shadcn-apply")
        .description("Theme the shadcn project in the current directory"),
    ).argument(
      "[shadcn-args...]",
      "Options after a `--`, forwarded verbatim to `shadcn add`",
    ),
  ),
).action((source: string, shadcnArgs: string[], _opts, command: Command) =>
  runApply(source, shadcnArgs, command),
);

program.parse();
