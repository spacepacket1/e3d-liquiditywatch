# DRAFT TEMPLATE — Privacy Policy — NOT FOR PUBLICATION AS-IS

**This is a structural skeleton for legal counsel to fill in and approve, not a real
policy.** Every `[BRACKETED]` placeholder marks a fact this session does not know or a
legal decision only counsel/the owner can make. Sections marked **CONFIRMED** are the
only parts grounded in something actually verified in this session (direct inspection of
the live site and codebase) — everything else is structure only. Do not publish this
file, or any version of it, without legal review. See `PRIVACY_REVIEW.md` for how each
placeholder below was derived.

---

## Privacy Policy for LiquidityWatch

**Effective date:** `[EFFECTIVE_DATE]`
**Publisher:** FutCo LLC **(CONFIRMED** — stated in e3d.ai's footer: "E3D is a product
developed and operated by FutCo LLC.")
**Contact for privacy inquiries:** `[PRIVACY_CONTACT_EMAIL_OR_FORM]`

### 1. What this policy covers

`[SCOPE_STATEMENT — e.g. "This policy covers liquiditywatch.e3d.ai and the LiquidityWatch
MCP server. It does not cover other E3D/FutCo products, which are covered by their own
policies at [LINK] / by this same policy — counsel to decide scope.]`

### 2. Information we collect

**CONFIRMED, from direct inspection this session — use as a starting point, verify
nothing else collects data before finalizing:**

- **Email address**, if you use the mailing-list signup form on liquiditywatch.e3d.ai.
  Submitted to `https://e3d.ai/api/mailing-list/signup`. Double opt-in — a confirmation
  link is emailed before any subscription is active.
- **Personal Liquidity Exposure calculator inputs** (your chosen asset allocation
  percentages) — stored **only in your browser's local storage**
  (`localStorage`), never transmitted to any server. `[CONFIRM_STILL_TRUE — re-verify
  against the live public/render.js if this policy is drafted more than a few weeks after
  2026-09-24, in case the implementation has changed.]`
- **MCP server requests** (`get_macro_snapshot`, `get_macro_history`,
  `get_macro_causal_graph`, whether reached via ChatGPT or directly): no user-submitted
  data beyond an optional numeric `limit` parameter. No accounts, cookies, or sessions.
  Server logs method/path/status/response-time only — not request or response bodies.

**NOT CONFIRMED — verify before publishing:**

- `[ANALYTICS_OR_TRACKING — does liquiditywatch.e3d.ai or e3d.ai run any analytics,
  advertising pixels, or tracking cookies? Not found in the code reviewed this session,
  but this session did not audit every script tag on every page of the wider e3d.ai
  site.]`
- `[SERVER_LOGS_ELSEWHERE — does the underlying spacepacket/e3d.ai backend log IP
  addresses, user agents, or other request metadata beyond what this session reviewed in
  e3d-mcp? Out of this session's scope — that's a different repository/team.]`

### 3. How we use information

`[USAGE_STATEMENT — e.g. "The email address is used solely to send the material-change
notification the signup describes and, if you complete confirmation, occasional
LiquidityWatch updates. It is not used for any other purpose." — confirm this is
actually true of how the mailing list is operated before stating it.]`

### 4. Retention

`[RETENTION_PERIOD — how long is a signed-up email retained? Indefinitely until
unsubscribe? A fixed period? This session found no documentation of a retention policy
anywhere in the reviewed code or infrastructure.]`

### 5. Third-party sharing

`[THIRD_PARTY_SHARING — is the email list shared with any processor (e.g. an email
delivery service) or any other third party? Not identified in this session's review —
requires checking whatever actually sends the confirmation email, which lives outside
this repo.]`

### 6. Data subject rights (deletion, access, correction)

`[RIGHTS_STATEMENT — depends on which jurisdictions' users this policy needs to serve
(GDPR/CCPA/other) — a legal determination, not a technical one. If GDPR/CCPA apply, this
section needs real mechanics: how does someone actually request deletion today? Not
identified in this session's review.]`

### 7. Children's privacy

`[COPPA_OR_EQUIVALENT_STATEMENT — standard boilerplate exists for this; counsel to
supply. Not reviewed by this session at all.]`

### 8. Changes to this policy

`[CHANGE_NOTICE_STATEMENT]`

### 9. Contact

`[SUPPORT_CONTACT — required by OpenAI's plugin submission requirements per
SUBMISSION.md §7, and currently absent from every page checked in this session. This is
likely the single highest-priority blank in this entire document.]`
