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

import { Command, Option, type OptionValues } from "commander";
import { z } from "zod";
import {
  addSourceArgument,
  addThemeOptions,
  builderOptions,
} from "./cli.options";
import { DEFAULT_SHADCN, runApply } from "./cli.shadcn";
import {
  builder,
  DEFAULT_BLEND,
  isHexColor,
  type HexCustomColor,
  type Mapping,
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

// The list `--format` accepts, and the list `writeOutput()` handles -- one array,
// so a format cannot be offered without being written, or written without being
// offered. Commander prints it in `--help` and refuses anything else, which is
// what retires the `default:` branch that used to answer `--format bananas` with
// JSON and not a word.
const FORMATS = [
  "json",
  "css",
  "figma",
  "tailwind",
  "shadcn",
  "registry-item",
  "flutter",
] as const;

type Format = (typeof FORMATS)[number];

function writeOutput(
  theme: Theme,
  opts: {
    format: Format;
    output?: string;
    shadcn?: boolean;
    fallback?: boolean;
    mapping?: Mapping;
  },
) {
  const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";

  switch (opts.format) {
    case "json":
      return process.stdout.write(json(theme.toJson()));
    case "css":
      return process.stdout.write(theme.toCss());
    case "tailwind":
      return process.stdout.write(
        theme.toTailwind({
          shadcn: opts.shadcn && { mapping: opts.mapping },
        }),
      );
    case "shadcn":
      return process.stdout.write(
        json(theme.toShadcn({ mapping: opts.mapping })),
      );
    case "registry-item":
      return process.stdout.write(
        json(
          theme.toShadcnRegistryItem({
            fallback: opts.fallback,
            mapping: opts.mapping,
          }),
        ),
      );
    case "flutter":
      return process.stdout.write(theme.toFlutter());
    case "figma":
      return writeFigmaTokens(theme, opts.output ?? "material-theme");
  }
}

// The option combinations that mean nothing, refused in one place.
//
// Each of these was, at some point, an option that silently did nothing: an
// output format has one shadcn-shaped question at most, and the flags that
// answer the others are one keystroke away from a format that has them.
function assertOptionsApply(opts: OptionValues, command: Command) {
  const fail = (message: string): never => {
    console.error(`Error: ${message}`);
    process.exit(1);
  };

  // --shadcn only ever modified the tailwind output.
  if (opts.shadcn && opts.format !== "tailwind")
    fail(
      "--shadcn only applies to --format tailwind. For concrete color values, use --format shadcn.",
    );

  // A mapping only ever reaches the shadcn renderings, and `--format css
  // --mapping mine.json` would otherwise emit the M3 properties as if nothing
  // had been asked for.
  const shadcnFormat =
    opts.format === "shadcn" ||
    opts.format === "registry-item" ||
    (opts.format === "tailwind" && opts.shadcn);

  if (opts.mapping && !shadcnFormat)
    fail(
      "--mapping only applies to --format shadcn|registry-item, or --format tailwind --shadcn.",
    );

  // Same reasoning, and the source matters more here: someone who asked for no
  // fallbacks and got a format that has none anyway would think they had opted
  // out of something. `fallback` defaults to true, so only an explicit
  // --no-fallback counts.
  if (
    command.getOptionValueSource("fallback") === "cli" &&
    opts.format !== "registry-item"
  )
    fail("--no-fallback only applies to --format registry-item.");
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
  .addOption(
    new Option("--format <type>", "Output format")
      .choices(FORMATS)
      .default("figma"),
  )
  .option("--output <dir>", "Output directory (required for figma format)")
  .option(
    "--shadcn",
    "Append the shadcn var() alias block to --format tailwind (for concrete values, use --format shadcn)",
  )
  .action((source: string, opts, command: Command) => {
    assertOptionsApply(opts, command);

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

addThemeOptions(
  addSourceArgument(
    program
      .command("shadcn-apply")
      .description("Theme the shadcn project in the current directory"),
  ).argument(
    "[shadcn-args...]",
    "Options after a `--`, forwarded verbatim to `shadcn add`",
  ),
)
  // `--shadcn-cli` rather than the obvious `--shadcn`, which is taken: the root
  // command has shipped a boolean `--shadcn` since 3.2.0, just above.
  .option(
    "--shadcn-cli <spec>",
    "npx package spec for the shadcn CLI to run (a version, tag, fork or tarball — anything npx resolves)",
    DEFAULT_SHADCN,
  )
  .action((source: string, shadcnArgs: string[], _opts, command: Command) =>
    runApply(source, shadcnArgs, command),
  );

program.parse();
