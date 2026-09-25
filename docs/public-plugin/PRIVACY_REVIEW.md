# PRIVACY_REVIEW.md — Privacy Policy / Publisher Info Requirements & Gaps

**This document does not draft, propose wording for, or publish any legal text.** Per the
mission's own constraint, that requires the owner and legal review. What follows is (1)
what OpenAI's submission process requires be published, (2) what was actually found when
checking, and (3) a structural checklist of *topics* such a policy would need to address,
derived from directly observing what the application does — not from a template or
assumed legal boilerplate.

## What's required

From `SUBMISSION.md` §7 (developers.openai.com/plugins/deploy/submission, checked
2026-09-24): a public submission needs public **website, support, privacy policy, and
terms of service URLs**, matching the publisher and disclosing actual data handling.
Reviewers are told to check MCP responses against the privacy policy before submitting.

## What was found

Checked directly (WebFetch on the live pages, this session):

| Item | liquiditywatch.e3d.ai | e3d.ai (parent site) |
|---|---|---|
| Publisher identification | Not found on-page | **"E3D is a product developed and operated by FutCo LLC."** (footer) |
| Copyright notice | Not found | **"© 2026 FutCo LLC. All rights reserved."** (footer) |
| Privacy policy | ~~Not found~~ **Resolved 2026-09-25:** published at `https://liquiditywatch.e3d.ai/privacy`, linked from the homepage footer — see §Published policy below | Not covered — LiquidityWatch-specific only |
| Terms of service | ~~Still not found~~ **Resolved 2026-09-25:** published at `https://liquiditywatch.e3d.ai/terms`, linked from the homepage footer — see §Published terms below | Not covered — LiquidityWatch-specific only |
| Support contact (email/form) | ~~Not found~~ **Resolved 2026-09-25:** `support@e3d.ai`, Cloudflare Email Routing forwarding to the owner — confirmed live, used directly in the submission form | Same |

**All three items this section originally flagged are now resolved.** Nothing left
blocking on the privacy/publisher-info side of the submission.

## Published policy (owner-approved, 2026-09-25)

Drafted from facts the owner confirmed directly (not fabricated): mailing-list email
retained until unsubscribe, sent by e3d.ai's own backend (no third-party email
processor), Google Analytics in use for site analytics, support at `support@e3d.ai`.
Shown to the owner in full before publishing; approved as-is. Live at
`public/privacy.html` in this repo, served at `/privacy` (and linked from the homepage
footer alongside `/support`/`/terms`). Superseded `PRIVACY_POLICY_DRAFT_TEMPLATE.md` for
this site — that file is kept as a record of the process and reusable if another
E3D/FutCo product needs the same starting structure.

**Caught and fixed, 2026-09-25:** the Google Analytics claim above was published *before*
GA was actually installed — checked directly against the live site's HTML and response
headers, found nothing (no `gtag`, no `googletagmanager.com`, no analytics of any kind
anywhere). The policy was stating something not yet true. Fixed by actually installing
GA4 (`G-Z9DQB5W05Y`) in all 5 pages' `<head>` (`index.html`, `about.html`,
`support.html`, `privacy.html`, `terms.html`), not by softening the claim — verified live
on all 5 production URLs afterward. Worth remembering: a privacy policy's accuracy needs
re-checking against the actual site any time something it describes changes, not just
written once and trusted.

## Published terms (owner-approved, 2026-09-25)

Drafted after the owner made three explicit, deliberately conservative choices: no
governing-law/jurisdiction clause, no arbitration/class-action-waiver clause, no stated
age restriction — all omitted rather than guessed, since each is a real legal decision,
not a fact this session could look up. Covers what LiquidityWatch is, the existing
informational-only/no-advice framing (already live on the site, not new), no transaction
capability (verified in `SECURITY.md`), acceptable use (including MCP/AI-agent access),
a standard no-warranty/liability-limitation section, and a changes clause. Shown to the
owner in full before publishing; approved as-is. Live at `public/terms.html`, served at
`/terms`, linked from the homepage footer. Superseded
`TERMS_OF_SERVICE_DRAFT_TEMPLATE.md` for this site — kept as a process record.

## What actually collects data, to ground a real policy (not a template)

Directly observed from the codebase and live behavior, split by what's actually in scope
for *this* submission vs. what a full-site policy would separately need to cover:

**The MCP server itself (`e3d-mcp`'s `server-http.js`, in scope for this submission):**
- Handles **zero user-submitted data**. All three tools take either no arguments or a
  single numeric `limit`. No accounts, no cookies, no sessions (stateless MCP transport —
  `sessionIdGenerator: undefined`), no auth tokens collected or stored.
- Logs, per request: HTTP method, path, status code, response time. **Not** logged:
  request bodies, tool arguments, response bodies, IP addresses beyond what's used
  in-memory for rate limiting (never persisted — see `SECURITY.md`).
- Makes outbound calls only to `https://e3d.ai/api/financial-stress-monitor(/history)` —
  already-public data, no credentials sent (see `SECURITY.md` §Protection against
  accidental exposure).

**The rest of the LiquidityWatch website (`e3d-liquiditywatch`, *not* part of this MCP
submission, but relevant context if a privacy policy is being drafted for the whole
product rather than just the plugin):**
- The mailing-list signup form (`public/index.html`) collects an **email address**,
  submitted to `https://e3d.ai/api/mailing-list/signup` — double opt-in, account-free
  (see `docs/API-CONTRACT.md`). This is pre-existing, unrelated to the MCP tools, but a
  real data-collection point on the same domain that a site-wide privacy policy would
  need to disclose.
- The "Personal Liquidity Exposure" calculator stores a user's chosen asset allocation
  **only in the browser's own `localStorage`** (`EXPOSURE_MIX_STORAGE_KEY`,
  `public/render.js`) — never transmitted to any server. Worth noting explicitly in a
  policy as a *local-only* storage example, distinct from server-side collection.

## Structural checklist for the owner/legal to work from

Topics a privacy policy covering the whole liquiditywatch.e3d.ai product (not just the
MCP endpoint) would need to address, based on the above — **not filled in, not worded,
left for legal drafting**:

- [ ] What data is collected (email via mailing-list signup) and what isn't (no accounts,
      no tracking cookies observed in the current codebase — verify this holds if
      analytics/tracking is ever added)
- [ ] How the mailing-list email is used, retained, and whether/how a user can unsubscribe
      or request deletion (the double opt-in confirmation flow is already
      user-facing — the retention/deletion policy behind it isn't documented anywhere
      checked in this session)
- [ ] That the MCP server (this submission) handles no user-submitted or personal data at
      all — worth stating explicitly, since it's the stronger, easier claim
- [ ] Third-party data sharing, if any (not identified in this review — confirm with
      whoever operates the `spacepacket`/`e3d.ai` backend, outside this repo's scope)
- [x] Publisher identity and contact — "FutCo LLC" already established on e3d.ai;
      support contact resolved 2026-09-25 (`support@e3d.ai`, live)
- [x] Terms of service — resolved 2026-09-25, see §Published terms above

## Recommendation (resolved)

Both privacy policy and terms of service are now live, owner-approved, and linked from
the homepage footer — no longer a submission blocker. The structural templates
(`PRIVACY_POLICY_DRAFT_TEMPLATE.md`, `TERMS_OF_SERVICE_DRAFT_TEMPLATE.md`) were the
starting point but were superseded by the real, published pages once the owner supplied
the facts and legal choices this session couldn't infer on its own (retention, email
processor, analytics tool, jurisdiction, dispute resolution, age restriction). Both
templates are kept as a process record and are reusable if another E3D/FutCo product
needs the same starting structure.

One caveat worth flagging: this was a fast, low-overhead draft-and-approve cycle
appropriate for a small, low-risk informational product. If LiquidityWatch's scope,
data collection, or risk profile changes materially, these pages should get a real legal
review rather than another quick session-driven pass.
