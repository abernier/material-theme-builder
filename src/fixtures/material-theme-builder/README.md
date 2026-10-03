The JSON files in this directory (`try-XX.json`) are exported directly from the [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/) using its JSON export feature.

They are used in tests to verify conformance of the `builder` implementation against the official Material Theme Builder output.

The `try-XX.colormatch.json` files are the same inputs exported with "Color match - Stay true to my color inputs" on.

The `*.theme.dart` files are the official Flutter exports (`lib/theme.dart`), kept verbatim: unlike the JSON export, they carry each custom color's roles for every contrast level.
