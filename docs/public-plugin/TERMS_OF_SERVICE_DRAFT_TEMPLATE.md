# DRAFT TEMPLATE — Terms of Service — NOT FOR PUBLICATION AS-IS

**This is a structural skeleton for legal counsel to fill in and approve, not real
terms.** Every `[BRACKETED]` placeholder is a fact or legal decision this session cannot
supply. Do not publish this file, or any version of it, without legal review.

---

## Terms of Service for LiquidityWatch

**Effective date:** `[EFFECTIVE_DATE]`
**Publisher:** FutCo LLC **(CONFIRMED**, per e3d.ai's footer)
**Governing law / jurisdiction:** `[GOVERNING_LAW — not determinable by this session]`

### 1. What LiquidityWatch is

`[DESCRIPTION — can reuse LISTING.md's long description as a starting point; that copy
was written this session and checked against what the product actually does, but it's
marketing copy, not a legal service description — counsel should decide whether it needs
different framing here.]`

### 2. Informational only — no advice, no guarantees

**CONFIRMED starting point** — this language is already live on the site today
(`public/index.html`, `public/about.html`), so it's the one section here grounded in an
existing commitment rather than a placeholder:

> "Not investment advice. This score reflects an AI-driven research and synthesis
> process; it is provided for informational purposes only." /
> "This score and its narrative are produced by an AI research and synthesis process and
> are provided for informational purposes only. They are not a recommendation to buy,
> sell, or hold any asset."

`[EXPAND_AS_NEEDED — counsel to decide whether the existing disclaimer language is
sufficient for a formal Terms document or needs to be more comprehensive (e.g. explicit
"AS IS" / no-warranty language, liability limitation).]`

### 3. No transaction capability

**CONFIRMED, verified directly this session:** LiquidityWatch's MCP tools
(`get_macro_snapshot`, `get_macro_history`, `get_macro_causal_graph`) are read-only. None
of them can execute a trade, transfer funds, or modify any account. This is enforced by
the tools that exist on the server, not by a policy a user could bypass — see
`SECURITY.md` in this same directory for how that was verified.

### 4. Acceptable use

`[ACCEPTABLE_USE_CLAUSE — standard boilerplate; counsel to supply. Consider explicitly
addressing automated/high-volume use given this is also exposed as an MCP server to AI
agents, not just human browser visitors — e3d-mcp's own rate limiting (60 req/IP/min
default) is a technical control, not a substitute for stating the expected use in terms.]`

### 5. Disclaimers and limitation of liability

`[STANDARD_DISCLAIMER_AND_LIABILITY_CLAUSES — not drafted by this session; this is the
section most likely to need real legal drafting rather than boilerplate, given the
subject matter (financial information).]`

### 6. Changes to the service or these terms

`[CHANGE_CLAUSE]`

### 7. Contact / disputes

`[CONTACT_AND_DISPUTE_RESOLUTION — same missing support contact flagged in
PRIVACY_REVIEW.md and the privacy policy template; also needs a decision on dispute
resolution mechanism (arbitration clause, venue, etc.) if the owner wants one.]`
