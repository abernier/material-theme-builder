// The color-theme options -- the ones that describe *a theme* rather than what
// to do with it -- declared once, and read back for two purposes.
//
// They were inline on the root command until three commands needed them: the
// root command, `init` and `apply` all end up calling `builder()`. Written out
// three times, one copy would be a release behind the others, and eleven
// descriptions is exactly the kind of thing nobody re-reads. `--print` gives the
// subcommands a second reason to know the list rather than just declare it: the
// chain it prints has to re-spell whatever was given.
//
// `--custom-colors` is deliberately *not* one of them. shadcn's variable set is
// fixed, so no component reads a custom color and a registry item cannot carry
// one -- `buildShadcn()` says as much. It stays on the root command, where
// `--format json|css|figma|tailwind` really do emit them. An option that provably
// does nothing would be worse than a missing one.

import { Command, Option, type OptionValues } from "commander";

import {
  DEFAULT_CONTRAST,
  DEFAULT_PREFIX,
  DEFAULT_SCHEME,
  schemeNames,
  type MtbConfig,
} from "./lib/builder";

/** The `builder()` argument, minus the parts the CLI assembles separately. */
export type ThemeOptions = Omit<MtbConfig, "source" | "customColors">;

/**
 * Everything a registry item is generated from, in both forms the chain needs:
 * what `builder()` is handed, and how to say the same thing in a shell.
 */
export type Theme = {
  options: ThemeOptions;
  /** Whether the item bakes this theme's colors in as the `var()` fallbacks. */
  fallback: boolean;
  /**
   * The options as `--print` re-spells them — only the ones actually given, a
   * printed line restating every default being noise rather than information.
   */
  args: string[];
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
    .option("--primary <hex>", "Primary color override")
    .option("--secondary <hex>", "Secondary color override")
    .option("--tertiary <hex>", "Tertiary color override")
    .option("--error <hex>", "Error color override")
    .option("--neutral <hex>", "Neutral color override")
    .option("--neutral-variant <hex>", "Neutral variant color override")
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

// What counts as a theme option, asked of a throwaway command rather than
// written down a second time: the answer is whatever `addThemeOptions()`
// declares, and a list that cannot be edited on its own cannot fall behind.
const THEME_OPTIONS = addThemeOptions(new Command()).options;

/**
 * The `builder()` argument, from parsed CLI options.
 *
 * Spelled out rather than passed through wholesale: commander's option bag also
 * carries `--format`, `--print` and the rest, and `builder()` should be handed
 * what it takes and nothing else.
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
 * The theme options actually given on the command line, re-spelled as argv.
 *
 * `getOptionValueSource()` is what separates "given" from "defaulted" —
 * commander records where each value came from, and only `"cli"` is the user
 * saying so. Without it, `--print` would show a line restating every default,
 * which reads as though they had been asked for.
 */
export function specifiedThemeArgs(command: Command) {
  const args: string[] = [];

  for (const option of THEME_OPTIONS) {
    const name = option.attributeName();

    if (command.getOptionValueSource(name) !== "cli") continue;
    if (option.long) args.push(option.long);
    // `--no-fallback` is a negation: the flag is the whole statement, and there
    // is no `--fallback` to spell the other way round.
    if (!option.negate) args.push(String(command.opts()[name]));
  }

  return args;
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
    args: specifiedThemeArgs(command),
  };
}
