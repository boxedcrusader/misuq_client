# Handoff: Misuq Marketing Landing Page

## Overview
Marketing landing page for **Misuq**, an AI marketing copilot for indie SaaS founders. The product drafts build-in-public updates, validates them on a founder's own small audience first, then reshapes the winners for wider channels (X, LinkedIn, email). Nothing auto-posts; the founder approves everything. The page communicates the product promise, the problem, the five-step loop, a report-back demo, pricing, and a closing CTA.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy directly. The task is to **recreate these designs in the target codebase's existing environment** (React, Vue, Svelte, etc.) using its established patterns, component library, and styling approach. If no environment exists yet, choose the most appropriate framework for a marketing site (e.g. Next.js/Astro) and implement there.

The HTML uses a custom Design Component runtime (`support.js`, `<x-dc>` tags). **Ignore that runtime** — it is our authoring tool. Only the markup, styles, and copy inside are the reference.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, and copy are all intentional and should be reproduced faithfully. Recreate pixel-close using the codebase's own libraries. There are no interactions beyond hover/nav — this is a static marketing page.

## Design System Reference
This page is built on the Misuq design system (also in this bundle: `Misuq Design System.dc.html`). Honor it:
- Minimal, not cold. Confident and considered, never decorative.
- No dashboard chrome, no heavy borders or decorative drop shadows — structure comes from whitespace and hairline (1px) borders.
- Generous whitespace. Founder-paced: no urgency, countdowns, streaks, or manufactured pressure.

## Design Tokens

### Colors
| Role | Hex | Usage |
|------|-----|-------|
| Primary accent (Electric Indigo) | `#5B4FE9` | CTAs, focus states, active selections, featured cards |
| Indigo hover | `#4A3FD0` | Link/button hover |
| Deep Ink | `#1B1830` | Primary text; dark section background |
| Lavender Ground | `#F7F6FC` | Page background (not pure white) |
| White | `#FFFFFF` | Cards |
| Soft Periwinkle | `#C7C2E8` | Small logo dot, de-emphasized fills |
| Border hairline | `#E3E0F4` | Card + section borders |
| Border (input/secondary btn) | `#D3CFEB` | Secondary button + input outlines |
| Muted violet border | `#DAD6EF` | Pill/badge outlines |
| Body text muted | `#4A4666` | Paragraph copy |
| Text muted 2 | `#6E6990` | Card body copy |
| Text muted 3 (labels) | `#8E88BE` | Eyebrow labels, captions |
| Context card fill | `#F4F2FC` | (from system) prior-context cards |
| CTA panel fill | `#F0EEFA` | Closing CTA background |
| On-dark heading | `#F3F1FE` | Text on Deep Ink |
| On-dark body | `#B7B2D8` | Body on Deep Ink |
| Logo accent mids | `#8E84EE` | Middle logo dot |

Logo dot palette (rising-baseline mark): small `#C7C2E8`, mid `#8E84EE`, large `#5B4FE9`.
On dark: `#6E64C8` / `#8E84EE` / `#8579FF`.

### Typography
Two families (Google Fonts):
- **Space Grotesk** (400/500/600/700) — display, headings, prompts, the wordmark, numeric/section markers. Used where personality matters.
- **Inter** (400/450/500/600) — body, UI labels, buttons, chat text, captions.

Key sizes as used:
| Token | Font | Size / line-height / tracking |
|-------|------|------|
| Hero H1 | Space Grotesk 600 | 58px / 1.02 / -0.03em |
| Section H2 | Space Grotesk 600 | 38px / 1.08 / -0.025em |
| Card/demo H2 | Space Grotesk 600 | 32px / 1.1 / -0.02em |
| Problem statement | Space Grotesk 400 | 34px / 1.32 / -0.02em |
| CTA H2 | Space Grotesk 600 | 42px / 1.06 / -0.025em |
| Step title | Space Grotesk 600 | 18px / -0.01em |
| Price figure | Space Grotesk 600 | 40px / -0.02em |
| Hero lead | Inter 400 | 19px / 1.6 |
| Body | Inter 400 | 16–17px / 1.6 |
| Button | Inter 500 | 15–16px |
| Eyebrow label | Inter 500 | 12px / 0.12em / uppercase |
| Caption | Inter 450–500 | 13–14px |

### Radii
Buttons `10–12px`; cards `16–18px`; large panels `20–24px`; pills/badges `999px`; input fields `11–12px`.

### Shadows (sparingly)
- Hero visual card: `0 24px 60px -30px rgba(27,24,48,0.25)`
- Featured pricing card: `0 24px 60px -30px rgba(91,79,233,0.6)`
- Input focus ring: `0 0 0 3px rgba(91,79,233,0.15)` with `1px #5B4FE9` border

### Layout
Content max-width `1080px`, horizontal padding `40px`. Sections separated by generous vertical padding (80–112px).

## Screens / Views
Single page, stacked sections top to bottom:

1. **Nav** — max-width row, space-between. Left: rising-baseline logo SVG (30px) + "Misuq" wordmark (Space Grotesk 600, 18px). Right: "How it works" and "Pricing" text links (Inter 450, 14.5px, `#4A4666`) + primary "Start free" button (indigo fill, radius 10, 10×18 padding).

2. **Hero** — 2-col grid (1.05fr / 0.95fr), 64px gap, centered.
   - Left: pill badge "For indie SaaS founders"; H1 "Shipping got easy. Getting noticed didn't."; lead paragraph; two buttons ("Draft my first update" primary, "See how it works" secondary outline); fine print "No card required · No auto-posting, ever · Founder-paced".
   - Right: white card (radius 20, hero shadow) titled eyebrow "Capture", prompt "What'd you ship or learn?" (Space Grotesk 500, 22px), a focused textarea preview, then an agent chat bubble (`#F4F2FC` fill, hairline, tail radius `14px 14px 14px 4px`) and two chips ("Draft it" indigo fill, "Add context" outline).

3. **Problem** (Deep Ink `#1B1830` full-bleed) — 2-col grid. Left: large Space Grotesk statement "AI made building cheap…". Right: two muted paragraphs (`#B7B2D8`).

4. **How it works** (`#how`) — eyebrow + H2 + lead, then a 5-col grid of step cards (01–05): Capture, Draft, Send, Report back, Graduate. Cards are white with hairline border; **the fifth (Graduate) is indigo-filled** with light text.

5. **Report-back demo** — single white card (radius 24, 56px padding), 2-col (0.9fr / 1.1fr). Left: eyebrow "Report back" + H2 + body. Right: a chat exchange — agent bubbles on `#F7F6FC` with hairline (left, tail `16px 16px 16px 5px`), founder bubble indigo fill (right, tail `16px 16px 5px 16px`), then a confirmation row with an indigo check tile + "Graduated to a validated story".

6. **Pricing** (`#pricing`) — eyebrow + H2 "Flat tiers. No per-draft metering." + lead, then 3-col grid: Starter $19, **Growth $49 (indigo-filled, "Popular" badge, featured shadow)**, Scale $99. Each: name, price figure, one-line description, and a button (Growth's button is light-on-indigo; others outline).

7. **Closing CTA** — `#F0EEFA` panel (radius 24), centered: H2 "You built it. Let's get it noticed.", supporting line, primary button.

8. **Footer** — top hairline border, max-width row: logo (24px) + wordmark on left, tagline "The marketing copilot for indie SaaS founders." on right (`#8E88BE`).

## Components (reusable)
- **Primary button**: Inter 500, `#F7F6FC` text on `#5B4FE9`, radius 11–12, 12–15px vertical padding.
- **Secondary button**: transparent, `1px #D3CFEB` border, `#3A3557` text.
- **Chip/tag**: pill (radius 999). Selected = indigo fill + light text; unselected = transparent + `#D3CFEB` border + `#5A5580` text.
- **Input/textarea**: fill white, `1px #D3CFEB` border default; focus = `1px #5B4FE9` + `0 0 0 3px rgba(91,79,233,0.15)` ring. Placeholder text `#9B96C4`.
- **Chat bubble**: agent left (light fill, hairline, asymmetric tail bottom-left), founder right (indigo fill, tail bottom-right). No avatars.
- **Context card**: `#F4F2FC` fill, `#E7E4F6` border, radius 12, uppercase caption + quoted prior text in `#6E6990`.
- **Confirmation micro-copy**: small indigo check tile + Space Grotesk 500 acknowledgment line + Inter muted follow-up. Warm, minimal.

## Interactions & Behavior
- Links change color to `#4A3FD0` on hover. Define default `a`/`a:hover` even where no links exist yet.
- Nav anchors (`#how`, `#pricing`) smooth-scroll to sections (do not use `scrollIntoView` if it disrupts the app; native anchor scroll is fine).
- No animations, loading, error, or form states in this reference. Buttons are visual only.
- Responsive: single-column stacking below ~900px is expected but not specified in the mock — apply the codebase's breakpoints; collapse the 2-col and 5-col grids to 1-col, reduce hero H1 accordingly.

## State Management
None. Static marketing page.

## Assets
- **Logo**: inline SVG (no file). Rising-baseline mark = three circles at increasing size and rising baseline:
  ```svg
  <svg viewBox="0 0 132 132" fill="none">
    <circle cx="24" cy="96" r="10" fill="#C7C2E8"/>
    <circle cx="66" cy="80" r="16" fill="#8E84EE"/>
    <circle cx="112" cy="54" r="22" fill="#5B4FE9"/>
  </svg>
  ```
  App-icon variant: same geometry in white/periwinkle tints on a `#5B4FE9` rounded tile.
- **Fonts**: Space Grotesk + Inter via Google Fonts.
- No images/photography. Do not generate any; request real assets if needed.

## Files
- `Misuq Landing.dc.html` — the landing page reference (this handoff's subject).
- `Misuq Design System.dc.html` — full color/type/component/voice reference.
- `Misuq Logo.dc.html` — logo exploration and the final rising-baseline mark with scale/app-icon/dark variants.
- Ignore `support.js` and `.dc.html` runtime wrappers — authoring tooling only.
