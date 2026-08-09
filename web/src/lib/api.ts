// Typed client for the misuq_service backend — capture/draft/send slices
// (report/graduate are a later seam, not built here).
//
// Types below MIRROR the real backend contract verbatim, not an assumed
// shape:
//   - CaptureStoryRequest      <- service/src/modules/capture/dto/create-story.dto.ts
//   - StageSendRequest         <- service/src/modules/send/dto/create-send.dto.ts
//   - Story / ContentPiece     <- service/prisma/schema.prisma (Story, ContentPiece models)
//   - Send                     <- service/prisma/schema.prisma (Send model) — stagePiece's
//                                 response is this raw row, NOT the Story (no .status field)
//   - StoryWithContentPieces   <- CaptureController's GET /stories/:id (findOne, which
//                                 `include: { contentPieces: true }`s)
//   - PaginatedStories         <- CaptureController's GET /stories (findAll)
//   - CreateReportRequest      <- service/src/modules/report-back/dto/create-report.dto.ts
//   - SendWithContentPiece     <- SendController's GET /sends/:id (findOne, which
//                                 `include: { contentPiece: { include: { story: true } } }`s)
//   - ReportResult             <- ReportBackController's POST /reports response
// If a field name or shape here ever differs from the real DTO/model, that's
// a bug in THIS file to fix, not something to paper over client-side.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// Auth stand-in (service's current-user.decorator.ts reads x-user-id off
// every request; there is no real auth or user-creation endpoint yet — see
// service/prisma/scripts/seed-dev-user.js for the seeded row this points
// at). ONE config point so swapping to real auth later only touches this
// function, never call sites.
function getDevUserId(): string {
  return process.env.NEXT_PUBLIC_DEV_USER_ID ?? "cmskxkz5a0000pnnusux6ftsa";
}

// No listAudiences endpoint exists (no audience-creation module either —
// both deferred, same as real auth). These are the 2 Audiences
// prisma/scripts/seed-dev-user.js upserts for the dev user above — the ONLY
// audiences that exist to stage anything to right now. Fixed here as the
// one config point, same treatment as the dev user id: swap for a real
// listAudiences() call once that endpoint exists, no call-site changes.
export const DEV_AUDIENCES: { id: string; name: string; type: AudienceType; size: number }[] = [
  { id: "cmsl1uu0n0002pnsqxdzr7h8m", name: "Beta list", type: "EMAIL_LIST", size: 42 },
  { id: "cmsl1uu3o0004pnsqo80hsrkf", name: "Discord", type: "DISCORD", size: 18 },
];

// ── Enums (prisma/schema.prisma) ────────────────────────────────────────
export type ContentType = "FEATURE_ANNOUNCEMENT" | "MILESTONE" | "LESSON_LEARNED" | "OTHER";
export type StoryStatus = "CAPTURED" | "DRAFTED" | "STAGED" | "REPORTED" | "GRADUATED" | "ARCHIVED";
export type Channel = "EMAIL" | "X" | "LINKEDIN" | "BLOG" | "DISCORD";
export type Stage = "PREVIEW" | "WIDE";
export type Tone =
  | "VULNERABLE"
  | "CONFIDENT"
  | "EDUCATIONAL"
  | "CASUAL"
  | "PROFESSIONAL"
  | "HUMBLE"
  | "CELEBRATORY"
  | "REFLECTIVE"
  | "OTHER";
export type ContentPieceStatus = "DRAFTED" | "EDITED" | "SENT";
export type AudienceType = "EMAIL_LIST" | "DISCORD" | "BETA_USERS" | "PEERS";
export type Sentiment = "POSITIVE" | "NEUTRAL" | "MIXED" | "NEGATIVE";
export type PostFormat = "SINGLE" | "THREAD" | "QUOTE" | "REPLY" | "LONGFORM";

// ── Response shapes (verified live against the running backend) ────────
export interface Story {
  id: string;
  userId: string;
  rawCapture: string;
  title: string | null;
  contentType: ContentType;
  status: StoryStatus;
  graduatedAt: string | null; // ISO datetime, or null pre-graduation
  createdAt: string;
  updatedAt: string;
}

export interface ContentPiece {
  id: string;
  storyId: string;
  channel: Channel;
  stage: Stage;
  tone: Tone;
  body: string;
  status: ContentPieceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoryWithContentPieces extends Story {
  contentPieces: ContentPiece[];
}

export interface PaginatedStories {
  data: Story[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// stagePiece's response — the raw Send row. NO Story.status field (same gap
// draftStory has): call getStory(storyId) afterward to read the Story's
// updated STAGED status as server-authoritative truth.
export interface Send {
  id: string;
  contentPieceId: string;
  audienceId: string;
  audienceSizeSnapshot: number; // frozen from Audience.size at send time
  sentAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSends {
  data: Send[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// GET /sends/:id (findOne) enriches the bare Send with its ContentPiece and
// that piece's Story — everything the report-back picker needs EXCEPT the
// Audience (not included by this endpoint; resolved via DEV_AUDIENCES
// locally instead, same as the Send screen).
export interface SendWithContentPiece extends Send {
  contentPiece: ContentPiece & { story: Story };
}

// Every field the stub extractor can fill in — see
// service/src/modules/report-back/extraction/extraction.provider.ts.
// null preserved throughout (unreported, never coerced to 0/false); this
// screen never renders these values, only the request/response shape needs
// to be typed faithfully.
export interface SignalRecord {
  id: string;
  userId: string;
  feedbackReportId: string;
  niche: string;
  channel: Channel;
  contentType: ContentType;
  tone: Tone;
  audienceSizeSnapshot: number;
  views: number | null;
  replyCount: number | null;
  signupCount: number | null;
  sentiment: Sentiment | null;
  postedAt: string | null;
  followerCountSnapshot: number | null;
  hasMedia: boolean | null;
  hasExternalLink: boolean | null;
  postFormat: PostFormat | null;
  isPremiumAccount: boolean | null;
  confidenceLow: boolean;
  createdAt: string;
  updatedAt: string;
}

// reportBack's response — the created FeedbackReport + its SignalRecord. NO
// Story.status field (same gap draftStory/stagePiece have): call
// getStory(storyId) afterward for the server-authoritative REPORTED status.
export interface ReportResult {
  id: string;
  sendId: string;
  rawFeedback: string;
  createdAt: string;
  updatedAt: string;
  signalRecord: SignalRecord;
}

// ── Request shapes ───────────────────────────────────────────────────────
export interface CaptureStoryRequest {
  rawCapture: string;
  title?: string;
  contentType?: ContentType;
}

export interface StageSendRequest {
  contentPieceId: string;
  audienceId: string;
}

export interface CreateReportRequest {
  sendId: string;
  rawFeedback: string;
}

// ── Error handling ───────────────────────────────────────────────────────
// NestJS's default HttpExceptionFilter shape (no custom filter exists in
// the backend — verified in service/src/common/) — class-validator's
// ValidationPipe returns `message` as a string[]; a plain thrown
// HttpException (NotFoundException, ConflictException, ...) returns a
// single string.
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly body: ApiErrorBody;

  constructor(statusCode: number, body: ApiErrorBody) {
    super(Array.isArray(body.message) ? body.message.join(", ") : body.message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.body = body;
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-user-id": getDevUserId(),
        ...init?.headers,
      },
    });
  } catch {
    // Network failure / backend unreachable / CORS rejection — fetch throws
    // a generic TypeError with no useful body, so surface a usable message
    // instead of letting that opaque error propagate.
    throw new ApiError(0, {
      statusCode: 0,
      error: "Network Error",
      message: "Could not reach the backend — is it running and is CORS configured for this origin?",
    });
  }

  if (!response.ok) {
    let body: ApiErrorBody;
    try {
      body = await response.json();
    } catch {
      body = { statusCode: response.status, error: "Unknown Error", message: response.statusText };
    }
    throw new ApiError(response.status, body);
  }

  return response.json() as Promise<T>;
}

export function captureStory(body: CaptureStoryRequest): Promise<Story> {
  return apiRequest<Story>("/stories", { method: "POST", body: JSON.stringify(body) });
}

export function draftStory(storyId: string): Promise<ContentPiece> {
  return apiRequest<ContentPiece>(`/stories/${storyId}/draft`, { method: "POST" });
}

// draftStory's response is the ContentPiece, not the Story — it has no
// Story.status. Call this after draftStory to read the Story's updated
// status (and its ContentPiece) as server-authoritative truth, rather than
// assuming "the draft call succeeded" means "status is now DRAFTED"
// client-side.
export function getStory(storyId: string): Promise<StoryWithContentPieces> {
  return apiRequest<StoryWithContentPieces>(`/stories/${storyId}`);
}

// No status filter query param exists on GET /stories — callers filter
// client-side (e.g. to status === "DRAFTED" for the Send screen's picker).
export function listStories(page = 1, limit = 20): Promise<PaginatedStories> {
  return apiRequest<PaginatedStories>(`/stories?page=${page}&limit=${limit}`);
}

export function stagePiece(body: StageSendRequest): Promise<Send> {
  return apiRequest<Send>("/sends", { method: "POST", body: JSON.stringify(body) });
}

export function listSends(page = 1, limit = 20): Promise<PaginatedSends> {
  return apiRequest<PaginatedSends>(`/sends?page=${page}&limit=${limit}`);
}

// Enriches a bare Send (from listSends) with its ContentPiece + Story —
// GET /sends doesn't include either, only GET /sends/:id does.
export function getSend(sendId: string): Promise<SendWithContentPiece> {
  return apiRequest<SendWithContentPiece>(`/sends/${sendId}`);
}

export function reportBack(body: CreateReportRequest): Promise<ReportResult> {
  return apiRequest<ReportResult>("/reports", { method: "POST", body: JSON.stringify(body) });
}
