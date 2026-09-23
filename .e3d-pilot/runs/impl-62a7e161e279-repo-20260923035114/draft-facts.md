## Selected Candidate (candidates.md)

```text
---
selected: personal-liquidity-exposure-calculator
reason: approved idea implementation
focus: default
---

# Candidates

## Proposed Candidates

### Candidate personal-liquidity-exposure-calculator: Personal Liquidity Exposure calculator -- fully ungated, lead-gen via per-mix alert signup, no monetization
Duplicate: no
Dedup rationale: First e3d-pilot ledger entry for e3d-liquiditywatch and first idea proposing an interactive/personalized feature on top of its current passive single-gauge display. Not a duplicate of the existing mailing-list signup -- this adds a new reason to sign up (an alert on your own saved mix) rather than changing the general signup mechanism. Proposed directly by the repo owner (spacepacket@gmail.com) via conversation on 2026-09-22.
Category: growth
Analogy: Same lead-magnet shape as the e3d-oppscan AI Readiness calculator (idea-17100e68160f, e3d-oppscan) -- a free, instant, deterministic, dropdown-driven score reusing an existing pipeline's published output -- but converting via a forward-looking alert hook instead of a paywall, since liquiditywatch has no paid tier and none is in scope for this build.
Attraction (1-5): 3
Retention (1-5): 2
Effort: low
Revenue (1-5|n/a): n/a
Description: SUPERSEDES an earlier "gate the number behind email" design -- do not implement a numeric gate. Final scope, per e3d-debate verdict (docs/debates/2026-09-22-liquidity-exposure-calculator/transcript.md, full consensus) and the repo owner's explicit decision to stay free-only with the goal of user acquisition/retention (no monetization in this build): (1) Add an interactive 'Personal Liquidity Exposure' calculator to liquiditywatch.e3d.ai: a short dropdown form (rough portfolio mix -- % equities/cash-like, % BTC, % ETH, % XRP, and a leverage/margin toggle) combining the visitor's inputs with data the site already fetches from the live financial-stress-monitor API (event.final_score, and event.asset_triggers[].utility_score for BTC/ETH/XRP per docs/API-CONTRACT.md) into a deterministic 0-100 personal exposure score, banded to the same six regimes the main gauge uses. There is no existing scoring function to reuse -- this is new, deterministic arithmetic, computed client- or server-side with zero new LLM calls. (2) The calculator, the resulting score, the band, and the methodology/formula are ALL fully public and ungated -- nobody enters an email to see their own number; a sophisticated finance/crypto audience treats gating deterministic arithmetic as a trust-breaking marketing toll and bounces. (3) Pair the instant score with a forward-looking scenario delta ('your score is 68 today; it would be 81 if macro stress escalates to the next regime'), computed from the same already-published data, to make the result feel perishable/live rather than a one-time toy -- this is the key retention mechanic. (4) The lead-gen hook: let the visitor optionally save their mix and sign up via the EXISTING POST /api/mailing-list/signup endpoint (a distinct `list` value, e.g. 'liquiditywatch-exposure-calculator', for attribution) for an alert when their saved mix crosses a regime boundary on the next published (material-move-only) update -- this is what gives someone a reason to come back, not a payment or a data-hiding gate. (5) Explicitly OUT of scope for this build: any paid tier, custom user-set thresholds, saved-allocation history, or an API -- these were flagged as a possible future monetization seed but are deferred; do not build them now. Reuse the existing SSR caching pattern in server.js (event fetched/cached, not re-fetched per calculator interaction) and the existing render.js helper conventions rather than introducing a second data-fetching path.

```

## Target Repo Tracked Files (truncated to 300)
```text
.gitignore
CLAUDE.md
README.md
docs/API-CONTRACT.md
docs/MODEL.draft.md
docs/MODEL.md
docs/VISION.md
docs/debates/2026-09-08-pipeline-build-spec/QUESTION.md
docs/debates/2026-09-08-pipeline-build-spec/RESULT.md
docs/debates/2026-09-08-pipeline-build-spec/run/transcript.md
docs/debates/2026-09-08-vision-strategy/PROMPT.md
docs/debates/2026-09-08-vision-strategy/QUESTION.md
docs/debates/2026-09-08-vision-strategy/RESULT.md
docs/debates/2026-09-08-vision-strategy/run/transcript.md
docs/liquiditywatch-session-notes.md
package-lock.json
package.json
public/about.html
public/favicon-180.png
public/favicon.svg
public/index.html
public/liquiditywatch.png
public/liquiditywatch2.jpg
public/liquiditywatch3.jpg
public/render.js
server.js
```

## Repo Docs
### CLAUDE.md
```text
# CLAUDE.md — e3d-liquiditywatch

Short rules for working in this repo. Not a README (see `README.md`) and not the model
(see `docs/MODEL.md`).

## What this repo is

The **presentation stage** of LiquidityWatch, and nothing else. An Express server
(`server.js`) serving static files from `public/` (`index.html`, `about.html`). Live at
`liquiditywatch.e3d.ai`.

The three-stage scoring pipeline (research → independent critique → narrative synthesis)
lives **elsewhere in the E3D stack**. It is not in this repo and must not be added here.

## Rules

1. **Compute nothing.** This repo renders a model it is handed. No scoring, no data
   ingestion, no LLM calls. If a change needs new computed data, it needs a new field in
   the API contract, not new code here.
2. **The integration boundary is `docs/API-CONTRACT.md`** — the JSON contract with the
   `e3d.ai` API (`/api/financial-stress-monitor`, `/api/mailing-list/signup`,
   `/verifyEmailCode`). No shared code with the pipeline; the contract is the only joint.
   This follows the E3D ecosystem law: stages are joined "by shared contracts, not shared
   code" (`e3d-maps/docs/E3D_ECOSYSTEM_ARCHITECTURE.md`).
3. **Model semantics live in `docs/MODEL.md`.** When the meaning of a score, band, regime,
   or the causal graph is in question, that document is the source of truth.
4. **Band table sync.** `docs/MODEL.md` §1 is the source of truth for the 0–100 bands and
   regimes. `GAUGE_BANDS` in `public/index.html` and the prose in `public/about.html` must
   match it. Change the doc first.
5. **Scale.** `final_score` / `final_score_before` are integers **0–100** (product
   identity). Every other magnitude — sub-scores, node states, edge confidence,
   probabilities — is a float **0.0–1.0**, matching E3D `shared_enums`. See
   `docs/API-CONTRACT.md` §Scale.
6. **Resilience contract.** Every API field is optional. Every render helper null-checks
   before using a field, and the panel renders from whatever subset is present. New API
   fields ship additively with no front-end coordination. Do not break this — it is what
   lets the two halves evolve independently.
7. **AI suggests, code decides.** The causal graph's *structure* (nodes, edges,
   polarity) is human-authored in `docs/MODEL.md`. The pipeline fills in per-cycle
   *states* only. A model-proposed new node/edge renders as provisional until a human
   promotes it into the doc.
8. **No build step.** `public/` is served as-is. No bundler, no framework, no transpile.
   Keep `index.html` self-contained (inline `<style>`/`<script>`).

## Run

```
npm install
npm start        # serves public/ on :3008 (or $PORT)
```

## Ecosystem context

Part of E3D — a FutCo intelligence product. For how this repo relates to the others, ask
the `futco-mcp` MCP server (`get_repo e3d-liquiditywatch`, `get_repo ecosystem-overview`).
LiquidityWatch is intended as the first domain-specific implementation of the E3D
intelligence-graph architecture (`Entity → Relationship → Event → Decision → Outcome →
Learning`), not a standalone dashboard — see `docs/MODEL.md` §6 and `docs/VISION.md`.

```
### README.md
```text
# LiquidityWatch

**How close is the U.S. financial system to a point where policymakers are forced to act?**

![LiquidityWatch — Macro + Crypto Liquidity Intelligence](public/liquiditywatch3.jpg)

Live at **[liquiditywatch.e3d.ai](https://liquiditywatch.e3d.ai)** — a single U.S. Financial Stress Score, 0–100, that only makes noise when something material actually changes.

## Why this exists

Recession probability, VIX, inflation prints, Treasury yields — each tells you something, but none of them answer the question that actually matters for markets: *is the plumbing about to break, and is the Fed/Treasury about to step in?* That's a synthesis problem — Treasury-market mechanics, funding-market stress, and how policymakers are actually behaving, read together — not something you get from a single indicator or a dashboard full of them.

LiquidityWatch answers that one question, as one number, and stays quiet otherwise.

## How the score is produced

Every evaluation runs through three independent AI stages — a different model at each step, so no single model's judgment silently becomes the answer:

1. **Research & scoring** — a deep-research model does live web research across Treasury, funding-market, and Fed-policy sources and proposes a score.
2. **Independent critique** — a second model reviews the same evidence *without seeing the first model's number* and derives its own. A real disagreement between the two triggers a targeted follow-up search on the specific point in dispute.
3. **Narrative synthesis** — a third model writes the plain-language summary, explicitly explaining any disagreement rather than quietly averaging it away.

Every evaluation is stored, but only ones judged *materially different* from the last published reading trigger a new score, a notification, and a newsletter issue. No daily noise.

## What you get

- **A live gauge, 0–100** across six regimes — from *Accommodative* through *Mild Watchfulness*, *Contained Tension*, *Restrictive Policy*, the *Policy-Forcing Danger Zone*, up to *Market Dysfunction*.
- **Trigger metrics tracked cycle-over-cycle**: Controlled Break Risk (odds current stress breaks into an uncontrolled crisis), Liquidity Response Probability (odds the Fed/Treasury actually supplies new support soon), and Phase (tightening → liquidity response beginning → full backstop underway).
- **Asset triggers for BTC, ETH, and XRP** — a utility score for how much each is actually functioning as settlement/bridge liquidity right now, not just price momentum.
- **A mailing list** that emails you only on material moves — see [`/about`](https://liquiditywatch.e3d.ai/about.html) for the full methodology and scale.

Fully automated end to end: a material evaluation publishes the moment the three-stage process completes, with no human-approval gate in the path. Not investment advice — an AI research and synthesis process, provided for informational purposes only.

## This repo

Just the static front end: an Express server (`server.js`) serving `public/` — the gauge, the score panel, and the mailing-list signup — which reads live data from the `e3d.ai` API (`/api/financial-stress-monitor`, `/api/mailing-list/signup`). The scoring pipeline itself lives elsewhere in the E3D stack.

```
npm install
npm start   # serves public/ on :3008 (or $PORT)
```

Part of the [E3D](https://e3d.ai) ecosystem — a FutCo intelligence product.

```

## Configured Verification Commands

- `npm install && node --check server.js && node --check public/render.js`
