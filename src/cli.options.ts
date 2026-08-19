// The color-theme options -- the ones that describe *a theme* rather than what
// to do with it -- declared once, and read back where they are needed.
//
// They were inline on the root command until two commands needed them: the root
// command and `shadcn-apply` both end up calling `builder()`. Written out twice,
// one copy would be a release behind the other, and eleven descriptions is
// exactly the kind of thing nobody re-reads.
//
// `--custom-colors` is deliberately *not* one of them. shadcn's variable set is
// fixed, so no component reads a custom color and a registry item cannot carry
// one -- `buildShadcn()` says as much. It stays on the root command, where
// `--format json|css|figma|tailwind` really do emit them. An option that provably
// does nothing would be worse than a missing one.

import * as fs from "node:fs";

import {
  InvalidArgumentError,
  Option,
  type Command,
  type OptionValues,
} from "commander";
import { z } from "zod";

import {
  DEFAULT_CONTRAST,
  DEFAULT_PREFIX,
  DEFAULT_SCHEME,
  isHexColor,
  schemeNames,
  type Mapping,
  type MtbConfig,
} from "./lib/builder";

// A flat object of strings, and no more: the M3 token each name is checked
// against is the theme's business -- `builder()` knows which tokens exist,
// including this theme's custom colors, and says so by name. Here it is only the
// *shape* that has to be right, so that a JSON array or a nested object is
// refused as such rather than reaching the builder as an unreadable mapping.
const mappingSchema = z.record(
  z.string(),
  z.string(),
) satisfies z.ZodType<Mapping>;

/**
 * Commander parser for `--mapping` — a path to a JSON file.
 *
 * A file rather than an inline `<json>` like `--custom-colors`: a mapping is
 * thirty-odd lines someone keeps and edits, not something typed at a prompt.
 *
 * Read and checked here, at parse time, so a missing file or a stray array is
 * one line with the path in it -- the same reason `parseHexColor()` restates
 * what `builder()` already enforces.
 */
export function parseMappingFile(file: string): Mapping {
  let contents: string;
  try {
    contents = fs.readFileSync(file, "utf8");
  } catch {
    throw new InvalidArgumentError(`could not read '${file}'.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new InvalidArgumentError(`'${file}' is not valid JSON.`);
  }

  const result = mappingSchema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue?.path.length ? ` at ${issue.path.join(".")}` : "";
    throw new InvalidArgumentError(
      `'${file}'${where}: ${issue?.message ?? "is invalid"}. Expected an object of CSS variable to M3 token, e.g. {"--primary": "tertiary"}.`,
    );
  }

  return result.data;
}

/**
 * Commander parser for a hex color — the `<source>` argument, and every
 * core-color override.
 *
 * `builder()` checks these as well, and that is not a redundant check but a
 * second *presentation*. The library has to refuse garbage on its own account:
 * `<Mtb source="banana">` and a programmatic caller both need it, and Material
 * Color Utilities silently themes `banana` as `#ba0000` if nobody looks. But a
 * thrown `Error` reaches someone at a terminal as a stack trace out of
 * `node_modules`, which is no way to be told about a typo — so the same rule is
 * stated once more here, where commander turns it into one line with the
 * offending value quoted.
 */
export function parseHexColor(value: string) {
  if (!isHexColor(value))
    throw new InvalidArgumentError(
      "Expected a hex color — 3, 6 or 8 hex digits, with or without '#' (e.g. #6750A4).",
    );

  return value;
}

/**
 * Declare the `<source>` argument, the one input all three commands share.
 *
 * Here rather than written out per command, for the same reason the options are:
 * the description and the parser have to be the same on all three, and a
 * `<source>` that skipped the parser on one of them would answer a typo there
 * with the stack trace this exists to avoid.
 */
export function addSourceArgument(command: Command) {
  return command.argument(
    "<source>",
    "Source color in hex format (e.g. #6750A4)",
    parseHexColor,
  );
}

/** The `builder()` argument, minus the parts the CLI assembles separately. */
export type ThemeOptions = Omit<MtbConfig, "source" | "customColors">;

/** Everything a registry item is generated from. */
export type Theme = {
  options: ThemeOptions;
  /** Whether the item bakes this theme's colors in as the `var()` fallbacks. */
  fallback: boolean;
  /** Variables to map differently, merged over the shadcn preset. */
  mapping?: Mapping;
};

/**
 * Declare the color-theme options on `command`.
 *
 * The same names, types, defaults and help text wherever they appear, which is
 * the point of there being one of these.
 */
export function addThemeOptions(command: Command) {
  return command
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
    .option("--primary <hex>", "Primary color override", parseHexColor)
    .option("--secondary <hex>", "Secondary color override", parseHexColor)
    .option("--tertiary <hex>", "Tertiary color override", parseHexColor)
    .option("--error <hex>", "Error color override", parseHexColor)
    .option("--neutral <hex>", "Neutral color override", parseHexColor)
    .option(
      "--neutral-variant <hex>",
      "Neutral variant color override",
      parseHexColor,
    )
    .option(
      "--mapping <file>",
      'JSON file of shadcn variable to M3 token, merged over the defaults (e.g. {"--primary": "tertiary"})',
      parseMappingFile,
    )
    .option(
      "--no-fallback",
      "Omit this theme's colors as the var() fallbacks in the registry item, so it renders nothing without an <Mtb> above it",
    )
    .option(
      "--prefix <string>",
      "CSS variable prefix (e.g. md → --md-sys-color-*, --md-ref-palette-*)",
      DEFAULT_PREFIX,
    );
}

/**
 * The `builder()` argument, from parsed CLI options.
 *
 * Spelled out rather than passed through wholesale: commander's option bag also
 * carries `--format` and the rest, and `builder()` should be handed what it
 * takes and nothing else.
 */
export function builderOptions(opts: OptionValues): ThemeOptions {
  return {
    scheme: opts.scheme,
    contrast: opts.contrast,
    primary: opts.primary,
    secondary: opts.secondary,
    tertiary: opts.tertiary,
    error: opts.error,
    neutral: opts.neutral,
    neutralVariant: opts.neutralVariant,
    prefix: opts.prefix,
  };
}

/**
 * Everything the registry item is generated from, read off `command`.
 *
 * @param command the invoked command, after parsing
 */
export function themeFrom(command: Command): Theme {
  const opts = command.opts();

  return {
    options: builderOptions(opts),
    // Declared as a negation, so commander's own default here is `true` -- the
    // opposite of the API's, and deliberately so: a CLI knows the source color,
    // which is what makes baking its colors in as the fallbacks free. See
    // `buildShadcnRegistryItem()`.
    fallback: opts.fallback ?? true,
    mapping: opts.mapping,
  };
}
