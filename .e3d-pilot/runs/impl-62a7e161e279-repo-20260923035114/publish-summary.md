# e3d-pilot Publish Summary

Branch: `e3d-pilot/impl-62a7e161e279-repo-20260923035114`

## Findings

---
head_sha: 88673638b01fd8743a0da73198f7b903cf205e89
focus: default
implementation_run_id: impl-62a7e161e279-repo-20260923035114
---

# Findings

## Local State

Approved idea `idea-62a7e161e279` is being implemented for `/Users/mini/e3d-liquiditywatch`.

## External Context

Add an interactive 'Personal Liquidity Exposure' calculator to liquiditywatch.e3d.ai: a short dropdown form (rough portfolio mix -- % equities/cash-like, % BTC, % ETH, % XRP, and a leverage/margin toggle) that combines the visitor's inputs with data the site already fetches from the live financial-stress-monitor API (event.final_score, and event.asset_triggers[].utility_score for BTC/ETH/XRP per docs/API-CONTRACT.md) into a deterministic 0-100 personal exposure score plus a one-line explanation banded to the same six regimes the main gauge already uses (Accommodative through Market Dysfunction). Unlike the oppscan readiness calculator, there is no existing scoring function to reuse here -- the portfolio-combination formula is new, deterministic arithmetic (e.g. weighting each crypto allocation by its inverse utility_score as a 'fragile plumbing today' proxy, scaled by the current macro final_score), computed client- or server-side with zero new LLM calls, since the upstream three-stage AI pipeline already did the expensive work and this only consumes its published numbers. Purpose is explicitly lead-gen, not monetization: this product has no paid tier today (its only existing conversion mechanic is the mailing-list signup at POST /api/mailing-list/signup), so gate the personalized numeric result behind that same signup flow (a distinct `list` value, e.g. 'liquiditywatch-exposure-calculator', so this funnel's signups are attributable) rather than a payment -- the calculator itself and the explanation of what it means should stay visible to everyone, only the visitor's own computed score requires an email to reveal, consistent with 'lead-gen, keep it free.' Should reuse the existing SSR caching pattern in server.js (event fetched/cached, not re-fetched per calculator submission) and the existing render.js helper conventions rather than introducing a second data-fetching path.

## Selected Candidate

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

## Negotiation Outcome

## Final Outcome

Needs human review after 2 rounds; spec-draft.md left in place.

## Approved Spec

Spec ready at `.e3d-pilot/runs/impl-62a7e161e279-repo-20260923035114/spec-final.md`.

## Audit Artifacts

- [.e3d-pilot/runs/impl-62a7e161e279-repo-20260923035114/findings.md](.e3d-pilot/runs/impl-62a7e161e279-repo-20260923035114/findings.md)
- [.e3d-pilot/runs/impl-62a7e161e279-repo-20260923035114/candidates.md](.e3d-pilot/runs/impl-62a7e161e279-repo-20260923035114/candidates.md)
- [.e3d-pilot/runs/impl-62a7e161e279-repo-20260923035114/negotiation-log.md](.e3d-pilot/runs/impl-62a7e161e279-repo-20260923035114/negotiation-log.md)
- [.e3d-pilot/runs/impl-62a7e161e279-repo-20260923035114/spec-final.md](.e3d-pilot/runs/impl-62a7e161e279-repo-20260923035114/spec-final.md)
- [.e3d-pilot/runs/impl-62a7e161e279-repo-20260923035114/csr-manifest-rows.tsv](.e3d-pilot/runs/impl-62a7e161e279-repo-20260923035114/csr-manifest-rows.tsv)
