```spec
# Personal Liquidity Exposure Calculator

## Overview

Add a fully ungated, deterministic Personal Liquidity Exposure calculator to the existing single-page LiquidityWatch experience. It uses the already-loaded financial-stress event, requires no additional data fetches or LLM calls, exposes its methodology, shows a next-regime scenario, and converts through the existing mailing-list flow.

## Goals

- Calculate a transparent 0–100 exposure score from portfolio allocations, leverage, `event.final_score`, and BTC/ETH/XRP `utility_score` values.
- Reuse the existing six LiquidityWatch regime bands.
- Show the current result and a next-macro-regime scenario without an email gate.
- Save one mix locally and attribute alert signups with `list: "liquiditywatch-exposure-calculator"`.
- Preserve the existing general mailing-list signup and verification flow.
- Provide deterministic unit coverage for scoring, boundaries, missing data, and scenario calculations.

## Non-Goals

- Paid plans, billing, custom thresholds, multiple portfolios, allocation history, sharing, or a public API.
- New upstream fields, endpoints, data fetching, LLM calls, schedulers, or scoring-pipeline code.
- Implementing downstream personalized email dispatch, which remains owned by the external API producer.
- Treating the calculator as investment advice or a market-price prediction.
- Persisting portfolio allocations on the server; the mix is saved only in the visitor’s browser.

## Existing Files

- `public/render.js` contains build-free helpers shared by browser rendering and server-side rendering.
- `public/index.html` contains the page markup, styles, client refresh, mailing-list signup, and verification logic.
- `server.js` fetches and briefly caches the current event for SSR.
- `docs/MODEL.md` defines the headline score and its six regimes.
- `CLAUDE.md` defines the presentation-only repository boundary.
- `README.md` describes the deployed product and repository.
- `docs/API-CONTRACT.md` documents the existing event and mailing-list contracts.

## Shared Constraints

- Keep the implementation within the no-build, framework-free CommonJS/browser pattern already used by `public/render.js`.
- The calculator is a narrow presentation-layer exception to the repository’s “compute nothing” rule: it may derive a user-facing score from published fields but must not alter, replace, or present itself as the upstream Financial Stress Score.
- Use the event already obtained by the existing page load. Calculator changes must never initiate another financial-stress API request.
- Treat every event field as optional. Missing or malformed asset utility data must degrade neutrally rather than disable the calculator or imply maximum risk.
- Normalize v1 and legacy utility-score scales through the existing `scaledUnitPercent` convention.
- Use the existing `GAUGE_BANDS` and `gaugeBand` helpers rather than creating a second regime table.
- Clamp all source and derived values to their documented ranges and round only the final displayed scores.
- Portfolio percentages must be finite non-negative values totaling exactly 100 before a result is shown.
- Preserve both existing mailing-list forms and the `/verifyEmailCode` flow.
- Do not add dependencies, a build step, analytics, cookies, or server-side portfolio storage.
- Keep all calculator copy explicit that it is an informational stress sensitivity, not expected performance, loss probability, or investment advice.
- Keep the complete change below 30 files and 3,200 changed lines.

## Phase 1 - Deterministic Calculator Model

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/render.js -->
<!-- pilot:touches=test/exposure-calculator.test.js -->
<!-- pilot:touches=docs/MODEL.md -->
<!-- pilot:touches=CLAUDE.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js -->

### Requirements

- Add pure, DOM-free calculator helpers to `public/render.js` and export them through `RENDER_EXPORTS` for both Node tests and browser use.
- Represent the portfolio as four percentages: `cashEquities`, `btc`, `eth`, and `xrp`, plus a Boolean `leveraged`.
- Validate that all four percentages are finite, between 0 and 100 inclusive, and total exactly 100.
- Derive the current score using this public formula:
  - Let `M` be `event.final_score`, clamped to 0–100.
  - Let each asset utility `U` be its case-insensitive BTC/ETH/XRP `utility_score`, normalized to 0–100 with existing schema-version behavior and clamped to 0–100.
  - A missing or invalid utility uses `U = 100 - M`, making that asset’s stress equal to `M` and therefore neutral relative to the macro component.
  - Cash/equities stress is `M`.
  - Each crypto asset’s stress is `0.70 × M + 0.30 × (100 - U)`.
  - Base exposure is the allocation-weighted mean of the four bucket stresses.
  - If leveraged, multiply base exposure by `1.15`.
  - Clamp to 0–100 and round once to the nearest integer.
- Return structured output containing validation state, normalized inputs, current score, current band, and enough component values to render the methodology without recomputing it elsewhere.
- Derive the next-regime scenario by replacing only `M` with the next integer regime entry point: 16, 36, 56, 76, or 91. Keep allocation, leverage, and current utility values unchanged.
- If macro stress is already in Market Dysfunction, return no next-regime scenario. Otherwise return the scenario macro score, recalculated personal score, band, and signed delta.
- Ensure personal-score banding uses `gaugeBand`, including its existing boundary behavior.
- Add focused Node built-in tests covering:
  - all-cash/equities exposure;
  - crypto-weighted exposure;
  - leveraged clamping;
  - legacy and v1 utility scales;
  - case-insensitive asset lookup;
  - missing and malformed utility fallbacks;
  - invalid allocations and totals;
  - all six personal-score bands and boundary values;
  - next-regime values and the highest-regime terminal case;
  - non-mutation of the supplied event and mix.
- Update `docs/MODEL.md` with a clearly separated “Personal Liquidity Exposure” presentation derivative that documents the exact formula, scenario assumption, interpretation, and distinction from the upstream headline model.
- Update `CLAUDE.md` to record this calculator as the sole narrow deterministic presentation derivative currently allowed, while retaining the prohibition on pipeline scoring, ingestion, and LLM calls.
- Run `node --test test/exposure-calculator.test.js` during implementation in addition to the configured verification command.

### Acceptance Criteria

- The same input event and portfolio always produce the same integer result.
- Tests independently demonstrate the documented arithmetic and fallback behavior.
- No helper accesses DOM, network, storage, environment, or time APIs.
- No API contract or upstream score semantics are changed.
- The methodology in `docs/MODEL.md` exactly matches the tested implementation.
- `node --test test/exposure-calculator.test.js` passes.
- The configured verification command passes.

## Phase 2 - Ungated Calculator and Alert Signup Experience

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/index.html -->
<!-- pilot:touches=README.md -->
<!-- runner:read=public/render.js -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js -->

### Requirements

- Add a responsive “Personal Liquidity Exposure” section to `public/index.html` after the headline stress score and before the analytical detail sections.
- Provide accessible labeled dropdowns for cash/equities, BTC, ETH, and XRP allocations using 10-point increments from 0% through 100%, plus a leverage/margin checkbox.
- Supply a valid, clearly labeled default mix totaling 100%.
- Recalculate immediately when an input changes using the most recently loaded event retained by `renderEventIntoPage`; do not fetch inside calculator handlers.
- Keep the form usable before event data arrives, but show a calm unavailable/loading state until a numeric `final_score` exists.
- Show an inline validation message and suppress results when allocations do not total 100%.
- For valid inputs, show:
  - the ungated 0–100 score;
  - its shared LiquidityWatch band and color;
  - a concise interpretation that avoids return or loss claims;
  - the next-regime personal score and signed delta, or an “already highest macro regime” message;
  - a visible expandable methodology explanation containing the exact formula and current component assumptions.
- Clearly distinguish the personal derivative from the upstream U.S. Financial Stress Score.
- Include an informational/not-investment-advice disclaimer adjacent to the result.
- Add a dedicated optional alert signup within the calculator section:
  - save the validated mix to a versioned `localStorage` key before submission;
  - restore and validate that mix on later visits, ignoring corrupt or obsolete data safely;
  - POST to the existing `/api/mailing-list/signup` endpoint with `{ email, list: "liquiditywatch-exposure-calculator" }`;
  - preserve the existing verification-code behavior and avoid sharing mutable pending-email state between the calculator and general signup forms;
  - clearly state that the mix is stored in this browser and that signup covers material LiquidityWatch updates; do not falsely claim that the current API stores the allocation or already performs server-side personalized dispatch.
- Keep the existing general `financial_stress_alerts` signup independently functional.
- Factor the duplicated signup/verification behavior into a small reusable client-side function if necessary, without adding a library or changing endpoint payloads.
- Make status messages accessible with an appropriate live region, preserve keyboard operation, and provide visible focus states for all new controls.
- Ensure the layout remains readable at the existing 480px mobile breakpoint.
- Update `README.md` to mention the ungated calculator, its transparent derivative nature, local saved mix, scenario result, and attributed optional alert signup.
- Do not modify `server.js`; its existing cached SSR event and existing browser refresh remain the only event-loading paths.

### Acceptance Criteria

- A visitor can calculate and inspect the score, band, scenario, and full formula without supplying an email.
- Changing any allocation or leverage control updates the result without a network request.
- Invalid totals never produce a misleading score.
- The calculator reacts correctly when the client refresh replaces the current event.
- Missing asset triggers still yield a deterministic neutral-fallback result.
- A valid mix survives reload through local storage; malformed stored data does not break the page.
- Calculator signup sends the exact calculator list attribution, while general signup retains `financial_stress_alerts`.
- Both signup paths handle success, verification-required responses, API errors, and retryable failures independently.
- Existing score, subscore, classification, briefing, and mailing-list rendering continue to work.
- The page remains usable on mobile and by keyboard.
- No new endpoint, dependency, financial-stress fetch, monetization surface, or email gate is introduced.
- The configured verification command passes.
```

---DRAFT-STATUS---
status: ok
reason: The calculator can be delivered as a two-phase, six-file presentation-layer change well within the file and line limits.
