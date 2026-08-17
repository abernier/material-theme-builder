---
"material-theme-builder": minor
---

Two subcommands, so that theming a shadcn project is one command rather than
three:

```sh
$ npx material-theme-builder init "#6750A4"   # a new project
$ npx material-theme-builder apply "#6750A4"  # a project you already have
```

`init` scaffolds a stock shadcn app, themes it and hands over to its dev server —
from nothing to something running, with nothing installed first and nothing to
read beforehand. `apply` does the theming half inside a project of your own, and
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

The names are shadcn's own: there, `init` is the new project and `apply` the
existing one, and https://ui.shadcn.com/create offers exactly that pair of
buttons. Our `apply` does not call `shadcn apply`, though — that command installs
shadcn _presets_, a different artifact with its own schema, where what we
generate is a `registry:theme` item that `shadcn add` installs. Borrowed verb,
unchanged mechanism.

Both take the theme options as well — `--scheme`, `--contrast`, the core-color
overrides, `--prefix`, `--no-fallback` — with the same names and defaults they
have on the root command:

```sh
$ npx material-theme-builder apply "#6750A4" --scheme vibrant --contrast 0.5
```

Without them these two commands could only ever install the default theme, which
is the limitation that motivated generating a registry item in the first place:
the item this package _publishes_ is impersonal precisely because it cannot be
asked for a scheme. (`--custom-colors` is not among them, and not by omission —
shadcn's variable set is fixed, so no component reads a custom color and a
registry item cannot carry one.)

Anything after a `--` is forwarded verbatim — to `shadcn init` for `init`, to
`shadcn add` for `apply` — and the defaults are merged in flag by flag, in either
spelling, so yours replace ours instead of duplicating them:

```sh
$ npx material-theme-builder init "#6750A4" -- --template next -n my-app
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

`--print` writes the equivalent shell chain to stdout and runs nothing — for the
docs, for debugging, and for anyone who would rather read what a command is about
to do, or paste it themselves, than let it spawn `npx` on their machine.
