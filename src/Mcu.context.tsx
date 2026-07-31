import {
  hexFromArgb,
  type TonalPalette,
} from "@material/material-color-utilities";
import React, { useCallback, useMemo, useState } from "react";
import {
  builder,
  type FigmaTokens,
  type FigmaVariable,
  type McuConfig,
  type TokenName,
} from "./lib/builder";
import { createRequiredContext } from "./lib/createRequiredContext";

type Api = {
  initials: McuConfig;
  mcuConfig: McuConfig;
  setMcuConfig: (config: McuConfig) => void;
  getMcuColor: (colorName: TokenName, theme?: string) => string;
  allPalettes: Record<string, TonalPalette>;
  figmaTokens: FigmaTokens;
  figmaVariables: FigmaVariable[];
};

const [useMcu, Provider, McuContext] = createRequiredContext<Api>();

/**
 * Provider that computes the Material You theme and exposes it via context.
 */
export const McuProvider = ({
  styleId,
  children,
  ...configProps
}: McuConfig & {
  /** The `id` attribute applied to the injected `<style>` element. */
  styleId: string;
  /** Content to render inside the provider. */
  children?: React.ReactNode;
}) => {
  const [initials] = useState(() => configProps);
  // console.log("McuProvider initials", initials);

  const [mcuConfig, setMcuConfig] = useState(initials);

  // Update mcuConfig when configProps change
  // Use a stable key to detect when config values have changed
  const configKey = JSON.stringify(configProps);
  React.useEffect(() => {
    setMcuConfig(configProps);
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
      mcuConfig.source,
      mcuConfig,
    );
    return {
      css: toCss(),
      figmaTokens: toFigmaTokens(),
      figmaVariables: toFigmaVariables(),
      ...rest,
    };
  }, [mcuConfig]);

  //
  // getMcuColor
  //

  const getMcuColor = useCallback(
    (colorName: TokenName, theme: string | undefined) => {
      // console.log("getMcuColor", colorName, theme);
      const mergedColors =
        theme === "light" ? mergedColorsLight : mergedColorsDark;
      const colorValue = mergedColors[colorName];

      if (colorValue === undefined) {
        throw new Error(`Unknown MCU token '${colorName}'`);
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
        mcuConfig,
        setMcuConfig,
        getMcuColor,
        allPalettes,
        figmaTokens,
        figmaVariables,
      }) satisfies Api,
    [
      getMcuColor,
      initials,
      mcuConfig,
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
  // server sends, and React updates its content in place when `setMcuConfig`
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

export { McuContext, useMcu };
