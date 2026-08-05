import {
  hexFromArgb,
  type TonalPalette,
} from "@material/material-color-utilities";
import React, { useCallback, useMemo, useState } from "react";
import {
  builder,
  type FigmaTokens,
  type FigmaVariable,
  type MtbConfig,
  type TokenName,
} from "./lib/builder";
import { createRequiredContext } from "./lib/createRequiredContext";

type Api = {
  initials: MtbConfig;
  mtbConfig: MtbConfig;
  setMtbConfig: (config: MtbConfig) => void;
  getMtbColor: (colorName: TokenName, theme?: string) => string;
  allPalettes: Record<string, TonalPalette>;
  figmaTokens: FigmaTokens;
  figmaVariables: FigmaVariable[];

  /**
   * @deprecated Renamed `mtbConfig` — same value. This alias will be removed in
   * the next major.
   */
  mcuConfig: MtbConfig;
  /**
   * @deprecated Renamed `setMtbConfig` — same setter. This alias will be
   * removed in the next major.
   */
  setMcuConfig: (config: MtbConfig) => void;
  /**
   * @deprecated Renamed `getMtbColor` — same function. This alias will be
   * removed in the next major.
   */
  getMcuColor: (colorName: TokenName, theme?: string) => string;
};

const [useMtb, Provider, MtbContext] = createRequiredContext<Api>();

/**
 * Provider that computes the Material You theme and exposes it via context.
 */
export const MtbProvider = ({
  styleId,
  children,
  ...configProps
}: MtbConfig & {
  /** The `id` attribute applied to the injected `<style>` element. */
  styleId: string;
  /** Content to render inside the provider. */
  children?: React.ReactNode;
}) => {
  const [initials] = useState(() => configProps);
  // console.log("MtbProvider initials", initials);

  const [mtbConfig, setMtbConfig] = useState(initials);

  // Update mtbConfig when configProps change
  // Use a stable key to detect when config values have changed
  const configKey = JSON.stringify(configProps);
  React.useEffect(() => {
    setMtbConfig(configProps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  const {
    css,
    mergedColorsLight,
    mergedColorsDark,
    allPalettes,
    figmaTokens,
    figmaVariables,
  } = useMemo(() => {
    const { toCss, toFigmaTokens, toFigmaVariables, ...rest } = builder(
      mtbConfig.source,
      mtbConfig,
    );
    return {
      css: toCss(),
      figmaTokens: toFigmaTokens(),
      figmaVariables: toFigmaVariables(),
      ...rest,
    };
  }, [mtbConfig]);

  //
  // getMtbColor
  //

  const getMtbColor = useCallback(
    (colorName: TokenName, theme: string | undefined) => {
      // console.log("getMtbColor", colorName, theme);
      const mergedColors =
        theme === "light" ? mergedColorsLight : mergedColorsDark;
      const colorValue = mergedColors[colorName];

      if (colorValue === undefined) {
        throw new Error(`Unknown token '${colorName}'`);
      }

      return hexFromArgb(colorValue);
    },
    [mergedColorsDark, mergedColorsLight],
  );

  //
  // api
  //

  const value = useMemo(
    () =>
      ({
        initials,
        mtbConfig,
        setMtbConfig,
        getMtbColor,
        allPalettes,
        figmaTokens,
        figmaVariables,

        // deprecated aliases
        mcuConfig: mtbConfig,
        setMcuConfig: setMtbConfig,
        getMcuColor: getMtbColor,
      }) satisfies Api,
    [
      getMtbColor,
      initials,
      mtbConfig,
      allPalettes,
      figmaTokens,
      figmaVariables,
    ],
  );

  //
  // <style>
  //
  // Rendered, not injected from an effect. An effect only ever runs in the
  // browser, so a server-rendered page would ship with none of the variables
  // defined and paint before hydration filled them in -- every color missing
  // for that first frame. Rendering the tag puts the CSS in the HTML the
  // server sends, and React updates its content in place when `setMtbConfig`
  // changes the theme.
  //
  // Not `<style href precedence>`: React treats hoisted stylesheets as
  // immutable and keyed by `href`, so a theme change would either be ignored
  // or leak a new stylesheet per change.

  return (
    <Provider value={value}>
      <style id={styleId} dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </Provider>
  );
};

/**
 * @deprecated Renamed `useMtb` — same hook, same return value. This alias will
 * be removed in the next major.
 */
const useMcu = useMtb;

export { MtbContext, useMcu, useMtb };
