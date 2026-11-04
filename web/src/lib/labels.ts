import type { AudienceType, Channel, DraftChannel, Niche } from "@/lib/api";

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
  X_FOLLOWERS: "My X followers",
  LINKEDIN_NETWORK: "My LinkedIn network",
};

// Public rooms are feeds the founder already posts to; the rest are warm,
// private rooms. Shapes copy ("posted" vs "sent", "followers" vs "people").
export function isPublicRoom(type: AudienceType): boolean {
  return type === "X_FOLLOWERS" || type === "LINKEDIN_NETWORK";
}

export const CHANNEL_LABELS: Record<Channel, string> = {
  EMAIL: "Email",
  X: "X post",
  LINKEDIN: "LinkedIn post",
  BLOG: "Blog post",
  DISCORD: "Discord message",
};

// The formats a founder can pick when drafting, in display order.
export const DRAFT_FORMATS: DraftChannel[] = ["X", "LINKEDIN", "EMAIL"];

// The format that fits a room: an X post for X followers, and so on.
export function formatForRoom(type: AudienceType): DraftChannel {
  if (type === "X_FOLLOWERS") return "X";
  if (type === "LINKEDIN_NETWORK") return "LINKEDIN";
  return "EMAIL";
}

export const X_MAX_CHARS = 280;

// Mid-sentence form: "email", "X post", "LinkedIn post" (brand names keep
// their capitals).
export function formatNoun(channel: Channel): string {
  return channel === "EMAIL" ? "email" : CHANNEL_LABELS[channel];
}

// "an email", "an X post" (said "ex"), "a LinkedIn post".
export function withArticle(channel: Channel): string {
  return `${channel === "EMAIL" || channel === "X" ? "an" : "a"} ${formatNoun(channel)}`;
}

// "EMAIL" → "Email", "LESSON_LEARNED" → "Lesson learned": for enum values
// shown as small print (a draft's channel and angle).
export function humanizeEnum(value: string): string {
  const words = value.toLowerCase().split("_");
  return words.join(" ").replace(/^./, (c) => c.toUpperCase());
}
