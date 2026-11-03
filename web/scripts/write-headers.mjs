// Writes out/_headers (Cloudflare Pages response headers) after `next build`.
//
// Generated, not a static public/_headers, so the CSP's connect-src always
// names the SAME API origin that NEXT_PUBLIC_API_URL baked into the bundle —
// a hand-edited copy would drift and silently block every API call.
//
// script-src/style-src need 'unsafe-inline': the static export inlines its
// RSC payload scripts and the pre-paint theme script (app/layout.tsx).
// Everything else is locked to this origin; fonts are self-hosted by
// next/font at build time.
import { writeFileSync } from "node:fs";

const api = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").origin;

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self' ${api}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const headers = `/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
`;

writeFileSync(new URL("../out/_headers", import.meta.url), headers);
console.log(`wrote out/_headers (connect-src → ${api})`);
