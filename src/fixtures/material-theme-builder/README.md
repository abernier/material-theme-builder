The JSON files in this directory (`try-XX.json`) are exported directly from the [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/) using its JSON export feature.

They are used in tests to verify conformance of the `builder` implementation against the official Material Theme Builder output.

The `color-match-XX.json` files are the same exports with "Color match - Stay true to my color inputs" on, and `color-match-XX.custom-colors.json` the custom color roles MTB's Flutter export computes for those themes (the JSON export carries none). Rather than clicked out of the website, they were computed by MTB's own code: `scripts/mtb-export.mjs` loads the site's compiled `main.dart.js` in Node and calls the function its JSON export button calls. Against the same build, that script reproduces every `try-XX.json` above byte for byte (`description` aside, which carries the export date) -- see its header for the build and how to rerun it.
