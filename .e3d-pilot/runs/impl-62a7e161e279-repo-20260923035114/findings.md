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
