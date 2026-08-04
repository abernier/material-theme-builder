/*
 * The two messages crossing between the service worker and the injected
 * panel. Shared so a rename can't drift one side out of sync with the other.
 */

/** Service worker → panel. Answered with a {@link PanelState}. */
export const PANEL_TOGGLE = "mtb:toggle";

/** Panel → service worker, when it closes itself (the ✕ button). */
export const PANEL_CLOSED = "mtb:closed";

export type PanelMessage =
  | { type: typeof PANEL_TOGGLE }
  | { type: typeof PANEL_CLOSED };

/** What the panel answers a {@link PANEL_TOGGLE} with. */
export type PanelState = { open: boolean };
