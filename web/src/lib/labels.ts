import type { AudienceType, Niche } from "@/lib/api";

// Human labels for backend enums, shared by onboarding and the loop screens
// so the same value always reads the same way. Keys mirror
// service/prisma/schema.prisma exactly; the Record type makes a missing or
// renamed enum value a compile error here.

export const NICHE_LABELS: Record<Niche, string> = {
  DEV_TOOLS: "Developer tools",
  AI_TOOLS: "AI tools",
  PRODUCTIVITY: "Productivity",
  NO_CODE: "No-code",
  MARKETING_TOOLS: "Marketing tools",
  ANALYTICS: "Analytics",
  DESIGN_TOOLS: "Design tools",
  ECOMMERCE: "E-commerce",
  FINTECH: "Fintech",
  // A genuine answer, not a fallback (CLAUDE.md §5): the founder chose it.
  OTHER: "Something else",
};

export const AUDIENCE_TYPE_LABELS: Record<AudienceType, string> = {
  EMAIL_LIST: "Email list",
  DISCORD: "Discord or community",
  BETA_USERS: "Beta users",
  PEERS: "Founder friends / peers",
};
