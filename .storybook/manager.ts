import { PaintBrushAltIcon } from "@storybook/icons";
import { createElement } from "react";
import { IconButton } from "storybook/internal/components";
import { addons, types, useGlobals } from "storybook/manager-api";

const ADDON_ID = "mtb/scheme-overlay";

/**
 * The scheme overlay's on/off switch.
 *
 * `createElement` rather than JSX: Storybook builds the manager with the
 * classic runtime, so JSX here compiles to `React.createElement` -- and the
 * `import React` that needs is precisely what `organize-imports` strips out
 * again, TypeScript having been told `react-jsx`. Two calls are cheaper than
 * arguing with that.
 */
function SchemeOverlayTool() {
  const [globals, updateGlobals] = useGlobals();
  const shown = globals.schemeOverlay === "shown";

  return createElement(
    IconButton,
    {
      active: shown,
      title: "Dock the generated scheme over the story",
      onClick: () =>
        updateGlobals({ schemeOverlay: shown ? "hidden" : "shown" }),
    },
    createElement(PaintBrushAltIcon),
  );
}

/**
 * A `globalTypes` toolbar would have been less code, but it can only render a
 * dropdown — two items deep, for what is one bit. Registering the tool by hand
 * keeps the bit a bit: one icon, pressed or not.
 */
addons.register(ADDON_ID, () => {
  addons.add(ADDON_ID, {
    type: types.TOOL,
    title: "Scheme",
    // Nothing to overlay in docs, where every story renders at once.
    match: ({ viewMode }) => viewMode === "story",
    render: () => createElement(SchemeOverlayTool),
  });
});
