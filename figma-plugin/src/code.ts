/// <reference types="@figma/plugin-typings" />

import type { FigmaColorValue, FigmaTokens } from "../../src/lib/builder";

// ─── Plugin entry point ─────────────────────────────────────────────────

figma.showUI(__html__, { width: 400, height: 600 });

figma.ui.onmessage = async (msg: { type: string; tokens: FigmaTokens }) => {
  if (msg.type === "sync-variables") {
    try {
      const count = await syncVariables(msg.tokens);
      figma.notify(`✓ Synced ${count} variables`);
      figma.ui.postMessage({ type: "sync-done" });
    } catch (err) {
      figma.notify("✗ " + (err as Error).message, { error: true });
      console.error(err);
      figma.ui.postMessage({ type: "sync-error" });
    }
  }
};

// ─── Helpers ────────────────────────────────────────────────────────────

async function findOrCreateCollection(name: string) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  return (
    collections.find((c) => c.name === name) ??
    figma.variables.createVariableCollection(name)
  );
}

function ensureModes(collection: VariableCollection, ...modeNames: string[]) {
  const result: Record<string, string> = {};
  for (let i = 0; i < modeNames.length; i++) {
    const existing = collection.modes.find((m) => m.name === modeNames[i]);
    if (existing) {
      result[modeNames[i]] = existing.modeId;
    } else if (i === 0 && collection.modes.length === 1) {
      collection.renameMode(collection.modes[0].modeId, modeNames[i]);
      result[modeNames[i]] = collection.modes[0].modeId;
    } else {
      result[modeNames[i]] = collection.addMode(modeNames[i]);
    }
  }
  return result;
}

async function findOrCreateVariable(
  name: string,
  collection: VariableCollection,
) {
  const variables = await figma.variables.getLocalVariablesAsync("COLOR");
  return (
    variables.find(
      (v) => v.name === name && v.variableCollectionId === collection.id,
    ) ?? figma.variables.createVariable(name, collection, "COLOR")
  );
}

/** Recursively collect leaf tokens (nodes with $type) from a DTCG token tree */
function collectTokens(
  obj: Record<string, unknown>,
  prefix = "",
  out: [string, Record<string, unknown>][] = [],
): [string, Record<string, unknown>][] {
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("$")) continue;
    const record = value as Record<string, unknown>;
    const path = prefix ? `${prefix}/${key}` : key;
    if ("$type" in record) {
      out.push([path, record]);
    } else {
      collectTokens(record, path, out);
    }
  }
  return out;
}

// ─── Sync logic ─────────────────────────────────────────────────────────

async function syncVariables(tokens: FigmaTokens) {
  const lightTokens = collectTokens(
    tokens["Light.tokens.json"] as unknown as Record<string, unknown>,
  );
  const darkTokenMap = new Map(
    collectTokens(
      tokens["Dark.tokens.json"] as unknown as Record<string, unknown>,
    ),
  );

  const collection = await findOrCreateCollection("Material Theme");
  const modes = ensureModes(collection, "Light", "Dark");

  // Create all variables first so aliases can reference them
  const varMap: Record<string, Variable> = {};
  for (const [path] of lightTokens) {
    varMap[path] = await findOrCreateVariable(path, collection);
  }

  // Set values for each mode
  for (const [path, lightToken] of lightTokens) {
    let darkToken = darkTokenMap.get(path);
    if (!darkToken) {
      console.warn(`Dark mode token missing for ${path}, using light value`);
      darkToken = lightToken;
    }
    const variable = varMap[path];

    if (typeof lightToken.$description === "string") {
      variable.description = lightToken.$description;
    }
    const scopes = (
      lightToken.$extensions as Record<string, unknown> | undefined
    )?.["com.figma.scopes"];
    if (scopes) {
      variable.scopes = scopes as VariableScope[];
    }

    variable.setValueForMode(
      modes["Light"],
      resolveValue(lightToken.$value as string | FigmaColorValue, varMap),
    );
    variable.setValueForMode(
      modes["Dark"],
      resolveValue(darkToken.$value as string | FigmaColorValue, varMap),
    );
  }

  return lightTokens.length;
}

function resolveValue(
  value: string | FigmaColorValue,
  varMap: Record<string, Variable>,
) {
  if (typeof value === "string") {
    // "{ref.palette.Primary.80}" → "ref/palette/Primary/80"
    const varPath = value.replace(/^\{|\}$/g, "").replaceAll(".", "/");
    const target = varMap[varPath];
    if (target) return figma.variables.createVariableAlias(target);
    console.warn(`Alias target not found: ${varPath}`);
    return { r: 0, g: 0, b: 0, a: 1 };
  }
  return {
    r: value.components[0],
    g: value.components[1],
    b: value.components[2],
    a: value.alpha ?? 1,
  };
}
