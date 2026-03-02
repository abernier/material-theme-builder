import {
  hexFromArgb,
  type TonalPalette,
} from "@material/material-color-utilities";
import React, {
  useCallback,
  useInsertionEffect,
  useMemo,
  useState,
} from "react";
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
  // <style>
  //

  useInsertionEffect(() => {
    let tag = document.getElementById(styleId);
    if (!tag) {
      tag = document.createElement("style");
      tag.id = styleId;
      document.head.appendChild(tag);
    }
    tag.textContent = css;
  }, [css, styleId]);

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

  return <Provider value={value}>{children}</Provider>;
};

export { McuContext, useMcu };
