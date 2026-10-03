// Core role groups, and where each one is read from.
//
// A theme is not read off one scheme. Each core color that was given its own
// input -- secondary, tertiary, error -- has its role group (the color, its
// container, the fixed accents and every on- role) read from a scheme built on
// that input, so that a role which depends on the scheme's source color (the
// `fidelity` / `content` containers, which land on the source's tone) follows
// the group's own input rather than the primary's. Every other token --
// surfaces, outlines, inverse roles, and the primary group itself -- is read
// from the base scheme, built on the primary.
//
// This is the seam colorMatch plugs into: there, each overridden group is the
// *primary* role group of `SchemeContent(input)`, read with `from: "primary"`.

import {
  type DynamicScheme,
  MaterialDynamicColors,
} from "@material/material-color-utilities";

import type { TokenName } from "./tokens";

/**
 * Each core color's role group, slot by slot: the same index is the same role
 * across groups (color, on-color, container, on-container, then the fixed
 * accents). Error has no fixed accents, so its group is the first four slots.
 */
export const roleGroups = {
  primary: [
    "primary",
    "onPrimary",
    "primaryContainer",
    "onPrimaryContainer",
    "primaryFixed",
    "primaryFixedDim",
    "onPrimaryFixed",
    "onPrimaryFixedVariant",
  ],
  secondary: [
    "secondary",
    "onSecondary",
    "secondaryContainer",
    "onSecondaryContainer",
    "secondaryFixed",
    "secondaryFixedDim",
    "onSecondaryFixed",
    "onSecondaryFixedVariant",
  ],
  tertiary: [
    "tertiary",
    "onTertiary",
    "tertiaryContainer",
    "onTertiaryContainer",
    "tertiaryFixed",
    "tertiaryFixedDim",
    "onTertiaryFixed",
    "onTertiaryFixedVariant",
  ],
  error: ["error", "onError", "errorContainer", "onErrorContainer"],
} as const satisfies Record<string, readonly TokenName[]>;

/** A core color that owns a role group. */
export type RoleGroupName = keyof typeof roleGroups;

/** Where one role group is read from. */
export type RoleGroupSource = {
  /** The scheme built on this group's own input color. */
  scheme: DynamicScheme;
  /**
   * Which of that scheme's role groups to read, slot for slot. Defaults to the
   * group itself; colorMatch reads `"primary"`.
   */
  from?: RoleGroupName;
};

/** The role groups that are not read from the base scheme. */
export type RoleGroupSources = Partial<Record<RoleGroupName, RoleGroupSource>>;

/** The core colors that can be overridden with an input of their own. */
type OverridableGroupName = Exclude<RoleGroupName, "primary">;

/**
 * One `RoleGroupSource` per overridden core color, each built on that color's
 * own input by `schemeFor`. Colors without an override are left out, so their
 * groups fall back to the base scheme.
 *
 * @param overrides - hex input per core color; `undefined` or blank means no override
 * @param schemeFor - builds the scheme whose source is the given input
 * @param from - which role group of that scheme to read (default: the same one)
 */
export function overriddenRoleGroups(
  overrides: Partial<Record<OverridableGroupName, string | undefined>>,
  schemeFor: (hex: string) => DynamicScheme,
  from?: RoleGroupName,
) {
  const sources: RoleGroupSources = {};
  for (const [name, hex] of Object.entries(overrides) as [
    OverridableGroupName,
    string | undefined,
  ][]) {
    if (!hex) continue;
    sources[name] = { scheme: schemeFor(hex), from };
  }
  return sources;
}

/**
 * Read `tokens` as ARGB, in the order given: a token in one of the `groups`
 * is read from that group's own scheme, every other token from `base`.
 */
export function readRoles<T extends TokenName>(
  tokens: readonly T[],
  base: DynamicScheme,
  groups: RoleGroupSources,
) {
  const result = {} as Record<T, number>;
  for (const token of tokens) {
    const [dynamicColor, scheme] = locate(token, base, groups);
    result[token] = dynamicColor.getArgb(scheme);
  }
  return result;
}

function locate(
  token: TokenName,
  base: DynamicScheme,
  groups: RoleGroupSources,
) {
  for (const [name, source] of Object.entries(groups) as [
    RoleGroupName,
    RoleGroupSource,
  ][]) {
    const slot = (roleGroups[name] as readonly TokenName[]).indexOf(token);
    if (slot === -1) continue;

    const read = roleGroups[source.from ?? name][slot];
    // A slot the `from` group lacks (the fixed accents, read from error)
    // stays with the base scheme.
    if (read === undefined) break;
    return [MaterialDynamicColors[read], source.scheme] as const;
  }
  return [MaterialDynamicColors[token], base] as const;
}
