// Misuq design tokens — mirrors design_handoff_misuq_landing/README.md ("Theming (light + dark)" table).
// Single source of truth for the mobile app's colors, type scale, and radii.
//
// `colors` is the light palette, `darkColors` its dark counterpart — see src/lib/theme.ts for the
// hook that picks between them. A few keys (onIndigo, onDarkHeading, onDarkBody, onDarkMuted) are
// intentionally identical in both palettes: they sit on indigo/panel fills, not the page background,
// so they never need to flip.

export const colors = {
  indigo: "#5B4FE9",
  indigoHover: "#4A3FD0",
  deepInk: "#1B1830",
  ground: "#F7F6FC",
  card: "#FFFFFF",
  onIndigo: "#F7F6FC",
  panel: "#1B1830",
  periwinkle: "#C7C2E8",
  borderHairline: "#E3E0F4",
  borderInput: "#D3CFEB",
  borderBadge: "#DAD6EF",
  textMuted: "#4A4666",
  textMuted2: "#6E6990",
  textMuted3: "#8E88BE",
  textFaint: "#9B96C4",
  contextFill: "#F4F2FC",
  contextBorder: "#E7E4F6",
  ctaPanel: "#F0EEFA",
  onDarkHeading: "#F3F1FE",
  onDarkBody: "#B7B2D8",
  onDarkMuted: "#DEDBF0",
  logoSmall: "#C7C2E8",
  logoMid: "#8E84EE",
  logoLarge: "#5B4FE9",
  shadow: "#1B1830",
} as const;

export type ColorPalette = Record<keyof typeof colors, string>;

export const darkColors: ColorPalette = {
  indigo: "#6C5FF0",
  indigoHover: "#8579FF",
  deepInk: "#F3F1FE",
  ground: "#141221",
  card: "#201B33",
  onIndigo: "#F7F6FC",
  panel: "#251F3C",
  periwinkle: "#C7C2E8",
  borderHairline: "#2F2A46",
  borderInput: "#3B3557",
  borderBadge: "#35304E",
  textMuted: "#B7B2D8",
  textMuted2: "#9A93C2",
  textMuted3: "#948DBE",
  textFaint: "#7C76A4",
  contextFill: "#262038",
  contextBorder: "#332C4C",
  ctaPanel: "#221D38",
  onDarkHeading: "#F3F1FE",
  onDarkBody: "#B7B2D8",
  onDarkMuted: "#DEDBF0",
  logoSmall: "#6E64C8",
  logoMid: "#8E84EE",
  logoLarge: "#8579FF",
  shadow: "#000000",
};

export const fonts = {
  display: "SpaceGrotesk_600SemiBold",
  displayMedium: "SpaceGrotesk_500Medium",
  displayRegular: "SpaceGrotesk_400Regular",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
} as const;

export const radii = {
  button: 12,
  card: 16,
  panel: 24,
  pill: 999,
  input: 12,
} as const;

export const spacing = {
  pageX: 20,
} as const;
