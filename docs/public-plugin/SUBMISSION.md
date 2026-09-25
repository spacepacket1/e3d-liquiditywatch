# SUBMISSION.md — Current OpenAI Plugin Submission Procedure

**Sources checked 2026-09-24** (current as of that date; OpenAI's submission flow has
changed at least once in 2026 — re-verify before acting if this file is more than a few
months old):

- [developers.openai.com/plugins/deploy/submission](https://developers.openai.com/plugins/deploy/submission) — plugin submission requirements
- [developers.openai.com/api/docs/guides/tools-connectors-mcp](https://developers.openai.com/api/docs/guides/tools-connectors-mcp) — remote MCP server requirements for the Responses API
- Corroborating secondary sources (not primary, used only to confirm dates/timeline):
  [OpenAI: "Developers can now submit apps to ChatGPT"](https://openai.com/index/developers-can-now-submit-apps-to-chatgpt/),
  VentureBeat coverage of the same announcement

`help.openai.com` (the Help Center, which hosts "Submitting apps to the ChatGPT app
directory" and "Developer mode and MCP apps in ChatGPT") returned HTTP 403 to this
session's fetcher on every attempt — likely bot protection on that Zendesk-hosted domain,
not a real access restriction. **Before submitting, read those two Help Center articles
directly in a real browser** — they're the primary consumer-facing docs and may contain
detail beyond what `developers.openai.com` covers. This file should not be treated as a
complete substitute for them.

**Context:** OpenAI migrated the app directory into a unified "Plugin Directory" (shared
with Codex) on **2026-07-09**. Older "Custom GPT" and legacy-plugin documentation
describes a different, retired workflow — do not follow it.

---

## 1. Eligibility

- The submitting account needs **"Apps Management" write permission** in the OpenAI
  Platform organization. Organization owners have this by default; anyone else needs it
  explicitly granted.
- **Every public submission must use a verified developer or business identity** in the
  OpenAI Platform (individual or business verification, done in organization settings).
  The verified identity's name must match the listing's publisher name, website, and
  support contact — mismatches risk rejection.
  - **Owner action required.** This is an OpenAI-account-level step FutCo/E3D's owner
    must complete; no code or infrastructure change enables it.

## 2. Domain verification (required for every remote MCP plugin)

- OpenAI issues a verification token during submission. It must be served at:
  `https://<challenge-base-host>/.well-known/openai-apps-challenge`
- The challenge base host is the MCP hostname or a parent hostname; **paths are ignored**
  — you cannot verify two different plugins on the same hostname via different paths.
- The endpoint must return **only** that token (no HTML wrapper, no JSON envelope).

**Already prepared:** `lib/http-app.js` (in `e3d-mcp`) serves
`GET /.well-known/openai-apps-challenge` from the `OPENAI_APPS_CHALLENGE_TOKEN` env var —
currently unset (404, inert). Once OpenAI issues a real token during submission, setting
that one env var and restarting the `e3d-mcp-http` PM2 process is the entire deployment
step. See `RELEASE_CHECKLIST.md`.

## 3. MCP endpoint requirements

- Use a **"Universal" URL** (one fixed endpoint working for all users) rather than a
  per-workspace "Template" URL — LiquidityWatch's data isn't user-specific, so Universal
  is the correct (and simpler) choice. `https://liquiditywatch.e3d.ai/mcp` already is one.
- Transport: **Streamable HTTP** — already what `server-http.js` implements and what was
  verified live in `TEST_REPORT.md`.
- **Authentication:** OpenAI's docs describe OAuth requirements *when auth is used* (demo
  credentials that work without MFA/SMS/email confirmation, `openid`+`email` scopes,
  etc.) but do not state that every submitted server must use auth. LiquidityWatch's three
  tools are fully public, unauthenticated, read-only data — matching the sensitivity of
  what's already public on liquiditywatch.e3d.ai. This is a **judgment call, not a
  documented hard requirement**; flag it explicitly during submission and be ready to
  explain the reasoning if a reviewer asks.

## 4. Tool metadata standards

- Every tool needs a clear name, description, input schema, and output structure — done
  (see `docs/API-CONTRACT.md` for the wire format the descriptions are built against).
- Every tool needs `readOnlyHint`, `openWorldHint`, and (for write tools) `destructiveHint`
  annotations. **Gap found and fixed this session** — see `SECURITY.md`; all three tools
  now carry `readOnlyHint: true`, `destructiveHint: false`, `openWorldHint: true`,
  `idempotentHint: true`, verified live.
- Remove unnecessary personal data, secrets, debug payloads, internal identifiers,
  undisclosed user-related fields from responses — audited in `SECURITY.md` §Data
  sanitization; nothing found to remove.

## 5. Test cases (required for submission)

**5 positive + 3 negative minimum**, each with a user prompt, expected behavior/result
shape, and (for negatives) the expected refusal/fallback and its rationale — written so a
reviewer with no prior context can run them. Drafted in `TEST_REPORT.md` §Submission test
cases; not yet run *through ChatGPT itself* (only through direct MCP protocol calls — see
`TEST_REPORT.md` for exactly what was and wasn't verified).

## 6. Branding & listing content

- Production-ready logo/brand assets, a concise short description, a longer workflow
  description, and starter/example prompts. Drafted in `LISTING.md`, built from existing
  LiquidityWatch branding (`public/favicon.svg`, `public/liquiditywatch*.{png,jpg}` in
  this repo) — no new brand identity invented.

## 7. Privacy & legal

- Public **website, support, privacy policy, and terms URLs**, matching the publisher and
  disclosing actual data handling. **All resolved 2026-09-25:** support
  (`support@e3d.ai` + `https://liquiditywatch.e3d.ai/support`), privacy policy
  (`https://liquiditywatch.e3d.ai/privacy`), and terms of service
  (`https://liquiditywatch.e3d.ai/terms`) — all drafted from owner-confirmed facts and
  explicit legal choices, shown in full and approved before publishing. See
  `PRIVACY_REVIEW.md` for exactly what was confirmed vs. deliberately left out.

## 8. Submission & review flow

1. Submit through the OpenAI Developer Platform's plugin submission portal (choose "With
   MCP"), supplying the production `/mcp` URL.
2. OpenAI scans the server's tools and runs domain verification.
3. Reviewer evaluates against the test cases and quality/safety standards. Review
   timelines "may vary"; third-party coverage of the July 2026 launch cited **one to two
   weeks**, longer if screenshots/test cases need revision.
4. On approval, the developer (not OpenAI) chooses when to actually publish.
5. Published plugins appear in the unified Plugins Directory (shared with Codex).
6. **Ongoing:** deleted tools are removed as soon as a scan detects them; new/changed
   tools need to pass automated checks before becoming available; changes to listing
   metadata or skills require a new version review. A tool/schema change to
   `e3d-mcp` after publication is not "ship and forget."

## 9. Financial-content restrictions

No explicit financial-services-specific restriction was found in the plugin submission
docs themselves. Separately, **confirmed by direct quote** (via search, since
`openai.com/policies/developer-apps-terms/` itself returned 403 to this session's
fetcher on every attempt, including via the Wayback Machine): OpenAI's App Developer
Terms state apps must not *"initiate, execute, or otherwise facilitate money transfers,
cryptocurrency transfers, or other financial or investment transactions through the
Services."* Apps may link out to an external site the developer owns for payment
("External Checkout"), but that's not relevant here. **LiquidityWatch has no transaction
capability of any kind** — all three tools are plain reads with no write path, no
payment/checkout flow, no External Checkout link — so this restriction is met by what the
server simply doesn't do, not by a policy the tools have to actively enforce. Still worth
reading the full terms yourself once the page is reachable, since a quoted excerpt isn't
the complete document.

## 10. What this session could not verify

- Whether independently-hosted (non-OpenAI-built) remote MCP servers are *currently*
  eligible for **public directory** listing, versus only for a user's own private
  Developer Mode connection, was not conclusively confirmed from source docs reachable by
  this session. The submission portal itself ("With MCP" option, described in the docs
  above) strongly implies yes, but this should be the **first thing confirmed** when the
  owner actually opens the submission portal — if that option isn't available or behaves
  differently than documented here, everything downstream in this package still stands as
  prep work, but the timeline changes.
