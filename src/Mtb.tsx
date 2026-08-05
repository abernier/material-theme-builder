"use client";

import { useMemo } from "react";
import {
  DEFAULT_CONTRAST,
  DEFAULT_CUSTOM_COLORS,
  DEFAULT_PREFIX,
  DEFAULT_SCHEME,
  type MtbConfig,
} from "./lib/builder";
import { MtbProvider } from "./Mtb.context";

// The DOM id stays `mcu-styles`: it is observable from user CSS/JS, so renaming
// it would break selectors silently. Only the local binding follows the rename.
const styleId = "mcu-styles";
const DEFAULT_COLOR_MATCH = false;

/**
 * Root component that generates and injects a Material You color theme into the page.
 */
export function Mtb({
  source,
  scheme = DEFAULT_SCHEME,
  contrast = DEFAULT_CONTRAST,
  primary,
  secondary,
  tertiary,
  neutral,
  neutralVariant,
  error,
  colorMatch = DEFAULT_COLOR_MATCH,
  customColors = DEFAULT_CUSTOM_COLORS,
  prefix = DEFAULT_PREFIX,
  children,
}: MtbConfig & {
  /** Content to render inside the themed scope. */
  children?: React.ReactNode;
}) {
  const config = useMemo(
    () => ({
      source,
      scheme,
      contrast,
      primary,
      secondary,
      tertiary,
      neutral,
      neutralVariant,
      error,
      colorMatch,
      customColors,
      prefix,
    }),
    [
      contrast,
      customColors,
      scheme,
      source,
      primary,
      secondary,
      tertiary,
      neutral,
      neutralVariant,
      error,
      colorMatch,
      prefix,
    ],
  );

  return (
    <MtbProvider {...config} styleId={styleId}>
      {children}
    </MtbProvider>
  );
}

/**
 * @deprecated Renamed `Mtb` — same component, same props. This alias will be
 * removed in the next major.
 */
export const Mcu = Mtb;
