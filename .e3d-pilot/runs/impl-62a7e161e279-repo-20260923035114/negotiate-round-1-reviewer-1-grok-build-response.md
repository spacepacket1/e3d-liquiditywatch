I'll review the draft against the calculator contract and the current page helpers so the status is based on whether the spec can actually be implemented as written.---STATUS---
status: revise
reason: The next-regime bounds conflict with overlapping GAUGE_BANDS and gaugeBand's first match, and the new helpers are not actually visible to index.html's later classic script.
```spec
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
- “Fixing” the inclusive overlapping edges in `GAUGE_BANDS` or in `gaugeBand`.

## Existing Files

- `public/render.js` contains build-free helpers shared by browser rendering and server-side rendering. `GAUGE_BANDS`, `gaugeBand`, and `scaledUnitPercent` already live here. `RENDER_EXPORTS` is assigned to `module.exports` only under Node. Top-level `const` bindings in this classic script are not visible to the later inline script in `public/index.html`; top-level `function` declarations are.
- `public/index.html` contains the page markup, styles, client refresh, mailing-list signup, and verification logic. `renderEventIntoPage` replaces the contents of `#score-panel` and the analytical panels. `loadStressScore` is the only client financial-stress fetch.
- `server.js` fetches and briefly caches the current event for SSR.
- `docs/MODEL.md` defines the headline score and its six regimes.
- `CLAUDE.md` defines the presentation-only repository boundary.
- `README.md` describes the deployed product and repository.
- `docs/API-CONTRACT.md` documents the existing event and mailing-list contracts. Asset utilities are `event.asset_triggers[].utility_score`, with `event.schema_version` selecting the v1 0–1 scale.

## Shared Constraints

- Keep the implementation within the no-build, framework-free CommonJS/browser pattern already used by `public/render.js`. Do not convert it to an ES module.
- The calculator is a narrow presentation-layer exception to the repository’s “compute nothing” rule: it may derive a user-facing score from published fields but must not alter, replace, or present itself as the upstream Financial Stress Score.
- Use the event already obtained by the existing page load. Calculator changes must never initiate another financial-stress API request.
- Treat every event field as optional. Missing or malformed asset utility data must degrade neutrally rather than disable the calculator or imply maximum risk.
- Normalize v1 and legacy utility-score scales through the existing `scaledUnitPercent(rawValue, schemaVersion)` convention, passing `event.schema_version` as `schemaVersion`. Do not reimplement that scale split.
- Use the existing `GAUGE_BANDS` and `gaugeBand` helpers. Do not create a second regime table or hard-code regime thresholds in the calculator.
- Clamp all source and derived values to their documented ranges. `scaledUnitPercent` may already round a resolved utility. The calculator itself rounds only the final displayed personal scores, using JavaScript `Math.round` (half away from zero for positive values), after clamping. Do not round stresses, base exposure, or the pre-clamp leveraged product.
- Portfolio percentages must be finite numbers from 0 through 100 inclusive and must total exactly 100 before a result is shown. Do not coerce numeric strings.
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
<!-- runner:read=public/render.js -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add pure, DOM-free calculator helpers to `public/render.js` and put them on `RENDER_EXPORTS` for Node tests. When `module.exports` is unavailable, assign that same object to `globalThis.RENDER_EXPORTS` so the later classic script in `index.html` can call it. Do not rely on top-level `const` names crossing script tags.
- Export this exact contract:
  - `DEFAULT_EXPOSURE_MIX`: `{ cashEquities: 70, btc: 10, eth: 10, xrp: 10, leveraged: false }`.
  - `EXPOSURE_MIX_STORAGE_KEY`: `"liquiditywatch.personalExposureMix.v1"`.
  - `EXPOSURE_ALERT_LIST`: `"liquiditywatch-exposure-calculator"`.
  - `normalizeExposureMix(mix)`: return `{ ok: true, mix }` or `{ ok: false, reason: "invalid-mix" }`. Do not mutate the input. A valid mix is a non-null, non-array object whose `cashEquities`, `btc`, `eth`, and `xrp` are each finite numbers in `[0, 100]` and sum to exactly 100. `leveraged` is `true` only when the input value is strictly `true`; any other leverage value means `false` when the percentages are valid. Return a new object containing only those five fields.
  - `serializeExposureMix(mix)`: normalize first. Return `null` when invalid. Otherwise return a JSON string `{ v: 1, cashEquities, btc, eth, xrp, leveraged }` of the normalized mix.
  - `parseStoredExposureMix(raw)`: accept a version-1 JSON string or a non-array object. Require `v === 1`, validate the percentage and leverage fields with `normalizeExposureMix`, and return the normalized mix object. Return `null` for corrupt JSON, non-objects, arrays, a missing or non-1 `v`, obsolete, partial, or invalid data. Do not mutate the input and do not throw.
  - `computePersonalExposure(event, mix)`: do not mutate `event` or `mix`. A null or non-object event does not throw. Return:
    - `ok: false`, `reason: "invalid-mix"`, `current: null`, `scenario: null`, and `components: null` when the mix is invalid. This reason wins even if `event` is missing or `final_score` is also missing.
    - `ok: false`, `reason: "missing-score"`, `current: null`, `scenario: null`, and `components: null` when the mix is valid but `event` is missing or `event.final_score` is not a finite number. Do not coerce strings.
    - Otherwise `ok: true`, `reason: null`, plus `current`, `scenario`, and `components`.
- Resolve BTC, ETH, and XRP only from `event.asset_triggers`. Identify an entry by case-insensitive `asset` (`String(asset).toUpperCase()` equals `BTC`, `ETH`, or `XRP`). The first matching entry wins. Read `utility_score` only. Do not filter on `score_kind`, do not coerce with `Number`, and do not invent a new event field.
- Derive the current score with this public formula:
  - Let `M` be finite `event.final_score`, clamped to 0–100.
  - Let each asset utility `U` be `scaledUnitPercent(utility_score, event.schema_version)`, then clamped to 0–100.
  - If the matching entry is absent, `utility_score` is not a finite number, or the scaled result is not a finite number, use `U = 100 - M` and mark that utility as a fallback. That choice makes the asset’s stress equal to `M`, neutral relative to the macro component. Compute this fallback once from the current clamped `M`.
  - Cash/equities stress is `M`.
  - Each crypto asset’s stress is `0.70 × M + 0.30 × (100 - U)`.
  - Base exposure is `(cashEquities × cashStress + btc × btcStress + eth × ethStress + xrp × xrpStress) / 100`.
  - If `leveraged` is strictly `true`, multiply base exposure by `1.15`; otherwise use `1`.
  - Clamp that product to 0–100, then round once with `Math.round` to produce the displayed integer score.
- `current` is `{ score, band }`, where `score` is that rounded integer and `band` is the existing `gaugeBand(score)` result, including that helper’s current first-match boundary behavior.
- `components` uses exactly this shape, and Phase 2 must render methodology from it rather than recomputing:
  - `macroScore`: clamped, unrounded `M`.
  - `utilities.btc`, `utilities.eth`, and `utilities.xrp`: each `{ score, fallback }`, where `score` is the resolved `U` and `fallback` is `true` only for the neutral path.
  - `stresses.cashEquities`, `stresses.btc`, `stresses.eth`, and `stresses.xrp`: the four unrounded stresses.
  - `baseExposure`: the unrounded weighted exposure.
  - `leverageFactor`: `1.15` or `1`.
  - `preClampScore`: the unrounded value after multiplying by the leverage factor and before the final clamp and round. This may lie outside 0–100.
- Derive the next-regime scenario from `GAUGE_BANDS` and `gaugeBand` only. After `gaugeBand` classifies clamped `M`, find that band’s object in `GAUGE_BANDS` and take the next array entry. If there is no next entry, `scenario` is `null`. Otherwise choose the scenario macro input as follows:
  - Use the next band’s `min` when `gaugeBand(next.min)` is that same next band.
  - Otherwise use `currentBand.max + 1` when `gaugeBand(currentBand.max + 1)` is that next band.
  - The current table’s inclusive shared edges make the first branch fail: `gaugeBand` keeps 15, 35, 55, 75, and 90 in the lower band. The second branch therefore yields exactly 16, 36, 56, 76, and 91. Those are entry points, not the stored `min` values (`0, 15, 35, 55, 75, 90`). Do not hard-code either list in the calculator.
  - Replace `M` with that scenario macro input and keep allocation, leverage, and the already resolved utility values unchanged. Do not recompute a neutral fallback from the scenario macro input. Recalculate stresses, base, leverage, clamp, round, and `gaugeBand` with the same formula.
  - `scenario` is `{ macroScore, score, band, delta }`. `macroScore` is the scenario macro input. `score` is the rounded personal score. `band` is `gaugeBand(score)` for that personal score, not a separately classified macro band. `delta` is the integer `scenario.score - current.score`.
- Tests must read the exported `GAUGE_BANDS` and `gaugeBand` and assert that this derivation, not a literal table rewrite, produces exactly 16, 36, 56, 76, and 91, and that the highest band’s label is Market Dysfunction. Also assert that `gaugeBand` at 15, 35, 55, 75, and 90 stays on the lower band.
- Add focused Node built-in tests covering:
  - all-cash/equities exposure, where an unlevered 100% cash/equities mix displays the rounded clamped macro score;
  - crypto-weighted exposure, with the expected value calculated from the documented formula;
  - leveraged clamping after multiplication and before rounding, including a `preClampScore` above 100;
  - `Math.round` half-away-from-zero behavior on a positive `.5` result at or below 100;
  - legacy and v1 utility scales through the existing `scaledUnitPercent` behavior, including passing `schema_version`;
  - case-insensitive asset lookup and first-match wins;
  - missing and malformed utility fallbacks, including non-numbers, non-finite values, and the identity that fallback crypto stress equals `M`;
  - no `Number()` coercion of `null` or numeric strings into a real utility;
  - invalid allocations, non-finite values, values outside 0–100, and totals other than exactly 100;
  - all six personal-score bands and their existing first-match boundary values;
  - next-regime macro bounds, unchanged fallback utilities, personal score, personal band, and signed delta, plus `scenario: null` in the highest regime;
  - a null event, a missing score, and a non-finite `final_score` returning `missing-score` without throwing;
  - invalid mix taking precedence over a missing event or missing score;
  - non-mutation of the supplied event and mix;
  - round-trip, rejection, and non-throwing behavior of `serializeExposureMix` and `parseStoredExposureMix`, including a non-1 `v` and corrupt JSON.
- Update `docs/MODEL.md` with a clearly separated “Personal Liquidity Exposure” presentation derivative. Document the exact formula, `schema_version` utility scaling, neutral utility fallback and its reuse in the scenario, leverage-then-clamp-then-round order, the overlapping-band scenario rule, signed delta, interpretation, and its distinction from the upstream headline model. Do not change the headline band table.
- Update `CLAUDE.md` to record this calculator as the sole narrow deterministic presentation derivative currently allowed, while retaining the prohibition on pipeline scoring, ingestion, and LLM calls.
- The configured verification command includes `node --test test/exposure-calculator.test.js`.

### Acceptance Criteria

- The same input event and portfolio always produce the same integer result.
- Tests independently demonstrate the documented arithmetic, fallback, and next-regime entry behavior.
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

- Add a responsive “Personal Liquidity Exposure” section to `public/index.html` after `section#stress-score` and before `section#subscore-breakdown`. Keep its markup outside `#score-panel` and outside every node whose `innerHTML` `renderEventIntoPage` replaces.
- Call calculator helpers through `globalThis.RENDER_EXPORTS`. Do not reimplement the formula and do not reference top-level `const` names from `render.js`.
- Provide accessible labeled dropdowns for cash/equities, BTC, ETH, and XRP allocations using 10-point increments from 0% through 100%, plus a leverage/margin checkbox.
- Initialize the controls from `DEFAULT_EXPOSURE_MIX` unless `parseStoredExposureMix` returns a valid saved mix whose four percentages are all members of those dropdown increments. Otherwise ignore the stored mix and use the default.
- Retain the argument of every `renderEventIntoPage` call, including nullish events, and recalculate immediately. Also recalculate when client refresh replaces that event. Call exported `computePersonalExposure` on that retained event. Do not fetch inside calculator handlers.
- Keep the controls usable before event data arrives. Until the result is `ok`, show a calm unavailable/loading state and no score when the retained event has no finite `final_score`.
- When the mix is invalid, show an inline validation message and suppress the score, scenario, and methodology values. `computePersonalExposure` reports only `invalid-mix` in that case, so the page must also inspect the retained event: if the mix is invalid and the score is missing, show both the validation message and the unavailable state.
- For an `ok` result, show:
  - the ungated 0–100 `current.score`;
  - the shared LiquidityWatch band name and color from `current.band.label` and `current.band.color`, using the existing gauge presentation;
  - a concise stress-sensitivity interpretation with no return, loss, probability, or price-target claim;
  - when `scenario` exists, its personal score, next macro score, and signed delta (positive values shown with `+`); when `scenario` is `null`, an “already highest macro regime” message;
  - a visible expandable methodology explanation that quotes the documented formula and displays the returned `components`, including fallback utilities and `preClampScore`. Do not recompute those values in `index.html`.
- Clearly distinguish the personal derivative from the upstream U.S. Financial Stress Score.
- Include an informational/not-investment-advice disclaimer adjacent to the result.
- Add a dedicated optional alert signup within the calculator section:
  - whenever the mix is valid, save `serializeExposureMix` under `EXPOSURE_MIX_STORAGE_KEY`; also save it immediately before a calculator signup submission;
  - restore through `parseStoredExposureMix` on later visits, ignoring `null` safely;
  - ignore storage read and write exceptions and continue with the in-memory mix;
  - POST to the existing `/api/mailing-list/signup` endpoint with exactly `{ email, list: EXPOSURE_ALERT_LIST }` and no portfolio fields;
  - preserve the existing verification-code behavior and use separate mutable pending-email state, status regions, and verify controls for the calculator and general signup forms;
  - state that the mix is stored in this browser and that signup covers material LiquidityWatch updates. Do not claim that the current API stores the allocation or already performs server-side personalized dispatch.
- Keep the existing general `financial_stress_alerts` signup independently functional, including its existing payload.
- Factor duplicated signup/verification behavior into a small reusable client-side function if necessary, without adding a library or changing the general form’s endpoint payload. Each path must independently handle success, `needsVerification`, API errors, and network failures, including re-enabling the submit control after a failure.
- Make calculator status messages accessible with an `aria-live="polite"` region, preserve keyboard operation, and provide visible focus states for all new controls. Do not remove the focus outline unless a visible replacement is shown.
- Ensure the layout remains readable at the existing 480px mobile breakpoint, with no horizontal overflow and stacked allocation controls.
- Update `README.md` to mention the ungated calculator, its transparent derivative nature, the local saved mix, the scenario result, and the attributed optional alert signup.
- Do not modify `server.js` or `public/render.js` in this phase. The existing cached SSR event and existing browser refresh remain the only event-loading paths.

### Acceptance Criteria

- A visitor can calculate and inspect the score, band, scenario, and full formula without supplying an email.
- Changing any allocation or leverage control updates the result without a network request.
- Invalid totals never produce a score.
- The calculator computes for the event already passed to `renderEventIntoPage`, including a nullish event, and recomputes when client refresh replaces that event. Refreshing `#score-panel` does not destroy the calculator.
- Missing asset utilities still yield the deterministic neutral-fallback result.
- A valid on-grid mix survives reload through local storage; malformed stored data, or a mix that does not fit the dropdown increments, leaves the page on the default mix.
- Calculator signup sends exactly the exported calculator list attribution, while general signup retains `financial_stress_alerts`.
- Both signup paths handle success, verification-required responses, API errors, and retryable failures independently.
- Existing score, subscore, classification, briefing, and mailing-list rendering continue to work.
- The page remains usable on mobile and by keyboard.
- No new endpoint, dependency, financial-stress fetch, monetization surface, or email gate is introduced.
- The configured verification command passes.
```
