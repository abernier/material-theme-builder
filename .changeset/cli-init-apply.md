---
"material-theme-builder": minor
---

Two subcommands, so that theming a shadcn project is one command rather than
three:

```sh
$ npx material-theme-builder shadcn-init "#6750A4"   # a new project
$ npx material-theme-builder shadcn-apply "#6750A4"  # a project you already have
```

`shadcn-init` scaffolds a stock shadcn app, themes it and hands over to its dev server —
from nothing to something running, with nothing installed first and nothing to
read beforehand. `shadcn-apply` does the theming half inside a project of your own, and
replaces what the README used to spell out by hand:

```sh
$ npx material-theme-builder "#6750A4" --format registry-item > mtb.json
$ npx shadcn@latest add ./mtb.json && rm mtb.json
```

Same mechanism, same result — the registry item is generated for your source
color with the `var()` fallbacks baked in, and `shadcn add` rewrites the values
inside your existing `:root` and `.dark` blocks in place — minus the temporary
file you had to remember to delete. `--format registry-item` is unchanged and
stays the way to pipe it somewhere else.

The verbs are shadcn's own: there, `init` is the new project and `apply` the
existing one, and https://ui.shadcn.com/create offers exactly that pair of
buttons — so anyone arriving from that page already knows which of these to reach
for. They are prefixed because shadcn is one integration here among Figma, CSS,
Tailwind and Flutter: a bare `init` would read as "initialize
material-theme-builder" rather than "initialize a shadcn project", and it would
spend the shared verb space on one integration, leaving nowhere sensible for a
`tailwind-init` later.

Our `shadcn-apply` does not call `shadcn apply`, though — that command installs
shadcn _presets_, a different artifact with its own schema, where what we
generate is a `registry:theme` item that `shadcn add` installs. Borrowed verb,
unchanged mechanism.

Both take the theme options as well — `--scheme`, `--contrast`, the core-color
overrides, `--prefix`, `--no-fallback` — with the same names and defaults they
have on the root command:

```sh
$ npx material-theme-builder shadcn-apply "#6750A4" --scheme vibrant --contrast 0.5
```

Without them these two commands could only ever install the default theme, which
is the limitation that motivated generating a registry item in the first place:
the item this package _publishes_ is impersonal precisely because it cannot be
asked for a scheme. (`--custom-colors` is not among them, and not by omission —
shadcn's variable set is fixed, so no component reads a custom color and a
registry item cannot carry one.)

Anything after a `--` is forwarded verbatim — to `shadcn init` for `shadcn-init`,
to `shadcn add` for `shadcn-apply` — and the defaults are merged in flag by flag,
in either spelling, so yours replace ours instead of duplicating them:

```sh
$ npx material-theme-builder shadcn-init "#6750A4" -- --template next -n my-app
```

Ours belong before the separator, and one written after it is refused by name
rather than forwarded: `-- --scheme vibrant` gets told where `--scheme` goes,
instead of coming back three seconds later as an unknown-option error from a
shadcn command that has never heard of it.

The one default worth knowing about is `--preset b0`: without a preset, `shadcn
init` stops to ask which component library you want, which would hang a
one-liner. `b0` is Base UI, style nova, neutral, lucide and Inter — the bundle
this repo dogfoods. None of it reaches the mapping, which only ever rewrites the
31 standard color variables every preset writes.

`--shadcn-cli <spec>` says which shadcn to run, defaulting to `shadcn@latest`:

```sh
$ npx material-theme-builder shadcn-apply "#6750A4" --shadcn-cli shadcn@4.18.0
```

Any spec `npx` resolves — a version, a tag, a fork, a tarball — and `shadcn-init` pins
both of its shadcn steps with it, a chain pinned for the scaffold and floating for
the install being worse than one that floats throughout. It is an escape hatch for
the neighbouring versions rather than a time machine, though, and honestly so:
`--preset b0` is itself 4.x vocabulary, so pinning far enough back means passing
that era's preset after the `--` as well.

The `-cli` is not decoration: `--shadcn` is taken, by the root command's boolean
that appends the alias block to `--format tailwind`. Nothing would actually
mis-parse — each command matches only the options it declares — but one word
meaning a boolean here and a package spec there is a trap for whoever reads
`--help` twice, and of the two it is the unreleased one that can give way.

`--print` writes the equivalent shell chain to stdout and runs nothing — for the
docs, for debugging, and for anyone who would rather read what a command is about
to do, or paste it themselves, than let it spawn `npx` on their machine.
