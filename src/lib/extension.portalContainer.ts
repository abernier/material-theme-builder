import * as React from "react";

/**
 * Where Radix portals — tooltips, popovers — land. `null`, the default,
 * leaves Radix its own default of `document.body`.
 *
 * The Chrome extension provides a node inside its shadow root instead: content
 * portalled to `document.body` would escape the shadow boundary and lose
 * every style.
 */
export const PortalContainerContext = React.createContext<HTMLElement | null>(
  null,
);
