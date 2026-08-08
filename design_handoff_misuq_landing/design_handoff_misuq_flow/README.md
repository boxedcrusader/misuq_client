# Handoff: Misuq — Founder Marketing Loop (Capture → Draft → Report Back → Graduate)

## Overview
Misuq is an AI marketing copilot for indie SaaS founders. It turns a founder's raw
progress notes into polished marketing content, tests it on a small preview audience,
listens to how it landed, and — only on the founder's explicit judgment call — promotes
the winning stories to wider public channels.

This package covers the core five-step mobile loop:

1. **Capture** — founder drops a raw update.
2. **Draft review** — agent turns the note into a newsletter draft; founder edits and sends.
3. *(Send happens here — draft goes to the preview audience.)*
4. **Report back** — founder tells the agent, in plain chat, how it landed.
5. **Graduate** — founder decides whether to promote the story to wider channels and picks which.

The product's core philosophy: **founder judgment is the validation, not automated scores.**
There are deliberately no progress bars, no validation percentages, no "virality" metrics,
no gamification. Small sample sizes are always framed with soft caveats ("a strong hint —
not a verdict").

## About the Design Files
The `.dc.html` files in this bundle are **design references created in HTML** — prototypes
that show the intended look, copy, and behavior. They are **not** production code to lift
directly. They are authored in a proprietary component format (`<x-dc>` + `support.js`) and
each file lays out 3–4 static UI states side-by-side inside phone frames on a canvas, purely
for review.

Your task is to **recreate these designs in the target codebase's environment** (React,
React Native, SwiftUI, Vue, etc.) using its established components, styling system, and
patterns. If no environment exists yet, choose the most appropriate framework for a
mobile-first product and implement there. The phone frame, the side-by-side layout, the
step badges ("1 · Empty · idle"), and the canvas description text are **presentation
scaffolding only** — do not reproduce them. Build the screen *contents*.

## Fidelity
**High-fidelity (hifi).** Colors, typography, spacing, radii, shadows, copy, and micro-interactions
are all final and intentional. Recreate the UI pixel-accurately using the codebase's existing
libraries, then wire in real data and navigation.

---

## Design Tokens

### Colors
| Token | Hex | Usage |
|---|---|---|
| Primary / accent | `#5B4FE9` | Primary buttons, active states, focus rings, agent avatar, user chat bubbles, icons, links, bullet dots |
| Primary hover / deep | `#4338CA` | Link hover, chip text on active tags |
| Accent tint (light) | `#ECEAFB` | Active chip fill, step-number badge fill, tag pill fill, icon tile fill |
| Accent tint (mid) | `#E4E1FB` | Inline highlight on edited text |
| Canvas / desk bg | `#ECE9F8` | The review canvas behind the phone frames (scaffolding — do not ship) |
| Screen background | `#F7F6FC` | The app screen background inside the frame |
| Card white | `#FFFFFF` | Draft card, chat input, channel rows |
| Panel / subtle fill | `#F1F0FA` | Quoted note, "what's next" panel, reference cards, caveat box |
| Neutral chip fill | `#ECE9F7` | Inactive send button, step-label pills, avatar placeholder circle |
| Text primary | `#211D2E` | Headlines, primary text |
| Text body | `#3C3650` | Draft/chat body copy |
| Text secondary | `#6E6788` | Secondary action labels |
| Text muted | `#8A84A0` | Supporting copy, timestamps |
| Text faint | `#9089A5` / `#A39DBA` / `#AFA9C4` | Meta labels, placeholders, captions |
| Placeholder headline | `#C6C2DE` | Idle headline & disabled "Capture" text |
| Border default | `#E7E5F5` / `#E2E0F2` | Card & input borders |
| Border chip (inactive) | `#DAD6F0` / `#D6D2F2` | Inactive chip / secondary button borders |
| On-accent text | `#F5F3FF` | Text/icons on primary buttons and user bubbles |
| Toggle off track | `#E2E0F2` | Inactive channel toggle |
| X/Twitter tile | `#211D2E` (white text) | Channel icon |
| LinkedIn tile | `#2D64BC` (white text) | Channel icon |

### Typography
- **Display / headings:** `Space Grotesk`, weights 400/500/600/700. Used for the app
  wordmark, screen titles, big prompt text, success headlines, subject lines, section
  headers, and single-letter avatars/icon glyphs (M, X, in, B).
- **Body / UI:** `Inter`, weights 400/500/600. Everything else.
- Google Fonts import:
  `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap`
- Headline letter-spacing: `-0.01em` to `-0.02em`. Uppercase meta labels: `+0.08em`, 11px.

### Type scale (px, as used)
- Big idle prompt: 34–38 / Space Grotesk 600 / line-height ~1.25
- Success headline: 27–29 / Space Grotesk 600
- Screen title: 19 / Space Grotesk 600
- Narrative summary heading: 23 / Space Grotesk 600 / line-height 1.3
- Subject line: 17 / Space Grotesk 600
- Body & chat: 14 / Inter / line-height 1.5–1.62
- Supporting copy: 13–15 / Inter / muted
- Meta/caption: 11–12.5 / Inter
- Uppercase section label: 11 / Inter 600 / tracking 0.08em

### Spacing, radius, shadow
- Screen inner padding: `52–60px` top / `22–30px` sides / `22–34px` bottom.
- Phone frame: `392 × 812`, outer radius `44px`, `14px` bezel padding, inner screen radius `32px`.
- Card radius `18px`; pills/buttons `22–26px`; chips `20px`; tag pills `12–14px`; panels `12–16px`; icon tiles `9–11px`.
- Primary button shadow: `0 12px 26px -10px rgba(91,79,233,0.6)` (send/CTA), `0 10px 22px -8px rgba(91,79,233,0.55)` (capture).
- Focus ring: `box-shadow: 0 0 0 3–4px rgba(91,79,233,0.10–0.14)` plus `1.5px solid #5B4FE9` border.
- Frame drop shadow (scaffolding): `0 24px 60px -30px rgba(40,32,80,0.42)`.

---

## Screens / Views

### 1 — Capture  (`Capture.dc.html`)
**Purpose:** the entry point. Founder drops a raw update with minimal friction.

States: `empty/idle` → `typing` → `captured (confirmation)` → `hand-off (generating)`.

**Layout (vertical flex, full-height screen):**
- Top bar: greeting text ("Tuesday morning", `#A39DBA`, 14px) left, a 30px avatar circle (`#ECE9F7`) right. `margin-bottom: 36px`.
- Center (flex:1): the input area.
- Bottom: optional type chips row, then a footer row (helper text + Capture button).

**Components:**
- **Idle prompt** — Space Grotesk 38px/600, color `#C6C2DE` (placeholder), copy: "What'd you ship or learn?" with a 3px `#5B4FE9` blinking caret bar (blink keyframe, `1.1s step-end infinite`) before the text.
- **Typing state** — same slot becomes full-color text (`#211D2E`, 34px) showing the founder's typed note, trailing blinking caret. Sample copy: *"Shipped the new onboarding flow—cut signup from 6 steps to 2. Took all weekend but the drop-off should finally stop."*
- **Type chips** — pill row, `gap:9px`, 3 chips: Shipped / Milestone / Lesson. Inactive: `1px solid #DAD6F0`, text `#9C96B2`. Active (Shipped): fill `#ECEAFB`, border `#5B4FE9`, text `#4338CA` 600. Chips are optional/single-select.
- **Footer** — left: helper text ("Optional" idle → live char count "142 characters" when typing, `#AFA9C4`). Right: **Capture** button. Disabled idle state: fill `#ECE9F7`, text `#C6C2DE`. Enabled: fill `#5B4FE9`, text `#F5F3FF`, `→` arrow, shadow.
- **Captured state** — centered: 64px `#5B4FE9` circle with white check, a `cc-pop` scale-in animation + 3 confetti dots bursting outward (`cc-burst`). Headline "Nice. Logged." Sub "That one's tucked away safe. Nothing else to do—we've got it from here." Bottom: a recap panel (`#EFEDFB`, radius 16) with the "Shipped" tag pill + truncated note text.
- **Hand-off state** — centered: three `#5B4FE9` bouncing dots (`cc-dot`, staggered .18s). Shimmering headline "Cooking up a draft…" (animated gradient text-clip, `cc-shimmer` 2s linear). Sub explains a preview draft is coming. Footer: "Step 1 of 5 · Capture → Draft".

### 2 — Draft Review  (`DraftReview.dc.html`)
**Purpose:** agent turns the captured note into a newsletter draft; founder reviews, edits, sends.

States: `draft loaded` → `editing` → `sent (confirmation)`.

**Layout (vertical flex):** header → "From your note" quote block → "Draft for preview" label row → draft card (flex:1) → action row → primary send button.

**Components:**
- **Header** — back chevron `‹` + title "Review draft" (Space Grotesk 19/600), right: step pill "Step 2 · Draft" (`#ECE9F7` fill, muted text). In "editing" the right pill becomes a "Done" text button in `#5B4FE9`.
- **Original note quote** — left border `2px #5B4FE9`, fill `#F1F0FA`, radius `0 12px 12px 0`. Contains "Shipped" tag pill + timestamp "Tuesday, 9:14 AM" + the note text (muted `#87819C`).
- **Draft label row** — "DRAFT FOR PREVIEW" uppercase label (`#5B4FE9`) left; right: "Tap to edit" w/ pencil icon (loaded) or a pulsing dot + "Editing" (editing state).
- **Draft card** — white, `1px #E7E5F5` border, radius 18. "Subject" caption + subject line (Space Grotesk 17/600) "Signup just got 3× shorter" + body copy (Inter 14/1.62, `#3C3650`). In **editing** state the card gets `1.5px #5B4FE9` border + focus glow, an inline `#E4E1FB` highlight on an edited sentence, and a blinking caret; a formatting toolbar appears below (B / I / link icons, "Saved just now").
- **Action row (loaded)** — centered: "Regenerate" (refresh icon) and "Edit further", both `#6E6788` 13/500.
- **Primary CTA** — full-width pill, `#5B4FE9`, "Send to preview audience" + paper-plane icon.
- **Sent state** — centered 66px `#5B4FE9` circle w/ white paper-plane, `cc-pop` + expanding `cc-ring`. Headline "On its way." Sub "Sent to your 42 preview readers. We'll listen for how it lands—then check back with you." Bottom "what's next" panel (`#F1F0FA`): clock icon tile + "Next: report back / Tell Misuq how it landed in a day or two."

### 3 — Report Back  (`ReportBack.dc.html`)
**Purpose:** founder returns and tells the agent, in freeform chat, how the draft landed. No forms, no ratings.

States: `opening prompt` → `mid-conversation` → `closing / bridge to graduate`.

**Layout (vertical flex):** header → reference card (the sent piece) → chat thread (flex:1) → text input.

**Components:**
- **Header** — back chevron + "Report back" title + step pill "Step 4 · Listen".
- **Reference card** — `#F1F0FA` fill, `1px #E7E5F5` border, radius 14: small icon tile + piece title "Signup just got 3× shorter" + "Sent to 42 preview readers · 2 days ago" + "Shipped" tag pill.
- **Chat bubbles** —
  - *Agent:* 26px `#5B4FE9` circle avatar with white "M" (Space Grotesk 600) + white bubble, `1px #E7E5F5` border, radius `16 16 16 4`, text `#3C3650`. Left-aligned, max-width ~78–82%.
  - *Founder:* `#5B4FE9` bubble, radius `16 16 4 16`, text `#F5F3FF`. Right-aligned.
  - Thread is bottom-anchored (`justify-content:flex-end`).
- **Text input** — pill, white, `1px #E2E0F2` border (or `1px #5B4FE9` + glow when focused). Placeholder "Tell Misuq how it landed…" w/ blinking caret. Right: 38px circular send button — inactive `#ECE9F7` w/ faint icon, active `#5B4FE9` w/ white plane + shadow.
- **Closing / bridge** — after the agent summarizes (with an explicit small-sample caveat: *"Take it as a strong hint, not a verdict (small sample)."*), it offers two inline reply chips indented under the avatar: primary **"Mark ready to graduate"** (`#5B4FE9` fill, white, arrow) and secondary **"Keep testing"** (white, `1px #D6D2F2` border, `#5B4FE9` text). Input persists below with placeholder "Or just keep talking…".

Sample dialogue (verbatim): Agent "How'd it land? Any replies, signups, or was it quiet?" → Founder "Better than usual, honestly — 4 replies and 2 signups from it." → Agent "Nice, that's a strong hit for a preview. Any sense how many actually saw it — opens or views?" → Founder "About 30 opens out of the 42." → Agent "Got it — 2 signups from ~30 opens is genuinely good for a small list. Take it as a strong hint, not a verdict (small sample). Want to mark this ready to graduate to wider channels, or keep testing?"

### 4 — Graduate  (`Graduate.dc.html`)
**Purpose:** founder decides — as a human judgment call, not a score — whether to promote the story to wider channels, and picks which.

States: `summary & decision` → `which channels?` → `confirmation`.

**Components:**
- **Header** — back chevron + "Graduate" title + step pill "Step 5 · Decide".
- **Summary state:**
  - Reference row: "Shipped" tag + piece title.
  - Narrative heading (Space Grotesk 23/600): "How this one landed with your preview readers".
  - **Narrative bullet list** (NOT a metrics grid): each row is a 7px `#5B4FE9` dot + a sentence with the number bolded — "**4 replies** — more than your usual preview send.", "**2 signups** came straight from the email.", "A couple of readers asked **when it hits their plan**."
  - **Soft caveat box** (`#F1F0FA`, radius 12): info icon + "Around 30 people saw this. A strong hint — not a verdict."
  - Decision block: heading "Ready to take it wider?" + reassurance "No rush — this is your call to make." Then primary CTA "Graduate to wider channels" (`#5B4FE9`, trending-up icon) and secondary "Keep testing — not yet" (`1px #DAD6F0` border, `#6E6788`).
- **Which channels state:**
  - Heading "Where should it go?" + sub "Pick the channels. Misuq reshapes the story to fit each one's voice."
  - **Channel rows** — white cards, radius 16. Each: 38px icon tile + name + one-line description + a 44×26 toggle.
    - X / Twitter — tile `#211D2E` white "X"; "Punchy hook, thread-ready"; ON (toggle `#5B4FE9`, knob right; row border `1.5px #5B4FE9` + glow).
    - LinkedIn — tile `#2D64BC` white "in"; "Narrative, professional arc"; ON.
    - Blog — tile `#ECE9F7` w/ file icon; "Long-form, technical detail"; OFF (toggle track `#E2E0F2`, knob left; row border `1px #E7E5F5`).
  - Footer: reassurance "You'll review every draft before anything posts." + primary CTA whose label reflects the count: "Reformat for 2 channels".
- **Confirmation state:** centered 66px `#5B4FE9` circle w/ white trending-up icon (`cc-pop` + `cc-ring`). Headline "Graduated." Sub "This story is heading to **X** and **LinkedIn**. Misuq is reshaping it for each — drafts land for your review shortly." Bottom: per-channel status rows (`#F1F0FA`) each with icon tile + "Thread draft" / "LinkedIn post draft" + "Reshaping…" status.

---

## Interactions & Behavior
- **Navigation flow:** Capture (send) → generating → Draft Review. Draft Review (send) → sent → later notification → Report Back. Report Back ("Mark ready to graduate") → Graduate. Graduate (choose channels → reformat) → per-channel draft review (out of scope here, mirrors Draft Review).
- **Capture button** is disabled until there is input; char count updates live; type chips are optional and single-select.
- **Draft card** is tap-to-edit inline; regenerate re-requests a draft from the agent; edits autosave ("Saved just now").
- **Report Back** is a real chat: agent asks follow-up questions, founder answers freeform. The agent surfaces the graduate/keep-testing choice as inline reply chips once it has enough signal — the founder can also just keep typing.
- **Graduate** channel toggles are independent; the primary CTA label counts selected channels ("Reformat for N channels"); disable/adjust when zero selected.
- **Animations:**
  - `cc-blink` — caret, `1.1s step-end infinite`.
  - `cc-pop` — success icon scale-in, `~0.45s ease-out`.
  - `cc-ring` / `cc-burst` — expanding ring + confetti on success moments, `~0.7–1.1s ease-out`.
  - `cc-dot` — 3 staggered bouncing dots for "thinking", `1.2s ease-in-out`, `.18s` stagger.
  - `cc-shimmer` — gradient sweep across "Cooking up a draft…" text, `2s linear infinite`.
- **Focus states:** inputs and the active draft card get a `#5B4FE9` border + `rgba(91,79,233,0.10–0.14)` glow.

## State Management
- **Capture:** `noteText` (string), `selectedType` ('shipped'|'milestone'|'lesson'|null), `charCount` (derived), `phase` ('idle'|'typing'|'captured'|'handoff').
- **Draft Review:** `originalNote` (text + type + timestamp), `draft` ({subject, body}), `isEditing` (bool), `sendState` ('loaded'|'editing'|'sent'), `previewAudienceCount` (e.g. 42).
- **Report Back:** `messages` (array of {role:'agent'|'founder', text}), `input` (string), `showGraduateChoice` (bool).
- **Graduate:** `summary` (replies, signups, reachEstimate, notableQuotes), `decision` ('undecided'|'graduate'|'keep'), `channels` ({x, linkedin, blog} bools), `confirmState` (bool).
- **Data fetching:** draft generation, send-to-audience, and channel reformatting are async agent/API calls with loading states (the shimmer/thinking dots represent these).

## Assets
- **Fonts:** Space Grotesk + Inter via Google Fonts (link above). Swap for the codebase's equivalents if a self-hosted setup exists.
- **Icons:** all icons are inline stroke SVGs in the Feather/Lucide style (check, paper-plane/send, refresh-cw, pencil/edit, clock, chevron-left, arrow-right, trending-up, info-circle, file-code, link, book/document). Use the codebase's existing icon library (Lucide recommended) — do not copy the raw SVG paths.
- **Channel glyphs:** "X" and "in" are set as text glyphs in Space Grotesk on colored tiles, not brand logos. Replace with official brand marks if brand guidelines require.
- **No raster images / photography** are used.

## Files
- `Capture.dc.html` — capture screen, 4 states.
- `DraftReview.dc.html` — draft review, 3 states.
- `ReportBack.dc.html` — report-back chat, 3 states.
- `Graduate.dc.html` — graduate decision + channel picker, 3 states.
- `support.js` — runtime for the prototype format only; **not** needed for implementation.

> The `<x-dc>` wrapper, `<helmet>`, the outer canvas `<div>`, the phone-frame `<div>`s, and the
> numbered state badges are all prototype scaffolding. Implement only the inner screen content
> (everything inside the inner `border-radius:32px` container of each frame).
