// The `shadcn-apply` subcommand: theme the shadcn project in the current
// directory, from a source color.
//
// A forwarder, and nothing more. It generates a `registry:theme` item for the
// source color, hands it to `shadcn add`, and deletes it. Everything written
// after a `--` goes to `shadcn add` untouched, with no exception -- that being
// the only rule about the separator anyone can hold.

import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { type Command } from "commander";
import { themeFrom } from "./cli.options";
import { builder } from "./lib/builder";

// Spawned rather than assumed installed, so a bare `npx material-theme-builder
// shadcn-apply` works with nothing on disk.
const NPX = ["npx", "--yes"];

/** The shadcn `--shadcn-cli` runs when it is not told otherwise. */
export const DEFAULT_SHADCN = "shadcn@latest";

// `shadcn add` defaults its own `--yes` to *false*, and prompts for
// confirmation on a `registry:theme` item ("You are about to install a new
// theme."). Without this the command is not scriptable and hangs in CI. Ours
// goes first so a forwarded `--no-yes` still wins -- both CLIs are commander,
// which takes the last occurrence of a repeated option.
const YES = "--yes";

// Where the generated registry item lands. `shadcn add` cannot read stdin -- it
// decides between a local file and a registry name on `endsWith(".json") &&
// !isURL(path)` -- so a real file with a real `.json` name is not a matter of
// taste. This runs inside someone's own project, hence a name unlikely to be
// theirs, and a check before writing.
const ITEM = "mtb.json";

/**
 * The argv for the `shadcn add` that installs the generated item.
 *
 * @param shadcn the npx package spec to run
 * @param forwarded args given after the `--`
 */
export function addArgv(shadcn: string, forwarded: string[] = []) {
  return [...NPX, shadcn, "add", `./${ITEM}`, YES, ...forwarded];
}

function fail(message: string, code = 1): never {
  console.error(`Error: ${message}`);
  process.exit(code);
}

function writeItem(source: string, command: Command, file: string) {
  // This runs in a directory full of someone else's files, and this one is both
  // written and deleted. Refusing beats a silent round trip through their file.
  if (fs.existsSync(file))
    fail(
      `${path.basename(file)} already exists and would be overwritten, then deleted. Move it aside first.`,
    );

  // Removed on the way out however we leave -- the happy path deletes it below,
  // this covers a failing `shadcn add`, and neither should leave a scratch file
  // in a project that is not ours. Both are idempotent.
  process.on("exit", () => fs.rmSync(file, { force: true }));

  const { options, fallback, mapping } = themeFrom(command);
  const item = builder(source, options).toShadcnRegistryItem({
    fallback,
    mapping,
  });
  fs.writeFileSync(file, `${JSON.stringify(item, null, 2)}\n`);
}

/**
 * Run the `shadcn-apply` chain.
 *
 * @param source source color in hex format
 * @param forwarded args given after the `--`, for `shadcn add`
 * @param command the invoked subcommand, read for its own options
 */
export function runApply(
  source: string,
  forwarded: string[],
  command: Command,
) {
  const file = path.resolve(ITEM);
  writeItem(source, command, file);

  // The argv verbatim, no interpolation into a shell: the source color and the
  // forwarded args are both user input.
  const [bin = "", ...args] = addArgv(command.opts().shadcnCli, forwarded);
  const { error, status } = spawnSync(bin, args, {
    stdio: "inherit",
    shell: false,
  });

  if (error) fail(`shadcn add could not be started: ${error.message}`);
  if (status !== 0) fail("shadcn add failed", status ?? 1);

  fs.rmSync(file, { force: true });
}
