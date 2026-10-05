import { PaintBrushAltIcon } from "@storybook/icons";
import { createElement, useEffect } from "react";
import { IconButton } from "storybook/internal/components";
import {
  addons,
  types,
  useArgs,
  useArgTypes,
  useGlobals,
  useStorybookApi,
  useStorybookState,
} from "storybook/manager-api";

const ADDON_ID = "mtb/scheme-overlay";
const SCHEME_CONTROL_LOCK_ID = "mtb/scheme-control-lock";

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

/**
 * Disables the `scheme` control while `colorMatch` is on: `colorMatch` takes
 * precedence over `scheme`, so the control would look broken.
 *
 * Storybook can hide a control on a condition (`if`), not disable it, and
 * `table.readonly`, which does disable one, takes no condition. So this sets
 * it on the argTypes the manager holds for the current story, each time
 * `colorMatch` changes -- and again each time the story is prepared, which
 * hands the manager fresh argTypes.
 *
 * Renders nothing: it is a tool only because that is where a component can
 * live in the manager.
 */
function SchemeControlLock() {
  const api = useStorybookApi();
  const { storyId } = useStorybookState();
  const [args] = useArgs();
  const argTypes = useArgTypes();

  const scheme = argTypes.scheme;
  // No args yet while the story is not prepared, whatever the type says
  const readonly = Boolean((args as typeof args | undefined)?.colorMatch);

  useEffect(() => {
    if (!scheme || Boolean(scheme.table?.readonly) === readonly) return;

    void api.updateStory(storyId, {
      argTypes: {
        ...argTypes,
        scheme: { ...scheme, table: { ...scheme.table, readonly } },
      },
    });
  }, [api, storyId, argTypes, scheme, readonly]);

  return null;
}

addons.register(SCHEME_CONTROL_LOCK_ID, () => {
  addons.add(SCHEME_CONTROL_LOCK_ID, {
    type: types.TOOL,
    title: "Scheme control lock",
    // The controls only show next to a story
    match: ({ viewMode }) => viewMode === "story",
    render: () => createElement(SchemeControlLock),
  });
});
