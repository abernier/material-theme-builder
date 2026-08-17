// The `init` and `apply` subcommands -- the two ways to get a shadcn project
// themed from a source color, named after shadcn's own vocabulary for which is
// which rather than a verb of our own:
//
//   init|create   initialize your project and install dependencies   (new project)
//   apply         apply a preset to an existing project              (existing project)
//
// https://ui.shadcn.com/create offers exactly that pair -- its "New Project"
// button copies `shadcn init --preset b0 --template vite`, its "Existing
// Project" button `shadcn apply --preset b0` -- so anyone arriving from there
// already knows which of ours to reach for. A third naming ("try", "setup")
// would only be one more to learn.
//
// Both chains end in `shadcn add` on a registry item generated in-process for
// the source color: that is the one gesture which rewrites the values inside a
// project's existing `:root` and `.dark` blocks in place, rather than asking an
// `@import` to win a cascade it is usually placed too early to win. See
// `buildShadcnRegistryItem()`.
//
// Our `apply` deliberately does *not* shell out to `shadcn apply`, tempting as
// the symmetry is: that command applies shadcn *presets* -- a different artifact
// with its own schema and its own `--only theme,font` semantics -- and what we
// have is a `registry:theme` item, which only `shadcn add` installs. The verb is
// borrowed; the mechanism stays `add`.

import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import type { Command, Option } from "commander";
import { themeFrom, type Theme } from "./cli.options";
import { builder } from "./lib/builder";

// Spawned rather than assumed installed, so a bare `npx material-theme-builder
// init` works with nothing on disk. `--yes` because the whole point is a command
// that does not stop to ask.
const NPX = ["npx", "--yes"];
const SHADCN = "shadcn@latest";
const SELF = "material-theme-builder";

// The shadcn command each chain ends up in, named once: it labels the step in an
// error message, and it is what a refused option is told it would have gone to.
const INIT_TARGET = "shadcn init";
const ADD_TARGET = "shadcn add";

// Where the generated registry item lands, relative to the project being
// themed. `shadcn add` cannot read stdin -- it decides between a local file and
// a registry name on `endsWith(".json") && !isURL(path)` -- so a real file with
// a real `.json` name is not a matter of taste. `apply` runs inside someone's
// own project, hence a name unlikely to be theirs, and a check before writing.
const ITEM = "mtb.json";

// The directory `init` scaffolds into, when the user names none. Named after
// what it is rather than after the verb that made it -- a directory called
// `material-theme-init` would be the command's name showing through into
// someone's file tree.
const APP_NAME = "material-theme-app";

/** A `shadcn` option we default, in both of the spellings it answers to. */
type Defaulted = {
  /** e.g. `--name` */
  long: string;
  /** e.g. `-n` */
  short: string;
  /** omitted for a boolean flag */
  value?: string;
};

const NAME: Defaulted = { long: "--name", short: "-n", value: APP_NAME };
const YES: Defaulted = { long: "--yes", short: "-y" };

// `--preset b0` is the load-bearing default: with no preset, `shadcn init`
// prompts for the component library even though its own `-y` already defaults to
// true ("? Select a component library >  Base UI (Recommended)"), which would
// hang the one-liner this command exists to be. `b0` is a preset *code* --
// `shadcn preset decode b0` reads it back as Base UI, style nova, neutral base,
// theme and chart colors, lucide, Inter, default radius -- so it picks the whole
// style bundle, not just a name. None of that reaches our mapping, which rewrites
// only the 31 standard color variables every preset writes; `b0` is simply the
// preset this repo dogfoods.
//
// `--yes` is redundant against today's shadcn, where it already defaults to
// true, and passed anyway: the printed chain has to stay non-interactive on its
// own terms rather than on an upstream default that could move.
const INIT_DEFAULTS: Defaulted[] = [
  { long: "--preset", short: "-p", value: "b0" },
  { long: "--template", short: "-t", value: "vite" },
  NAME,
  YES,
];

// `shadcn add` has no prompt worth pre-answering beyond confirmation, so this is
// the whole list.
const ADD_DEFAULTS: Defaulted[] = [YES];

// ─── Argument merging ────────────────────────────────────────────────────

// Whether the forwarded args already spell an option, in either form. Both have
// to count: `-n my-app` must suppress `--name`, or shadcn is handed two names
// and the chain `cd`s into the wrong directory. A value attached to a short flag
// (`-nmy-app`) counts too -- commander accepts it, so someone will write it.
function mentions(args: string[], { long, short }: Defaulted) {
  return args.some(
    (arg) =>
      arg === long || arg.startsWith(`${long}=`) || arg.startsWith(short),
  );
}

/**
 * Merge our defaults into the args forwarded after the `--`, flag by flag,
 * injecting each only where the user spelled none themselves.
 *
 * Not a mirror of shadcn's own options, deliberately: `shadcn init` has
 * eighteen, several of which collide with names we already use (`-p/--preset`
 * against our `--primary`), and redeclaring them would mean tracking their
 * majors. The `--` separator says "the rest is theirs", the POSIX way, and this
 * is the only thing we do to that side of it.
 *
 * Ours go first so that the user's win on any duplicate this fails to notice:
 * both CLIs are commander, and commander takes the last occurrence of a repeated
 * option. That is also what makes a forwarded `--no-yes` work -- unrecognized as
 * a spelling of `--yes`, injected against, and then overridden anyway.
 */
export function mergeDefaults(defaults: Defaulted[], forwarded: string[]) {
  const injected = defaults
    .filter((option) => !mentions(forwarded, option))
    .flatMap(({ long, value }) =>
      value === undefined ? [long] : [long, value],
    );

  return [...injected, ...forwarded];
}

// The name `shadcn init` will really use, read back off the merged args rather
// than tracked alongside them -- the chain has to `cd` into the directory shadcn
// actually creates. Scanning from the end mirrors commander's last-one-wins, and
// covers the three ways to spell a value.
function lastName(args: string[]) {
  for (let i = args.length - 1; i >= 0; i--) {
    const arg = args[i] ?? "";

    if (arg === NAME.long || arg === NAME.short) return args[i + 1];
    if (arg.startsWith(`${NAME.long}=`)) return arg.slice(NAME.long.length + 1);
    if (arg.length > NAME.short.length && arg.startsWith(NAME.short))
      return arg.slice(NAME.short.length);
  }

  return undefined;
}

/**
 * The first of `declared` found among the args forwarded after the `--`, as it
 * was written.
 *
 * A refusal, not a rescue. `init '#x' -- --print` used to be read as though the
 * flag had been written before the separator, which made "everything after `--`
 * is theirs" true except once — and an except-once rule is one nobody can hold.
 * Reading those args in order to *decline* them leaves the separator's meaning
 * exactly as it was; it is reinterpreting one of them that quietly redefined it.
 * The refusal also gets to say what to do, where the alternative is an
 * unknown-option error from shadcn three seconds later, about a flag it has never
 * heard of.
 *
 * Matched against what the subcommand declares rather than a list kept here, so
 * it covers every option either one gains without being edited — which is how
 * `-- --scheme vibrant` comes to be refused clearly rather than forwarded into a
 * confusing failure.
 *
 * The cost of making the rule absolute: if shadcn ever adds an option we also
 * declare, this refuses to forward it. Nothing collides today — none of
 * `--scheme`, `--contrast`, `--primary`, `--print` or the rest appears in
 * `shadcn init` or `shadcn add`. If one does, the fix is to rename ours, not to
 * soften this back into a special case.
 */
export function ownOptionIn(declared: readonly Option[], forwarded: string[]) {
  return forwarded.find((arg) =>
    declared.some(
      (option) =>
        arg === option.long ||
        arg === option.short ||
        (option.long !== undefined && arg.startsWith(`${option.long}=`)),
    ),
  );
}

function refuseOwnOptions(
  command: Command,
  forwarded: string[],
  target: string,
) {
  const misplaced = ownOptionIn(command.options, forwarded);

  if (misplaced !== undefined)
    fail(
      `${misplaced} is ours and must come before the \`--\`. Everything after the separator goes to \`${target}\`.`,
    );
}

// ─── The chain, as data ──────────────────────────────────────────────────

/**
 * One step of a chain.
 *
 * `spawn` steps carry the argv verbatim -- no interpolation into a shell, the
 * source color and the forwarded args both being user input.
 */
export type Step =
  | { kind: "spawn"; label: string; argv: string[]; where: "cwd" | "project" }
  | { kind: "cd"; dir: string }
  | { kind: "item"; file: string }
  | { kind: "rm"; file: string };

/**
 * A chain: the steps in order, plus what the registry item is generated from.
 *
 * The one description both `--print` and the runner read, so the two cannot
 * disagree about what would happen -- which is the only thing that makes
 * `--print` trustworthy as an eject hatch.
 */
export type Plan = {
  /** The source color the registry item is generated from. */
  source: string;
  /** The theme options it is generated with. */
  theme: Theme;
  /** The directory this chain scaffolds and then works in, if it scaffolds one. */
  dir?: string;
  steps: Step[];
};

// A theme asked for at every default -- what both plans describe when no theme
// option was given, and what the tests below build on.
const DEFAULT_THEME: Theme = { options: {}, fallback: true, args: [] };

/**
 * The `init` chain: scaffold a stock shadcn app, theme it, and hand over to its
 * dev server.
 *
 * The forwarded args go to `shadcn init` -- the step whose options anyone would
 * want to reach (`--template next`, `-n my-app`, another `--preset`). The
 * `shadcn add` in the middle gets only our defaults; nothing about it is worth
 * configuring from out here.
 */
export function initPlan(
  source: string,
  forwarded: string[] = [],
  theme: Theme = DEFAULT_THEME,
): Plan {
  const args = mergeDefaults(INIT_DEFAULTS, forwarded);
  const dir = lastName(args) ?? APP_NAME;

  return {
    source,
    theme,
    dir,
    steps: [
      {
        kind: "spawn",
        label: INIT_TARGET,
        argv: [...NPX, SHADCN, "init", ...args],
        where: "cwd",
      },
      { kind: "cd", dir },
      { kind: "item", file: ITEM },
      {
        kind: "spawn",
        label: ADD_TARGET,
        argv: [
          ...NPX,
          SHADCN,
          "add",
          `./${ITEM}`,
          ...mergeDefaults(ADD_DEFAULTS, []),
        ],
        where: "project",
      },
      { kind: "rm", file: ITEM },
      // The handover: long-running by design, stdio inherited, ctrl-C reaching
      // it. Package-manager detection is out of scope -- `shadcn init` under
      // `npx` writes a `package-lock.json` and the `dev` script npm will run.
      {
        kind: "spawn",
        label: "npm run dev",
        argv: ["npm", "run", "dev"],
        where: "project",
      },
    ],
  };
}

/**
 * The `apply` chain: theme the project the command is run from, and stop there.
 *
 * No scaffold and no dev server -- this is someone's own project, already
 * running or not, and the only thing it wants is its CSS rewritten. It replaces
 * the three-command incantation the README used to document (generate to a file,
 * `shadcn add` it, remember to delete it), the last part of which is exactly the
 * kind of thing a CLI should be doing for you.
 *
 * The forwarded args go to `shadcn add` here, that being the only command in the
 * chain: `--overwrite`, `--dry-run`, `-c/--cwd`, `-p/--path` and `-s/--silent`
 * all reach it untouched.
 */
export function applyPlan(
  source: string,
  forwarded: string[] = [],
  theme: Theme = DEFAULT_THEME,
): Plan {
  return {
    source,
    theme,
    steps: [
      { kind: "item", file: ITEM },
      {
        kind: "spawn",
        label: ADD_TARGET,
        argv: [
          ...NPX,
          SHADCN,
          "add",
          `./${ITEM}`,
          ...mergeDefaults(ADD_DEFAULTS, forwarded),
        ],
        where: "cwd",
      },
      { kind: "rm", file: ITEM },
    ],
  };
}

// ─── Printing ────────────────────────────────────────────────────────────

// Bare where a shell would leave the argument alone, single-quoted otherwise.
// The source color is the reason this exists: an unquoted `#769CDF` is a comment
// and takes the rest of the line with it.
const SHELL_SAFE = /^[\w@%+=:,./-]+$/;

function quote(argv: string[]) {
  return argv
    .map((arg) =>
      SHELL_SAFE.test(arg) ? arg : `'${arg.replaceAll("'", `'\\''`)}'`,
    )
    .join(" ");
}

function renderStep(plan: Plan, step: Step) {
  switch (step.kind) {
    case "spawn":
      return quote(step.argv);
    case "cd":
      return `cd ${step.dir}`;
    // Rendered as the command someone could have run themselves -- theme options
    // included, or the line would describe a different theme from the one the
    // runner generates. The runner does the same thing in-process, being the very
    // binary this spawns.
    case "item":
      return `${quote([...NPX, SELF, plan.source, ...plan.theme.args, "--format", "registry-item"])} > ${step.file}`;
    case "rm":
      return `rm ${step.file}`;
  }
}

/**
 * The chain as a shell one-liner -- what `--print` writes.
 *
 * For docs, for debugging, and for anyone who would rather read what a command
 * is about to do than let it spawn `npx` on their machine. Rendered from the
 * same `Plan` the runner walks, so what it shows is what would run.
 */
export function renderChain(plan: Plan) {
  return plan.steps.map((step) => renderStep(plan, step)).join(" && ");
}

// ─── Running ─────────────────────────────────────────────────────────────

function fail(message: string, code = 1): never {
  console.error(`Error: ${message}`);
  process.exit(code);
}

function run({ label, argv }: { label: string; argv: string[] }, cwd: string) {
  const [command = "", ...args] = argv;
  const { error, status, signal } = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });

  if (error) fail(`${label} could not be started: ${error.message}`);
  // Not a failure to report: a signal here is the user stopping the dev server
  // they were handed. Exit as a shell would have, and say nothing.
  if (signal) process.exit(128 + (os.constants.signals[signal] ?? 0));
  if (status !== 0) fail(`${label} failed`, status ?? 1);
}

function writeItem({ source, theme }: Plan, file: string) {
  // `apply` runs in a directory full of someone else's files, and this one is
  // both written and deleted. Refusing beats a silent round trip through their
  // file.
  if (fs.existsSync(file))
    fail(
      `${path.basename(file)} already exists and would be overwritten, then deleted. Move it aside first.`,
    );

  // Removed on the way out however we leave -- the `rm` step covers the happy
  // path, this covers a failing `shadcn add`, and neither should leave a
  // scratch file in a project that is not ours. Both are idempotent.
  process.on("exit", () => fs.rmSync(file, { force: true }));

  // `fallback` is honoured rather than forced: someone who always mounts an
  // `<Mtb>` may well prefer a theme that failed to arrive to fail loudly --
  // components rendering transparent -- over silently resolving to colors baked
  // in weeks ago.
  const item = builder(source, theme.options).toShadcnRegistryItem({
    fallback: theme.fallback,
  });
  fs.writeFileSync(file, `${JSON.stringify(item, null, 2)}\n`);
}

function runStep(plan: Plan, step: Step, projectDir: string) {
  switch (step.kind) {
    case "spawn":
      return run(step, step.where === "project" ? projectDir : process.cwd());
    case "item":
      return writeItem(plan, path.join(projectDir, step.file));
    case "rm":
      return fs.rmSync(path.join(projectDir, step.file), { force: true });
    // Nothing to do: the runner resolved the directory up front, where a shell
    // would have changed into it. The step exists so that `--print` can say so.
    case "cd":
      return;
  }
}

function runChain(plan: Plan) {
  const projectDir = plan.dir ? path.resolve(plan.dir) : process.cwd();

  // A plan with a `dir` is a plan that creates it, and `shadcn init` into an
  // existing directory would write over whatever is in there.
  if (plan.dir && fs.existsSync(projectDir))
    fail(
      `./${plan.dir} already exists. Pick another name with \`-- -n other-name\`, or remove it first.`,
    );

  for (const step of plan.steps) runStep(plan, step, projectDir);
}

function execute(plan: Plan, command: Command) {
  if (command.opts().print === true) {
    process.stdout.write(`${renderChain(plan)}\n`);
    return;
  }

  runChain(plan);
}

/**
 * Run — or print — the `init` chain.
 *
 * @param source source color in hex format
 * @param forwarded args given after the `--`, for `shadcn init`
 * @param command the invoked subcommand, read for its own options
 */
export function runInit(source: string, forwarded: string[], command: Command) {
  refuseOwnOptions(command, forwarded, INIT_TARGET);
  execute(initPlan(source, forwarded, themeFrom(command)), command);
}

/**
 * Run — or print — the `apply` chain.
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
  refuseOwnOptions(command, forwarded, ADD_TARGET);
  execute(applyPlan(source, forwarded, themeFrom(command)), command);
}
