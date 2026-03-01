/// <reference types="@figma/plugin-typings" />

import type { FigmaColorValue, FigmaTokens } from "../../src/lib/builder";

// ─── Plugin entry point ─────────────────────────────────────────────────

figma.showUI(__html__, { width: 400, height: 600 });

figma.ui.onmessage = async (msg: { type: string; tokens: FigmaTokens }) => {
  if (msg.type === "sync-variables") {
    try {
      const stats = await syncVariables(msg.tokens);
      figma.notify(
        `✓ Synced ${stats.refCount} palette + ${stats.sysCount} system variables`,
      );
      figma.ui.postMessage({ type: "sync-done" });
    } catch (err) {
      figma.notify("✗ " + (err as Error).message, { error: true });
      console.error(err);
      figma.ui.postMessage({ type: "sync-error" });
    }
  }
};

// ─── Helpers ────────────────────────────────────────────────────────────

/** Find a local collection by name or create a new one */
async function findOrCreateCollection(name: string) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const existing = collections.find((c) => c.name === name);
  if (existing) return existing;
  return figma.variables.createVariableCollection(name);
}

/** Ensure the collection has exactly the requested modes (by name) and return their IDs */
function ensureModes(collection: VariableCollection, ...modeNames: string[]) {
  const result: Record<string, string> = {};

  for (let i = 0; i < modeNames.length; i++) {
    const modeName = modeNames[i];
    const existingMode = collection.modes.find((m) => m.name === modeName);

    if (existingMode) {
      result[modeName] = existingMode.modeId;
    } else if (i === 0 && collection.modes.length === 1) {
      // Rename the default first mode instead of adding
      collection.renameMode(collection.modes[0].modeId, modeName);
      result[modeName] = collection.modes[0].modeId;
    } else {
      const modeId = collection.addMode(modeName);
      result[modeName] = modeId;
    }
  }

  return result;
}

/** Find an existing variable in a collection by name, or create it */
async function findOrCreateVariable(
  name: string,
  collection: VariableCollection,
  resolvedType: VariableResolvedDataType,
) {
  const variables = await figma.variables.getLocalVariablesAsync(resolvedType);
  const existing = variables.find(
    (v) => v.name === name && v.variableCollectionId === collection.id,
  );
  if (existing) return existing;
  return figma.variables.createVariable(name, collection, resolvedType);
}

/** Convert DTCG color components [r, g, b] (0-1 range) to Figma RGBA */
function toFigmaColor(components: number[], alpha?: number) {
  return {
    r: components[0],
    g: components[1],
    b: components[2],
    a: alpha != null ? alpha : 1,
  };
}

// ─── Sync logic ─────────────────────────────────────────────────────────

async function syncVariables(tokens: FigmaTokens) {
  const lightFile = tokens["Light.tokens.json"];
  const darkFile = tokens["Dark.tokens.json"];

  // Single collection with Light & Dark modes
  const collection = await findOrCreateCollection("Material Theme");
  const modes = ensureModes(collection, "Light", "Dark");
  const lightModeId = modes["Light"];
  const darkModeId = modes["Dark"];

  // ── 1. ref/palette — Reference Tokens (same value in both modes) ──────
  const refVarMap: Record<string, Variable> = {};
  let refCount = 0;

  const palettes = lightFile.ref.palette;
  for (const [paletteName, tones] of Object.entries(palettes)) {
    for (const [tone, token] of Object.entries(tones)) {
      if (!token.$type) continue;
      const varName = `ref/palette/${paletteName}/${tone}`;
      const variable = await findOrCreateVariable(varName, collection, "COLOR");

      const color = toFigmaColor(token.$value.components, token.$value.alpha);
      variable.setValueForMode(lightModeId, color);
      variable.setValueForMode(darkModeId, color);

      if (token.$extensions?.["com.figma.scopes"]) {
        variable.scopes = token.$extensions[
          "com.figma.scopes"
        ] as VariableScope[];
      }

      refVarMap[`ref.palette.${paletteName}.${tone}`] = variable;
      refCount++;
    }
  }

  // ── 2. sys/color — System Tokens (different value per mode) ───────────
  let sysCount = 0;

  const lightColors = lightFile.sys.color;
  const darkColors = darkFile.sys.color;

  for (const tokenName of Object.keys(lightColors)) {
    const lightToken = lightColors[tokenName];
    const darkToken = darkColors[tokenName];
    if (!lightToken || !lightToken.$type) continue;

    const varName = `sys/color/${tokenName}`;
    const variable = await findOrCreateVariable(varName, collection, "COLOR");

    if (lightToken.$description) {
      variable.description = lightToken.$description;
    }

    if (lightToken.$extensions?.["com.figma.scopes"]) {
      variable.scopes = lightToken.$extensions[
        "com.figma.scopes"
      ] as VariableScope[];
    }

    for (const [modeId, token] of [
      [lightModeId, lightToken],
      [darkModeId, darkToken],
    ] as const) {
      const value = resolveValue(token.$value, refVarMap);
      variable.setValueForMode(modeId, value);
    }

    sysCount++;
  }

  return { refCount, sysCount };
}

/**
 * Resolve a DTCG $value:
 * - If it's a string like "{ref.palette.Primary.80}", create a variable alias
 * - Otherwise treat it as a direct color value object
 */
function resolveValue(
  value: string | FigmaColorValue,
  refVarMap: Record<string, Variable>,
) {
  if (typeof value === "string") {
    // Parse alias: "{ref.palette.Primary.80}" → "ref.palette.Primary.80"
    const aliasPath = value.replace(/^\{|\}$/g, "");
    const target = refVarMap[aliasPath];
    if (target) {
      return figma.variables.createVariableAlias(target);
    }
    // Alias target not found — shouldn't happen, but fall through
    console.warn(`Alias target not found: ${aliasPath}`);
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  // Direct color value object
  return toFigmaColor(value.components, value.alpha);
}
