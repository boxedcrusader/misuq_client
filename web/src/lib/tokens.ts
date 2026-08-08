// Misuq design tokens — mirrors design_handoff_misuq_landing/README.md
// Single source of truth for the web app's Tailwind theme (see globals.css @theme block).

export const colors = {
  indigo: "#5B4FE9",
  indigoHover: "#4A3FD0",
  deepInk: "#1B1830",
  ground: "#F7F6FC",
  white: "#FFFFFF",
  periwinkle: "#C7C2E8",
  borderHairline: "#E3E0F4",
  borderInput: "#D3CFEB",
  borderBadge: "#DAD6EF",
  textMuted: "#4A4666",
  textMuted2: "#6E6990",
  textMuted3: "#8E88BE",
  contextFill: "#F4F2FC",
  ctaPanel: "#F0EEFA",
  onDarkHeading: "#F3F1FE",
  onDarkBody: "#B7B2D8",
  logoAccentMid: "#8E84EE",
} as const;

export const radii = {
  button: "12px",
  card: "18px",
  panel: "24px",
  pill: "999px",
  input: "12px",
} as const;
