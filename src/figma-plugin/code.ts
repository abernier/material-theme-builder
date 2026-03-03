/// <reference types="@figma/plugin-typings" />

import type { FigmaVariable } from "../lib/builder";
import { COLLECTION_NAME } from "./constants";

// ─── Plugin entry point ─────────────────────────────────────────────────

figma.showUI(__html__, { width: 360, height: 600 });

figma.ui.onmessage = async (msg: {
  type: string;
  variables: FigmaVariable[];
}) => {
  if (msg.type === "sync-variables") {
    try {
      const count = await syncVariables(msg.variables);
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

// ─── Sync logic ─────────────────────────────────────────────────────────

async function syncVariables(variables: FigmaVariable[]) {
  const collection = await findOrCreateCollection(COLLECTION_NAME);
  const modes = ensureModes(collection, "Light", "Dark");

  // Create all variables first so aliases can reference them
  const varMap: Record<string, Variable> = {};
  for (const v of variables) {
    varMap[v.path] = await findOrCreateVariable(v.path, collection);
  }

  // Set values and metadata
  for (const v of variables) {
    const variable = varMap[v.path];

    if (v.description) variable.description = v.description;
    if (v.scopes) variable.scopes = v.scopes as VariableScope[];

    for (const [modeName, modeId] of Object.entries(modes)) {
      const value = v.values[modeName];
      if (!value) continue;

      if ("alias" in value) {
        const target = varMap[value.alias];
        if (target) {
          variable.setValueForMode(
            modeId,
            figma.variables.createVariableAlias(target),
          );
        } else {
          console.warn(`Alias target not found: ${value.alias}`);
          variable.setValueForMode(modeId, { r: 0, g: 0, b: 0, a: 1 });
        }
      } else {
        variable.setValueForMode(modeId, value);
      }
    }
  }

  return variables.length;
}
