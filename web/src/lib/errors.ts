import { ApiError } from "@/lib/api";

// One place that turns any failure into words a founder can act on. The
// backend's messages are written for developers ("Story cm3… not found",
// "rawCapture must be shorter than or equal to 4000 characters",
// "ThrottlerException: Too Many Requests"), so screens never show them raw:
// they show describeError()'s title + detail, and a screen with a more
// specific story to tell (e.g. "already staged to Beta list") passes its own
// detail through ErrorBanner's `message` prop.

export interface ErrorCopy {
  title: string;
  detail: string;
  // What the founder can do next. "retry" means the same action may simply
  // work again; "login" means the session is gone.
  action: "retry" | "login" | "none";
}

// Wraps anything thrown (ApiError, TypeError, a string) into an ApiError so
// every screen's catch block can stay one line.
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  return new ApiError(0, { statusCode: 0, error: "Unknown", message: err instanceof Error ? err.message : String(err) });
}

const FIELD_NAMES: Record<string, string> = {
  rawCapture: "Your update",
  title: "The title",
  rawFeedback: "Your feedback",
  body: "The draft",
  name: "The name",
  size: "The number of people",
  type: "The type",
  email: "Email",
  password: "Password",
  styleSample: "Your writing sample",
  niche: "What you're building",
  contentType: "The kind of update",
};

// class-validator's default messages, reworded. Anything unrecognised falls
// through unchanged: Nest's own sentences are already readable.
function humanizeValidation(message: string): string {
  const field = message.split(" ")[0];
  const subject = FIELD_NAMES[field] ?? null;
  if (/^property \S+ should not exist$/.test(message)) return "Something unexpected was sent. Refresh the page and try again.";
  if (!subject) return message;
  const rest = message.slice(field.length).trim();
  const rules: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/^must be shorter than or equal to (\d+) characters$/, (m) => `is too long — keep it under ${Number(m[1]).toLocaleString()} characters.`],
    [/^must be longer than or equal to (\d+) characters$/, (m) => `is too short — at least ${m[1]} characters.`],
    [/^should not be empty$/, () => "can't be empty."],
    [/^must be an email$/, () => "doesn't look like an email address."],
    [/^must not be less than (\d+)$/, (m) => `must be at least ${m[1]}.`],
    [/^must not be greater than (\d+)$/, (m) => `must be ${Number(m[1]).toLocaleString()} or less.`],
    [/^must be an integer number$/, () => "must be a whole number."],
    [/^must be one of the following values/, () => "isn't one of the options."],
  ];
  for (const [pattern, render] of rules) {
    const match = rest.match(pattern);
    if (match) return `${subject} ${render(match)}`;
  }
  return `${subject} ${rest}`;
}

function validationDetail(error: ApiError): string {
  const raw = error.body.message;
  const messages = Array.isArray(raw) ? raw : [raw];
  // De-duplicate: one field can fail two rules with the same reworded text.
  return [...new Set(messages.map(humanizeValidation))].join(" ");
}

export function describeError(error: ApiError): ErrorCopy {
  const message = error.message;
  switch (error.statusCode) {
    case 0:
      return {
        title: "Can't reach Misuq",
        detail: "Check your connection and try again. Nothing you typed has been lost.",
        action: "retry",
      };
    case 400:
      return { title: "Let's fix that", detail: validationDetail(error), action: "none" };
    case 401:
      return { title: "You've been logged out", detail: "Log in again to pick up where you left off.", action: "login" };
    case 403:
      return { title: "That's not yours", detail: "This belongs to another account.", action: "none" };
    case 404:
      return {
        title: "We couldn't find that",
        detail: "It may have been removed, or the link is out of date. Head home to see what's there now.",
        action: "none",
      };
    case 409:
      return {
        title: "That's already done",
        detail: "This step has already happened, maybe in another tab. Refresh to see the latest.",
        action: "none",
      };
    case 413:
      return { title: "That's too long", detail: "Trim it down a little and try again.", action: "none" };
    case 429: {
      const daily = message.match(/Daily limit reached: (\d+) (drafts|report-backs) per 24 hours/);
      if (daily) {
        return {
          title: "That's today's limit",
          detail: `You can do ${daily[1]} ${daily[2]} a day during the beta. Your work is saved — come back tomorrow.`,
          action: "none",
        };
      }
      return {
        title: "One moment",
        detail: "That was a lot of tries in a short time. Wait a minute, then try again.",
        action: "retry",
      };
    }
    case 502:
      if (/analyze this report/.test(message)) {
        return {
          title: "Your report is saved",
          detail: "We couldn't read the numbers out of it just yet. Nothing is lost — we'll try again.",
          action: "none",
        };
      }
      return {
        title: "The draft didn't come through",
        detail: "Our writing model had a hiccup. Try again — it usually works the second time.",
        action: "retry",
      };
    case 503:
      return { title: "Misuq is catching its breath", detail: "We're briefly unavailable. Try again in a minute.", action: "retry" };
    default:
      if (error.statusCode >= 500) {
        return {
          title: "Something broke on our side",
          detail: "It's not you. Try again in a moment.",
          action: "retry",
        };
      }
      return { title: "Something went wrong", detail: "Try again in a moment.", action: "retry" };
  }
}
