You are reviewer grok-build in round 1 of the negotiate loop.
Read the current draft below as the only source of truth.

Respond using exactly this format, with no other text before or after it,
no markdown heading, comment, or bold syntax around any of these lines:

---STATUS---
status: approved
reason: <one-line reason>

Use "status: revise" in place of "status: approved" if the draft needs changes.
When status is revise, put a fenced ```spec block directly after the reason line,
containing the full replacement spec (not a diff or a summary of changes), then
nothing else.

The line "---STATUS---" must appear verbatim and on its own line; it is a fixed
parser marker, not a section title to be reworded or restyled.

Current draft:

# Personal Liquidity Exposure Calculator

## Overview

Add a fully ungated, deterministic Personal Liquidity Exposure calculator to the existing single-page LiquidityWatch experience. It uses the already-loaded financial-stress event, requires no additional data fetches or LLM calls, exposes its methodology, shows a next-regime scenario, and converts through the existing mailing-list flow.

## Goals

- Calculate a transparent 0–100 exposure score from portfolio allocations, leverage, `event.final_score`, and BTC/ETH/XRP `utility_score` values.
- Reuse the existing six LiquidityWatch regime bands through the existing `GAUGE_BANDS` table and `gaugeBand` helper.
- Show the current result and a next-macro-regime scenario without an email gate.
- Save one valid mix locally and attribute alert signups with `list: "liquiditywatch-exposure-calculator"`.
- Preserve the existing general mailing-list signup and verification flow.
- Provide deterministic unit coverage for scoring, boundaries, missing data, scenario calculations, and stored-mix parsing.

## Non-Goals

- Paid plans, billing, custom thresholds, multiple portfolios, allocation history, sharing, or a public API.
- New upstream fields, endpoints, data fetching, LLM calls, schedulers, or scoring-pipeline code.
- Implementing downstream personalized email dispatch, which remains owned by the external API producer.
- Treating the calculator as investment advice or a market-price prediction.
- Persisting portfolio allocations on the server; the mix is saved only in the visitor’s browser.
- Changing `docs/API-CONTRACT.md`, `server.js`, `public/about.html`, or any regime boundary.

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
- Use the existing `GAUGE_BANDS` and `gaugeBand` helpers. Do not create a second regime table or hard-code regime thresholds in the calculator.
- Clamp all source and derived values to their documented ranges. Round only the final displayed personal scores, using JavaScript `Math.round` (half away from zero for positive values), after clamping.
- Portfolio percentages must be finite values from 0 through 100 inclusive and must total exactly 100 before a result is shown.
- Preserve both existing mailing-list forms and the `/verifyEmailCode` flow.
- Do not add dependencies, a build step, analytics, cookies, or server-side portfolio storage.
- Keep all calculator copy explicit that it is an informational stress sensitivity, not expected performance, loss probability, or investment advice. Do not use “expected return”, “probability of loss”, “will lose”, or price targets.
- Keep the complete change below 30 files and 3,200 changed lines.

## Phase 1 — Deterministic Calculator Model

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/render.js -->
<!-- pilot:touches=test/exposure-calculator.test.js -->
<!-- pilot:touches=docs/MODEL.md -->
<!-- pilot:touches=CLAUDE.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add pure, DOM-free calculator helpers to `public/render.js` and export them through `RENDER_EXPORTS` for both Node tests and browser use.
- Export this exact contract:
  - `DEFAULT_EXPOSURE_MIX`: `{ cashEquities: 70, btc: 10, eth: 10, xrp: 10, leveraged: false }`.
  - `EXPOSURE_MIX_STORAGE_KEY`: `"liquiditywatch.personalExposureMix.v1"`.
  - `EXPOSURE_ALERT_LIST`: `"liquiditywatch-exposure-calculator"`.
  - `normalizeExposureMix(mix)`: return `{ ok: true, mix }` or `{ ok: false, reason: "invalid-mix" }`. A valid mix has finite `cashEquities`, `btc`, `eth`, and `xrp`, each in `[0, 100]`, summing to exactly 100, and `leveraged` set to `true` only when the input value is strictly `true`; any other leverage value means `false` when the percentages are valid.
  - `serializeExposureMix(mix)`: return a JSON string `{ v: 1, cashEquities, btc, eth, xrp, leveraged }` for a valid mix, otherwise `null`.
  - `parseStoredExposureMix(raw)`: accept a version-1 JSON string or object, validate it with `normalizeExposureMix`, and return the normalized mix. Return `null` for corrupt, obsolete, partial, or invalid data. Do not throw.
  - `computePersonalExposure(event, mix)`: do not mutate `event` or `mix`. Return:
    - `ok: false`, `reason: "invalid-mix"`, `current: null`, `scenario: null`, and `components: null` when the mix is invalid. This reason wins even if `final_score` is also missing.
    - `ok: false`, `reason: "missing-score"`, `current: null`, `scenario: null`, and `components: null` when the mix is valid but `event.final_score` is not a finite number.
    - Otherwise `ok: true`, `reason: null`, plus `current`, `scenario`, and `components`.
- Resolve BTC, ETH, and XRP with the same case-insensitive asset identity and `utility_score` location the existing renderer already uses. Do not invent a new event field.
- Derive the current score with this public formula:
  - Let `M` be finite `event.final_score`, clamped to 0–100.
  - Let each asset utility `U` be its case-insensitive BTC/ETH/XRP `utility_score`, normalized with `scaledUnitPercent` and clamped to 0–100.
  - If the utility is missing, malformed, or normalizes to a non-finite value, use `U = 100 - M`. That choice makes the asset’s stress equal to `M`, neutral relative to the macro component.
  - Cash/equities stress is `M`.
  - Each crypto asset’s stress is `0.70 × M + 0.30 × (100 - U)`.
  - Base exposure is `(cashEquities × cashStress + btc × btcStress + eth × ethStress + xrp × xrpStress) / 100`.
  - If `leveraged` is strictly `true`, multiply base exposure by `1.15`; otherwise use `1`.
  - Clamp that product to 0–100, then round once with `Math.round` to produce the displayed integer score.
- `current` is `{ score, band }`, where `band` is the existing `gaugeBand(score)` result, including that helper’s current boundary behavior.
- `components` must contain the clamped macro score, each resolved utility and whether it used the neutral fallback, each of the four unrounded stresses, the unrounded base exposure, the leverage factor, and the unrounded value after leverage but before the final clamp and round. Phase 2 must render methodology from these values rather than recomputing them.
- Derive the next-regime scenario from `GAUGE_BANDS` only. After `gaugeBand` classifies clamped `M`, replace `M` with the lower bound of the next higher band and keep allocation, leverage, and the already resolved utility values unchanged. Recalculate the personal score and band with the same formula. `scenario` is `{ macroScore, score, band, delta }`, where `delta` is the integer `scenario.score - current.score`. If the current band is already the highest band, `scenario` is `null`.
- Tests must assert, by reading `GAUGE_BANDS`, that the current next-band lower bounds are exactly 16, 36, 56, 76, and 91, and that the highest band is Market Dysfunction. The calculator implementation must still use the table, not those literals.
- Add focused Node built-in tests covering:
  - all-cash/equities exposure, where an unlevered 100% cash/equities mix displays the rounded clamped macro score;
  - crypto-weighted exposure;
  - leveraged clamping after multiplication and before rounding, including a product above 100;
  - `Math.round` half-away-from-zero behavior on a positive `.5` result at or below 100;
  - legacy and v1 utility scales through the existing `scaledUnitPercent` behavior;
  - case-insensitive asset lookup;
  - missing and malformed utility fallbacks, including the identity that fallback crypto stress equals `M`;
  - invalid allocations, non-finite values, values outside 0–100, and totals other than exactly 100;
  - all six personal-score bands and their existing boundary values;
  - next-regime macro bounds, personal score, band, and signed delta, plus `scenario: null` in the highest regime;
  - missing or non-finite `final_score` returning `missing-score` without throwing;
  - invalid mix taking precedence over a missing score;
  - non-mutation of the supplied event and mix;
  - round-trip, rejection, and non-throwing behavior of `serializeExposureMix` and `parseStoredExposureMix`.
- Update `docs/MODEL.md` with a clearly separated “Personal Liquidity Exposure” presentation derivative. Document the exact formula, neutral utility fallback, leverage-then-clamp-then-round order, scenario assumption, signed delta, interpretation, and its distinction from the upstream headline model. Do not change the headline band table.
- Update `CLAUDE.md` to record this calculator as the sole narrow deterministic presentation derivative currently allowed, while retaining the prohibition on pipeline scoring, ingestion, and LLM calls.
- The configured verification command includes `node --test test/exposure-calculator.test.js`.

### Acceptance Criteria

- The same input event and portfolio always produce the same integer result.
- Tests independently demonstrate the documented arithmetic and fallback behavior.
- No helper accesses DOM, network, storage, environment, or time APIs.
- No API contract, upstream score semantics, or regime boundary is changed.
- The methodology in `docs/MODEL.md` exactly matches the tested implementation.
- `node --test test/exposure-calculator.test.js` passes.
- The configured verification command passes.

## Phase 2 — Ungated Calculator and Alert Signup Experience

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/index.html -->
<!-- pilot:touches=README.md -->
<!-- runner:read=public/render.js -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add a responsive “Personal Liquidity Exposure” section to `public/index.html` after the headline stress score and before the analytical detail sections.
- Provide accessible labeled dropdowns for cash/equities, BTC, ETH, and XRP allocations using 10-point increments from 0% through 100%, plus a leverage/margin checkbox.
- Initialize the controls from `DEFAULT_EXPOSURE_MIX` unless `parseStoredExposureMix` returns a valid saved mix.
- Recalculate by calling exported `computePersonalExposure` on the most recently loaded event retained by `renderEventIntoPage`, including the initial event that function already receives. Do not fetch inside calculator handlers and do not reimplement the formula in `index.html`.
- Keep the controls usable before event data arrives. Until the result is `ok`, show a calm unavailable/loading state and no score when the reason is `missing-score`.
- When the reason is `invalid-mix`, show an inline validation message and suppress the score, scenario, and methodology values. If both the mix is invalid and the score is missing, show both the validation message and the unavailable state.
- For an `ok` result, show:
  - the ungated 0–100 `current.score`;
  - the shared LiquidityWatch band name and color from `current.band`, using the existing gauge presentation;
  - a concise stress-sensitivity interpretation with no return, loss, probability, or price-target claim;
  - when `scenario` exists, its personal score, next macro score, and signed delta; when `scenario` is `null`, an “already highest macro regime” message;
  - a visible expandable methodology explanation that quotes the documented formula and displays the returned component assumptions, including fallback utilities.
- Clearly distinguish the personal derivative from the upstream U.S. Financial Stress Score.
- Include an informational/not-investment-advice disclaimer adjacent to the result.
- Add a dedicated optional alert signup within the calculator section:
  - whenever the mix is valid, save `serializeExposureMix` under `EXPOSURE_MIX_STORAGE_KEY`; also save it immediately before a calculator signup submission;
  - restore through `parseStoredExposureMix` on later visits, ignoring `null` safely;
  - POST to the existing `/api/mailing-list/signup` endpoint with exactly `{ email, list: EXPOSURE_ALERT_LIST }` and no portfolio fields;
  - preserve the existing verification-code behavior and use separate mutable pending-email state for the calculator and general signup forms;
  - state that the mix is stored in this browser and that signup covers material LiquidityWatch updates. Do not claim that the current API stores the allocation or already performs server-side personalized dispatch.
- Keep the existing general `financial_stress_alerts` signup independently functional, including its existing payload.
- Factor duplicated signup/verification behavior into a small reusable client-side function if necessary, without adding a library or changing the general form’s endpoint payload.
- Make calculator status messages accessible with an `aria-live="polite"` region, preserve keyboard operation, and provide visible focus states for all new controls.
- Ensure the layout remains readable at the existing 480px mobile breakpoint.
- Update `README.md` to mention the ungated calculator, its transparent derivative nature, the local saved mix, the scenario result, and the attributed optional alert signup.
- Do not modify `server.js` or `public/render.js` in this phase. The existing cached SSR event and existing browser refresh remain the only event-loading paths.

### Acceptance Criteria

- A visitor can calculate and inspect the score, band, scenario, and full formula without supplying an email.
- Changing any allocation or leverage control updates the result without a network request.
- Invalid totals never produce a score.
- The calculator computes for the event already passed to `renderEventIntoPage` and recomputes when client refresh replaces that event.
- Missing asset utilities still yield the deterministic neutral-fallback result.
- A valid mix survives reload through local storage; malformed stored data leaves the page on the default mix.
- Calculator signup sends exactly the exported calculator list attribution, while general signup retains `financial_stress_alerts`.
- Both signup paths handle success, verification-required responses, API errors, and retryable failures independently.
- Existing score, subscore, classification, briefing, and mailing-list rendering continue to work.
- The page remains usable on mobile and by keyboard.
- No new endpoint, dependency, financial-stress fetch, monetization surface, or email gate is introduced.
- The configured verification command passes.

