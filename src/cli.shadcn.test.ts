import { Command } from "commander";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { addThemeOptions, themeFrom } from "./cli.options";
import { addArgv, addChainOptions } from "./cli.shadcn";

const here = path.dirname(fileURLToPath(import.meta.url));

/** The args `shadcn add` is really spawned with, past its own name. */
const added = (forwarded: string[] = []) => {
  const argv = addArgv("shadcn@latest", forwarded);
  return argv.slice(argv.indexOf("add") + 1);
};

describe("addArgv()", () => {
  it("should run the pinned shadcn under npx", () => {
    expect(addArgv("shadcn@4.18.0").slice(0, 4)).toEqual([
      "npx",
      "--yes",
      "shadcn@4.18.0",
      "add",
    ]);
  });

  it("should install the generated item by relative path", () => {
    // `shadcn add` decides between a local file and a registry name on
    // `endsWith(".json") && !isURL(path)`, so the `./` and the extension are
    // both load-bearing.
    expect(added()[0]).toBe("./mtb.json");
  });

  it("should pass --yes, which shadcn add defaults to false", () => {
    // Without it, `shadcn add` prompts on a `registry:theme` item and the
    // command hangs in CI.
    expect(added()).toContain("--yes");
  });

  it("should forward everything after the `--`, verbatim and in order", () => {
    expect(added(["--overwrite", "-p", "src/app", "--dry-run"])).toEqual([
      "./mtb.json",
      "--yes",
      "--overwrite",
      "-p",
      "src/app",
      "--dry-run",
    ]);
  });

  it("should put --yes ahead of the forwarded args, so they can win", () => {
    // Both CLIs are commander, which takes the last occurrence of a repeated
    // option -- which is what makes a forwarded `--no-yes` work.
    const args = added(["--no-yes"]);

    expect(args.indexOf("--yes")).toBeLessThan(args.indexOf("--no-yes"));
  });
});

describe("theme options", () => {
  const command = (argv: string[]) => {
    const parsed = addChainOptions(addThemeOptions(new Command()));
    parsed.parse(argv, { from: "user" });
    return parsed;
  };

  it("should reach the subcommand rather than the program", () => {
    // The regression `enablePositionalOptions()` exists for: the same option
    // names are declared on both, and only one of them is being asked.
    const theme = themeFrom(command(["--scheme", "vibrant", "--prefix", "my"]));

    expect(theme.options.scheme).toBe("vibrant");
    expect(theme.options.prefix).toBe("my");
  });

  it("should default `fallback` to true, being declared as a negation", () => {
    expect(themeFrom(command([])).fallback).toBe(true);
    expect(themeFrom(command(["--no-fallback"])).fallback).toBe(false);
  });
});

// The built binary, on the invocations that have to keep behaving exactly as
// they did. Offline and fast -- the chain itself reaches the network, so it is
// never run here.
describe("cli", () => {
  const cli = path.join(here, "..", "dist", "cli.js");
  // stderr piped rather than inherited, so the guard messages below land in the
  // thrown error instead of in the suite's own output.
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
    // The one theme option the subcommand deliberately does not have, so the
    // only place it can be checked is here.
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

  it.runIf(fs.existsSync(cli))("should list the subcommand in --help", () => {
    const help = run(["--help"]);

    expect(help).toContain("shadcn-apply");
    expect(help).toContain("<source>");
    // Removed in 4.0.0 -- `shadcn init` is shadcn's to run.
    expect(help).not.toContain("shadcn-init");
  });

  // The unprefixed name, which is what habit from every other CLI will type.
  // There is no subcommand to route it to, so it reaches the root command as its
  // `<source>`, where the color that follows is one operand too many. An error
  // is the whole point: a theme built from the word "apply" would be worse.
  it.runIf(fs.existsSync(cli))(
    "should not quietly read `apply` as a source color",
    () => {
      expect(() => run(["apply", "#769CDF"])).toThrow(/too many arguments/);
    },
  );

  // Everything after the separator is shadcn's, without exception -- including
  // an option we happen to declare ourselves. Checked here because only a full
  // parse proves commander does not claim it back.
  it.runIf(fs.existsSync(cli))(
    "should not claim our own options back from after the `--`",
    () => {
      const parsed = addChainOptions(addThemeOptions(new Command()))
        .argument("<source>")
        .argument("[shadcn-args...]");
      parsed.parse(["#769CDF", "--", "--scheme", "vibrant"], { from: "user" });

      expect(parsed.args.slice(1)).toEqual(["--scheme", "vibrant"]);
      expect(parsed.opts().scheme).toBe("tonalSpot");
    },
  );
});
