import { Command, Option } from "commander";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { addThemeOptions, themeFrom } from "./cli.options";
import {
  addChainOptions,
  applyPlan,
  chainOptionsFrom,
  initPlan,
  mergeDefaults,
  ownOptionIn,
  renderChain,
  type Plan,
  type Step,
} from "./cli.shadcn";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * The options `shadcn init` would be spawned with — the merged list, without the
 * `npx --yes shadcn@latest init` in front of it.
 */
const initArgs = (forwarded: string[] = []) => {
  const argv = spawnArgv(initPlan("#769CDF", forwarded))[0] ?? [];
  return argv.slice(argv.indexOf("init") + 1);
};

/** Every `spawn` step's argv, in order. */
const spawnArgv = (plan: Plan) =>
  plan.steps
    .filter(
      (step): step is Extract<Step, { kind: "spawn" }> => step.kind === "spawn",
    )
    .map((step) => step.argv);

describe("shadcn-init › forwarded args", () => {
  it("should inject every default when nothing is forwarded", () => {
    expect(initArgs()).toEqual([
      "--preset",
      "b0",
      "--template",
      "vite",
      "--name",
      "material-theme-app",
      "--yes",
    ]);
  });
});

// The table the merge exists for: either spelling of an option the user
// forwarded has to suppress our default for it, or shadcn is handed two.
describe.each([
  ["--name", "-n", "material-theme-app"],
  ["--template", "-t", "vite"],
  ["--preset", "-p", "b0"],
] as const)("shadcn-init › %s", (long, short, ourValue) => {
  it.each([
    [`${long} mine`, [long, "mine"]],
    [`${short} mine`, [short, "mine"]],
    [`${long}=mine`, [`${long}=mine`]],
  ])("should keep only the user's, given %s", (_, forwarded) => {
    const args = initArgs(forwarded);
    const spellings = args.filter(
      (arg) => arg === long || arg === short || arg.startsWith(`${long}=`),
    );

    expect(spellings).toHaveLength(1);
    expect(args).not.toContain(ourValue);
    expect(args.slice(-forwarded.length)).toEqual(forwarded);
  });
});

describe("shadcn-init › --yes", () => {
  it.each([["--yes"], ["-y"]])(
    "should not be injected twice, given %s",
    (spelling) => {
      expect(
        initArgs([spelling]).filter((arg) => arg === spelling),
      ).toHaveLength(1);
      expect(initArgs([spelling])).not.toContain(
        spelling === "-y" ? "--yes" : "-y",
      );
    },
  );
});

describe("shadcn-init › unrelated flags", () => {
  it("should forward them untouched, suppressing no default", () => {
    const args = initArgs(["--rtl"]);

    expect(args).toEqual([
      "--preset",
      "b0",
      "--template",
      "vite",
      "--name",
      "material-theme-app",
      "--yes",
      "--rtl",
    ]);
  });
});

describe("shadcn-init › the scaffold directory", () => {
  it.each([
    ["nothing forwarded", [], "material-theme-app"],
    ["-n mine", ["-n", "mine"], "mine"],
    ["--name mine", ["--name", "mine"], "mine"],
    ["--name=mine", ["--name=mine"], "mine"],
    // A value attached to a short flag: commander accepts it, so the chain has
    // to `cd` into what shadcn will really create.
    ["-nmine", ["-nmine"], "mine"],
    // Last one wins, as commander reads a repeated option.
    ["two names", ["-n", "first", "--name", "second"], "second"],
  ] as const)("should be %s → %s", (_, forwarded, dir) => {
    expect(initPlan("#769CDF", [...forwarded]).dir).toBe(dir);
  });
});

describe("shadcn-apply", () => {
  it("should inject -y and forward the rest to `shadcn add`", () => {
    const [argv] = spawnArgv(applyPlan("#769CDF", ["--overwrite"]));

    expect(argv).toEqual([
      "npx",
      "--yes",
      "shadcn@latest",
      "add",
      "./mtb.json",
      "--yes",
      "--overwrite",
    ]);
  });

  it("should not inject -y twice", () => {
    // Sliced past `add ./mtb.json`, so that `npx --yes` is not mistaken for one
    // of the options being counted.
    const [argv = []] = spawnArgv(applyPlan("#769CDF", ["-y"]));
    const options = argv.slice(argv.indexOf("add") + 2);

    expect(options).toEqual(["-y"]);
  });

  it("should neither scaffold nor start anything", () => {
    const plan = applyPlan("#769CDF");

    expect(plan.dir).toBeUndefined();
    expect(plan.steps.map((step) => step.kind)).toEqual([
      "item",
      "spawn",
      "rm",
    ]);
  });
});

describe("mergeDefaults()", () => {
  it("should put ours first, so a duplicate it misses still wins downstream", () => {
    const merged = mergeDefaults(
      [{ long: "--name", short: "-n", value: "ours" }],
      ["--no-name"],
    );

    expect(merged).toEqual(["--name", "ours", "--no-name"]);
  });
});

describe("ownOptionIn()", () => {
  const declared = [
    new Option("--print", "print"),
    new Option("--scheme <name>", "scheme"),
    new Option("--no-fallback", "no fallback"),
  ];

  // Ours after the `--` is a mistake worth a message, not something to
  // reinterpret: forwarded verbatim it would come back as an unknown-option
  // error from shadcn, about a flag shadcn has never heard of.
  it.each([
    ["--print", ["-n", "mine", "--print"], "--print"],
    ["--scheme", ["--scheme", "vibrant"], "--scheme"],
    ["--scheme=value", ["--scheme=vibrant"], "--scheme=vibrant"],
    // Declared as a negation, so the flag as typed is what has to be matched.
    ["--no-fallback", ["--no-fallback"], "--no-fallback"],
  ])("should find %s among the forwarded args", (_, forwarded, found) => {
    expect(ownOptionIn(declared, forwarded)).toBe(found);
  });

  it.each([
    ["shadcn's own options", ["-n", "mine", "--rtl", "--overwrite"]],
    ["nothing at all", []],
  ])("should pass %s through", (_, forwarded) => {
    expect(ownOptionIn(declared, forwarded)).toBeUndefined();
  });
});

// A subcommand wired the way `cli.ts` wires one, parsed with `argv`.
//
// Declared under a program that also carries the theme options, because that is
// the arrangement: the same names on the program and on the subcommand, and
// positional options as the only thing that stops the program from matching
// `--scheme` first and handing the subcommand a default theme.
function themeCommand(argv: string[]) {
  let captured: Command | undefined;

  const program = addThemeOptions(
    new Command().argument("<source>"),
  ).enablePositionalOptions();

  addChainOptions(
    addThemeOptions(
      program
        .command("shadcn-apply")
        .argument("<source>")
        .argument("[shadcn-args...]"),
    ),
  ).action((_source, _args, _opts, command: Command) => {
    captured = command;
  });

  program.parse(["shadcn-apply", "#769CDF", ...argv], { from: "user" });

  if (!captured) throw new Error("the action never ran");

  return captured;
}

/** `--flag value` pairs, and bare flags, read back out of an argv. */
function parseFlags(args: string[]) {
  const flags: Record<string, string | true> = {};

  for (let i = 0; i < args.length; i++) {
    const flag = args[i] ?? "";
    const next = args[i + 1];

    if (next !== undefined && !next.startsWith("--")) {
      flags[flag] = next;
      i++;
    } else {
      flags[flag] = true;
    }
  }

  return flags;
}

/** The `> mtb.json` step of a rendered chain. */
const itemStep = (chain: string) =>
  chain.split(" && ").find((step) => step.includes("--format registry-item"));

describe("theme options", () => {
  const given = ["--scheme", "vibrant", "--contrast", "0.5", "--prefix", "my"];

  it("should reach the subcommand rather than the program", () => {
    // The regression `enablePositionalOptions()` exists for: the same option
    // names are declared on both, and only one of them is being asked.
    expect(themeFrom(themeCommand(given)).options.scheme).toBe("vibrant");
  });

  // The pair that can silently diverge now that both exist: what `--print`
  // re-spells, and what the runner hands `builder()`. Checked against each other,
  // not each against a literal.
  it("should describe the same theme they generate", () => {
    const theme = themeFrom(themeCommand([...given, "--no-fallback"]));
    const spelled = parseFlags(theme.args);

    expect(spelled["--scheme"]).toBe(theme.options.scheme);
    expect(Number(spelled["--contrast"])).toBe(theme.options.contrast);
    expect(spelled["--prefix"]).toBe(theme.options.prefix);
    expect("--no-fallback" in spelled).toBe(!theme.fallback);
    expect(theme.fallback).toBe(false);
  });

  it("should carry into the printed item step, ahead of --format", () => {
    const theme = themeFrom(themeCommand([...given, "--no-fallback"]));

    expect(itemStep(renderChain(applyPlan("#769CDF", [], { theme })))).toBe(
      "npx --yes material-theme-builder '#769CDF' --scheme vibrant --contrast 0.5 --no-fallback --prefix my --format registry-item > mtb.json",
    );
  });

  it("should leave --shadcn-cli out of the item step", () => {
    // That line generates the registry item; which shadcn installs it is a
    // question about the step after.
    const theme = themeFrom(themeCommand(given));
    const plan = applyPlan("#769CDF", [], { theme, shadcn: "shadcn@4.18.0" });

    expect(itemStep(renderChain(plan))).toBe(
      "npx --yes material-theme-builder '#769CDF' --scheme vibrant --contrast 0.5 --prefix my --format registry-item > mtb.json",
    );
  });

  it("should render nothing when none was given", () => {
    // A printed line restating every default would read as though the defaults
    // had been asked for.
    const theme = themeFrom(themeCommand([]));

    expect(theme.args).toEqual([]);
    expect(theme.fallback).toBe(true);
    expect(theme.options.scheme).toBe("tonalSpot");
    expect(itemStep(renderChain(applyPlan("#769CDF", [], { theme })))).toBe(
      "npx --yes material-theme-builder '#769CDF' --format registry-item > mtb.json",
    );
  });
});

// The anti-drift check: `--print` is only trustworthy if it cannot describe
// something other than what the runner would do. Both read one `Plan`, so it is
// enough to assert every spawned argv appears in the printed line, verbatim.
describe.each([
  ["shadcn-init", initPlan],
  ["shadcn-apply", applyPlan],
] as const)("renderChain() › %s", (_, plan) => {
  it("should contain the argv of every step it would spawn", () => {
    const built = plan("#769CDF", ["-n", "my app"]);
    const line = renderChain(built);

    for (const argv of spawnArgv(built)) {
      // `my app` needs quoting to survive a shell, and so does the color's `#`
      // -- the point is that every token is there, in order, in one piece.
      expect(line).toContain(
        argv
          .map((arg) => (/^[\w@%+=:,./-]+$/.test(arg) ? arg : `'${arg}'`))
          .join(" "),
      );
    }

    expect(line).toContain("'#769CDF'");
  });
});

describe("renderChain() › init", () => {
  it("should read as the chain the README documents", () => {
    expect(renderChain(initPlan("#769CDF"))).toBe(
      "npx --yes shadcn@latest init --preset b0 --template vite --name material-theme-app --yes && " +
        "cd material-theme-app && " +
        "npx --yes material-theme-builder '#769CDF' --format registry-item > mtb.json && " +
        "npx --yes shadcn@latest add ./mtb.json --yes && " +
        "rm mtb.json && " +
        "npm run dev",
    );
  });
});

/** The `npx` package spec each shadcn spawn of a plan runs, in order. */
const shadcnSpecs = (plan: Plan) =>
  spawnArgv(plan)
    .filter(([command]) => command === "npx")
    .map((argv) => argv[2]);

describe("--shadcn-cli <spec>", () => {
  const pinned = { shadcn: "shadcn@4.18.0" };

  // Both of init's, not just the scaffold: a chain pinned for `init` and floating
  // for the `add` that installs into it is worse than one that floats throughout.
  it("should pin every shadcn spawn of the chain", () => {
    expect(shadcnSpecs(initPlan("#769CDF", [], pinned))).toEqual([
      "shadcn@4.18.0",
      "shadcn@4.18.0",
    ]);
    expect(shadcnSpecs(applyPlan("#769CDF", [], pinned))).toEqual([
      "shadcn@4.18.0",
    ]);
  });

  it("should default to shadcn@latest", () => {
    expect(shadcnSpecs(initPlan("#769CDF"))).toEqual([
      "shadcn@latest",
      "shadcn@latest",
    ]);
    expect(chainOptionsFrom(themeCommand([])).shadcn).toBe("shadcn@latest");
  });

  it("should be read off the command", () => {
    expect(
      chainOptionsFrom(themeCommand(["--shadcn-cli", "shadcn@next"])).shadcn,
    ).toBe("shadcn@next");
  });
});

// The built binary, on the invocations that have to keep behaving exactly as
// they did before the subcommands existed. Offline and fast -- the chains
// themselves reach the network, so they are never run here.
describe("cli › backward compatibility", () => {
  const cli = path.join(here, "..", "dist", "cli.js");
  // stderr piped rather than inherited, so the two guard messages below land in
  // the thrown error instead of in the suite's own output.
  const run = (args: string[]) =>
    execFileSync(process.execPath, [cli, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

  it.runIf(fs.existsSync(cli)).each([
    ["--format css", ["--format", "css"], ":root {"],
    ["--format json", ["--format", "json"], '"seed"'],
    ["--format tailwind", ["--format", "tailwind"], "@theme inline"],
    [
      "--format tailwind --shadcn",
      ["--format", "tailwind", "--shadcn"],
      "--card: var(--md-sys-color-surface-container-low)",
    ],
    ["--format shadcn", ["--format", "shadcn"], '"card"'],
    [
      "--format registry-item",
      ["--format", "registry-item"],
      "var(--md-sys-color-surface-container-low, oklch(",
    ],
    [
      "--format registry-item --no-fallback",
      ["--format", "registry-item", "--no-fallback"],
      '"card": "var(--md-sys-color-surface-container-low)"',
    ],
    // The one theme option the subcommands deliberately do not have, so the only
    // place it can be checked is here.
    [
      "--custom-colors",
      [
        "--custom-colors",
        '[{"name":"brand","hex":"#FF5733","blend":true}]',
        "--format",
        "css",
      ],
      "--md-sys-color-brand:",
    ],
    ["--scheme vibrant", ["--scheme", "vibrant", "--format", "css"], ":root {"],
  ] as const)("should still answer `%s`", (_, args, expected) => {
    expect(run(["#6750A4", ...args])).toContain(expected);
  });

  it.runIf(fs.existsSync(cli))(
    "should still guard the option combinations",
    () => {
      for (const args of [
        ["--format", "json", "--shadcn"],
        ["--format", "css", "--no-fallback"],
      ]) {
        expect(() => run(["#6750A4", ...args])).toThrow(/only applies to/);
      }
    },
  );

  // The library throws on a bad hex; what is checked here is the CLI's answer to
  // one -- a single line from commander with the value quoted, not the stack
  // trace a thrown `Error` from `builder()` would have produced.
  it.runIf(fs.existsSync(cli)).each([
    ["a bad source", ["banana", "--format", "shadcn"], "argument 'source'"],
    [
      "a bad core color",
      ["#6750A4", "--primary", "banana"],
      "option '--primary <hex>'",
    ],
    [
      "a bad custom color",
      ["#6750A4", "--custom-colors", '[{"name":"brand","hex":"banana"}]'],
      "--custom-colors at 0.hex",
    ],
  ] as const)("should refuse %s in one line", (_, args, where) => {
    let message = "";
    try {
      run([...args]);
    } catch (error) {
      message = String((error as { stderr?: string }).stderr ?? error);
    }

    expect(message).toContain(where);
    // The shared clause: commander's parser says "Expected a hex color", zod's
    // refinement "must be a hex color", each reading as its own sentence.
    expect(message).toContain("3, 6 or 8 hex digits");
    expect(message).not.toContain("node_modules");
  });

  it.runIf(fs.existsSync(cli))("should list the subcommands in --help", () => {
    const help = run(["--help"]);

    expect(help).toContain("shadcn-init");
    expect(help).toContain("shadcn-apply");
    expect(help).toContain("<source>");
  });

  // Through the binary because the message has to name the flag the user really
  // typed and the shadcn command it would really have gone to, and only a full
  // parse knows both. Offline: it refuses before spawning anything.
  it.runIf(fs.existsSync(cli)).each([
    [
      "shadcn-init",
      ["shadcn-init", "#769CDF", "--", "--print"],
      "--print",
      "shadcn init",
    ],
    [
      "shadcn-apply",
      ["shadcn-apply", "#769CDF", "--", "--scheme", "vibrant"],
      "--scheme",
      "shadcn add",
    ],
    // `--print` was given on the wrong side of the separator, so the refusal is
    // about `--print` -- not a chain that prints, and not a crash.
    [
      "shadcn-apply, mixed with a real shadcn flag",
      ["shadcn-apply", "#769CDF", "--", "--overwrite", "--print"],
      "--print",
      "shadcn add",
    ],
    // Covered by the same check without it being taught about `--shadcn-cli`,
    // which is the point of reading the declarations rather than a list -- and
    // covered under the new name only, the subcommand having no `--shadcn` of its
    // own to claim.
    [
      "shadcn-apply, --shadcn-cli",
      ["shadcn-apply", "#769CDF", "--", "--shadcn-cli", "shadcn@4.18.0"],
      "--shadcn-cli",
      "shadcn add",
    ],
  ] as const)(
    "should refuse an option of ours after the `--` (%s)",
    (_, args, flag, target) => {
      expect(() => run([...args])).toThrow(
        `${flag} is ours, not shadcn's, so it belongs before the \`--\`. Everything after the separator is handed to \`${target}\` untouched.`,
      );
    },
  );

  // The unprefixed names, which is what habit from every other CLI will type.
  // There is no subcommand to route them to, so they reach the root command as
  // its `<source>`, where the color that follows is one operand too many. An
  // error is the whole point: a theme built from the word "init" would be worse.
  it.runIf(fs.existsSync(cli)).each([["init"], ["apply"]])(
    "should not quietly read `%s` as a source color",
    (name) => {
      expect(() => run([name, "#769CDF"])).toThrow(/too many arguments/);
    },
  );

  // The value reaches `npx` in the position where npx reads its own options, so
  // these two are worth rejecting ourselves rather than letting npx fail at them
  // several seconds later.
  it.runIf(fs.existsSync(cli)).each([
    ["a bare version", ["--shadcn-cli", "4.18.0"], "write 'shadcn@4.18.0'"],
    [
      "a leading dash",
      ["--shadcn-cli", "--overwrite"],
      "cannot start with '-'",
    ],
  ] as const)("should reject %s as a --shadcn-cli spec", (_, args, message) => {
    expect(() => run(["shadcn-apply", "#769CDF", ...args])).toThrow(message);
  });
});
