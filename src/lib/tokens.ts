// M3 color-role names, standing on their own — no color engine, no builder
// context. The Tailwind plugin (`material-theme-builder/tailwind`) runs inside
// the CSS build and needs the names alone, so it imports them from here rather
// than dragging `builder.ts` — and Material Color Utilities with it — along.

/**
 * Default CSS custom-property prefix — `--md-sys-color-*`, `--md-ref-palette-*`.
 *
 * Part of how the tokens are spelled, so it lives with them.
 */
export const DEFAULT_PREFIX = "md";

/**
 * Material Design 3 token names and their descriptions.
 *
 * Centralizes both the canonical list of scheme tokens and their M3 color role semantics.
 *
 * @see https://m3.material.io/styles/color/the-color-system/color-roles
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
