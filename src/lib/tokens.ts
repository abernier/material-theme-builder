// The M3 color vocabulary, on its own: the token names, the tonal-palette
// names, and the Tailwind shade <-> M3 tone mapping.
//
// A leaf module by design. `builder.ts` owns the color engine and imports
// `@material/material-color-utilities`; the Tailwind plugin
// (`src/tailwind-plugin.ts`) needs the vocabulary and none of the engine, so
// the vocabulary lives where it can be read without pulling the engine in.

/** Default CSS custom-property prefix. */
export const DEFAULT_PREFIX = "md";

/**
 * Material Design 3 token names and their descriptions.
 *
 * Centralizes both the canonical list of scheme tokens and their M3 color role semantics.
 *
 * The Material Design blog is the best source on *why* these roles are shaped
 * the way they are — the spec pages state the what, the blog posts the
 * reasoning, and they are where role changes get announced first (the
 * tone-based surfaces post is what documents `surface-variant` giving way to
 * `surface-container-highest`).
 *
 * Note that the list below is wider than the spec's own inventory — "26
 * standard color roles organized into six groups" — because it also carries
 * the add-on roles (fixed accents, surface dim/bright, inverse) and the ones
 * the spec has since dropped but the exporters still emit: `background`,
 * `onBackground`, `surfaceVariant`, `surfaceTint`.
 *
 * Deep links below are section anchors; the spec site is a client-rendered SPA,
 * so `#:~:text=` fragments are stripped on load and only these work.
 *
 * @see https://m3.material.io/styles/color/roles
 * @see https://m3.material.io/blog/tone-based-surface-color-m3
 * @see https://m3.material.io/blog/science-of-color-design
 */
export const tokenDescriptions = {
  background: "Default background color for screens and large surfaces.",
  error: "Color for error states, used on elements like error text and icons.",
  errorContainer: "Fill color for error container elements like error banners.",
  inverseOnSurface: "Color for text and icons on inverse surface backgrounds.",
  inversePrimary:
    "Primary color used on inverse surface, e.g. buttons on snackbars.",
  inverseSurface:
    "Background for elements that require reverse contrast, such as snackbars.",
  onBackground: "Color for text and icons displayed on the background.",
  onError: "Color for text and icons on error-colored elements.",
  onErrorContainer: "Color for text and icons on error container elements.",
  onPrimary:
    "Color for text and icons on primary-colored elements like filled buttons.",
  onPrimaryContainer:
    "Color for text and icons on primary container elements like tonal buttons.",
  onPrimaryFixed:
    "Color for text and icons on primary fixed elements, constant across themes.",
  onPrimaryFixedVariant:
    "Lower-emphasis color for text and icons on primary fixed elements.",
  onSecondary: "Color for text and icons on secondary-colored elements.",
  onSecondaryContainer:
    "Color for text and icons on secondary container elements.",
  onSecondaryFixed:
    "Color for text and icons on secondary fixed elements, constant across themes.",
  onSecondaryFixedVariant:
    "Lower-emphasis color for text and icons on secondary fixed elements.",
  onSurface: "High-emphasis color for text and icons on surface backgrounds.",
  onSurfaceVariant:
    "Medium-emphasis color for text and icons on surface variant backgrounds.",
  onTertiary: "Color for text and icons on tertiary-colored elements.",
  onTertiaryContainer:
    "Color for text and icons on tertiary container elements.",
  onTertiaryFixed:
    "Color for text and icons on tertiary fixed elements, constant across themes.",
  onTertiaryFixedVariant:
    "Lower-emphasis color for text and icons on tertiary fixed elements.",
  outline: "Subtle color for borders and dividers to create visual separation.",
  outlineVariant: "Lower-emphasis border color used for decorative dividers.",
  primary:
    "Main brand color, used for key components like filled buttons and active states.",
  primaryContainer:
    "Fill color for large primary elements like cards and tonal buttons.",
  primaryFixed:
    "Fixed primary color that stays the same in light and dark themes.",
  primaryFixedDim:
    "Dimmed variant of the fixed primary color for lower emphasis.",
  scrim: "Color overlay for modals and dialogs to obscure background content.",
  secondary:
    "Accent color for less prominent elements like filter chips and selections.",
  secondaryContainer:
    "Fill color for secondary container elements like tonal buttons and input fields.",
  secondaryFixed:
    "Fixed secondary color that stays the same in light and dark themes.",
  secondaryFixedDim:
    "Dimmed variant of the fixed secondary color for lower emphasis.",
  shadow: "Color for elevation shadows applied to surfaces and components.",
  surface: "Default surface color for cards, sheets, and dialogs.",
  surfaceBright:
    "Brightest surface variant, used for elevated surfaces in dark themes.",
  surfaceContainer:
    "Middle-emphasis container color for grouping related content.",
  surfaceContainerHigh:
    "Higher-emphasis container color for elements like cards.",
  surfaceContainerHighest:
    "Highest-emphasis container color for text fields and other input areas.",
  surfaceContainerLow:
    "Lower-emphasis container color for subtle surface groupings.",
  surfaceContainerLowest:
    "Lowest-emphasis container, typically the lightest surface in light theme.",
  surfaceDim:
    "Dimmest surface variant, used for recessed areas or dark theme backgrounds.",
  surfaceTint:
    "Tint color applied to surfaces for subtle primary color elevation overlay.",
  surfaceVariant:
    "Alternative surface color for differentiated areas like sidebar backgrounds.",
  tertiary:
    "Third accent color for complementary elements that balance primary and secondary.",
  tertiaryContainer:
    "Fill color for tertiary container elements like complementary cards.",
  tertiaryFixed:
    "Fixed tertiary color that stays the same in light and dark themes.",
  tertiaryFixedDim:
    "Dimmed variant of the fixed tertiary color for lower emphasis.",
} as const;

/**
 * Type-guard that checks whether a string is a known M3 color token name.
 */
export function isTokenName(
  key: string,
): key is keyof typeof tokenDescriptions {
  return key in tokenDescriptions;
}

/** All known M3 color token names. */
export const tokenNames = Object.keys(tokenDescriptions).filter(isTokenName);

/** Union of all known M3 color token names. */
export type TokenName = keyof typeof tokenDescriptions;

// ─── Palettes and shades ───────────────────────────────────────

/**
 * Tailwind shade → M3 tone.
 *
 * Tailwind counts up as it darkens, M3 tones count up as they lighten, so the
 * two run in opposite directions — shade 50 is tone 95.
 */
export const SHADE_TO_TONE = [
  [50, 95],
  [100, 90],
  [200, 80],
  [300, 70],
  [400, 60],
  [500, 50],
  [600, 40],
  [700, 30],
  [800, 20],
  [900, 10],
  [950, 5],
] as const;

/** Tonal palettes that a full set of Tailwind shades is emitted for. */
export const CORE_PALETTES = [
  "primary",
  "secondary",
  "tertiary",
  "error",
  "neutral",
  "neutral-variant",
] as const;
