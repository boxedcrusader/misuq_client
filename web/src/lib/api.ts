// Typed client for the misuq_service backend — covers the full V1 loop
// (capture/draft, send, report-back, graduate).
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
//   - graduateStory's response <- GraduateController's POST /stories/:id/graduate
//                                 (returns the updated Story itself, typed as Story — no
//                                 separate interface needed, no getStory follow-up required)
//   - UpdateContentPieceRequest <- service/src/modules/content-pieces/dto/update-content-piece.dto.ts
//   - updateContentPiece's response <- ContentPiecesController's PATCH /content-pieces/:id
//                                 (returns the updated ContentPiece itself — server-authoritative,
//                                 no follow-up read needed, same pattern as graduateStory)
//   - RegisterRequest / LoginRequest <- service/src/modules/auth/dto/{register,login}.dto.ts
//   - AuthUser / AuthResult    <- AuthService's PUBLIC_USER_SELECT + register/login response
//                                 (service/src/modules/auth/auth.service.ts)
//   - UpdateMeRequest          <- service/src/modules/auth/dto/update-me.dto.ts
//   - Audience / Create/UpdateAudienceRequest <- service/src/modules/audiences/ (model + DTOs)
//   - VoiceSample              <- service/src/modules/voice/ (GET/PUT /voice-profile)
// If a field name or shape here ever differs from the real DTO/model, that's
// a bug in THIS file to fix, not something to paper over client-side.

import { clearSession, getSession, setSession, setSessionOnboarded, updateTokens } from "@/lib/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

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
export type Plan = "DRAFT_ONLY" | "STARTER" | "GROWTH" | "SCALE";
export type Niche =
  | "DEV_TOOLS"
  | "AI_TOOLS"
  | "PRODUCTIVITY"
  | "NO_CODE"
  | "MARKETING_TOOLS"
  | "ANALYTICS"
  | "DESIGN_TOOLS"
  | "ECOMMERCE"
  | "FINTECH"
  | "OTHER";

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
  // Immutable snapshot of the drafting provider's raw output, set once at
  // draft generation. `body` is the mutable current/shipped text — send-as-is
  // is derivable client-side as `body === generatedBody`, no separate flag.
  generatedBody: string;
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
// Audience (not included by this endpoint; the screen resolves names from
// listAudiences() client-side).
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
  // null = the post's angle was never classified (ContentPiece.tone was
  // OTHER) — the backend never pools OTHER as a grouping key.
  tone: Tone | null;
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
// signalRecord is null when Gemini extraction failed: the founder's report
// and the REPORTED status are saved regardless, and the backend can retry
// extraction later (POST /reports/:id/extract) — so null is NOT an error
// to show the founder.
export interface ReportResult {
  id: string;
  sendId: string;
  rawFeedback: string;
  createdAt: string;
  updatedAt: string;
  signalRecord: SignalRecord | null;
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

export interface UpdateContentPieceRequest {
  body: string;
}

export interface CreateReportRequest {
  sendId: string;
  rawFeedback: string;
}

export interface RegisterRequest {
  email: string;
  password: string; // 8–128 chars (RegisterDto)
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ── Auth response shapes ────────────────────────────────────────────────
// Never includes passwordHash / hashedRefreshToken — the backend selects
// these fields explicitly (PUBLIC_USER_SELECT).
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  plan: Plan;
  niche: Niche | null;
  aggregateLearningConsent: boolean;
  // When onboarding finished; null = not yet. Product screens send the
  // founder to /onboarding until it's set (RequireAuth).
  onboardedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface UpdateMeRequest {
  name?: string; // "" clears it
  niche?: Niche; // no way to unset — report-back needs one
}

export interface Audience {
  id: string;
  userId: string;
  name: string;
  type: AudienceType;
  size: number; // founder's rough headcount; frozen into each Send at send time
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAudiences {
  data: Audience[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateAudienceRequest {
  name: string; // 1–80 chars
  type: AudienceType;
  size: number; // integer, 1–10,000,000
}

export type UpdateAudienceRequest = Partial<CreateAudienceRequest>;

export interface VoiceSample {
  styleSample: string | null;
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

function networkError(): ApiError {
  // Network failure / backend unreachable / CORS rejection — fetch throws
  // a generic TypeError with no useful body, so surface a usable message
  // instead of letting that opaque error propagate.
  return new ApiError(0, {
    statusCode: 0,
    error: "Network Error",
    message: "Could not reach the backend — is it running and is CORS configured for this origin?",
  });
}

function sendRequest(path: string, init: RequestInit | undefined, accessToken: string | undefined): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });
}

// ── Token refresh ───────────────────────────────────────────────────────
// The backend ROTATES refresh tokens: each one works exactly once. So
// concurrent 401s (a screen firing several requests at once) must share ONE
// refresh call — if each fired its own, the first would spend the token and
// the rest would be rejected, logging the founder out for no reason.
type RefreshOutcome = "refreshed" | "rejected" | "unavailable";
let refreshInFlight: Promise<RefreshOutcome> | null = null;

function refreshSession(): Promise<RefreshOutcome> {
  refreshInFlight ??= doRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function doRefresh(): Promise<RefreshOutcome> {
  const current = getSession();
  if (!current) return "rejected";

  let response: Response;
  try {
    response = await sendRequest(
      "/auth/refresh",
      { method: "POST", body: JSON.stringify({ refreshToken: current.refreshToken }) },
      undefined,
    );
  } catch {
    // Backend unreachable is not a verdict on the session — keep it.
    return "unavailable";
  }

  if (response.ok) {
    updateTokens((await response.json()) as { accessToken: string; refreshToken: string });
    return "refreshed";
  }

  // Another TAB may have rotated the token while this request was in
  // flight (tabs share localStorage but not refreshInFlight). If storage
  // now holds a different refresh token, that tab won — use its tokens.
  const latest = getSession();
  if (latest && latest.refreshToken !== current.refreshToken) return "refreshed";

  // Any 4xx is a definitive "this token is no good" (401 spent/revoked/
  // expired; 400 malformed — RefreshDto's @IsJWT) and ends the session.
  // Only a 5xx might be transient, so that one keeps it.
  if (response.status >= 400 && response.status < 500) {
    clearSession(); // RequireAuth sees this and redirects to /login
    return "rejected";
  }
  return "unavailable";
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await sendRequest(path, init, getSession()?.accessToken);
    // An expired access token is routine (15 min TTL): refresh once and
    // replay. Never loops — the replay's own 401 falls through as an error.
    if (response.status === 401 && getSession()) {
      const outcome = await refreshSession();
      if (outcome === "refreshed") {
        response = await sendRequest(path, init, getSession()?.accessToken);
      }
    }
  } catch {
    throw networkError();
  }

  return readResponse<T>(response);
}

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let body: ApiErrorBody;
    try {
      body = await response.json();
    } catch {
      body = { statusCode: response.status, error: "Unknown Error", message: response.statusText };
    }
    throw new ApiError(response.status, body);
  }

  // No body to parse: either 204 No Content (POST /auth/logout), or a 200
  // whose handler returned null — Nest sends that as an EMPTY body, not the
  // text "null" (found live: GET /voice-profile for a founder with no sample
  // crashed onboarding with "Unexpected end of JSON input").
  const text = await response.text();
  if (text.length === 0) return (response.status === 204 ? undefined : null) as T;
  return JSON.parse(text) as T;
}

// ── Auth ─────────────────────────────────────────────────────────────────
// register/login go through a plain fetch, not apiRequest: they're public
// endpoints, and a 401 here means "wrong password", not "refresh and retry".
async function authenticate(path: "/auth/register" | "/auth/login", body: RegisterRequest | LoginRequest): Promise<AuthResult> {
  let response: Response;
  try {
    response = await sendRequest(path, { method: "POST", body: JSON.stringify(body) }, undefined);
  } catch {
    throw networkError();
  }
  const result = await readResponse<AuthResult>(response);
  setSession({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      onboarded: result.user.onboardedAt !== null,
    },
  });
  return result;
}

// 409 when the email already has an account; 400 for validation failures
// (bad email, password under 8 chars).
export function register(body: RegisterRequest): Promise<AuthResult> {
  return authenticate("/auth/register", body);
}

// 401 "Invalid email or password" for both unknown email and wrong password.
export function login(body: LoginRequest): Promise<AuthResult> {
  return authenticate("/auth/login", body);
}

// Revokes the refresh token server-side, then forgets the local session.
// The local clear happens even if the server call fails — a founder who
// clicks "Log out" must end up logged out on this device regardless.
export async function logout(): Promise<void> {
  try {
    await apiRequest<void>("/auth/logout", { method: "POST" });
  } catch {
    // Best-effort revocation; the refresh token still expires on its own.
  } finally {
    clearSession();
  }
}

export function getMe(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/me");
}

export function updateMe(body: UpdateMeRequest): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/me", { method: "PATCH", body: JSON.stringify(body) });
}

// 400 if no niche is set yet. Idempotent: the original onboardedAt is never
// moved. Also flips the local session's onboarded flag so RequireAuth lets
// the founder into the product without another round-trip.
export async function completeOnboarding(): Promise<AuthUser> {
  const user = await apiRequest<AuthUser>("/auth/me/onboarding", { method: "POST" });
  setSessionOnboarded(user.onboardedAt !== null);
  return user;
}

// ── Audiences ────────────────────────────────────────────────────────────
// Always the logged-in founder's own; another founder's id 404s.
export function listAudiences(page = 1, limit = 50): Promise<PaginatedAudiences> {
  return apiRequest<PaginatedAudiences>(`/audiences?page=${page}&limit=${limit}`);
}

export function createAudience(body: CreateAudienceRequest): Promise<Audience> {
  return apiRequest<Audience>("/audiences", { method: "POST", body: JSON.stringify(body) });
}

// Safe for history: past Sends keep their own frozen audienceSizeSnapshot.
export function updateAudience(audienceId: string, body: UpdateAudienceRequest): Promise<Audience> {
  return apiRequest<Audience>(`/audiences/${audienceId}`, { method: "PATCH", body: JSON.stringify(body) });
}

// ── Voice sample (drafting voice reference) ─────────────────────────────
// null when the founder never submitted one.
export function getVoiceSample(): Promise<VoiceSample | null> {
  return apiRequest<VoiceSample | null>("/voice-profile");
}

// 40–4000 chars (SetVoiceSampleDto). Upsert: re-submitting replaces it.
export function setVoiceSample(styleSample: string): Promise<VoiceSample> {
  return apiRequest<VoiceSample>("/voice-profile", { method: "PUT", body: JSON.stringify({ styleSample }) });
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

// PATCH /content-pieces/:id — returns the updated piece (server-authoritative
// body/status), same "trust the response, don't compute client-side"
// discipline as every other write in this file. 409 when the piece has
// already been SENT (send froze it, too late to edit) — surface via
// ErrorBanner same as the other guard errors in this file.
export function updateContentPiece(contentPieceId: string, body: UpdateContentPieceRequest): Promise<ContentPiece> {
  return apiRequest<ContentPiece>(`/content-pieces/${contentPieceId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
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

// No request body — returns the updated Story itself (status GRADUATED,
// graduatedAt stamped), so this IS the server-authoritative read; no
// getStory follow-up needed, unlike stagePiece/reportBack.
export function graduateStory(storyId: string): Promise<Story> {
  return apiRequest<Story>(`/stories/${storyId}/graduate`, { method: "POST" });
}
