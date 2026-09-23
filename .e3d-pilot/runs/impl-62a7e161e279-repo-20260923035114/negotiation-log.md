---
run_id: impl-62a7e161e279-repo-20260923035114
---

# Negotiation Log

## Round 1

### Draft Before Round

```text
# Personal Liquidity Exposure Calculator

## Overview

Add a deterministic Personal Liquidity Exposure calculator to the existing LiquidityWatch page. Visitors select a coarse portfolio allocation and leverage status; the calculator combines those inputs with the already-published financial-stress event.

The calculator, methodology, exposure band, and explanation remain public. The personalized numeric score is revealed only after successful mailing-list signup and, when required, email verification. This is a free lead-generation feature using the existing signup endpoints, with no payment, LLM call, upstream scoring change, or separate data-fetching path.

## Goals

- Calculate a deterministic 0–100 personal exposure score from the current event and visitor-supplied allocations.
- Reuse the six existing LiquidityWatch bands and render-helper conventions.
- Support both legacy and v1 `asset_triggers[].utility_score` scales.
- Attribute conversions with the list value `liquiditywatch-exposure-calculator`.
- Reveal only the numeric result after successful signup or verification.
- Reuse the event already obtained by SSR or the existing page refresh.
- Preserve optional-field resilience and the no-build architecture.
- Add focused automated coverage for the calculation and validation rules.

## Non-Goals

- Changing the upstream financial-stress pipeline or its published score.
- Adding API fields, calculator endpoints, LLM calls, ingestion, payment, alerts, saved portfolios, history, sharing, or analytics.
- Treating the personal exposure score as investment advice or as a replacement for `event.final_score`.
- Persisting portfolio allocations or the calculated result.
- Refactoring the existing general mailing-list flow.
- Modifying environment files.

## Existing Files

- `CLAUDE.md` defines the presentation-only architecture and currently prohibits all local scoring.
- `docs/MODEL.md` defines score semantics and the canonical six regime bands.
- `docs/API-CONTRACT.md` defines the optional event fields, legacy/v1 scales, and mailing-list endpoints.
- `public/render.js` contains shared browser/SSR render helpers and `GAUGE_BANDS`.
- `public/index.html` contains the page, inline styles and behavior, live event refresh, and existing mailing-list forms.
- `server.js` fetches and caches the current event for SSR.
- `package.json` provides the existing no-build Node application.

## Shared Constraints

- Keep the entire implementation within 30 changed files and 3,200 changed lines.
- Do not modify `.env*`.
- Do not add a framework, bundler, transpiler, database, dependency, payment flow, or LLM call.
- The upstream financial-stress event remains authoritative; the personal score is a clearly labeled, consumer-derived presentation metric.
- All upstream fields remain optional. Calculator unavailability must not affect the main score panel or other page content.
- Do not fetch the financial-stress endpoint in response to calculator calculation, signup, or verification.
- Escape or safely serialize all data inserted into HTML.
- Portfolio values and results remain in page memory only.
- Use semantic labels, keyboard-operable controls, visible focus states, accessible status messaging, and responsive styling.
- Keep the existing general mailing-list signup and its `financial_stress_alerts` attribution unchanged.
- Display an informational/not-investment-advice qualification with the calculator.
- Use `codex:gpt-5.6-sol` for all phases.

## Phase 1 - Define Calculator Semantics and Architectural Exception

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=CLAUDE.md -->
<!-- pilot:touches=docs/MODEL.md -->
<!-- pilot:touches=docs/API-CONTRACT.md -->
<!-- runner:read=docs/debates/2026-09-22-liquidity-exposure-calculator/transcript.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js -->

### Requirements

- Amend `CLAUDE.md` with a narrow exception permitting deterministic, browser-visible personalization derived solely from an already-published event and visitor inputs.
- State that this exception does not permit reproducing or modifying the upstream financial-stress model, ingesting new data, making LLM calls, or persisting personal inputs.
- Add a Personal Liquidity Exposure section to `docs/MODEL.md` that distinguishes the derived personal metric from `event.final_score`.
- Define allocation inputs as percentages for:
  - Equities / cash-like assets.
  - BTC.
  - ETH.
  - XRP.
- Require allocations to be finite values from 0 through 100 whose total is exactly 100.
- Define utility normalization from the API contract:
  - For schema major version 1 or later, use `utility_score` as a 0.0–1.0 value.
  - For absent or pre-v1 schema versions, divide the legacy 0–100 value by 100.
  - Reject nonnumeric or out-of-range utility values rather than silently inventing data.
- Define shares `t`, `b`, `e`, and `x` as each allocation divided by 100.
- Define normalized utilities as `uBTC`, `uETH`, and `uXRP`.
- Define the formula exactly as:
  - `weightedFragility = t + b * (2 - uBTC) + e * (2 - uETH) + x * (2 - uXRP)`.
  - `leverageMultiplier = 1.15` when leverage/margin is selected, otherwise `1`.
  - `personalExposure = round(clamp(final_score * weightedFragility * leverageMultiplier, 0, 100))`.
- Explain that high utility reduces the additional crypto-plumbing penalty, while leverage increases exposure.
- Require `event.final_score` to be finite and within 0–100.
- Require a valid utility score only for a crypto asset receiving a nonzero allocation.
- Map the derived result through the existing six canonical bands without defining a second band table.
- Document that the band describes personal exposure under current published conditions and is not a policy-regime prediction.
- Update `docs/API-CONTRACT.md` to document this as a consumer-derived value, not a new wire field.
- Document use of existing signup and verification endpoints with the distinct list value `liquiditywatch-exposure-calculator`.
- Preserve the contract rule that all event fields are optional and specify that insufficient inputs make only the calculator unavailable.

### Acceptance Criteria

- The architecture documentation expressly permits this bounded derived calculation without weakening the upstream contract boundary.
- The formula, validation, normalization, leverage behavior, band reuse, and missing-data behavior are unambiguous.
- `docs/API-CONTRACT.md` adds no required event field or new endpoint.
- The general mailing-list value remains documented separately from the calculator attribution.
- The configured verification command succeeds.

## Phase 2 - Implement and Test Pure Exposure Helpers

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/render.js -->
<!-- pilot:touches=test/exposure-calculator.test.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add pure, DOM-independent helpers to `public/render.js` for:
  - Allocation validation.
  - Asset-trigger lookup using case-insensitive BTC, ETH, and XRP asset names.
  - Contract-aware utility normalization.
  - Personal exposure calculation.
  - Reusing `gaugeBand` for the derived result.
  - Producing a safe result object containing the score, band label, color, and concise explanation.
- Keep helpers compatible with both direct browser loading and CommonJS use.
- Export the helpers through `RENDER_EXPORTS`.
- Return a structured unavailable/error result for invalid allocations, missing `final_score`, or missing/invalid utility data required by a nonzero allocation.
- Do not require utility data for crypto assets with zero allocation.
- Clamp only the final calculated score; do not silently repair invalid allocations or invalid upstream values.
- Keep calculation helpers free of fetches, storage, timers, global mutable state, and HTML/DOM access.
- Add `node:test` coverage without introducing a test dependency.
- Cover at least:
  - A 100% equities/cash-like allocation.
  - Mixed allocations using legacy utility values.
  - Mixed allocations using v1 utility values.
  - Leveraged versus unleveraged results.
  - Final-score clamping at 100.
  - Case-insensitive asset lookup.
  - Allocation totals other than 100.
  - Negative, over-100, nonnumeric, and nonfinite allocations.
  - Missing or invalid `final_score`.
  - Missing utility for an allocated crypto asset.
  - Missing utility for an unallocated crypto asset.
  - Reuse of the canonical band label at representative boundaries.

### Acceptance Criteria

- A single pure helper call deterministically produces the documented score from an event, allocations, and leverage flag.
- Legacy and v1 payloads representing the same utilities produce the same result.
- Invalid or incomplete inputs return an unavailable result and never throw during normal use.
- No second band table is introduced.
- `public/render.js` remains valid in Node and the browser.
- All focused tests and the configured syntax checks pass.

## Phase 3 - Add the Gated Calculator Experience

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/index.html -->
<!-- pilot:touches=server.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:read=public/render.js -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add a Personal Liquidity Exposure section to `public/index.html` near the current stress score.
- Include labeled dropdowns for equities/cash-like, BTC, ETH, and XRP allocations using coarse percentage increments from 0% through 100%, plus a leverage/margin checkbox.
- Include public explanatory copy describing:
  - What the calculator measures.
  - The deterministic formula at a readable level.
  - How current macro stress and crypto utility affect the result.
  - That the output is informational and not investment advice.
- Validate that allocations total exactly 100 and announce actionable errors without opening the email gate.
- After a valid calculation:
  - Show the derived band and one-line explanation immediately.
  - Keep the personalized numeric score masked.
  - Show a calculator-specific email form explaining that signup reveals the number.
- Submit calculator emails to `POST /api/mailing-list/signup` with `{ email, list: "liquiditywatch-exposure-calculator" }`.
- Treat non-2xx responses or `{ success: false }` as failures and keep the numeric score hidden.
- If signup succeeds with `needsVerification: false`, reveal the numeric score immediately.
- If signup succeeds with `needsVerification: true`, show a calculator-specific verification-code form and reveal the number only after `POST /verifyEmailCode` succeeds.
- Keep calculator form IDs, pending email, status messages, and verification state independent from the existing mailing-list forms.
- Once access is granted during the page session, allow recalculation without another signup while keeping all data in memory.
- If allocations change before access is granted, invalidate the pending numeric result and require a fresh calculation, but not a second signup after access has already been granted.
- Disable duplicate submissions while requests are pending and restore controls after recoverable errors.
- Preserve API-provided error messages when safe to display, with a generic fallback.
- Maintain the existing general signup behavior and list value unchanged.
- Add a non-executable JSON placeholder to `public/index.html` for the calculator’s initial event context.
- Update `server.js` to populate that placeholder from the already-cached SSR event using only `final_score`, `schema_version`, and `asset_triggers`.
- Serialize the context safely so values containing `<`, `>`, `&`, U+2028, U+2029, or `</script>` cannot terminate the script element or inject markup.
- When SSR context is absent, let the calculator use the event returned by the page’s existing `loadStressScore()` call.
- Update calculator context whenever `renderEventIntoPage(event)` receives a newer event.
- Do not add any calculator-triggered financial-stress fetch or change the existing cache TTL.
- Disable calculation with a clear temporary/unavailable message when required event data is absent, while leaving the rest of the page functional.
- Style the section consistently with existing panels and make the controls stack cleanly on narrow screens.
- Use `aria-live` for validation, signup, verification, and reveal status.
- Move focus to the revealed result after successful signup or verification.
- Never place the email address, allocation, or score in a URL, cookie, local storage, session storage, or server log.

### Acceptance Criteria

- Visitors can configure and calculate an allocation using keyboard or pointer controls on desktop and mobile layouts.
- Invalid totals and unavailable upstream data produce clear messages without breaking the page.
- The band and explanation are visible after calculation, while the numeric score remains hidden until the required signup flow succeeds.
- Calculator signup uses exactly `liquiditywatch-exposure-calculator`; the existing signup still uses `financial_stress_alerts`.
- Verification-required users cannot reveal the number before successful code verification.
- Signup or verification failures do not reveal the number.
- Successful users can recalculate during the same page session without another email submission.
- Calculator actions cause no additional request to `/api/financial-stress-monitor`.
- SSR-provided calculator context is safely serialized and client refreshes replace it when available.
- The main score, optional panels, newsletter content, and existing mailing-list flow retain their behavior.
- The focused tests and configured verification checks pass.

```

### Reviewer 1: grok-build

Status: revise

Reason: Asset lookup, schema-version parsing, verification behavior, score gating, and refresh/invalidation are still ambiguous enough to implement differently.

Replacement Spec:

```spec
# Personal Liquidity Exposure Calculator

## Overview

Add a deterministic Personal Liquidity Exposure calculator to the existing LiquidityWatch page. Visitors select a coarse portfolio allocation and leverage status; the calculator combines those inputs with the already-published financial-stress event.

The calculator, methodology, exposure band, and explanation remain public. The personalized numeric score is revealed only after successful mailing-list signup and, when required, email verification. This is a free lead-generation feature using the existing signup endpoints, with no payment, LLM call, upstream scoring change, or separate data-fetching path.

## Goals

- Calculate a deterministic 0–100 personal exposure score from the current event and visitor-supplied allocations.
- Reuse the six existing LiquidityWatch bands and render-helper conventions.
- Support both legacy and v1 `asset_triggers[].utility_score` scales.
- Attribute conversions with the list value `liquiditywatch-exposure-calculator`.
- Reveal only the numeric result after successful signup or verification.
- Reuse the event already obtained by SSR or the existing page refresh.
- Preserve optional-field resilience and the no-build architecture.
- Add focused automated coverage for the calculation and validation rules.

## Non-Goals

- Changing the upstream financial-stress pipeline or its published score.
- Adding API fields, calculator endpoints, LLM calls, ingestion, payment, alerts, saved portfolios, history, sharing, or analytics.
- Treating the personal exposure score as investment advice or as a replacement for `event.final_score`.
- Persisting portfolio allocations or the calculated result.
- Refactoring the existing general mailing-list flow.
- Modifying environment files.
- Changing band ranges, labels, or colors, or adding a personal-exposure band table.

## Existing Files

- `CLAUDE.md` defines the presentation-only architecture and currently prohibits all local scoring.
- `docs/MODEL.md` defines score semantics and the canonical six regime bands. Its runtime band-table sentence is stale: `GAUGE_BANDS` lives in `public/render.js`, not `public/index.html`.
- `docs/API-CONTRACT.md` defines the optional event fields, legacy/v1 scales, and mailing-list endpoints. `asset_triggers[].asset` is the asset identifier. Signup is `POST /api/mailing-list/signup` with `{ email, list }` and a response of `{ success, needsVerification, message }`. Verification is `POST /verifyEmailCode` with `{ username, code }` and a response of `{ success, message }`.
- `public/render.js` contains shared browser/SSR render helpers, `GAUGE_BANDS`, `gaugeBand`, and `RENDER_EXPORTS`. `scaledUnitPercent` is only a display helper: it treats any present `schema_version` as v1 and does not reject out-of-range values. The calculator must not use it.
- `public/index.html` contains the page, inline styles and behavior, live event refresh, and the existing mailing-list forms. It already loads `/render.js`. The existing narrow layout breakpoint is `max-width: 480px`.
- `server.js` fetches and caches the current event for SSR in `renderIndexHtml`. It does not proxy mailing-list signup.
- `package.json` provides the existing no-build Node application.

## Shared Constraints

- Keep the entire implementation within 30 changed files and 3,200 changed lines.
- Do not modify `.env*`.
- Do not add a framework, bundler, transpiler, database, dependency, payment flow, or LLM call.
- The upstream financial-stress event remains authoritative; the personal score is a clearly labeled, consumer-derived presentation metric.
- All upstream fields remain optional. Calculator unavailability must not affect the main score panel or other page content.
- Do not fetch the financial-stress endpoint in response to calculator calculation, signup, or verification.
- Escape or safely serialize all data inserted into HTML.
- Portfolio values and results remain in page memory only.
- Use semantic labels, keyboard-operable controls, visible focus states, accessible status messaging, and responsive styling.
- Keep the existing general mailing-list signup and its `financial_stress_alerts` attribution unchanged.
- Display an informational/not-investment-advice qualification with the calculator.
- Use `codex:gpt-5.6-sol` for all phases.

## Phase 1 - Define Calculator Semantics and Architectural Exception

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=CLAUDE.md -->
<!-- pilot:touches=docs/MODEL.md -->
<!-- pilot:touches=docs/API-CONTRACT.md -->
<!-- runner:read=docs/debates/2026-09-22-liquidity-exposure-calculator/transcript.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js -->

### Requirements

- Amend `CLAUDE.md` with a narrow exception permitting deterministic, browser-visible personalization derived solely from an already-published event and visitor inputs.
- State that this exception does not permit reproducing or modifying the upstream financial-stress model, ingesting new data, making LLM calls, or persisting personal inputs.
- In `docs/MODEL.md` §0, replace the unqualified "computes nothing" claim with the same narrow exception so it does not contradict the new section.
- Correct the stale `GAUGE_BANDS` location note to `public/render.js` without changing any band range, label, or meaning. Do not edit `public/about.html`.
- Add a Personal Liquidity Exposure section to `docs/MODEL.md` that distinguishes the derived personal metric from `event.final_score`.
- Define allocation inputs as percentages for:
  - Equities / cash-like assets (`t`).
  - BTC (`b`).
  - ETH (`e`).
  - XRP (`x`).
- Require each allocation to be a finite number from 0 through 100, and require the four allocations to total exactly 100. Do not coerce strings, repair totals, or treat out-of-range values as zero.
- Define schema handling from the API contract:
  - Absent, null, or empty `schema_version` has major version 0.
  - A string semver uses the nonnegative integer before the first dot, or the whole string when it contains only digits. `"1.0"` and `"1"` are major 1. `"0.0"` is major 0.
  - Any other `schema_version` shape makes the calculator unavailable.
  - Major version 1 or later uses the v1 scale. Major version 0 uses the legacy scale.
- Define utility normalization:
  - v1: `utility_score` must be a finite number from 0.0 through 1.0 and is used unchanged.
  - Legacy: `utility_score` must be a finite number from 0 through 100 and is divided by 100.
  - Reject booleans, strings, nulls, nonfinite numbers, and out-of-range values. Never infer the scale from the magnitude.
- Look up each crypto utility on `asset_triggers[].asset` by trimming and case-insensitive exact equality with `BTC`, `ETH`, or `XRP`. Do not use substring or alias matching. If several entries match, use the first in array order.
- Define shares `t`, `b`, `e`, and `x` as each allocation divided by 100, with no intermediate rounding.
- Define normalized utilities as `uBTC`, `uETH`, and `uXRP`.
- Define the formula exactly as:
  - `weightedFragility = t + b * (2 - uBTC) + e * (2 - uETH) + x * (2 - uXRP)`.
  - `leverageMultiplier = 1.15` when leverage/margin is selected, otherwise `1`.
  - `raw = final_score * weightedFragility * leverageMultiplier`.
  - `personalExposure = round(clamp(raw, 0, 100))`, where clamp is inclusive and round is JavaScript `Math.round` (nearest integer; nonnegative halves round away from zero).
- Explain that a utility of 1 gives that crypto asset the same weight as equities/cash-like, while a utility of 0 doubles its weight. Leverage multiplies the combined result by 1.15. High utility therefore removes only the additional crypto-plumbing penalty; it never makes crypto weigh less than equities/cash-like.
- Require `event.final_score` to be a finite number from 0 through 100. Reject values outside that range rather than clamping them. Numeric non-integers inside the range are accepted.
- Require a valid matching utility only for a crypto asset whose allocation is nonzero. Ignore missing or invalid utilities for a zero allocation.
- Map the rounded result through the existing `gaugeBand` helper and the six canonical bands. Do not define a second band table. Where band edges overlap, the existing first match wins.
- Document that these band labels are reused as a severity vocabulary for personal exposure under current published conditions. They are not a statement that policy is in that regime and not a policy-regime prediction.
- Pin these worked examples in the model section:
  - Score 40, allocations 100/0/0/0, unleveraged → raw 40 → 40.
  - Score 40, allocations 40/30/20/10, utilities 0.80/0.50/0.20, unleveraged → weighted fragility 1.24 → raw 49.6 → 50. The same utilities encoded as legacy 80/50/20 under major version 0 produce 50.
  - The same mixed inputs with leverage → raw 57.04 → 57.
  - Score 1, allocation 100% BTC, utility 0.5, unleveraged → raw 1.5 → 2.
  - Score 100, allocation 100% BTC, utility 0, leveraged → raw 230 → 100.
- Update `docs/API-CONTRACT.md` to document this as a consumer-derived value, not a new wire field and not a new endpoint.
- Document signup as `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`.
- Document verification as the existing `POST /verifyEmailCode` body `{ username, code }`, where `username` is the submitted email. The verification body has no list field.
- Keep `financial_stress_alerts` documented as the general mailing-list value.
- Preserve the contract rule that all event fields are optional and specify that insufficient inputs make only the calculator unavailable.

### Acceptance Criteria

- The architecture documentation expressly permits this bounded derived calculation without weakening the upstream contract boundary.
- `CLAUDE.md` and `docs/MODEL.md` do not contradict each other about local computation.
- The formula, worked examples, validation, normalization, asset matching, leverage behavior, band reuse, and missing-data behavior are unambiguous.
- `docs/API-CONTRACT.md` adds no required event field or new endpoint.
- The general mailing-list value remains documented separately from the calculator attribution.
- The configured verification command succeeds.

## Phase 2 - Implement and Test Pure Exposure Helpers

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/render.js -->
<!-- pilot:touches=test/exposure-calculator.test.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add pure, DOM-independent helpers to `public/render.js` for:
  - Allocation validation.
  - Asset-trigger lookup using trimmed, case-insensitive exact `asset` matches for BTC, ETH, and XRP.
  - Contract-aware utility normalization, implemented separately from `scaledUnitPercent`.
  - Personal exposure calculation.
  - Reusing `gaugeBand` for the derived result.
  - Producing a safe result object.
- Keep helpers compatible with both direct browser loading and CommonJS use.
- Export the helpers through `RENDER_EXPORTS`.
- Return a structured unavailable result, and do not throw, for invalid allocations, a non-boolean leverage flag, an unparsable `schema_version`, a missing or out-of-range `final_score`, or missing/invalid utility data required by a nonzero allocation.
- Use this result shape:
  - Success: `{ ok: true, score, bandLabel, bandColor, explanation }`.
  - Unavailable: `{ ok: false, reason, message }`, where `reason` is `allocations`, `leverage`, `schema`, `final_score`, or `utility`.
- `score` is the rounded integer. `bandLabel` and `bandColor` come from `gaugeBand(score)`. Do not add another band table.
- `explanation` is one concise sentence generated from the result. It names the band, says whether any allocated crypto utility raised exposure above the equities/cash-like baseline or all allocated crypto utilities matched it, and says whether leverage was applied. For a zero crypto allocation, say that utility does not change the result. Do not include the numeric score.
- Do not require utility data for crypto assets with zero allocation.
- Clamp only an in-range raw product. Do not silently repair invalid allocations, invalid leverage, invalid schema versions, or invalid upstream values.
- Keep calculation helpers free of fetches, storage, timers, global mutable state, and HTML/DOM access.
- Add `node:test` coverage without introducing a test dependency.
- Cover at least:
  - All five worked examples from Phase 1, including identical legacy and v1 results.
  - A 100% equities/cash-like allocation.
  - Leveraged versus unleveraged results.
  - Final-score clamping at 100 and rejection of `final_score` below 0 or above 100.
  - Case-insensitive exact asset lookup, trimming, and first-match precedence.
  - Rejection of substring matches such as `WBTC`.
  - Allocation totals other than 100.
  - Negative, over-100, nonnumeric, string, and nonfinite allocations.
  - Missing or invalid `final_score`, including nonfinite values.
  - Missing or invalid utility for an allocated crypto asset, including a legacy value interpreted only on the legacy scale.
  - Missing or invalid utility for an unallocated crypto asset.
  - Absent schema as legacy, `"1.0"` as v1, and a non-string schema as unavailable.
  - A non-boolean leverage flag as unavailable.
  - Reuse of the canonical `gaugeBand` label at representative boundaries, including an overlapping boundary where the first matching band wins.
  - An explanation that does not contain the numeric score.

### Acceptance Criteria

- A single pure helper call deterministically produces the documented score from an event, allocations, and leverage flag.
- Legacy and v1 payloads representing the same utilities produce the same result.
- Invalid or incomplete inputs return an unavailable result and never throw during normal use.
- No second band table is introduced.
- `public/render.js` remains valid in Node and the browser.
- All focused tests and the configured syntax checks pass.

## Phase 3 - Add the Gated Calculator Experience

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/index.html -->
<!-- pilot:touches=server.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:read=public/render.js -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add a Personal Liquidity Exposure section to `public/index.html` immediately after the current score panel.
- The page must call the Phase 2 helpers. Do not reimplement the formula in the page script.
- Include labeled dropdowns for equities/cash-like, BTC, ETH, and XRP. Each offers 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, and 100. Default to 100, 0, 0, and 0. Include an unchecked leverage/margin checkbox.
- Give every calculator control and status element an id beginning with `exposure-`. Do not reuse `signup-form`, `signup-email`, `signup-status`, `signup-submit`, `verify-form`, `verify-code`, or `verify-submit`.
- Include public explanatory copy describing:
  - What the calculator measures.
  - The deterministic formula at a readable level, including the 1.15 leverage multiplier.
  - That current macro stress sets the baseline, crypto utility can only add a plumbing penalty, and utility of 1 matches equities/cash-like.
  - That the reused band label describes personal-exposure severity and is not a policy-regime call.
  - That the output is informational and not investment advice.
- Validate that allocations total exactly 100 and announce actionable errors without opening the email gate.
- After a valid calculation, before access is granted:
  - Show the derived band and one-line explanation immediately.
  - Keep the personalized numeric score masked.
  - Do not place that score in the DOM, a data attribute, a title, an aria attribute, or the explanation.
  - Show a calculator-specific email form explaining that signup reveals the number.
- Submit calculator emails to `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`. Trim the email. Do not submit an empty email.
- Treat a network failure, non-JSON response, non-2xx response, or falsy `success` as signup failure and keep the numeric score hidden.
- If signup succeeds and `needsVerification` is truthy, show a calculator-specific verification-code form and do not reveal the number.
- If signup succeeds and `needsVerification` is not truthy, grant access and reveal the numeric score immediately.
- Submit verification as `POST /verifyEmailCode` with exactly `{ username, code }`, where `username` is the calculator email stored in memory. Trim the code. Do not submit an empty code or include a list field.
- Reveal the number after verification only when the response is 2xx, the JSON has truthy `success`, and a current successful calculation is still valid. Verification failure, network failure, or non-JSON response keeps the number hidden.
- Insert API `message` values with `textContent` only when they are strings. Otherwise use a generic fallback.
- Keep calculator form state, pending email, status messages, verification state, and access state independent from the existing mailing-list forms.
- While a signup or verification request is pending, disable the calculator controls and both calculator submit buttons. Restore them after failure or after a verification request for more input. Do not leave a control disabled after a recoverable error.
- Once access is granted during the page session, hide the calculator email and verification forms and allow recalculation without another signup. Keep allocations, access, and results in memory only.
- If allocations or leverage change before access is granted, clear the current band, explanation, and any pending score, and require Calculate to be pressed again. Do not reveal a cleared result if verification completes first.
- If signup already succeeded and only verification remains, an input change does not require a second signup. After the visitor calculates again, the existing verification form can reveal the new result.
- After access has been granted, input changes do not revoke access. The new number is shown only after the next successful calculation.
- Add `<script type="application/json" id="exposure-calculator-context">null</script>` to `public/index.html`.
- Update `server.js` so an available cached SSR event replaces that placeholder. Preserve every existing SSR replacement. When there is no cached event, leave the placeholder as null and preserve today's early static fallback.
- Serialize only `final_score` when it is a number, `schema_version` when it is a string, and `asset_triggers` as an array of `{ asset, utility_score }` objects. Non-array triggers serialize as `[]`.
- Escape JSON embedded in HTML by replacing `&` with `\u0026`, `<` with `\u003c`, `>` with `\u003e`, U+2028 with `\u2028`, and U+2029 with `\u2029`, so values cannot terminate the script element or inject markup.
- The calculator reads the in-memory event context. When the JSON placeholder is null, use the event from the page's existing `loadStressScore()` path once it arrives. Do not start a second financial-stress fetch.
- Every call to `renderEventIntoPage(event)` with a non-null event object replaces the calculator context with that event. Do not compare timestamps.
- If a calculation is already displayed when context is replaced, recompute it from the current controls and new context without another signup or fetch. If access is granted, update the visible number; otherwise update only the band and explanation. If recomputation is unavailable, clear the score and show the unavailable message.
- Do not change the existing cache TTL.
- Disable calculation with a clear temporary/unavailable message when required event data is absent, while leaving the rest of the page functional.
- Style the section consistently with existing panels. At `max-width: 480px`, stack its controls in one column.
- Use an `aria-live="polite"` region for validation, signup, verification, and reveal status.
- After a reveal, move focus to the result element. Make it programmatically focusable without adding it to the tab order.
- Never place the email address, allocation, or score in a URL, cookie, local storage, session storage, or server log.

### Acceptance Criteria

- Visitors can configure and calculate an allocation using keyboard or pointer controls on desktop and mobile layouts.
- The default 100/0/0/0 allocation is valid, and only the listed 10-point choices are offered.
- Invalid totals and unavailable upstream data produce clear messages without breaking the page.
- The band and explanation are visible after calculation, while the numeric score is absent from the DOM until the required signup flow succeeds.
- Calculator signup uses exactly `liquiditywatch-exposure-calculator`; the existing signup still uses `financial_stress_alerts`.
- Verification uses exactly `{ username, code }`.
- A missing `needsVerification` field on an otherwise successful signup reveals the number; a truthy value does not.
- Verification-required users cannot reveal the number before successful code verification.
- Signup or verification failures do not reveal the number.
- Changing inputs before access clears the unrevealed result, and a late verification cannot reveal a stale score.
- Successful users can recalculate during the same page session without another email submission.
- A later event rendered by the existing refresh updates the displayed calculation without an additional request to `/api/financial-stress-monitor`.
- Calculator actions cause no additional request to `/api/financial-stress-monitor`.
- SSR-provided calculator context contains only the projected fields, is safely serialized, and is replaced when the client renders a new event.
- The main score, optional panels, newsletter content, and existing mailing-list flow retain their behavior.
- The focused tests and configured verification checks pass.
```

Raw Response:

```text
The draft's formula is explicit, but a few behaviors it depends on are still ambiguous. I'll check the contract and page structure so the review can name those precisely.---STATUS---
status: revise
reason: Asset lookup, schema-version parsing, verification behavior, score gating, and refresh/invalidation are still ambiguous enough to implement differently.
```spec
# Personal Liquidity Exposure Calculator

## Overview

Add a deterministic Personal Liquidity Exposure calculator to the existing LiquidityWatch page. Visitors select a coarse portfolio allocation and leverage status; the calculator combines those inputs with the already-published financial-stress event.

The calculator, methodology, exposure band, and explanation remain public. The personalized numeric score is revealed only after successful mailing-list signup and, when required, email verification. This is a free lead-generation feature using the existing signup endpoints, with no payment, LLM call, upstream scoring change, or separate data-fetching path.

## Goals

- Calculate a deterministic 0–100 personal exposure score from the current event and visitor-supplied allocations.
- Reuse the six existing LiquidityWatch bands and render-helper conventions.
- Support both legacy and v1 `asset_triggers[].utility_score` scales.
- Attribute conversions with the list value `liquiditywatch-exposure-calculator`.
- Reveal only the numeric result after successful signup or verification.
- Reuse the event already obtained by SSR or the existing page refresh.
- Preserve optional-field resilience and the no-build architecture.
- Add focused automated coverage for the calculation and validation rules.

## Non-Goals

- Changing the upstream financial-stress pipeline or its published score.
- Adding API fields, calculator endpoints, LLM calls, ingestion, payment, alerts, saved portfolios, history, sharing, or analytics.
- Treating the personal exposure score as investment advice or as a replacement for `event.final_score`.
- Persisting portfolio allocations or the calculated result.
- Refactoring the existing general mailing-list flow.
- Modifying environment files.
- Changing band ranges, labels, or colors, or adding a personal-exposure band table.

## Existing Files

- `CLAUDE.md` defines the presentation-only architecture and currently prohibits all local scoring.
- `docs/MODEL.md` defines score semantics and the canonical six regime bands. Its runtime band-table sentence is stale: `GAUGE_BANDS` lives in `public/render.js`, not `public/index.html`.
- `docs/API-CONTRACT.md` defines the optional event fields, legacy/v1 scales, and mailing-list endpoints. `asset_triggers[].asset` is the asset identifier. Signup is `POST /api/mailing-list/signup` with `{ email, list }` and a response of `{ success, needsVerification, message }`. Verification is `POST /verifyEmailCode` with `{ username, code }` and a response of `{ success, message }`.
- `public/render.js` contains shared browser/SSR render helpers, `GAUGE_BANDS`, `gaugeBand`, and `RENDER_EXPORTS`. `scaledUnitPercent` is only a display helper: it treats any present `schema_version` as v1 and does not reject out-of-range values. The calculator must not use it.
- `public/index.html` contains the page, inline styles and behavior, live event refresh, and the existing mailing-list forms. It already loads `/render.js`. The existing narrow layout breakpoint is `max-width: 480px`.
- `server.js` fetches and caches the current event for SSR in `renderIndexHtml`. It does not proxy mailing-list signup.
- `package.json` provides the existing no-build Node application.

## Shared Constraints

- Keep the entire implementation within 30 changed files and 3,200 changed lines.
- Do not modify `.env*`.
- Do not add a framework, bundler, transpiler, database, dependency, payment flow, or LLM call.
- The upstream financial-stress event remains authoritative; the personal score is a clearly labeled, consumer-derived presentation metric.
- All upstream fields remain optional. Calculator unavailability must not affect the main score panel or other page content.
- Do not fetch the financial-stress endpoint in response to calculator calculation, signup, or verification.
- Escape or safely serialize all data inserted into HTML.
- Portfolio values and results remain in page memory only.
- Use semantic labels, keyboard-operable controls, visible focus states, accessible status messaging, and responsive styling.
- Keep the existing general mailing-list signup and its `financial_stress_alerts` attribution unchanged.
- Display an informational/not-investment-advice qualification with the calculator.
- Use `codex:gpt-5.6-sol` for all phases.

## Phase 1 - Define Calculator Semantics and Architectural Exception

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=CLAUDE.md -->
<!-- pilot:touches=docs/MODEL.md -->
<!-- pilot:touches=docs/API-CONTRACT.md -->
<!-- runner:read=docs/debates/2026-09-22-liquidity-exposure-calculator/transcript.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js -->

### Requirements

- Amend `CLAUDE.md` with a narrow exception permitting deterministic, browser-visible personalization derived solely from an already-published event and visitor inputs.
- State that this exception does not permit reproducing or modifying the upstream financial-stress model, ingesting new data, making LLM calls, or persisting personal inputs.
- In `docs/MODEL.md` §0, replace the unqualified "computes nothing" claim with the same narrow exception so it does not contradict the new section.
- Correct the stale `GAUGE_BANDS` location note to `public/render.js` without changing any band range, label, or meaning. Do not edit `public/about.html`.
- Add a Personal Liquidity Exposure section to `docs/MODEL.md` that distinguishes the derived personal metric from `event.final_score`.
- Define allocation inputs as percentages for:
  - Equities / cash-like assets (`t`).
  - BTC (`b`).
  - ETH (`e`).
  - XRP (`x`).
- Require each allocation to be a finite number from 0 through 100, and require the four allocations to total exactly 100. Do not coerce strings, repair totals, or treat out-of-range values as zero.
- Define schema handling from the API contract:
  - Absent, null, or empty `schema_version` has major version 0.
  - A string semver uses the nonnegative integer before the first dot, or the whole string when it contains only digits. `"1.0"` and `"1"` are major 1. `"0.0"` is major 0.
  - Any other `schema_version` shape makes the calculator unavailable.
  - Major version 1 or later uses the v1 scale. Major version 0 uses the legacy scale.
- Define utility normalization:
  - v1: `utility_score` must be a finite number from 0.0 through 1.0 and is used unchanged.
  - Legacy: `utility_score` must be a finite number from 0 through 100 and is divided by 100.
  - Reject booleans, strings, nulls, nonfinite numbers, and out-of-range values. Never infer the scale from the magnitude.
- Look up each crypto utility on `asset_triggers[].asset` by trimming and case-insensitive exact equality with `BTC`, `ETH`, or `XRP`. Do not use substring or alias matching. If several entries match, use the first in array order.
- Define shares `t`, `b`, `e`, and `x` as each allocation divided by 100, with no intermediate rounding.
- Define normalized utilities as `uBTC`, `uETH`, and `uXRP`.
- Define the formula exactly as:
  - `weightedFragility = t + b * (2 - uBTC) + e * (2 - uETH) + x * (2 - uXRP)`.
  - `leverageMultiplier = 1.15` when leverage/margin is selected, otherwise `1`.
  - `raw = final_score * weightedFragility * leverageMultiplier`.
  - `personalExposure = round(clamp(raw, 0, 100))`, where clamp is inclusive and round is JavaScript `Math.round` (nearest integer; nonnegative halves round away from zero).
- Explain that a utility of 1 gives that crypto asset the same weight as equities/cash-like, while a utility of 0 doubles its weight. Leverage multiplies the combined result by 1.15. High utility therefore removes only the additional crypto-plumbing penalty; it never makes crypto weigh less than equities/cash-like.
- Require `event.final_score` to be a finite number from 0 through 100. Reject values outside that range rather than clamping them. Numeric non-integers inside the range are accepted.
- Require a valid matching utility only for a crypto asset whose allocation is nonzero. Ignore missing or invalid utilities for a zero allocation.
- Map the rounded result through the existing `gaugeBand` helper and the six canonical bands. Do not define a second band table. Where band edges overlap, the existing first match wins.
- Document that these band labels are reused as a severity vocabulary for personal exposure under current published conditions. They are not a statement that policy is in that regime and not a policy-regime prediction.
- Pin these worked examples in the model section:
  - Score 40, allocations 100/0/0/0, unleveraged → raw 40 → 40.
  - Score 40, allocations 40/30/20/10, utilities 0.80/0.50/0.20, unleveraged → weighted fragility 1.24 → raw 49.6 → 50. The same utilities encoded as legacy 80/50/20 under major version 0 produce 50.
  - The same mixed inputs with leverage → raw 57.04 → 57.
  - Score 1, allocation 100% BTC, utility 0.5, unleveraged → raw 1.5 → 2.
  - Score 100, allocation 100% BTC, utility 0, leveraged → raw 230 → 100.
- Update `docs/API-CONTRACT.md` to document this as a consumer-derived value, not a new wire field and not a new endpoint.
- Document signup as `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`.
- Document verification as the existing `POST /verifyEmailCode` body `{ username, code }`, where `username` is the submitted email. The verification body has no list field.
- Keep `financial_stress_alerts` documented as the general mailing-list value.
- Preserve the contract rule that all event fields are optional and specify that insufficient inputs make only the calculator unavailable.

### Acceptance Criteria

- The architecture documentation expressly permits this bounded derived calculation without weakening the upstream contract boundary.
- `CLAUDE.md` and `docs/MODEL.md` do not contradict each other about local computation.
- The formula, worked examples, validation, normalization, asset matching, leverage behavior, band reuse, and missing-data behavior are unambiguous.
- `docs/API-CONTRACT.md` adds no required event field or new endpoint.
- The general mailing-list value remains documented separately from the calculator attribution.
- The configured verification command succeeds.

## Phase 2 - Implement and Test Pure Exposure Helpers

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/render.js -->
<!-- pilot:touches=test/exposure-calculator.test.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add pure, DOM-independent helpers to `public/render.js` for:
  - Allocation validation.
  - Asset-trigger lookup using trimmed, case-insensitive exact `asset` matches for BTC, ETH, and XRP.
  - Contract-aware utility normalization, implemented separately from `scaledUnitPercent`.
  - Personal exposure calculation.
  - Reusing `gaugeBand` for the derived result.
  - Producing a safe result object.
- Keep helpers compatible with both direct browser loading and CommonJS use.
- Export the helpers through `RENDER_EXPORTS`.
- Return a structured unavailable result, and do not throw, for invalid allocations, a non-boolean leverage flag, an unparsable `schema_version`, a missing or out-of-range `final_score`, or missing/invalid utility data required by a nonzero allocation.
- Use this result shape:
  - Success: `{ ok: true, score, bandLabel, bandColor, explanation }`.
  - Unavailable: `{ ok: false, reason, message }`, where `reason` is `allocations`, `leverage`, `schema`, `final_score`, or `utility`.
- `score` is the rounded integer. `bandLabel` and `bandColor` come from `gaugeBand(score)`. Do not add another band table.
- `explanation` is one concise sentence generated from the result. It names the band, says whether any allocated crypto utility raised exposure above the equities/cash-like baseline or all allocated crypto utilities matched it, and says whether leverage was applied. For a zero crypto allocation, say that utility does not change the result. Do not include the numeric score.
- Do not require utility data for crypto assets with zero allocation.
- Clamp only an in-range raw product. Do not silently repair invalid allocations, invalid leverage, invalid schema versions, or invalid upstream values.
- Keep calculation helpers free of fetches, storage, timers, global mutable state, and HTML/DOM access.
- Add `node:test` coverage without introducing a test dependency.
- Cover at least:
  - All five worked examples from Phase 1, including identical legacy and v1 results.
  - A 100% equities/cash-like allocation.
  - Leveraged versus unleveraged results.
  - Final-score clamping at 100 and rejection of `final_score` below 0 or above 100.
  - Case-insensitive exact asset lookup, trimming, and first-match precedence.
  - Rejection of substring matches such as `WBTC`.
  - Allocation totals other than 100.
  - Negative, over-100, nonnumeric, string, and nonfinite allocations.
  - Missing or invalid `final_score`, including nonfinite values.
  - Missing or invalid utility for an allocated crypto asset, including a legacy value interpreted only on the legacy scale.
  - Missing or invalid utility for an unallocated crypto asset.
  - Absent schema as legacy, `"1.0"` as v1, and a non-string schema as unavailable.
  - A non-boolean leverage flag as unavailable.
  - Reuse of the canonical `gaugeBand` label at representative boundaries, including an overlapping boundary where the first matching band wins.
  - An explanation that does not contain the numeric score.

### Acceptance Criteria

- A single pure helper call deterministically produces the documented score from an event, allocations, and leverage flag.
- Legacy and v1 payloads representing the same utilities produce the same result.
- Invalid or incomplete inputs return an unavailable result and never throw during normal use.
- No second band table is introduced.
- `public/render.js` remains valid in Node and the browser.
- All focused tests and the configured syntax checks pass.

## Phase 3 - Add the Gated Calculator Experience

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/index.html -->
<!-- pilot:touches=server.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:read=public/render.js -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add a Personal Liquidity Exposure section to `public/index.html` immediately after the current score panel.
- The page must call the Phase 2 helpers. Do not reimplement the formula in the page script.
- Include labeled dropdowns for equities/cash-like, BTC, ETH, and XRP. Each offers 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, and 100. Default to 100, 0, 0, and 0. Include an unchecked leverage/margin checkbox.
- Give every calculator control and status element an id beginning with `exposure-`. Do not reuse `signup-form`, `signup-email`, `signup-status`, `signup-submit`, `verify-form`, `verify-code`, or `verify-submit`.
- Include public explanatory copy describing:
  - What the calculator measures.
  - The deterministic formula at a readable level, including the 1.15 leverage multiplier.
  - That current macro stress sets the baseline, crypto utility can only add a plumbing penalty, and utility of 1 matches equities/cash-like.
  - That the reused band label describes personal-exposure severity and is not a policy-regime call.
  - That the output is informational and not investment advice.
- Validate that allocations total exactly 100 and announce actionable errors without opening the email gate.
- After a valid calculation, before access is granted:
  - Show the derived band and one-line explanation immediately.
  - Keep the personalized numeric score masked.
  - Do not place that score in the DOM, a data attribute, a title, an aria attribute, or the explanation.
  - Show a calculator-specific email form explaining that signup reveals the number.
- Submit calculator emails to `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`. Trim the email. Do not submit an empty email.
- Treat a network failure, non-JSON response, non-2xx response, or falsy `success` as signup failure and keep the numeric score hidden.
- If signup succeeds and `needsVerification` is truthy, show a calculator-specific verification-code form and do not reveal the number.
- If signup succeeds and `needsVerification` is not truthy, grant access and reveal the numeric score immediately.
- Submit verification as `POST /verifyEmailCode` with exactly `{ username, code }`, where `username` is the calculator email stored in memory. Trim the code. Do not submit an empty code or include a list field.
- Reveal the number after verification only when the response is 2xx, the JSON has truthy `success`, and a current successful calculation is still valid. Verification failure, network failure, or non-JSON response keeps the number hidden.
- Insert API `message` values with `textContent` only when they are strings. Otherwise use a generic fallback.
- Keep calculator form state, pending email, status messages, verification state, and access state independent from the existing mailing-list forms.
- While a signup or verification request is pending, disable the calculator controls and both calculator submit buttons. Restore them after failure or after a verification request for more input. Do not leave a control disabled after a recoverable error.
- Once access is granted during the page session, hide the calculator email and verification forms and allow recalculation without another signup. Keep allocations, access, and results in memory only.
- If allocations or leverage change before access is granted, clear the current band, explanation, and any pending score, and require Calculate to be pressed again. Do not reveal a cleared result if verification completes first.
- If signup already succeeded and only verification remains, an input change does not require a second signup. After the visitor calculates again, the existing verification form can reveal the new result.
- After access has been granted, input changes do not revoke access. The new number is shown only after the next successful calculation.
- Add `<script type="application/json" id="exposure-calculator-context">null</script>` to `public/index.html`.
- Update `server.js` so an available cached SSR event replaces that placeholder. Preserve every existing SSR replacement. When there is no cached event, leave the placeholder as null and preserve today's early static fallback.
- Serialize only `final_score` when it is a number, `schema_version` when it is a string, and `asset_triggers` as an array of `{ asset, utility_score }` objects. Non-array triggers serialize as `[]`.
- Escape JSON embedded in HTML by replacing `&` with `\u0026`, `<` with `\u003c`, `>` with `\u003e`, U+2028 with `\u2028`, and U+2029 with `\u2029`, so values cannot terminate the script element or inject markup.
- The calculator reads the in-memory event context. When the JSON placeholder is null, use the event from the page's existing `loadStressScore()` path once it arrives. Do not start a second financial-stress fetch.
- Every call to `renderEventIntoPage(event)` with a non-null event object replaces the calculator context with that event. Do not compare timestamps.
- If a calculation is already displayed when context is replaced, recompute it from the current controls and new context without another signup or fetch. If access is granted, update the visible number; otherwise update only the band and explanation. If recomputation is unavailable, clear the score and show the unavailable message.
- Do not change the existing cache TTL.
- Disable calculation with a clear temporary/unavailable message when required event data is absent, while leaving the rest of the page functional.
- Style the section consistently with existing panels. At `max-width: 480px`, stack its controls in one column.
- Use an `aria-live="polite"` region for validation, signup, verification, and reveal status.
- After a reveal, move focus to the result element. Make it programmatically focusable without adding it to the tab order.
- Never place the email address, allocation, or score in a URL, cookie, local storage, session storage, or server log.

### Acceptance Criteria

- Visitors can configure and calculate an allocation using keyboard or pointer controls on desktop and mobile layouts.
- The default 100/0/0/0 allocation is valid, and only the listed 10-point choices are offered.
- Invalid totals and unavailable upstream data produce clear messages without breaking the page.
- The band and explanation are visible after calculation, while the numeric score is absent from the DOM until the required signup flow succeeds.
- Calculator signup uses exactly `liquiditywatch-exposure-calculator`; the existing signup still uses `financial_stress_alerts`.
- Verification uses exactly `{ username, code }`.
- A missing `needsVerification` field on an otherwise successful signup reveals the number; a truthy value does not.
- Verification-required users cannot reveal the number before successful code verification.
- Signup or verification failures do not reveal the number.
- Changing inputs before access clears the unrevealed result, and a late verification cannot reveal a stale score.
- Successful users can recalculate during the same page session without another email submission.
- A later event rendered by the existing refresh updates the displayed calculation without an additional request to `/api/financial-stress-monitor`.
- Calculator actions cause no additional request to `/api/financial-stress-monitor`.
- SSR-provided calculator context contains only the projected fields, is safely serialized, and is replaced when the client renders a new event.
- The main score, optional panels, newsletter content, and existing mailing-list flow retain their behavior.
- The focused tests and configured verification checks pass.
```
```

### Reviewer 2: claude

Status: approved

Reason: Formula and all five worked examples check out arithmetically, and the gating/resilience/security constraints are consistent and unambiguous across phases.

Raw Response:

```text
---STATUS---
status: approved
reason: Formula and all five worked examples check out arithmetically, and the gating/resilience/security constraints are consistent and unambiguous across phases.
```

### Reviewer 3: codex

Status: revise

Reason: Phase 2 contradicts the worked clamping example by requiring an “in-range raw product,” even though valid inputs can produce raw values above 100.

Replacement Spec:

```spec
# Personal Liquidity Exposure Calculator

## Overview

Add a deterministic Personal Liquidity Exposure calculator to the existing LiquidityWatch page. Visitors select a coarse portfolio allocation and leverage status; the calculator combines those inputs with the already-published financial-stress event.

The calculator, methodology, exposure band, and explanation remain public. The personalized numeric score is revealed only after successful mailing-list signup and, when required, email verification. This is a free lead-generation feature using the existing signup endpoints, with no payment, LLM call, upstream scoring change, or separate data-fetching path.

## Goals

- Calculate a deterministic 0–100 personal exposure score from the current event and visitor-supplied allocations.
- Reuse the six existing LiquidityWatch bands and render-helper conventions.
- Support both legacy and v1 `asset_triggers[].utility_score` scales.
- Attribute conversions with the list value `liquiditywatch-exposure-calculator`.
- Reveal only the numeric result after successful signup or verification.
- Reuse the event already obtained by SSR or the existing page refresh.
- Preserve optional-field resilience and the no-build architecture.
- Add focused automated coverage for the calculation and validation rules.

## Non-Goals

- Changing the upstream financial-stress pipeline or its published score.
- Adding API fields, calculator endpoints, LLM calls, ingestion, payment, alerts, saved portfolios, history, sharing, or analytics.
- Treating the personal exposure score as investment advice or as a replacement for `event.final_score`.
- Persisting portfolio allocations or the calculated result.
- Refactoring the existing general mailing-list flow.
- Modifying environment files.
- Changing band ranges, labels, or colors, or adding a personal-exposure band table.

## Existing Files

- `CLAUDE.md` defines the presentation-only architecture and currently prohibits all local scoring.
- `docs/MODEL.md` defines score semantics and the canonical six regime bands. Its runtime band-table sentence is stale: `GAUGE_BANDS` lives in `public/render.js`, not `public/index.html`.
- `docs/API-CONTRACT.md` defines the optional event fields, legacy/v1 scales, and mailing-list endpoints. `asset_triggers[].asset` is the asset identifier. Signup is `POST /api/mailing-list/signup` with `{ email, list }` and a response of `{ success, needsVerification, message }`. Verification is `POST /verifyEmailCode` with `{ username, code }` and a response of `{ success, message }`.
- `public/render.js` contains shared browser/SSR render helpers, `GAUGE_BANDS`, `gaugeBand`, and `RENDER_EXPORTS`. `scaledUnitPercent` is only a display helper: it treats any present `schema_version` as v1 and does not reject out-of-range values. The calculator must not use it.
- `public/index.html` contains the page, inline styles and behavior, live event refresh, and the existing mailing-list forms. It already loads `/render.js`. The existing narrow layout breakpoint is `max-width: 480px`.
- `server.js` fetches and caches the current event for SSR in `renderIndexHtml`. It does not proxy mailing-list signup.
- `package.json` provides the existing no-build Node application.

## Shared Constraints

- Keep the entire implementation within 30 changed files and 3,200 changed lines.
- Do not modify `.env*`.
- Do not add a framework, bundler, transpiler, database, dependency, payment flow, or LLM call.
- The upstream financial-stress event remains authoritative; the personal score is a clearly labeled, consumer-derived presentation metric.
- All upstream fields remain optional. Calculator unavailability must not affect the main score panel or other page content.
- Do not fetch the financial-stress endpoint in response to calculator calculation, signup, or verification.
- Escape or safely serialize all data inserted into HTML.
- Portfolio values and results remain in page memory only.
- Use semantic labels, keyboard-operable controls, visible focus states, accessible status messaging, and responsive styling.
- Keep the existing general mailing-list signup and its `financial_stress_alerts` attribution unchanged.
- Display an informational/not-investment-advice qualification with the calculator.
- Use `codex:gpt-5.6-sol` for all phases.

## Phase 1 - Define Calculator Semantics and Architectural Exception

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=CLAUDE.md -->
<!-- pilot:touches=docs/MODEL.md -->
<!-- pilot:touches=docs/API-CONTRACT.md -->
<!-- runner:read=docs/debates/2026-09-22-liquidity-exposure-calculator/transcript.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js -->

### Requirements

- Amend `CLAUDE.md` with a narrow exception permitting deterministic, browser-visible personalization derived solely from an already-published event and visitor inputs.
- State that this exception does not permit reproducing or modifying the upstream financial-stress model, ingesting new data, making LLM calls, or persisting personal inputs.
- In `docs/MODEL.md` §0, replace the unqualified "computes nothing" claim with the same narrow exception so it does not contradict the new section.
- Correct the stale `GAUGE_BANDS` location note to `public/render.js` without changing any band range, label, or meaning. Do not edit `public/about.html`.
- Add a Personal Liquidity Exposure section to `docs/MODEL.md` that distinguishes the derived personal metric from `event.final_score`.
- Define allocation inputs as percentages for:
  - Equities / cash-like assets (`t`).
  - BTC (`b`).
  - ETH (`e`).
  - XRP (`x`).
- Require each allocation to be a finite number from 0 through 100, and require the four allocations to total exactly 100. Do not coerce strings, repair totals, or treat out-of-range values as zero.
- Define schema handling from the API contract:
  - Absent, null, or empty `schema_version` has major version 0.
  - A version string is accepted only when it consists of nonnegative integer components separated by dots, with at least one component. Its major version is the integer before the first dot, or the whole string when it contains only digits. `"1.0"` and `"1"` are major 1. `"0.0"` is major 0.
  - Any other `schema_version` shape or string makes the calculator unavailable.
  - Major version 1 or later uses the v1 scale. Major version 0 uses the legacy scale.
- Define utility normalization:
  - v1: `utility_score` must be a finite number from 0.0 through 1.0 and is used unchanged.
  - Legacy: `utility_score` must be a finite number from 0 through 100 and is divided by 100.
  - Reject booleans, strings, nulls, nonfinite numbers, and out-of-range values. Never infer the scale from the magnitude.
- Look up each crypto utility on `asset_triggers[].asset` by trimming and case-insensitive exact equality with `BTC`, `ETH`, or `XRP`. Do not use substring or alias matching. If several entries match, use the first in array order.
- Define shares `t`, `b`, `e`, and `x` as each allocation divided by 100, with no intermediate rounding.
- Define normalized utilities as `uBTC`, `uETH`, and `uXRP`.
- Define the formula exactly as:
  - `weightedFragility = t + b * (2 - uBTC) + e * (2 - uETH) + x * (2 - uXRP)`.
  - `leverageMultiplier = 1.15` when leverage/margin is selected, otherwise `1`.
  - `raw = final_score * weightedFragility * leverageMultiplier`.
  - `personalExposure = round(clamp(raw, 0, 100))`, where clamp is inclusive and round is JavaScript `Math.round` (nearest integer; nonnegative halves round away from zero).
- Explain that a utility of 1 gives that crypto asset the same weight as equities/cash-like, while a utility of 0 doubles its weight. Leverage multiplies the combined result by 1.15. High utility therefore removes only the additional crypto-plumbing penalty; it never makes crypto weigh less than equities/cash-like.
- Require `event.final_score` to be a finite number from 0 through 100. Reject values outside that range rather than clamping them. Numeric non-integers inside the range are accepted.
- Require a valid matching utility only for a crypto asset whose allocation is nonzero. Ignore missing or invalid utilities for a zero allocation.
- Map the rounded result through the existing `gaugeBand` helper and the six canonical bands. Do not define a second band table. Where band edges overlap, the existing first match wins.
- Document that these band labels are reused as a severity vocabulary for personal exposure under current published conditions. They are not a statement that policy is in that regime and not a policy-regime prediction.
- Pin these worked examples in the model section:
  - Score 40, allocations 100/0/0/0, unleveraged → raw 40 → 40.
  - Score 40, allocations 40/30/20/10, utilities 0.80/0.50/0.20, unleveraged → weighted fragility 1.24 → raw 49.6 → 50. The same utilities encoded as legacy 80/50/20 under major version 0 produce 50.
  - The same mixed inputs with leverage → raw 57.04 → 57.
  - Score 1, allocation 100% BTC, utility 0.5, unleveraged → raw 1.5 → 2.
  - Score 100, allocation 100% BTC, utility 0, leveraged → raw 230 → 100.
- Update `docs/API-CONTRACT.md` to document this as a consumer-derived value, not a new wire field and not a new endpoint.
- Document signup as `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`.
- Document verification as the existing `POST /verifyEmailCode` body `{ username, code }`, where `username` is the submitted email. The verification body has no list field.
- Keep `financial_stress_alerts` documented as the general mailing-list value.
- Preserve the contract rule that all event fields are optional and specify that insufficient inputs make only the calculator unavailable.

### Acceptance Criteria

- The architecture documentation expressly permits this bounded derived calculation without weakening the upstream contract boundary.
- `CLAUDE.md` and `docs/MODEL.md` do not contradict each other about local computation.
- The formula, worked examples, validation, normalization, asset matching, leverage behavior, band reuse, and missing-data behavior are unambiguous.
- `docs/API-CONTRACT.md` adds no required event field or new endpoint.
- The general mailing-list value remains documented separately from the calculator attribution.
- The configured verification command succeeds.

## Phase 2 - Implement and Test Pure Exposure Helpers

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/render.js -->
<!-- pilot:touches=test/exposure-calculator.test.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add pure, DOM-independent helpers to `public/render.js` for:
  - Allocation validation.
  - Asset-trigger lookup using trimmed, case-insensitive exact `asset` matches for BTC, ETH, and XRP.
  - Contract-aware utility normalization, implemented separately from `scaledUnitPercent`.
  - Personal exposure calculation.
  - Reusing `gaugeBand` for the derived result.
  - Producing a safe result object.
- Keep helpers compatible with both direct browser loading and CommonJS use.
- Export the helpers through `RENDER_EXPORTS`.
- Return a structured unavailable result, and do not throw, for invalid allocations, a non-boolean leverage flag, an unparsable `schema_version`, a missing or out-of-range `final_score`, or missing/invalid utility data required by a nonzero allocation.
- Use this result shape:
  - Success: `{ ok: true, score, bandLabel, bandColor, explanation }`.
  - Unavailable: `{ ok: false, reason, message }`, where `reason` is `allocations`, `leverage`, `schema`, `final_score`, or `utility`.
- `score` is the rounded integer. `bandLabel` and `bandColor` come from `gaugeBand(score)`. Do not add another band table.
- `explanation` is one concise sentence generated from the result. It names the band, says whether any allocated crypto utility raised exposure above the equities/cash-like baseline or all allocated crypto utilities matched it, and says whether leverage was applied. For a zero crypto allocation, say that utility does not change the result. Do not include the numeric score.
- Do not require utility data for crypto assets with zero allocation.
- After validating all source inputs, require the computed `weightedFragility`, multiplier, and `raw` product to be finite. Clamp `raw` inclusively to 0–100 even when valid inputs produce a value above 100; do not clamp or silently repair invalid allocations, invalid leverage, invalid schema versions, or invalid upstream values.
- Keep calculation helpers free of fetches, storage, timers, global mutable state, and HTML/DOM access.
- Add `node:test` coverage without introducing a test dependency.
- Cover at least:
  - All five worked examples from Phase 1, including identical legacy and v1 results.
  - A 100% equities/cash-like allocation.
  - Leveraged versus unleveraged results.
  - Raw-result clamping at 100 and rejection of `final_score` below 0 or above 100.
  - Case-insensitive exact asset lookup, trimming, and first-match precedence.
  - Rejection of substring matches such as `WBTC`.
  - Allocation totals other than 100.
  - Negative, over-100, nonnumeric, string, and nonfinite allocations.
  - Missing or invalid `final_score`, including nonfinite values.
  - Missing or invalid utility for an allocated crypto asset, including a legacy value interpreted only on the legacy scale.
  - Missing or invalid utility for an unallocated crypto asset.
  - Absent schema as legacy, `"1.0"` as v1, and a non-string schema as unavailable.
  - Rejection of malformed version strings.
  - A non-boolean leverage flag as unavailable.
  - Reuse of the canonical `gaugeBand` label at representative boundaries, including an overlapping boundary where the first matching band wins.
  - An explanation that does not contain the numeric score.

### Acceptance Criteria

- A single pure helper call deterministically produces the documented score from an event, allocations, and leverage flag.
- Legacy and v1 payloads representing the same utilities produce the same result.
- Invalid or incomplete inputs return an unavailable result and never throw during normal use.
- Valid inputs whose raw result exceeds 100 are clamped to 100.
- No second band table is introduced.
- `public/render.js` remains valid in Node and the browser.
- All focused tests and the configured syntax checks pass.

## Phase 3 - Add the Gated Calculator Experience

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/index.html -->
<!-- pilot:touches=server.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:read=public/render.js -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add a Personal Liquidity Exposure section to `public/index.html` immediately after the current score panel.
- The page must call the Phase 2 helpers. Do not reimplement the formula in the page script.
- Include labeled dropdowns for equities/cash-like, BTC, ETH, and XRP. Each offers 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, and 100. Default to 100, 0, 0, and 0. Include an unchecked leverage/margin checkbox.
- Give every calculator control and status element an id beginning with `exposure-`. Do not reuse `signup-form`, `signup-email`, `signup-status`, `signup-submit`, `verify-form`, `verify-code`, or `verify-submit`.
- Include public explanatory copy describing:
  - What the calculator measures.
  - The deterministic formula at a readable level, including the 1.15 leverage multiplier.
  - That current macro stress sets the baseline, crypto utility can only add a plumbing penalty, and utility of 1 matches equities/cash-like.
  - That the reused band label describes personal-exposure severity and is not a policy-regime call.
  - That the output is informational and not investment advice.
- Validate that allocations total exactly 100 and announce actionable errors without opening the email gate.
- After a valid calculation, before access is granted:
  - Show the derived band and one-line explanation immediately.
  - Keep the personalized numeric score masked.
  - Do not place that score in the DOM, a data attribute, a title, an aria attribute, or the explanation.
  - Show a calculator-specific email form explaining that signup reveals the number.
- Submit calculator emails to `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`. Trim the email. Do not submit an empty email.
- Treat a network failure, non-JSON response, non-2xx response, or falsy `success` as signup failure and keep the numeric score hidden.
- If signup succeeds and `needsVerification` is truthy, show a calculator-specific verification-code form and do not reveal the number.
- If signup succeeds and `needsVerification` is not truthy, grant access and reveal the numeric score immediately.
- Submit verification as `POST /verifyEmailCode` with exactly `{ username, code }`, where `username` is the calculator email stored in memory. Trim the code. Do not submit an empty code or include a list field.
- Reveal the number after verification only when the response is 2xx, the JSON has truthy `success`, and a current successful calculation is still valid. Verification failure, network failure, or non-JSON response keeps the number hidden.
- Insert API `message` values with `textContent` only when they are strings. Otherwise use a generic fallback.
- Keep calculator form state, pending email, status messages, verification state, and access state independent from the existing mailing-list forms.
- While a signup or verification request is pending, disable the calculator controls and both calculator submit buttons. Restore them after failure or after a verification request for more input. Do not leave a control disabled after a recoverable error.
- Once access is granted during the page session, hide the calculator email and verification forms and allow recalculation without another signup. Keep allocations, access, and results in memory only.
- If allocations or leverage change before access is granted, clear the current band, explanation, and any pending score, and require Calculate to be pressed again. Do not reveal a cleared result if verification completes first.
- If signup already succeeded and only verification remains, an input change does not require a second signup. After the visitor calculates again, the existing verification form can reveal the new result.
- After access has been granted, input changes do not revoke access. The new number is shown only after the next successful calculation.
- Add `<script type="application/json" id="exposure-calculator-context">null</script>` to `public/index.html`.
- Update `server.js` so an available cached SSR event replaces that placeholder. Preserve every existing SSR replacement. When there is no cached event, leave the placeholder as null and preserve today's early static fallback.
- Serialize only `final_score` when it is a number, `schema_version` when it is a string, and `asset_triggers` as an array of `{ asset, utility_score }` objects. Non-array triggers serialize as `[]`.
- Escape JSON embedded in HTML by replacing `&` with `\u0026`, `<` with `\u003c`, `>` with `\u003e`, U+2028 with `\u2028`, and U+2029 with `\u2029`, so values cannot terminate the script element or inject markup.
- The calculator reads the in-memory event context. When the JSON placeholder is null, use the event from the page's existing `loadStressScore()` path once it arrives. Do not start a second financial-stress fetch.
- Every call to `renderEventIntoPage(event)` with a non-null event object replaces the calculator context with that event. Do not compare timestamps.
- If a calculation is already displayed when context is replaced, recompute it from the current controls and new context without another signup or fetch. If access is granted, update the visible number; otherwise update only the band and explanation. If recomputation is unavailable, clear the score and show the unavailable message.
- Do not change the existing cache TTL.
- Disable calculation with a clear temporary/unavailable message when required event data is absent, while leaving the rest of the page functional.
- Style the section consistently with existing panels. At `max-width: 480px`, stack its controls in one column.
- Use an `aria-live="polite"` region for validation, signup, verification, and reveal status.
- After a reveal, move focus to the result element. Make it programmatically focusable without adding it to the tab order.
- Never place the email address, allocation, or score in a URL, cookie, local storage, session storage, or server log.

### Acceptance Criteria

- Visitors can configure and calculate an allocation using keyboard or pointer controls on desktop and mobile layouts.
- The default 100/0/0/0 allocation is valid, and only the listed 10-point choices are offered.
- Invalid totals and unavailable upstream data produce clear messages without breaking the page.
- The band and explanation are visible after calculation, while the numeric score is absent from the DOM until the required signup flow succeeds.
- Calculator signup uses exactly `liquiditywatch-exposure-calculator`; the existing signup still uses `financial_stress_alerts`.
- Verification uses exactly `{ username, code }`.
- A missing `needsVerification` field on an otherwise successful signup reveals the number; a truthy value does not.
- Verification-required users cannot reveal the number before successful code verification.
- Signup or verification failures do not reveal the number.
- Changing inputs before access clears the unrevealed result, and a late verification cannot reveal a stale score.
- Successful users can recalculate during the same page session without another email submission.
- A later event rendered by the existing refresh updates the displayed calculation without an additional request to `/api/financial-stress-monitor`.
- Calculator actions cause no additional request to `/api/financial-stress-monitor`.
- SSR-provided calculator context contains only the projected fields, is safely serialized, and is replaced when the client renders a new event.
- The main score, optional panels, newsletter content, and existing mailing-list flow retain their behavior.
- The focused tests and configured verification checks pass.
```

Raw Response:

```text
---STATUS---
status: revise
reason: Phase 2 contradicts the worked clamping example by requiring an “in-range raw product,” even though valid inputs can produce raw values above 100.
```spec
# Personal Liquidity Exposure Calculator

## Overview

Add a deterministic Personal Liquidity Exposure calculator to the existing LiquidityWatch page. Visitors select a coarse portfolio allocation and leverage status; the calculator combines those inputs with the already-published financial-stress event.

The calculator, methodology, exposure band, and explanation remain public. The personalized numeric score is revealed only after successful mailing-list signup and, when required, email verification. This is a free lead-generation feature using the existing signup endpoints, with no payment, LLM call, upstream scoring change, or separate data-fetching path.

## Goals

- Calculate a deterministic 0–100 personal exposure score from the current event and visitor-supplied allocations.
- Reuse the six existing LiquidityWatch bands and render-helper conventions.
- Support both legacy and v1 `asset_triggers[].utility_score` scales.
- Attribute conversions with the list value `liquiditywatch-exposure-calculator`.
- Reveal only the numeric result after successful signup or verification.
- Reuse the event already obtained by SSR or the existing page refresh.
- Preserve optional-field resilience and the no-build architecture.
- Add focused automated coverage for the calculation and validation rules.

## Non-Goals

- Changing the upstream financial-stress pipeline or its published score.
- Adding API fields, calculator endpoints, LLM calls, ingestion, payment, alerts, saved portfolios, history, sharing, or analytics.
- Treating the personal exposure score as investment advice or as a replacement for `event.final_score`.
- Persisting portfolio allocations or the calculated result.
- Refactoring the existing general mailing-list flow.
- Modifying environment files.
- Changing band ranges, labels, or colors, or adding a personal-exposure band table.

## Existing Files

- `CLAUDE.md` defines the presentation-only architecture and currently prohibits all local scoring.
- `docs/MODEL.md` defines score semantics and the canonical six regime bands. Its runtime band-table sentence is stale: `GAUGE_BANDS` lives in `public/render.js`, not `public/index.html`.
- `docs/API-CONTRACT.md` defines the optional event fields, legacy/v1 scales, and mailing-list endpoints. `asset_triggers[].asset` is the asset identifier. Signup is `POST /api/mailing-list/signup` with `{ email, list }` and a response of `{ success, needsVerification, message }`. Verification is `POST /verifyEmailCode` with `{ username, code }` and a response of `{ success, message }`.
- `public/render.js` contains shared browser/SSR render helpers, `GAUGE_BANDS`, `gaugeBand`, and `RENDER_EXPORTS`. `scaledUnitPercent` is only a display helper: it treats any present `schema_version` as v1 and does not reject out-of-range values. The calculator must not use it.
- `public/index.html` contains the page, inline styles and behavior, live event refresh, and the existing mailing-list forms. It already loads `/render.js`. The existing narrow layout breakpoint is `max-width: 480px`.
- `server.js` fetches and caches the current event for SSR in `renderIndexHtml`. It does not proxy mailing-list signup.
- `package.json` provides the existing no-build Node application.

## Shared Constraints

- Keep the entire implementation within 30 changed files and 3,200 changed lines.
- Do not modify `.env*`.
- Do not add a framework, bundler, transpiler, database, dependency, payment flow, or LLM call.
- The upstream financial-stress event remains authoritative; the personal score is a clearly labeled, consumer-derived presentation metric.
- All upstream fields remain optional. Calculator unavailability must not affect the main score panel or other page content.
- Do not fetch the financial-stress endpoint in response to calculator calculation, signup, or verification.
- Escape or safely serialize all data inserted into HTML.
- Portfolio values and results remain in page memory only.
- Use semantic labels, keyboard-operable controls, visible focus states, accessible status messaging, and responsive styling.
- Keep the existing general mailing-list signup and its `financial_stress_alerts` attribution unchanged.
- Display an informational/not-investment-advice qualification with the calculator.
- Use `codex:gpt-5.6-sol` for all phases.

## Phase 1 - Define Calculator Semantics and Architectural Exception

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=CLAUDE.md -->
<!-- pilot:touches=docs/MODEL.md -->
<!-- pilot:touches=docs/API-CONTRACT.md -->
<!-- runner:read=docs/debates/2026-09-22-liquidity-exposure-calculator/transcript.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js -->

### Requirements

- Amend `CLAUDE.md` with a narrow exception permitting deterministic, browser-visible personalization derived solely from an already-published event and visitor inputs.
- State that this exception does not permit reproducing or modifying the upstream financial-stress model, ingesting new data, making LLM calls, or persisting personal inputs.
- In `docs/MODEL.md` §0, replace the unqualified "computes nothing" claim with the same narrow exception so it does not contradict the new section.
- Correct the stale `GAUGE_BANDS` location note to `public/render.js` without changing any band range, label, or meaning. Do not edit `public/about.html`.
- Add a Personal Liquidity Exposure section to `docs/MODEL.md` that distinguishes the derived personal metric from `event.final_score`.
- Define allocation inputs as percentages for:
  - Equities / cash-like assets (`t`).
  - BTC (`b`).
  - ETH (`e`).
  - XRP (`x`).
- Require each allocation to be a finite number from 0 through 100, and require the four allocations to total exactly 100. Do not coerce strings, repair totals, or treat out-of-range values as zero.
- Define schema handling from the API contract:
  - Absent, null, or empty `schema_version` has major version 0.
  - A version string is accepted only when it consists of nonnegative integer components separated by dots, with at least one component. Its major version is the integer before the first dot, or the whole string when it contains only digits. `"1.0"` and `"1"` are major 1. `"0.0"` is major 0.
  - Any other `schema_version` shape or string makes the calculator unavailable.
  - Major version 1 or later uses the v1 scale. Major version 0 uses the legacy scale.
- Define utility normalization:
  - v1: `utility_score` must be a finite number from 0.0 through 1.0 and is used unchanged.
  - Legacy: `utility_score` must be a finite number from 0 through 100 and is divided by 100.
  - Reject booleans, strings, nulls, nonfinite numbers, and out-of-range values. Never infer the scale from the magnitude.
- Look up each crypto utility on `asset_triggers[].asset` by trimming and case-insensitive exact equality with `BTC`, `ETH`, or `XRP`. Do not use substring or alias matching. If several entries match, use the first in array order.
- Define shares `t`, `b`, `e`, and `x` as each allocation divided by 100, with no intermediate rounding.
- Define normalized utilities as `uBTC`, `uETH`, and `uXRP`.
- Define the formula exactly as:
  - `weightedFragility = t + b * (2 - uBTC) + e * (2 - uETH) + x * (2 - uXRP)`.
  - `leverageMultiplier = 1.15` when leverage/margin is selected, otherwise `1`.
  - `raw = final_score * weightedFragility * leverageMultiplier`.
  - `personalExposure = round(clamp(raw, 0, 100))`, where clamp is inclusive and round is JavaScript `Math.round` (nearest integer; nonnegative halves round away from zero).
- Explain that a utility of 1 gives that crypto asset the same weight as equities/cash-like, while a utility of 0 doubles its weight. Leverage multiplies the combined result by 1.15. High utility therefore removes only the additional crypto-plumbing penalty; it never makes crypto weigh less than equities/cash-like.
- Require `event.final_score` to be a finite number from 0 through 100. Reject values outside that range rather than clamping them. Numeric non-integers inside the range are accepted.
- Require a valid matching utility only for a crypto asset whose allocation is nonzero. Ignore missing or invalid utilities for a zero allocation.
- Map the rounded result through the existing `gaugeBand` helper and the six canonical bands. Do not define a second band table. Where band edges overlap, the existing first match wins.
- Document that these band labels are reused as a severity vocabulary for personal exposure under current published conditions. They are not a statement that policy is in that regime and not a policy-regime prediction.
- Pin these worked examples in the model section:
  - Score 40, allocations 100/0/0/0, unleveraged → raw 40 → 40.
  - Score 40, allocations 40/30/20/10, utilities 0.80/0.50/0.20, unleveraged → weighted fragility 1.24 → raw 49.6 → 50. The same utilities encoded as legacy 80/50/20 under major version 0 produce 50.
  - The same mixed inputs with leverage → raw 57.04 → 57.
  - Score 1, allocation 100% BTC, utility 0.5, unleveraged → raw 1.5 → 2.
  - Score 100, allocation 100% BTC, utility 0, leveraged → raw 230 → 100.
- Update `docs/API-CONTRACT.md` to document this as a consumer-derived value, not a new wire field and not a new endpoint.
- Document signup as `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`.
- Document verification as the existing `POST /verifyEmailCode` body `{ username, code }`, where `username` is the submitted email. The verification body has no list field.
- Keep `financial_stress_alerts` documented as the general mailing-list value.
- Preserve the contract rule that all event fields are optional and specify that insufficient inputs make only the calculator unavailable.

### Acceptance Criteria

- The architecture documentation expressly permits this bounded derived calculation without weakening the upstream contract boundary.
- `CLAUDE.md` and `docs/MODEL.md` do not contradict each other about local computation.
- The formula, worked examples, validation, normalization, asset matching, leverage behavior, band reuse, and missing-data behavior are unambiguous.
- `docs/API-CONTRACT.md` adds no required event field or new endpoint.
- The general mailing-list value remains documented separately from the calculator attribution.
- The configured verification command succeeds.

## Phase 2 - Implement and Test Pure Exposure Helpers

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/render.js -->
<!-- pilot:touches=test/exposure-calculator.test.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add pure, DOM-independent helpers to `public/render.js` for:
  - Allocation validation.
  - Asset-trigger lookup using trimmed, case-insensitive exact `asset` matches for BTC, ETH, and XRP.
  - Contract-aware utility normalization, implemented separately from `scaledUnitPercent`.
  - Personal exposure calculation.
  - Reusing `gaugeBand` for the derived result.
  - Producing a safe result object.
- Keep helpers compatible with both direct browser loading and CommonJS use.
- Export the helpers through `RENDER_EXPORTS`.
- Return a structured unavailable result, and do not throw, for invalid allocations, a non-boolean leverage flag, an unparsable `schema_version`, a missing or out-of-range `final_score`, or missing/invalid utility data required by a nonzero allocation.
- Use this result shape:
  - Success: `{ ok: true, score, bandLabel, bandColor, explanation }`.
  - Unavailable: `{ ok: false, reason, message }`, where `reason` is `allocations`, `leverage`, `schema`, `final_score`, or `utility`.
- `score` is the rounded integer. `bandLabel` and `bandColor` come from `gaugeBand(score)`. Do not add another band table.
- `explanation` is one concise sentence generated from the result. It names the band, says whether any allocated crypto utility raised exposure above the equities/cash-like baseline or all allocated crypto utilities matched it, and says whether leverage was applied. For a zero crypto allocation, say that utility does not change the result. Do not include the numeric score.
- Do not require utility data for crypto assets with zero allocation.
- After validating all source inputs, require the computed `weightedFragility`, multiplier, and `raw` product to be finite. Clamp `raw` inclusively to 0–100 even when valid inputs produce a value above 100; do not clamp or silently repair invalid allocations, invalid leverage, invalid schema versions, or invalid upstream values.
- Keep calculation helpers free of fetches, storage, timers, global mutable state, and HTML/DOM access.
- Add `node:test` coverage without introducing a test dependency.
- Cover at least:
  - All five worked examples from Phase 1, including identical legacy and v1 results.
  - A 100% equities/cash-like allocation.
  - Leveraged versus unleveraged results.
  - Raw-result clamping at 100 and rejection of `final_score` below 0 or above 100.
  - Case-insensitive exact asset lookup, trimming, and first-match precedence.
  - Rejection of substring matches such as `WBTC`.
  - Allocation totals other than 100.
  - Negative, over-100, nonnumeric, string, and nonfinite allocations.
  - Missing or invalid `final_score`, including nonfinite values.
  - Missing or invalid utility for an allocated crypto asset, including a legacy value interpreted only on the legacy scale.
  - Missing or invalid utility for an unallocated crypto asset.
  - Absent schema as legacy, `"1.0"` as v1, and a non-string schema as unavailable.
  - Rejection of malformed version strings.
  - A non-boolean leverage flag as unavailable.
  - Reuse of the canonical `gaugeBand` label at representative boundaries, including an overlapping boundary where the first matching band wins.
  - An explanation that does not contain the numeric score.

### Acceptance Criteria

- A single pure helper call deterministically produces the documented score from an event, allocations, and leverage flag.
- Legacy and v1 payloads representing the same utilities produce the same result.
- Invalid or incomplete inputs return an unavailable result and never throw during normal use.
- Valid inputs whose raw result exceeds 100 are clamped to 100.
- No second band table is introduced.
- `public/render.js` remains valid in Node and the browser.
- All focused tests and the configured syntax checks pass.

## Phase 3 - Add the Gated Calculator Experience

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/index.html -->
<!-- pilot:touches=server.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:read=public/render.js -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add a Personal Liquidity Exposure section to `public/index.html` immediately after the current score panel.
- The page must call the Phase 2 helpers. Do not reimplement the formula in the page script.
- Include labeled dropdowns for equities/cash-like, BTC, ETH, and XRP. Each offers 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, and 100. Default to 100, 0, 0, and 0. Include an unchecked leverage/margin checkbox.
- Give every calculator control and status element an id beginning with `exposure-`. Do not reuse `signup-form`, `signup-email`, `signup-status`, `signup-submit`, `verify-form`, `verify-code`, or `verify-submit`.
- Include public explanatory copy describing:
  - What the calculator measures.
  - The deterministic formula at a readable level, including the 1.15 leverage multiplier.
  - That current macro stress sets the baseline, crypto utility can only add a plumbing penalty, and utility of 1 matches equities/cash-like.
  - That the reused band label describes personal-exposure severity and is not a policy-regime call.
  - That the output is informational and not investment advice.
- Validate that allocations total exactly 100 and announce actionable errors without opening the email gate.
- After a valid calculation, before access is granted:
  - Show the derived band and one-line explanation immediately.
  - Keep the personalized numeric score masked.
  - Do not place that score in the DOM, a data attribute, a title, an aria attribute, or the explanation.
  - Show a calculator-specific email form explaining that signup reveals the number.
- Submit calculator emails to `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`. Trim the email. Do not submit an empty email.
- Treat a network failure, non-JSON response, non-2xx response, or falsy `success` as signup failure and keep the numeric score hidden.
- If signup succeeds and `needsVerification` is truthy, show a calculator-specific verification-code form and do not reveal the number.
- If signup succeeds and `needsVerification` is not truthy, grant access and reveal the numeric score immediately.
- Submit verification as `POST /verifyEmailCode` with exactly `{ username, code }`, where `username` is the calculator email stored in memory. Trim the code. Do not submit an empty code or include a list field.
- Reveal the number after verification only when the response is 2xx, the JSON has truthy `success`, and a current successful calculation is still valid. Verification failure, network failure, or non-JSON response keeps the number hidden.
- Insert API `message` values with `textContent` only when they are strings. Otherwise use a generic fallback.
- Keep calculator form state, pending email, status messages, verification state, and access state independent from the existing mailing-list forms.
- While a signup or verification request is pending, disable the calculator controls and both calculator submit buttons. Restore them after failure or after a verification request for more input. Do not leave a control disabled after a recoverable error.
- Once access is granted during the page session, hide the calculator email and verification forms and allow recalculation without another signup. Keep allocations, access, and results in memory only.
- If allocations or leverage change before access is granted, clear the current band, explanation, and any pending score, and require Calculate to be pressed again. Do not reveal a cleared result if verification completes first.
- If signup already succeeded and only verification remains, an input change does not require a second signup. After the visitor calculates again, the existing verification form can reveal the new result.
- After access has been granted, input changes do not revoke access. The new number is shown only after the next successful calculation.
- Add `<script type="application/json" id="exposure-calculator-context">null</script>` to `public/index.html`.
- Update `server.js` so an available cached SSR event replaces that placeholder. Preserve every existing SSR replacement. When there is no cached event, leave the placeholder as null and preserve today's early static fallback.
- Serialize only `final_score` when it is a number, `schema_version` when it is a string, and `asset_triggers` as an array of `{ asset, utility_score }` objects. Non-array triggers serialize as `[]`.
- Escape JSON embedded in HTML by replacing `&` with `\u0026`, `<` with `\u003c`, `>` with `\u003e`, U+2028 with `\u2028`, and U+2029 with `\u2029`, so values cannot terminate the script element or inject markup.
- The calculator reads the in-memory event context. When the JSON placeholder is null, use the event from the page's existing `loadStressScore()` path once it arrives. Do not start a second financial-stress fetch.
- Every call to `renderEventIntoPage(event)` with a non-null event object replaces the calculator context with that event. Do not compare timestamps.
- If a calculation is already displayed when context is replaced, recompute it from the current controls and new context without another signup or fetch. If access is granted, update the visible number; otherwise update only the band and explanation. If recomputation is unavailable, clear the score and show the unavailable message.
- Do not change the existing cache TTL.
- Disable calculation with a clear temporary/unavailable message when required event data is absent, while leaving the rest of the page functional.
- Style the section consistently with existing panels. At `max-width: 480px`, stack its controls in one column.
- Use an `aria-live="polite"` region for validation, signup, verification, and reveal status.
- After a reveal, move focus to the result element. Make it programmatically focusable without adding it to the tab order.
- Never place the email address, allocation, or score in a URL, cookie, local storage, session storage, or server log.

### Acceptance Criteria

- Visitors can configure and calculate an allocation using keyboard or pointer controls on desktop and mobile layouts.
- The default 100/0/0/0 allocation is valid, and only the listed 10-point choices are offered.
- Invalid totals and unavailable upstream data produce clear messages without breaking the page.
- The band and explanation are visible after calculation, while the numeric score is absent from the DOM until the required signup flow succeeds.
- Calculator signup uses exactly `liquiditywatch-exposure-calculator`; the existing signup still uses `financial_stress_alerts`.
- Verification uses exactly `{ username, code }`.
- A missing `needsVerification` field on an otherwise successful signup reveals the number; a truthy value does not.
- Verification-required users cannot reveal the number before successful code verification.
- Signup or verification failures do not reveal the number.
- Changing inputs before access clears the unrevealed result, and a late verification cannot reveal a stale score.
- Successful users can recalculate during the same page session without another email submission.
- A later event rendered by the existing refresh updates the displayed calculation without an additional request to `/api/financial-stress-monitor`.
- Calculator actions cause no additional request to `/api/financial-stress-monitor`.
- SSR-provided calculator context contains only the projected fields, is safely serialized, and is replaced when the client renders a new event.
- The main score, optional panels, newsletter content, and existing mailing-list flow retain their behavior.
- The focused tests and configured verification checks pass.
```
```

### Reviewer 4: devin

Status: approved

Reason: Formula, validation rules, state machine, escaping, and phase sequencing are internally consistent and conflict-free.

Raw Response:

```text
---STATUS---
status: approved
reason: Formula, validation rules, state machine, escaping, and phase sequencing are internally consistent and conflict-free.
```

### Reviewer 5: local

Status: approved

Reason: The draft is clear and comprehensive, meeting all specified requirements without introducing new features or dependencies.

Raw Response:

```text
---STATUS---
status: approved
reason: The draft is clear and comprehensive, meeting all specified requirements without introducing new features or dependencies.
```

Round Result: not converged

At least one reviewer requested revision in round 1.

## Round 2

### Draft Before Round

```text
# Personal Liquidity Exposure Calculator

## Overview

Add a deterministic Personal Liquidity Exposure calculator to the existing LiquidityWatch page. Visitors select a coarse portfolio allocation and leverage status; the calculator combines those inputs with the already-published financial-stress event.

The calculator, methodology, exposure band, and explanation remain public. The personalized numeric score is revealed only after successful mailing-list signup and, when required, email verification. This is a free lead-generation feature using the existing signup endpoints, with no payment, LLM call, upstream scoring change, or separate data-fetching path.

## Goals

- Calculate a deterministic 0–100 personal exposure score from the current event and visitor-supplied allocations.
- Reuse the six existing LiquidityWatch bands and render-helper conventions.
- Support both legacy and v1 `asset_triggers[].utility_score` scales.
- Attribute conversions with the list value `liquiditywatch-exposure-calculator`.
- Reveal only the numeric result after successful signup or verification.
- Reuse the event already obtained by SSR or the existing page refresh.
- Preserve optional-field resilience and the no-build architecture.
- Add focused automated coverage for the calculation and validation rules.

## Non-Goals

- Changing the upstream financial-stress pipeline or its published score.
- Adding API fields, calculator endpoints, LLM calls, ingestion, payment, alerts, saved portfolios, history, sharing, or analytics.
- Treating the personal exposure score as investment advice or as a replacement for `event.final_score`.
- Persisting portfolio allocations or the calculated result.
- Refactoring the existing general mailing-list flow.
- Modifying environment files.
- Changing band ranges, labels, or colors, or adding a personal-exposure band table.

## Existing Files

- `CLAUDE.md` defines the presentation-only architecture and currently prohibits all local scoring.
- `docs/MODEL.md` defines score semantics and the canonical six regime bands. Its runtime band-table sentence is stale: `GAUGE_BANDS` lives in `public/render.js`, not `public/index.html`.
- `docs/API-CONTRACT.md` defines the optional event fields, legacy/v1 scales, and mailing-list endpoints. `asset_triggers[].asset` is the asset identifier. Signup is `POST /api/mailing-list/signup` with `{ email, list }` and a response of `{ success, needsVerification, message }`. Verification is `POST /verifyEmailCode` with `{ username, code }` and a response of `{ success, message }`.
- `public/render.js` contains shared browser/SSR render helpers, `GAUGE_BANDS`, `gaugeBand`, and `RENDER_EXPORTS`. `scaledUnitPercent` is only a display helper: it treats any present `schema_version` as v1 and does not reject out-of-range values. The calculator must not use it.
- `public/index.html` contains the page, inline styles and behavior, live event refresh, and the existing mailing-list forms. It already loads `/render.js`. The existing narrow layout breakpoint is `max-width: 480px`.
- `server.js` fetches and caches the current event for SSR in `renderIndexHtml`. It does not proxy mailing-list signup.
- `package.json` provides the existing no-build Node application.

## Shared Constraints

- Keep the entire implementation within 30 changed files and 3,200 changed lines.
- Do not modify `.env*`.
- Do not add a framework, bundler, transpiler, database, dependency, payment flow, or LLM call.
- The upstream financial-stress event remains authoritative; the personal score is a clearly labeled, consumer-derived presentation metric.
- All upstream fields remain optional. Calculator unavailability must not affect the main score panel or other page content.
- Do not fetch the financial-stress endpoint in response to calculator calculation, signup, or verification.
- Escape or safely serialize all data inserted into HTML.
- Portfolio values and results remain in page memory only.
- Use semantic labels, keyboard-operable controls, visible focus states, accessible status messaging, and responsive styling.
- Keep the existing general mailing-list signup and its `financial_stress_alerts` attribution unchanged.
- Display an informational/not-investment-advice qualification with the calculator.
- Use `codex:gpt-5.6-sol` for all phases.

## Phase 1 - Define Calculator Semantics and Architectural Exception

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=CLAUDE.md -->
<!-- pilot:touches=docs/MODEL.md -->
<!-- pilot:touches=docs/API-CONTRACT.md -->
<!-- runner:read=docs/debates/2026-09-22-liquidity-exposure-calculator/transcript.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js -->

### Requirements

- Amend `CLAUDE.md` with a narrow exception permitting deterministic, browser-visible personalization derived solely from an already-published event and visitor inputs.
- State that this exception does not permit reproducing or modifying the upstream financial-stress model, ingesting new data, making LLM calls, or persisting personal inputs.
- In `docs/MODEL.md` §0, replace the unqualified "computes nothing" claim with the same narrow exception so it does not contradict the new section.
- Correct the stale `GAUGE_BANDS` location note to `public/render.js` without changing any band range, label, or meaning. Do not edit `public/about.html`.
- Add a Personal Liquidity Exposure section to `docs/MODEL.md` that distinguishes the derived personal metric from `event.final_score`.
- Define allocation inputs as percentages for:
  - Equities / cash-like assets (`t`).
  - BTC (`b`).
  - ETH (`e`).
  - XRP (`x`).
- Require each allocation to be a finite number from 0 through 100, and require the four allocations to total exactly 100. Do not coerce strings, repair totals, or treat out-of-range values as zero.
- Define schema handling from the API contract:
  - Absent, null, or empty `schema_version` has major version 0.
  - A version string is accepted only when it consists of nonnegative integer components separated by dots, with at least one component. Its major version is the integer before the first dot, or the whole string when it contains only digits. `"1.0"` and `"1"` are major 1. `"0.0"` is major 0.
  - Any other `schema_version` shape or string makes the calculator unavailable.
  - Major version 1 or later uses the v1 scale. Major version 0 uses the legacy scale.
- Define utility normalization:
  - v1: `utility_score` must be a finite number from 0.0 through 1.0 and is used unchanged.
  - Legacy: `utility_score` must be a finite number from 0 through 100 and is divided by 100.
  - Reject booleans, strings, nulls, nonfinite numbers, and out-of-range values. Never infer the scale from the magnitude.
- Look up each crypto utility on `asset_triggers[].asset` by trimming and case-insensitive exact equality with `BTC`, `ETH`, or `XRP`. Do not use substring or alias matching. If several entries match, use the first in array order.
- Define shares `t`, `b`, `e`, and `x` as each allocation divided by 100, with no intermediate rounding.
- Define normalized utilities as `uBTC`, `uETH`, and `uXRP`.
- Define the formula exactly as:
  - `weightedFragility = t + b * (2 - uBTC) + e * (2 - uETH) + x * (2 - uXRP)`.
  - `leverageMultiplier = 1.15` when leverage/margin is selected, otherwise `1`.
  - `raw = final_score * weightedFragility * leverageMultiplier`.
  - `personalExposure = round(clamp(raw, 0, 100))`, where clamp is inclusive and round is JavaScript `Math.round` (nearest integer; nonnegative halves round away from zero).
- Explain that a utility of 1 gives that crypto asset the same weight as equities/cash-like, while a utility of 0 doubles its weight. Leverage multiplies the combined result by 1.15. High utility therefore removes only the additional crypto-plumbing penalty; it never makes crypto weigh less than equities/cash-like.
- Require `event.final_score` to be a finite number from 0 through 100. Reject values outside that range rather than clamping them. Numeric non-integers inside the range are accepted.
- Require a valid matching utility only for a crypto asset whose allocation is nonzero. Ignore missing or invalid utilities for a zero allocation.
- Map the rounded result through the existing `gaugeBand` helper and the six canonical bands. Do not define a second band table. Where band edges overlap, the existing first match wins.
- Document that these band labels are reused as a severity vocabulary for personal exposure under current published conditions. They are not a statement that policy is in that regime and not a policy-regime prediction.
- Pin these worked examples in the model section:
  - Score 40, allocations 100/0/0/0, unleveraged → raw 40 → 40.
  - Score 40, allocations 40/30/20/10, utilities 0.80/0.50/0.20, unleveraged → weighted fragility 1.24 → raw 49.6 → 50. The same utilities encoded as legacy 80/50/20 under major version 0 produce 50.
  - The same mixed inputs with leverage → raw 57.04 → 57.
  - Score 1, allocation 100% BTC, utility 0.5, unleveraged → raw 1.5 → 2.
  - Score 100, allocation 100% BTC, utility 0, leveraged → raw 230 → 100.
- Update `docs/API-CONTRACT.md` to document this as a consumer-derived value, not a new wire field and not a new endpoint.
- Document signup as `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`.
- Document verification as the existing `POST /verifyEmailCode` body `{ username, code }`, where `username` is the submitted email. The verification body has no list field.
- Keep `financial_stress_alerts` documented as the general mailing-list value.
- Preserve the contract rule that all event fields are optional and specify that insufficient inputs make only the calculator unavailable.

### Acceptance Criteria

- The architecture documentation expressly permits this bounded derived calculation without weakening the upstream contract boundary.
- `CLAUDE.md` and `docs/MODEL.md` do not contradict each other about local computation.
- The formula, worked examples, validation, normalization, asset matching, leverage behavior, band reuse, and missing-data behavior are unambiguous.
- `docs/API-CONTRACT.md` adds no required event field or new endpoint.
- The general mailing-list value remains documented separately from the calculator attribution.
- The configured verification command succeeds.

## Phase 2 - Implement and Test Pure Exposure Helpers

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/render.js -->
<!-- pilot:touches=test/exposure-calculator.test.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add pure, DOM-independent helpers to `public/render.js` for:
  - Allocation validation.
  - Asset-trigger lookup using trimmed, case-insensitive exact `asset` matches for BTC, ETH, and XRP.
  - Contract-aware utility normalization, implemented separately from `scaledUnitPercent`.
  - Personal exposure calculation.
  - Reusing `gaugeBand` for the derived result.
  - Producing a safe result object.
- Keep helpers compatible with both direct browser loading and CommonJS use.
- Export the helpers through `RENDER_EXPORTS`.
- Return a structured unavailable result, and do not throw, for invalid allocations, a non-boolean leverage flag, an unparsable `schema_version`, a missing or out-of-range `final_score`, or missing/invalid utility data required by a nonzero allocation.
- Use this result shape:
  - Success: `{ ok: true, score, bandLabel, bandColor, explanation }`.
  - Unavailable: `{ ok: false, reason, message }`, where `reason` is `allocations`, `leverage`, `schema`, `final_score`, or `utility`.
- `score` is the rounded integer. `bandLabel` and `bandColor` come from `gaugeBand(score)`. Do not add another band table.
- `explanation` is one concise sentence generated from the result. It names the band, says whether any allocated crypto utility raised exposure above the equities/cash-like baseline or all allocated crypto utilities matched it, and says whether leverage was applied. For a zero crypto allocation, say that utility does not change the result. Do not include the numeric score.
- Do not require utility data for crypto assets with zero allocation.
- After validating all source inputs, require the computed `weightedFragility`, multiplier, and `raw` product to be finite. Clamp `raw` inclusively to 0–100 even when valid inputs produce a value above 100; do not clamp or silently repair invalid allocations, invalid leverage, invalid schema versions, or invalid upstream values.
- Keep calculation helpers free of fetches, storage, timers, global mutable state, and HTML/DOM access.
- Add `node:test` coverage without introducing a test dependency.
- Cover at least:
  - All five worked examples from Phase 1, including identical legacy and v1 results.
  - A 100% equities/cash-like allocation.
  - Leveraged versus unleveraged results.
  - Raw-result clamping at 100 and rejection of `final_score` below 0 or above 100.
  - Case-insensitive exact asset lookup, trimming, and first-match precedence.
  - Rejection of substring matches such as `WBTC`.
  - Allocation totals other than 100.
  - Negative, over-100, nonnumeric, string, and nonfinite allocations.
  - Missing or invalid `final_score`, including nonfinite values.
  - Missing or invalid utility for an allocated crypto asset, including a legacy value interpreted only on the legacy scale.
  - Missing or invalid utility for an unallocated crypto asset.
  - Absent schema as legacy, `"1.0"` as v1, and a non-string schema as unavailable.
  - Rejection of malformed version strings.
  - A non-boolean leverage flag as unavailable.
  - Reuse of the canonical `gaugeBand` label at representative boundaries, including an overlapping boundary where the first matching band wins.
  - An explanation that does not contain the numeric score.

### Acceptance Criteria

- A single pure helper call deterministically produces the documented score from an event, allocations, and leverage flag.
- Legacy and v1 payloads representing the same utilities produce the same result.
- Invalid or incomplete inputs return an unavailable result and never throw during normal use.
- Valid inputs whose raw result exceeds 100 are clamped to 100.
- No second band table is introduced.
- `public/render.js` remains valid in Node and the browser.
- All focused tests and the configured syntax checks pass.

## Phase 3 - Add the Gated Calculator Experience

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/index.html -->
<!-- pilot:touches=server.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:read=public/render.js -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add a Personal Liquidity Exposure section to `public/index.html` immediately after the current score panel.
- The page must call the Phase 2 helpers. Do not reimplement the formula in the page script.
- Include labeled dropdowns for equities/cash-like, BTC, ETH, and XRP. Each offers 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, and 100. Default to 100, 0, 0, and 0. Include an unchecked leverage/margin checkbox.
- Give every calculator control and status element an id beginning with `exposure-`. Do not reuse `signup-form`, `signup-email`, `signup-status`, `signup-submit`, `verify-form`, `verify-code`, or `verify-submit`.
- Include public explanatory copy describing:
  - What the calculator measures.
  - The deterministic formula at a readable level, including the 1.15 leverage multiplier.
  - That current macro stress sets the baseline, crypto utility can only add a plumbing penalty, and utility of 1 matches equities/cash-like.
  - That the reused band label describes personal-exposure severity and is not a policy-regime call.
  - That the output is informational and not investment advice.
- Validate that allocations total exactly 100 and announce actionable errors without opening the email gate.
- After a valid calculation, before access is granted:
  - Show the derived band and one-line explanation immediately.
  - Keep the personalized numeric score masked.
  - Do not place that score in the DOM, a data attribute, a title, an aria attribute, or the explanation.
  - Show a calculator-specific email form explaining that signup reveals the number.
- Submit calculator emails to `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`. Trim the email. Do not submit an empty email.
- Treat a network failure, non-JSON response, non-2xx response, or falsy `success` as signup failure and keep the numeric score hidden.
- If signup succeeds and `needsVerification` is truthy, show a calculator-specific verification-code form and do not reveal the number.
- If signup succeeds and `needsVerification` is not truthy, grant access and reveal the numeric score immediately.
- Submit verification as `POST /verifyEmailCode` with exactly `{ username, code }`, where `username` is the calculator email stored in memory. Trim the code. Do not submit an empty code or include a list field.
- Reveal the number after verification only when the response is 2xx, the JSON has truthy `success`, and a current successful calculation is still valid. Verification failure, network failure, or non-JSON response keeps the number hidden.
- Insert API `message` values with `textContent` only when they are strings. Otherwise use a generic fallback.
- Keep calculator form state, pending email, status messages, verification state, and access state independent from the existing mailing-list forms.
- While a signup or verification request is pending, disable the calculator controls and both calculator submit buttons. Restore them after failure or after a verification request for more input. Do not leave a control disabled after a recoverable error.
- Once access is granted during the page session, hide the calculator email and verification forms and allow recalculation without another signup. Keep allocations, access, and results in memory only.
- If allocations or leverage change before access is granted, clear the current band, explanation, and any pending score, and require Calculate to be pressed again. Do not reveal a cleared result if verification completes first.
- If signup already succeeded and only verification remains, an input change does not require a second signup. After the visitor calculates again, the existing verification form can reveal the new result.
- After access has been granted, input changes do not revoke access. The new number is shown only after the next successful calculation.
- Add `<script type="application/json" id="exposure-calculator-context">null</script>` to `public/index.html`.
- Update `server.js` so an available cached SSR event replaces that placeholder. Preserve every existing SSR replacement. When there is no cached event, leave the placeholder as null and preserve today's early static fallback.
- Serialize only `final_score` when it is a number, `schema_version` when it is a string, and `asset_triggers` as an array of `{ asset, utility_score }` objects. Non-array triggers serialize as `[]`.
- Escape JSON embedded in HTML by replacing `&` with `\u0026`, `<` with `\u003c`, `>` with `\u003e`, U+2028 with `\u2028`, and U+2029 with `\u2029`, so values cannot terminate the script element or inject markup.
- The calculator reads the in-memory event context. When the JSON placeholder is null, use the event from the page's existing `loadStressScore()` path once it arrives. Do not start a second financial-stress fetch.
- Every call to `renderEventIntoPage(event)` with a non-null event object replaces the calculator context with that event. Do not compare timestamps.
- If a calculation is already displayed when context is replaced, recompute it from the current controls and new context without another signup or fetch. If access is granted, update the visible number; otherwise update only the band and explanation. If recomputation is unavailable, clear the score and show the unavailable message.
- Do not change the existing cache TTL.
- Disable calculation with a clear temporary/unavailable message when required event data is absent, while leaving the rest of the page functional.
- Style the section consistently with existing panels. At `max-width: 480px`, stack its controls in one column.
- Use an `aria-live="polite"` region for validation, signup, verification, and reveal status.
- After a reveal, move focus to the result element. Make it programmatically focusable without adding it to the tab order.
- Never place the email address, allocation, or score in a URL, cookie, local storage, session storage, or server log.

### Acceptance Criteria

- Visitors can configure and calculate an allocation using keyboard or pointer controls on desktop and mobile layouts.
- The default 100/0/0/0 allocation is valid, and only the listed 10-point choices are offered.
- Invalid totals and unavailable upstream data produce clear messages without breaking the page.
- The band and explanation are visible after calculation, while the numeric score is absent from the DOM until the required signup flow succeeds.
- Calculator signup uses exactly `liquiditywatch-exposure-calculator`; the existing signup still uses `financial_stress_alerts`.
- Verification uses exactly `{ username, code }`.
- A missing `needsVerification` field on an otherwise successful signup reveals the number; a truthy value does not.
- Verification-required users cannot reveal the number before successful code verification.
- Signup or verification failures do not reveal the number.
- Changing inputs before access clears the unrevealed result, and a late verification cannot reveal a stale score.
- Successful users can recalculate during the same page session without another email submission.
- A later event rendered by the existing refresh updates the displayed calculation without an additional request to `/api/financial-stress-monitor`.
- Calculator actions cause no additional request to `/api/financial-stress-monitor`.
- SSR-provided calculator context contains only the projected fields, is safely serialized, and is replaced when the client renders a new event.
- The main score, optional panels, newsletter content, and existing mailing-list flow retain their behavior.
- The focused tests and configured verification checks pass.

```

### Reviewer 1: grok-build

Status: revise

Reason: The draft conflicts with itself on control re-enable, string dropdown values versus rejected strings, non-throwing lookup, band-file locations, and when a cleared result may reappear.

Replacement Spec:

```spec
# Personal Liquidity Exposure Calculator

## Overview

Add a deterministic Personal Liquidity Exposure calculator to the existing LiquidityWatch page. Visitors select a coarse portfolio allocation and leverage status; the calculator combines those inputs with the already-published financial-stress event.

The calculator, methodology, exposure band, and explanation remain public. The personalized numeric score is revealed only after successful mailing-list signup and, when required, email verification. This is a free lead-generation feature using the existing signup endpoints, with no payment, LLM call, upstream scoring change, or separate data-fetching path.

The debate transcript at `docs/debates/2026-09-22-liquidity-exposure-calculator/transcript.md` is not an input. Do not implement its ungated score, scenario delta, saved mix, alerts, or paid threshold.

## Goals

- Calculate a deterministic 0–100 personal exposure score from the current event and visitor-supplied allocations.
- Reuse the six existing LiquidityWatch bands and render-helper conventions.
- Support both legacy and v1 `asset_triggers[].utility_score` scales.
- Attribute conversions with the list value `liquiditywatch-exposure-calculator`.
- Reveal the numeric score only after successful signup or verification; the band and explanation stay public.
- Reuse the event already obtained by SSR or the existing page refresh.
- Preserve optional-field resilience and the no-build architecture.
- Add focused automated coverage for the calculation and validation rules.

## Non-Goals

- Changing the upstream financial-stress pipeline or its published score.
- Adding API fields, calculator endpoints, LLM calls, ingestion, payment, alerts, saved portfolios, history, sharing, or analytics.
- Treating the personal exposure score as investment advice or as a replacement for `event.final_score`.
- Persisting portfolio allocations or the calculated result.
- Refactoring the existing general mailing-list flow.
- Modifying environment files.
- Changing band ranges, labels, or colors, or adding a personal-exposure band table.
- Ungating the numeric score, showing a next-regime scenario delta, or following the debate transcript.

## Existing Files

- `CLAUDE.md` defines the presentation-only architecture and currently prohibits all local scoring. Its band-sync rule still names `public/index.html`, which is stale.
- `docs/MODEL.md` defines score semantics and the canonical six regime bands. Its runtime band-table sentences, including §8 open item 1, are stale: `GAUGE_BANDS` lives in `public/render.js`, not `public/index.html`. §8 open item 2 still says this repo computes nothing.
- `docs/API-CONTRACT.md` defines the optional event fields, legacy/v1 scales, and mailing-list endpoints. `asset_triggers[].asset` is the asset identifier. Signup is `POST /api/mailing-list/signup` with `{ email, list }` and a response of `{ success, needsVerification, message }`. Verification is `POST /verifyEmailCode` with `{ username, code }` and a response of `{ success, message }`. The contract does not yet name the list value `financial_stress_alerts`; the live general form in `public/index.html` does.
- `public/render.js` contains shared browser/SSR render helpers, `GAUGE_BANDS`, `gaugeBand`, and `RENDER_EXPORTS`. Top-level declarations are globals in the classic browser script and CommonJS exports in Node. `scaledUnitPercent` is only a display helper: it treats any present truthy `schema_version` as v1 and does not reject out-of-range values. The calculator must not use it.
- `public/index.html` contains the page, inline styles and behavior, live event refresh, and the existing mailing-list forms. It already loads `/render.js` before its inline script. The macro score lives in `section#stress-score`. The existing narrow layout breakpoint is `max-width: 480px`. `loadStressScore()` always fetches once on load and calls `renderEventIntoPage`.
- `server.js` fetches and caches the current event for SSR in `renderIndexHtml`. A null event returns the template unchanged. A throw falls back to the static file. It does not proxy mailing-list signup.
- `package.json` provides the existing no-build Node application.

## Shared Constraints

- Keep the entire implementation within 30 changed files and 3,200 changed lines.
- Do not modify `.env*`.
- Do not add a framework, bundler, transpiler, database, dependency, payment flow, or LLM call.
- The upstream financial-stress event remains authoritative; the personal score is a clearly labeled, consumer-derived presentation metric.
- All upstream fields remain optional. Calculator unavailability must not affect the main score panel or other page content.
- Do not fetch the financial-stress endpoint in response to calculator calculation, signup, or verification. Do not add a second financial-stress fetch; the existing `loadStressScore()` call remains the only client fetch.
- Escape or safely serialize all data inserted into HTML. Set calculator band, explanation, score, and status text with `textContent`, never `innerHTML`.
- Portfolio values and results remain in page memory only.
- Use semantic labels, keyboard-operable controls, visible focus states, accessible status messaging, and responsive styling.
- Keep the existing general mailing-list signup and its `financial_stress_alerts` attribution unchanged.
- Display an informational/not-investment-advice qualification with the calculator.
- Use `codex:gpt-5.6-sol` for all phases.
- Do not put the email address, allocations, or personal score in a URL, cookie, local storage, session storage, `console` output, or server log. The signup and verification request bodies contain only the fields specified below and do not include the score or allocations.

## Phase 1 - Define Calculator Semantics and Architectural Exception

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=CLAUDE.md -->
<!-- pilot:touches=docs/MODEL.md -->
<!-- pilot:touches=docs/API-CONTRACT.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js -->

### Requirements

- Amend `CLAUDE.md` with a narrow exception permitting deterministic, browser-visible personalization derived solely from an already-published event and visitor inputs.
- State that this exception does not permit reproducing or modifying the upstream financial-stress model, ingesting new data, making LLM calls, or persisting personal inputs.
- In the same `CLAUDE.md` edit, change the band-sync location from `public/index.html` to `public/render.js`. Do not change band ranges, labels, colors, or the `public/about.html` obligation.
- In `docs/MODEL.md` §0, replace the unqualified "computes nothing" claim with the same narrow exception so it does not contradict the new section.
- Qualify `docs/MODEL.md` §8 open item 2 so it does not still require an unqualified "compute nothing" rule.
- Correct every stale `GAUGE_BANDS` location note in `docs/MODEL.md`, including the regime-band paragraph and §8 open item 1, to `public/render.js` without changing any band range, label, or meaning. Do not edit `public/about.html`. Do not renumber existing model sections.
- Add a `## Personal Liquidity Exposure` section to `docs/MODEL.md` immediately after the §1 regime-band subsection. It distinguishes the derived personal metric from `event.final_score`.
- Define allocation inputs as percentages for:
  - Equities / cash-like assets (`equities`, share `t`).
  - BTC (`btc`, share `b`).
  - ETH (`eth`, share `e`).
  - XRP (`xrp`, share `x`).
- Require each allocation to be a finite number from 0 through 100, and require the four allocations to total exactly 100. Missing keys are invalid. Do not coerce strings, repair totals, default missing keys to zero, or treat out-of-range values as zero.
- Define schema handling from the API contract:
  - Absent, null, or `""` `schema_version` has major version 0.
  - A version string is accepted only when it matches `/^(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*))*$/` with no trimming. Its major version is the integer before the first dot, or the whole string when it contains only digits. `"1.0"` and `"1"` are major 1. `"0.0"` and `"0"` are major 0.
  - Leading zeros (`"01"`, `"1.00"`), whitespace, prerelease suffixes, and every non-string value make the calculator unavailable.
  - Major version 1 or later uses the v1 scale. Major version 0 uses the legacy scale.
  - Schema is validated even when every crypto allocation is zero.
- Define utility normalization:
  - v1: `utility_score` must be a finite number from 0.0 through 1.0 and is used unchanged.
  - Legacy: `utility_score` must be a finite number from 0 through 100 and is divided by 100.
  - Reject booleans, strings, nulls, nonfinite numbers, and out-of-range values. Never infer the scale from the magnitude.
- Look up each crypto utility on `asset_triggers[].asset` by trimming and case-insensitive exact equality with `BTC`, `ETH`, or `XRP`. Do not use substring or alias matching. If several entries match, use the first in array order.
- A null or non-object event, a missing `asset_triggers`, or a non-array `asset_triggers` contributes no matches and does not throw. Skip entries that are not non-null objects and skip entries whose `asset` is not a string.
- Define shares `t`, `b`, `e`, and `x` as each allocation divided by 100, with no intermediate rounding.
- Define normalized utilities as `uBTC`, `uETH`, and `uXRP`.
- Define the formula exactly as:
  - `weightedFragility = t + b * (2 - uBTC) + e * (2 - uETH) + x * (2 - uXRP)`.
  - `leverageMultiplier = 1.15` when leverage/margin is selected, otherwise `1`.
  - `raw = final_score * weightedFragility * leverageMultiplier`.
  - `personalExposure = Math.round(clamp(raw, 0, 100))`, where clamp is inclusive and happens before rounding. `Math.round` is nearest integer; nonnegative halves round away from zero.
- Explain that a utility of 1 gives that crypto asset the same weight as equities/cash-like, while a utility of 0 doubles its weight. Leverage multiplies the combined result by 1.15. High utility therefore removes only the additional crypto-plumbing penalty; it never makes crypto weigh less than equities/cash-like.
- Require `event.final_score` to be a finite number from 0 through 100. Reject values outside that range rather than clamping them. Numeric non-integers inside the range are accepted. A null or non-object event has a missing `final_score`.
- Require a valid matching utility only for a crypto asset whose allocation is nonzero. Ignore missing or invalid utilities for a zero allocation.
- Map the rounded result through the existing `gaugeBand` helper and the six canonical bands. Do not define a second band table. Where band edges overlap, the existing first match wins: 15 is Accommodative, 35 is Mild Watchfulness, 55 is Contained Tension, 75 is Restrictive Policy, and 90 is Policy-Forcing Danger Zone.
- Document that these band labels are reused as a severity vocabulary for personal exposure under current published conditions. They are not a statement that policy is in that regime and not a policy-regime prediction.
- Pin these worked examples in the model section:
  - Score 40, allocations 100/0/0/0, unleveraged → raw 40 → 40.
  - Score 40, allocations 40/30/20/10, utilities 0.80/0.50/0.20, unleveraged → weighted fragility 1.24 → raw 49.6 → 50. The same utilities encoded as legacy 80/50/20 under major version 0 produce 50.
  - The same mixed inputs with leverage → raw 57.04 → 57.
  - Score 1, allocation 100% BTC, utility 0.5, unleveraged → raw 1.5 → 2.
  - Score 100, allocation 100% BTC, utility 0, leveraged → raw 230 → clamp 100 → 100.
- Update `docs/API-CONTRACT.md` to document this as a consumer-derived value, not a new wire field and not a new endpoint.
- Document the existing general mailing-list value as `financial_stress_alerts`, separate from the calculator.
- Document calculator signup as `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`.
- Document verification as the existing `POST /verifyEmailCode` body `{ username, code }`, where `username` is the submitted email. The verification body has no list field.
- Preserve the contract rule that all event fields are optional and specify that insufficient inputs make only the calculator unavailable.

### Acceptance Criteria

- The architecture documentation expressly permits this bounded derived calculation without weakening the upstream contract boundary.
- `CLAUDE.md` and `docs/MODEL.md` do not contradict each other about local computation or about where `GAUGE_BANDS` lives.
- The formula, worked examples, validation, normalization, asset matching, leverage behavior, band reuse, and missing-data behavior are unambiguous.
- `docs/API-CONTRACT.md` adds no required event field or new endpoint.
- `financial_stress_alerts` and `liquiditywatch-exposure-calculator` are documented as different list values.
- The configured verification command succeeds.

## Phase 2 - Implement and Test Pure Exposure Helpers

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/render.js -->
<!-- pilot:touches=test/exposure-calculator.test.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add a top-level function `computePersonalExposure(event, allocations, leveraged)` to `public/render.js`, plus the pure helpers it needs. `allocations` is `{ equities, btc, eth, xrp }`.
- Keep the helpers DOM-independent and cover:
  - Allocation validation.
  - Asset-trigger lookup using trimmed, case-insensitive exact `asset` matches for BTC, ETH, and XRP.
  - Contract-aware utility normalization, implemented separately from `scaledUnitPercent`.
  - Personal exposure calculation.
  - Reusing `gaugeBand` for the derived result.
  - Producing a safe result object.
- Keep helpers compatible with both direct browser loading and CommonJS use. Define `computePersonalExposure` so the classic script exposes it as a global, and add it to `RENDER_EXPORTS`.
- Validate in this order and return the first failure: `allocations`, `leverage`, `schema`, `final_score`, `utility`.
- Return a structured unavailable result, and do not throw, for invalid allocations, a non-boolean leverage flag, an unparsable `schema_version`, a null or non-object event, a missing or out-of-range `final_score`, malformed `asset_triggers`, or missing/invalid utility data required by a nonzero allocation.
- Use this result shape:
  - Success: `{ ok: true, score, bandLabel, bandColor, explanation }`.
  - Unavailable: `{ ok: false, reason, message }`, where `reason` is `allocations`, `leverage`, `schema`, `final_score`, or `utility`, and `message` is a non-empty string that contains no digit characters.
- `score` is the rounded integer. `bandLabel` and `bandColor` come from `gaugeBand(score)`. Do not add another band table.
- `explanation` is one concise sentence generated from the result. It names the band, says whether any allocated crypto utility raised exposure above the equities/cash-like baseline or all allocated crypto utilities matched it, and says whether leverage was applied. For a zero crypto allocation, say that utility does not change the result. It contains no digit characters and does not include the numeric score.
- Do not require utility data for crypto assets with zero allocation.
- After validating all source inputs, require the computed `weightedFragility`, multiplier, and `raw` product to be finite. If that defensive check fails, return `{ ok: false, reason: "final_score", message }` and do not throw. Clamp `raw` inclusively to 0–100 before `Math.round`, even when valid inputs produce a value above 100. Do not clamp or silently repair invalid allocations, invalid leverage, invalid schema versions, or invalid upstream values.
- Keep calculation helpers free of fetches, storage, timers, global mutable state, and HTML/DOM access.
- Add `node:test` coverage without introducing a test dependency. Require `computePersonalExposure` and `gaugeBand` from `public/render.js`.
- Cover at least:
  - All five worked examples from Phase 1, including identical legacy and v1 results.
  - A 100% equities/cash-like allocation, including one with a non-string `schema_version`, which is unavailable.
  - Leveraged versus unleveraged results.
  - Raw-result clamping at 100 and rejection of `final_score` below 0 or above 100.
  - Case-insensitive exact asset lookup, trimming, and first-match precedence.
  - Rejection of substring matches such as `WBTC`.
  - Non-array `asset_triggers`, non-object entries, and non-string `asset` values do not throw.
  - A null event with valid allocations and a boolean leverage flag returns `reason: "final_score"` and does not throw.
  - Allocation totals other than 100.
  - Negative, over-100, nonnumeric, string, and nonfinite allocations, plus a missing allocation key.
  - Missing or invalid `final_score`, including nonfinite values.
  - Missing or invalid utility for an allocated crypto asset, including a boolean, and a legacy value interpreted only on the legacy scale.
  - Missing or invalid utility for an unallocated crypto asset.
  - Absent, null, and `""` schema as legacy; `"0"` and `"0.0"` as legacy; `"1"` and `"1.0"` as v1.
  - Rejection of `"01"`, `"1.00"`, `" 1.0"`, `"1.0.0-beta"`, and a non-string schema.
  - A non-boolean leverage flag as unavailable.
  - Reuse of the canonical `gaugeBand` label at 0, 15, 35, 55, 75, 90, and 100, with the first matching band winning on each overlap.
  - An explanation and unavailable message that contain no digit characters.

### Acceptance Criteria

- `computePersonalExposure(event, allocations, leveraged)` deterministically produces the documented score.
- Legacy and v1 payloads representing the same utilities produce the same result.
- Invalid or incomplete inputs, including a null event and malformed triggers, return an unavailable result and never throw during normal use.
- Valid inputs whose raw result exceeds 100 are clamped to 100 before rounding.
- No second band table is introduced.
- `public/render.js` remains valid in Node and the browser.
- All focused tests and the configured syntax checks pass.

## Phase 3 - Add the Gated Calculator Experience

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/index.html -->
<!-- pilot:touches=server.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:read=public/render.js -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add a Personal Liquidity Exposure section to `public/index.html` immediately after `section#stress-score` and before the subscore section.
- The page must call the global `computePersonalExposure`. Do not reimplement the formula in the page script.
- Include labeled dropdowns for equities/cash-like, BTC, ETH, and XRP. Each offers 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, and 100. Default to 100, 0, 0, and 0. Include an unchecked leverage/margin checkbox and a Calculate button.
- Convert a selected option to a number only when its value matches `/^(?:0|100|[1-9]0)$/`. Pass those numbers and the boolean `checked` value to `computePersonalExposure`. Do not pass raw DOM strings.
- Give every calculator control and status element an id beginning with `exposure-`. Do not reuse `signup-form`, `signup-email`, `signup-status`, `signup-submit`, `verify-form`, `verify-code`, or `verify-submit`.
- Include public explanatory copy describing:
  - What the calculator measures.
  - The deterministic formula at a readable level, including the 1.15 leverage multiplier.
  - That current macro stress sets the baseline, crypto utility can only add a plumbing penalty, and utility of 1 matches equities/cash-like.
  - That the reused band label describes personal-exposure severity and is not a policy-regime call.
  - That the output is informational and not investment advice.
- Validate that allocations total exactly 100 and announce actionable errors without opening the email gate.
- A current calculation is the last helper result whose controls have not changed since Calculate was pressed. Changing allocations or leverage invalidates it.
- After a valid current calculation, before access is granted:
  - Show the derived band and one-line explanation immediately.
  - Keep the personalized numeric score masked.
  - Do not place that score in the DOM, a data attribute, a title, an aria attribute, the live region, or the explanation.
  - Show a calculator-specific email form explaining that signup reveals the number.
- Submit calculator emails to `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`. Trim the email. If the trimmed email is empty, do not send a request and leave controls enabled.
- Treat a network failure, non-JSON response, non-2xx response, or falsy `success` as signup failure and keep the numeric score hidden.
- If signup succeeds and `needsVerification` is truthy, show a calculator-specific verification-code form and do not reveal the number.
- If signup succeeds and `needsVerification` is not truthy, grant access and reveal the numeric score immediately.
- Submit verification as `POST /verifyEmailCode` with exactly `{ username, code }`, where `username` is the calculator email stored in memory. Trim the code. If the trimmed code is empty, do not send a request and leave controls enabled. Do not include a list field.
- Reveal the number after verification only when the response is 2xx, the JSON has truthy `success`, and a current successful calculation is still valid. Verification failure, network failure, non-JSON response, or a stale cleared calculation keeps the number hidden.
- Insert API `message` values with `textContent` only when they are strings. Otherwise use a generic fallback. The live region must not contain the numeric score until access is granted.
- Keep calculator form state, pending email, status messages, verification state, and access state independent from the existing mailing-list forms.
- While a signup or verification request is pending, disable the calculator controls and both calculator submit buttons.
- When that request settles, re-enable every visible calculator control. This includes signup failure, verification failure, a signup that needs verification, and a response that grants access. An empty-input return that does not send a request also leaves controls enabled. Do not leave a visible control disabled after the request settles.
- Once access is granted during the page session, hide the calculator email and verification forms and allow recalculation without another signup. Keep allocations, access, and results in memory only.
- If allocations or leverage change before access is granted, clear the current band, explanation, and any pending score. If signup has not succeeded, hide the calculator email form until the next successful Calculate. Do not reveal a cleared result if verification completes first.
- If signup already succeeded and only verification remains, an input change does not require a second signup and the verification form stays available. Verification reveals a number only after the visitor calculates again and that result is still current.
- After access has been granted, input changes do not revoke access. Clear the visible numeric score, band, and explanation immediately, and show the new number only after the next successful Calculate.
- Add `<script type="application/json" id="exposure-calculator-context">null</script>` to `public/index.html`.
- Update `server.js` so an available cached SSR event replaces that placeholder. Preserve every existing SSR replacement. When there is no cached event, leave the placeholder as null and preserve today's early static fallback. Calculator projection must not throw; a malformed event still server-renders the existing score panel.
- Serialize a projection with only these rules:
  - Include `final_score` only when it is a finite number.
  - Include `schema_version` only when it is a string.
  - If `asset_triggers` is not an array, serialize `asset_triggers` as `[]`.
  - Otherwise include one object per entry that is a non-null object, in order, shaped as `{ asset, utility_score }`. Copy `asset` only when it is a string; otherwise use `null`. Copy `utility_score` only when it is a finite number; otherwise use `null`.
- Escape JSON embedded in HTML by replacing `&` with `\u0026`, `<` with `\u003c`, `>` with `\u003e`, U+2028 with `\u2028`, and U+2029 with `\u2029`, so values cannot terminate the script element or inject markup.
- The calculator reads the projection into memory once. When the JSON placeholder is null, use the event from the page's existing `loadStressScore()` path once it arrives. Do not start a second financial-stress fetch. Do not rewrite the script element on later updates.
- Every call to `renderEventIntoPage(event)` with a non-null object replaces the in-memory calculator context with that event. Do not compare timestamps. A null or non-object argument leaves the calculator context unchanged and preserves the existing main-panel null behavior.
- If the current calculation is still valid for the current controls when context is replaced, recompute it with `computePersonalExposure` without another signup or fetch. If access is granted, update the visible number; otherwise update only the band and explanation. If recomputation is unavailable, clear the score and show the unavailable message without revoking access. Do not recalculate a missing or invalidated calculation merely because context was replaced.
- Do not move focus when recalculation or an event refresh updates the number. After the signup or verification response that first grants access, move focus to the result element. Make that element programmatically focusable with `tabindex="-1"` and do not add it to the tab order.
- Do not change the existing cache TTL.
- Disable calculation with a clear temporary/unavailable message when required event data is absent, while leaving the rest of the page functional.
- Style the section consistently with existing panels. At `max-width: 480px`, stack its controls in one column.
- Use an `aria-live="polite"` region for validation, signup, verification, and reveal status.

### Acceptance Criteria

- Visitors can configure and calculate an allocation using keyboard or pointer controls on desktop and mobile layouts.
- The default 100/0/0/0 allocation is valid, and only the listed 10-point choices are offered.
- Invalid totals and unavailable upstream data produce clear messages without breaking the page.
- The band and explanation are visible after calculation, while the numeric score is absent from the DOM until the required signup flow succeeds.
- Calculator signup uses exactly `liquiditywatch-exposure-calculator`; the existing signup still uses `financial_stress_alerts`.
- Verification uses exactly `{ username, code }`.
- A missing `needsVerification` field on an otherwise successful signup reveals the number; a truthy value does not.
- Verification-required users cannot reveal the number before successful code verification.
- Signup or verification failures do not reveal the number, and visible calculator controls are enabled again after the request settles.
- Changing inputs before access clears the unrevealed result and hides a not-yet-submitted email form. A late verification cannot reveal a stale score.
- After access is granted, changing inputs clears the visible number until the next successful Calculate and does not require another signup.
- Successful users can recalculate during the same page session without another email submission.
- A later non-null event rendered by the existing refresh updates a still-current calculation without an additional request to `/api/financial-stress-monitor`, and does not resurrect an invalidated calculation.
- Calculator actions cause no additional request to `/api/financial-stress-monitor`.
- SSR-provided calculator context contains only the projected fields, is safely serialized, does not throw on malformed triggers, and is replaced in memory when the client renders a new event.
- The main score, optional panels, newsletter content, and existing mailing-list flow retain their behavior.
- The focused tests and configured verification checks pass.
```

Raw Response:

```text
I'll review the draft against the repo's actual structure and the contract it claims to follow, looking for contradictions that would make the spec unsafe to implement.---STATUS---
status: revise
reason: The draft conflicts with itself on control re-enable, string dropdown values versus rejected strings, non-throwing lookup, band-file locations, and when a cleared result may reappear.

```spec
# Personal Liquidity Exposure Calculator

## Overview

Add a deterministic Personal Liquidity Exposure calculator to the existing LiquidityWatch page. Visitors select a coarse portfolio allocation and leverage status; the calculator combines those inputs with the already-published financial-stress event.

The calculator, methodology, exposure band, and explanation remain public. The personalized numeric score is revealed only after successful mailing-list signup and, when required, email verification. This is a free lead-generation feature using the existing signup endpoints, with no payment, LLM call, upstream scoring change, or separate data-fetching path.

The debate transcript at `docs/debates/2026-09-22-liquidity-exposure-calculator/transcript.md` is not an input. Do not implement its ungated score, scenario delta, saved mix, alerts, or paid threshold.

## Goals

- Calculate a deterministic 0–100 personal exposure score from the current event and visitor-supplied allocations.
- Reuse the six existing LiquidityWatch bands and render-helper conventions.
- Support both legacy and v1 `asset_triggers[].utility_score` scales.
- Attribute conversions with the list value `liquiditywatch-exposure-calculator`.
- Reveal the numeric score only after successful signup or verification; the band and explanation stay public.
- Reuse the event already obtained by SSR or the existing page refresh.
- Preserve optional-field resilience and the no-build architecture.
- Add focused automated coverage for the calculation and validation rules.

## Non-Goals

- Changing the upstream financial-stress pipeline or its published score.
- Adding API fields, calculator endpoints, LLM calls, ingestion, payment, alerts, saved portfolios, history, sharing, or analytics.
- Treating the personal exposure score as investment advice or as a replacement for `event.final_score`.
- Persisting portfolio allocations or the calculated result.
- Refactoring the existing general mailing-list flow.
- Modifying environment files.
- Changing band ranges, labels, or colors, or adding a personal-exposure band table.
- Ungating the numeric score, showing a next-regime scenario delta, or following the debate transcript.

## Existing Files

- `CLAUDE.md` defines the presentation-only architecture and currently prohibits all local scoring. Its band-sync rule still names `public/index.html`, which is stale.
- `docs/MODEL.md` defines score semantics and the canonical six regime bands. Its runtime band-table sentences, including §8 open item 1, are stale: `GAUGE_BANDS` lives in `public/render.js`, not `public/index.html`. §8 open item 2 still says this repo computes nothing.
- `docs/API-CONTRACT.md` defines the optional event fields, legacy/v1 scales, and mailing-list endpoints. `asset_triggers[].asset` is the asset identifier. Signup is `POST /api/mailing-list/signup` with `{ email, list }` and a response of `{ success, needsVerification, message }`. Verification is `POST /verifyEmailCode` with `{ username, code }` and a response of `{ success, message }`. The contract does not yet name the list value `financial_stress_alerts`; the live general form in `public/index.html` does.
- `public/render.js` contains shared browser/SSR render helpers, `GAUGE_BANDS`, `gaugeBand`, and `RENDER_EXPORTS`. Top-level declarations are globals in the classic browser script and CommonJS exports in Node. `scaledUnitPercent` is only a display helper: it treats any present truthy `schema_version` as v1 and does not reject out-of-range values. The calculator must not use it.
- `public/index.html` contains the page, inline styles and behavior, live event refresh, and the existing mailing-list forms. It already loads `/render.js` before its inline script. The macro score lives in `section#stress-score`. The existing narrow layout breakpoint is `max-width: 480px`. `loadStressScore()` always fetches once on load and calls `renderEventIntoPage`.
- `server.js` fetches and caches the current event for SSR in `renderIndexHtml`. A null event returns the template unchanged. A throw falls back to the static file. It does not proxy mailing-list signup.
- `package.json` provides the existing no-build Node application.

## Shared Constraints

- Keep the entire implementation within 30 changed files and 3,200 changed lines.
- Do not modify `.env*`.
- Do not add a framework, bundler, transpiler, database, dependency, payment flow, or LLM call.
- The upstream financial-stress event remains authoritative; the personal score is a clearly labeled, consumer-derived presentation metric.
- All upstream fields remain optional. Calculator unavailability must not affect the main score panel or other page content.
- Do not fetch the financial-stress endpoint in response to calculator calculation, signup, or verification. Do not add a second financial-stress fetch; the existing `loadStressScore()` call remains the only client fetch.
- Escape or safely serialize all data inserted into HTML. Set calculator band, explanation, score, and status text with `textContent`, never `innerHTML`.
- Portfolio values and results remain in page memory only.
- Use semantic labels, keyboard-operable controls, visible focus states, accessible status messaging, and responsive styling.
- Keep the existing general mailing-list signup and its `financial_stress_alerts` attribution unchanged.
- Display an informational/not-investment-advice qualification with the calculator.
- Use `codex:gpt-5.6-sol` for all phases.
- Do not put the email address, allocations, or personal score in a URL, cookie, local storage, session storage, `console` output, or server log. The signup and verification request bodies contain only the fields specified below and do not include the score or allocations.

## Phase 1 - Define Calculator Semantics and Architectural Exception

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=CLAUDE.md -->
<!-- pilot:touches=docs/MODEL.md -->
<!-- pilot:touches=docs/API-CONTRACT.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js -->

### Requirements

- Amend `CLAUDE.md` with a narrow exception permitting deterministic, browser-visible personalization derived solely from an already-published event and visitor inputs.
- State that this exception does not permit reproducing or modifying the upstream financial-stress model, ingesting new data, making LLM calls, or persisting personal inputs.
- In the same `CLAUDE.md` edit, change the band-sync location from `public/index.html` to `public/render.js`. Do not change band ranges, labels, colors, or the `public/about.html` obligation.
- In `docs/MODEL.md` §0, replace the unqualified "computes nothing" claim with the same narrow exception so it does not contradict the new section.
- Qualify `docs/MODEL.md` §8 open item 2 so it does not still require an unqualified "compute nothing" rule.
- Correct every stale `GAUGE_BANDS` location note in `docs/MODEL.md`, including the regime-band paragraph and §8 open item 1, to `public/render.js` without changing any band range, label, or meaning. Do not edit `public/about.html`. Do not renumber existing model sections.
- Add a `## Personal Liquidity Exposure` section to `docs/MODEL.md` immediately after the §1 regime-band subsection. It distinguishes the derived personal metric from `event.final_score`.
- Define allocation inputs as percentages for:
  - Equities / cash-like assets (`equities`, share `t`).
  - BTC (`btc`, share `b`).
  - ETH (`eth`, share `e`).
  - XRP (`xrp`, share `x`).
- Require each allocation to be a finite number from 0 through 100, and require the four allocations to total exactly 100. Missing keys are invalid. Do not coerce strings, repair totals, default missing keys to zero, or treat out-of-range values as zero.
- Define schema handling from the API contract:
  - Absent, null, or `""` `schema_version` has major version 0.
  - A version string is accepted only when it matches `/^(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*))*$/` with no trimming. Its major version is the integer before the first dot, or the whole string when it contains only digits. `"1.0"` and `"1"` are major 1. `"0.0"` and `"0"` are major 0.
  - Leading zeros (`"01"`, `"1.00"`), whitespace, prerelease suffixes, and every non-string value make the calculator unavailable.
  - Major version 1 or later uses the v1 scale. Major version 0 uses the legacy scale.
  - Schema is validated even when every crypto allocation is zero.
- Define utility normalization:
  - v1: `utility_score` must be a finite number from 0.0 through 1.0 and is used unchanged.
  - Legacy: `utility_score` must be a finite number from 0 through 100 and is divided by 100.
  - Reject booleans, strings, nulls, nonfinite numbers, and out-of-range values. Never infer the scale from the magnitude.
- Look up each crypto utility on `asset_triggers[].asset` by trimming and case-insensitive exact equality with `BTC`, `ETH`, or `XRP`. Do not use substring or alias matching. If several entries match, use the first in array order.
- A null or non-object event, a missing `asset_triggers`, or a non-array `asset_triggers` contributes no matches and does not throw. Skip entries that are not non-null objects and skip entries whose `asset` is not a string.
- Define shares `t`, `b`, `e`, and `x` as each allocation divided by 100, with no intermediate rounding.
- Define normalized utilities as `uBTC`, `uETH`, and `uXRP`.
- Define the formula exactly as:
  - `weightedFragility = t + b * (2 - uBTC) + e * (2 - uETH) + x * (2 - uXRP)`.
  - `leverageMultiplier = 1.15` when leverage/margin is selected, otherwise `1`.
  - `raw = final_score * weightedFragility * leverageMultiplier`.
  - `personalExposure = Math.round(clamp(raw, 0, 100))`, where clamp is inclusive and happens before rounding. `Math.round` is nearest integer; nonnegative halves round away from zero.
- Explain that a utility of 1 gives that crypto asset the same weight as equities/cash-like, while a utility of 0 doubles its weight. Leverage multiplies the combined result by 1.15. High utility therefore removes only the additional crypto-plumbing penalty; it never makes crypto weigh less than equities/cash-like.
- Require `event.final_score` to be a finite number from 0 through 100. Reject values outside that range rather than clamping them. Numeric non-integers inside the range are accepted. A null or non-object event has a missing `final_score`.
- Require a valid matching utility only for a crypto asset whose allocation is nonzero. Ignore missing or invalid utilities for a zero allocation.
- Map the rounded result through the existing `gaugeBand` helper and the six canonical bands. Do not define a second band table. Where band edges overlap, the existing first match wins: 15 is Accommodative, 35 is Mild Watchfulness, 55 is Contained Tension, 75 is Restrictive Policy, and 90 is Policy-Forcing Danger Zone.
- Document that these band labels are reused as a severity vocabulary for personal exposure under current published conditions. They are not a statement that policy is in that regime and not a policy-regime prediction.
- Pin these worked examples in the model section:
  - Score 40, allocations 100/0/0/0, unleveraged → raw 40 → 40.
  - Score 40, allocations 40/30/20/10, utilities 0.80/0.50/0.20, unleveraged → weighted fragility 1.24 → raw 49.6 → 50. The same utilities encoded as legacy 80/50/20 under major version 0 produce 50.
  - The same mixed inputs with leverage → raw 57.04 → 57.
  - Score 1, allocation 100% BTC, utility 0.5, unleveraged → raw 1.5 → 2.
  - Score 100, allocation 100% BTC, utility 0, leveraged → raw 230 → clamp 100 → 100.
- Update `docs/API-CONTRACT.md` to document this as a consumer-derived value, not a new wire field and not a new endpoint.
- Document the existing general mailing-list value as `financial_stress_alerts`, separate from the calculator.
- Document calculator signup as `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`.
- Document verification as the existing `POST /verifyEmailCode` body `{ username, code }`, where `username` is the submitted email. The verification body has no list field.
- Preserve the contract rule that all event fields are optional and specify that insufficient inputs make only the calculator unavailable.

### Acceptance Criteria

- The architecture documentation expressly permits this bounded derived calculation without weakening the upstream contract boundary.
- `CLAUDE.md` and `docs/MODEL.md` do not contradict each other about local computation or about where `GAUGE_BANDS` lives.
- The formula, worked examples, validation, normalization, asset matching, leverage behavior, band reuse, and missing-data behavior are unambiguous.
- `docs/API-CONTRACT.md` adds no required event field or new endpoint.
- `financial_stress_alerts` and `liquiditywatch-exposure-calculator` are documented as different list values.
- The configured verification command succeeds.

## Phase 2 - Implement and Test Pure Exposure Helpers

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/render.js -->
<!-- pilot:touches=test/exposure-calculator.test.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add a top-level function `computePersonalExposure(event, allocations, leveraged)` to `public/render.js`, plus the pure helpers it needs. `allocations` is `{ equities, btc, eth, xrp }`.
- Keep the helpers DOM-independent and cover:
  - Allocation validation.
  - Asset-trigger lookup using trimmed, case-insensitive exact `asset` matches for BTC, ETH, and XRP.
  - Contract-aware utility normalization, implemented separately from `scaledUnitPercent`.
  - Personal exposure calculation.
  - Reusing `gaugeBand` for the derived result.
  - Producing a safe result object.
- Keep helpers compatible with both direct browser loading and CommonJS use. Define `computePersonalExposure` so the classic script exposes it as a global, and add it to `RENDER_EXPORTS`.
- Validate in this order and return the first failure: `allocations`, `leverage`, `schema`, `final_score`, `utility`.
- Return a structured unavailable result, and do not throw, for invalid allocations, a non-boolean leverage flag, an unparsable `schema_version`, a null or non-object event, a missing or out-of-range `final_score`, malformed `asset_triggers`, or missing/invalid utility data required by a nonzero allocation.
- Use this result shape:
  - Success: `{ ok: true, score, bandLabel, bandColor, explanation }`.
  - Unavailable: `{ ok: false, reason, message }`, where `reason` is `allocations`, `leverage`, `schema`, `final_score`, or `utility`, and `message` is a non-empty string that contains no digit characters.
- `score` is the rounded integer. `bandLabel` and `bandColor` come from `gaugeBand(score)`. Do not add another band table.
- `explanation` is one concise sentence generated from the result. It names the band, says whether any allocated crypto utility raised exposure above the equities/cash-like baseline or all allocated crypto utilities matched it, and says whether leverage was applied. For a zero crypto allocation, say that utility does not change the result. It contains no digit characters and does not include the numeric score.
- Do not require utility data for crypto assets with zero allocation.
- After validating all source inputs, require the computed `weightedFragility`, multiplier, and `raw` product to be finite. If that defensive check fails, return `{ ok: false, reason: "final_score", message }` and do not throw. Clamp `raw` inclusively to 0–100 before `Math.round`, even when valid inputs produce a value above 100. Do not clamp or silently repair invalid allocations, invalid leverage, invalid schema versions, or invalid upstream values.
- Keep calculation helpers free of fetches, storage, timers, global mutable state, and HTML/DOM access.
- Add `node:test` coverage without introducing a test dependency. Require `computePersonalExposure` and `gaugeBand` from `public/render.js`.
- Cover at least:
  - All five worked examples from Phase 1, including identical legacy and v1 results.
  - A 100% equities/cash-like allocation, including one with a non-string `schema_version`, which is unavailable.
  - Leveraged versus unleveraged results.
  - Raw-result clamping at 100 and rejection of `final_score` below 0 or above 100.
  - Case-insensitive exact asset lookup, trimming, and first-match precedence.
  - Rejection of substring matches such as `WBTC`.
  - Non-array `asset_triggers`, non-object entries, and non-string `asset` values do not throw.
  - A null event with valid allocations and a boolean leverage flag returns `reason: "final_score"` and does not throw.
  - Allocation totals other than 100.
  - Negative, over-100, nonnumeric, string, and nonfinite allocations, plus a missing allocation key.
  - Missing or invalid `final_score`, including nonfinite values.
  - Missing or invalid utility for an allocated crypto asset, including a boolean, and a legacy value interpreted only on the legacy scale.
  - Missing or invalid utility for an unallocated crypto asset.
  - Absent, null, and `""` schema as legacy; `"0"` and `"0.0"` as legacy; `"1"` and `"1.0"` as v1.
  - Rejection of `"01"`, `"1.00"`, `" 1.0"`, `"1.0.0-beta"`, and a non-string schema.
  - A non-boolean leverage flag as unavailable.
  - Reuse of the canonical `gaugeBand` label at 0, 15, 35, 55, 75, 90, and 100, with the first matching band winning on each overlap.
  - An explanation and unavailable message that contain no digit characters.

### Acceptance Criteria

- `computePersonalExposure(event, allocations, leveraged)` deterministically produces the documented score.
- Legacy and v1 payloads representing the same utilities produce the same result.
- Invalid or incomplete inputs, including a null event and malformed triggers, return an unavailable result and never throw during normal use.
- Valid inputs whose raw result exceeds 100 are clamped to 100 before rounding.
- No second band table is introduced.
- `public/render.js` remains valid in Node and the browser.
- All focused tests and the configured syntax checks pass.

## Phase 3 - Add the Gated Calculator Experience

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/index.html -->
<!-- pilot:touches=server.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:read=public/render.js -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add a Personal Liquidity Exposure section to `public/index.html` immediately after `section#stress-score` and before the subscore section.
- The page must call the global `computePersonalExposure`. Do not reimplement the formula in the page script.
- Include labeled dropdowns for equities/cash-like, BTC, ETH, and XRP. Each offers 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, and 100. Default to 100, 0, 0, and 0. Include an unchecked leverage/margin checkbox and a Calculate button.
- Convert a selected option to a number only when its value matches `/^(?:0|100|[1-9]0)$/`. Pass those numbers and the boolean `checked` value to `computePersonalExposure`. Do not pass raw DOM strings.
- Give every calculator control and status element an id beginning with `exposure-`. Do not reuse `signup-form`, `signup-email`, `signup-status`, `signup-submit`, `verify-form`, `verify-code`, or `verify-submit`.
- Include public explanatory copy describing:
  - What the calculator measures.
  - The deterministic formula at a readable level, including the 1.15 leverage multiplier.
  - That current macro stress sets the baseline, crypto utility can only add a plumbing penalty, and utility of 1 matches equities/cash-like.
  - That the reused band label describes personal-exposure severity and is not a policy-regime call.
  - That the output is informational and not investment advice.
- Validate that allocations total exactly 100 and announce actionable errors without opening the email gate.
- A current calculation is the last helper result whose controls have not changed since Calculate was pressed. Changing allocations or leverage invalidates it.
- After a valid current calculation, before access is granted:
  - Show the derived band and one-line explanation immediately.
  - Keep the personalized numeric score masked.
  - Do not place that score in the DOM, a data attribute, a title, an aria attribute, the live region, or the explanation.
  - Show a calculator-specific email form explaining that signup reveals the number.
- Submit calculator emails to `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`. Trim the email. If the trimmed email is empty, do not send a request and leave controls enabled.
- Treat a network failure, non-JSON response, non-2xx response, or falsy `success` as signup failure and keep the numeric score hidden.
- If signup succeeds and `needsVerification` is truthy, show a calculator-specific verification-code form and do not reveal the number.
- If signup succeeds and `needsVerification` is not truthy, grant access and reveal the numeric score immediately.
- Submit verification as `POST /verifyEmailCode` with exactly `{ username, code }`, where `username` is the calculator email stored in memory. Trim the code. If the trimmed code is empty, do not send a request and leave controls enabled. Do not include a list field.
- Reveal the number after verification only when the response is 2xx, the JSON has truthy `success`, and a current successful calculation is still valid. Verification failure, network failure, non-JSON response, or a stale cleared calculation keeps the number hidden.
- Insert API `message` values with `textContent` only when they are strings. Otherwise use a generic fallback. The live region must not contain the numeric score until access is granted.
- Keep calculator form state, pending email, status messages, verification state, and access state independent from the existing mailing-list forms.
- While a signup or verification request is pending, disable the calculator controls and both calculator submit buttons.
- When that request settles, re-enable every visible calculator control. This includes signup failure, verification failure, a signup that needs verification, and a response that grants access. An empty-input return that does not send a request also leaves controls enabled. Do not leave a visible control disabled after the request settles.
- Once access is granted during the page session, hide the calculator email and verification forms and allow recalculation without another signup. Keep allocations, access, and results in memory only.
- If allocations or leverage change before access is granted, clear the current band, explanation, and any pending score. If signup has not succeeded, hide the calculator email form until the next successful Calculate. Do not reveal a cleared result if verification completes first.
- If signup already succeeded and only verification remains, an input change does not require a second signup and the verification form stays available. Verification reveals a number only after the visitor calculates again and that result is still current.
- After access has been granted, input changes do not revoke access. Clear the visible numeric score, band, and explanation immediately, and show the new number only after the next successful Calculate.
- Add `<script type="application/json" id="exposure-calculator-context">null</script>` to `public/index.html`.
- Update `server.js` so an available cached SSR event replaces that placeholder. Preserve every existing SSR replacement. When there is no cached event, leave the placeholder as null and preserve today's early static fallback. Calculator projection must not throw; a malformed event still server-renders the existing score panel.
- Serialize a projection with only these rules:
  - Include `final_score` only when it is a finite number.
  - Include `schema_version` only when it is a string.
  - If `asset_triggers` is not an array, serialize `asset_triggers` as `[]`.
  - Otherwise include one object per entry that is a non-null object, in order, shaped as `{ asset, utility_score }`. Copy `asset` only when it is a string; otherwise use `null`. Copy `utility_score` only when it is a finite number; otherwise use `null`.
- Escape JSON embedded in HTML by replacing `&` with `\u0026`, `<` with `\u003c`, `>` with `\u003e`, U+2028 with `\u2028`, and U+2029 with `\u2029`, so values cannot terminate the script element or inject markup.
- The calculator reads the projection into memory once. When the JSON placeholder is null, use the event from the page's existing `loadStressScore()` path once it arrives. Do not start a second financial-stress fetch. Do not rewrite the script element on later updates.
- Every call to `renderEventIntoPage(event)` with a non-null object replaces the in-memory calculator context with that event. Do not compare timestamps. A null or non-object argument leaves the calculator context unchanged and preserves the existing main-panel null behavior.
- If the current calculation is still valid for the current controls when context is replaced, recompute it with `computePersonalExposure` without another signup or fetch. If access is granted, update the visible number; otherwise update only the band and explanation. If recomputation is unavailable, clear the score and show the unavailable message without revoking access. Do not recalculate a missing or invalidated calculation merely because context was replaced.
- Do not move focus when recalculation or an event refresh updates the number. After the signup or verification response that first grants access, move focus to the result element. Make that element programmatically focusable with `tabindex="-1"` and do not add it to the tab order.
- Do not change the existing cache TTL.
- Disable calculation with a clear temporary/unavailable message when required event data is absent, while leaving the rest of the page functional.
- Style the section consistently with existing panels. At `max-width: 480px`, stack its controls in one column.
- Use an `aria-live="polite"` region for validation, signup, verification, and reveal status.

### Acceptance Criteria

- Visitors can configure and calculate an allocation using keyboard or pointer controls on desktop and mobile layouts.
- The default 100/0/0/0 allocation is valid, and only the listed 10-point choices are offered.
- Invalid totals and unavailable upstream data produce clear messages without breaking the page.
- The band and explanation are visible after calculation, while the numeric score is absent from the DOM until the required signup flow succeeds.
- Calculator signup uses exactly `liquiditywatch-exposure-calculator`; the existing signup still uses `financial_stress_alerts`.
- Verification uses exactly `{ username, code }`.
- A missing `needsVerification` field on an otherwise successful signup reveals the number; a truthy value does not.
- Verification-required users cannot reveal the number before successful code verification.
- Signup or verification failures do not reveal the number, and visible calculator controls are enabled again after the request settles.
- Changing inputs before access clears the unrevealed result and hides a not-yet-submitted email form. A late verification cannot reveal a stale score.
- After access is granted, changing inputs clears the visible number until the next successful Calculate and does not require another signup.
- Successful users can recalculate during the same page session without another email submission.
- A later non-null event rendered by the existing refresh updates a still-current calculation without an additional request to `/api/financial-stress-monitor`, and does not resurrect an invalidated calculation.
- Calculator actions cause no additional request to `/api/financial-stress-monitor`.
- SSR-provided calculator context contains only the projected fields, is safely serialized, does not throw on malformed triggers, and is replaced in memory when the client renders a new event.
- The main score, optional panels, newsletter content, and existing mailing-list flow retain their behavior.
- The focused tests and configured verification checks pass.
```
```

### Reviewer 2: claude

Status: approved

Reason: Formula, worked examples, validation order, and gating/reveal logic are internally consistent and unambiguous across all three phases.

Raw Response:

```text
---STATUS---
status: approved
reason: Formula, worked examples, validation order, and gating/reveal logic are internally consistent and unambiguous across all three phases.
```

### Reviewer 3: codex

Status: revise

Reason: The SSR projection drops invalid non-string schema versions, incorrectly converting them into valid legacy inputs and potentially producing a score.

Replacement Spec:

```spec
# Personal Liquidity Exposure Calculator

## Overview

Add a deterministic Personal Liquidity Exposure calculator to the existing LiquidityWatch page. Visitors select a coarse portfolio allocation and leverage status; the calculator combines those inputs with the already-published financial-stress event.

The calculator, methodology, exposure band, and explanation remain public. The personalized numeric score is revealed only after successful mailing-list signup and, when required, email verification. This is a free lead-generation feature using the existing signup endpoints, with no payment, LLM call, upstream scoring change, or separate data-fetching path.

The debate transcript at `docs/debates/2026-09-22-liquidity-exposure-calculator/transcript.md` is not an input. Do not implement its ungated score, scenario delta, saved mix, alerts, or paid threshold.

## Goals

- Calculate a deterministic 0–100 personal exposure score from the current event and visitor-supplied allocations.
- Reuse the six existing LiquidityWatch bands and render-helper conventions.
- Support both legacy and v1 `asset_triggers[].utility_score` scales.
- Attribute conversions with the list value `liquiditywatch-exposure-calculator`.
- Reveal the numeric score only after successful signup or verification; the band and explanation stay public.
- Reuse the event already obtained by SSR or the existing page refresh.
- Preserve optional-field resilience and the no-build architecture.
- Add focused automated coverage for the calculation and validation rules.

## Non-Goals

- Changing the upstream financial-stress pipeline or its published score.
- Adding API fields, calculator endpoints, LLM calls, ingestion, payment, alerts, saved portfolios, history, sharing, or analytics.
- Treating the personal exposure score as investment advice or as a replacement for `event.final_score`.
- Persisting portfolio allocations or the calculated result.
- Refactoring the existing general mailing-list flow.
- Modifying environment files.
- Changing band ranges, labels, or colors, or adding a personal-exposure band table.
- Ungating the numeric score, showing a next-regime scenario delta, or following the debate transcript.

## Existing Files

- `CLAUDE.md` defines the presentation-only architecture and currently prohibits all local scoring. Its band-sync rule still names `public/index.html`, which is stale.
- `docs/MODEL.md` defines score semantics and the canonical six regime bands. Its runtime band-table sentences, including §8 open item 1, are stale: `GAUGE_BANDS` lives in `public/render.js`, not `public/index.html`. §8 open item 2 still says this repo computes nothing.
- `docs/API-CONTRACT.md` defines the optional event fields, legacy/v1 scales, and mailing-list endpoints. `asset_triggers[].asset` is the asset identifier. Signup is `POST /api/mailing-list/signup` with `{ email, list }` and a response of `{ success, needsVerification, message }`. Verification is `POST /verifyEmailCode` with `{ username, code }` and a response of `{ success, message }`. The contract does not yet name the list value `financial_stress_alerts`; the live general form in `public/index.html` does.
- `public/render.js` contains shared browser/SSR render helpers, `GAUGE_BANDS`, `gaugeBand`, and `RENDER_EXPORTS`. Top-level declarations are globals in the classic browser script and CommonJS exports in Node. `scaledUnitPercent` is only a display helper: it treats any present truthy `schema_version` as v1 and does not reject out-of-range values. The calculator must not use it.
- `public/index.html` contains the page, inline styles and behavior, live event refresh, and the existing mailing-list forms. It already loads `/render.js` before its inline script. The macro score lives in `section#stress-score`. The existing narrow layout breakpoint is `max-width: 480px`. `loadStressScore()` always fetches once on load and calls `renderEventIntoPage`.
- `server.js` fetches and caches the current event for SSR in `renderIndexHtml`. A null event returns the template unchanged. A throw falls back to the static file. It does not proxy mailing-list signup.
- `package.json` provides the existing no-build Node application.

## Shared Constraints

- Keep the entire implementation within 30 changed files and 3,200 changed lines.
- Do not modify `.env*`.
- Do not add a framework, bundler, transpiler, database, dependency, payment flow, or LLM call.
- The upstream financial-stress event remains authoritative; the personal score is a clearly labeled, consumer-derived presentation metric.
- All upstream fields remain optional. Calculator unavailability must not affect the main score panel or other page content.
- Do not fetch the financial-stress endpoint in response to calculator calculation, signup, or verification. Do not add a second financial-stress fetch; the existing `loadStressScore()` call remains the only client fetch.
- Escape or safely serialize all data inserted into HTML. Set calculator band, explanation, score, and status text with `textContent`, never `innerHTML`.
- Portfolio values and results remain in page memory only.
- Use semantic labels, keyboard-operable controls, visible focus states, accessible status messaging, and responsive styling.
- Keep the existing general mailing-list signup and its `financial_stress_alerts` attribution unchanged.
- Display an informational/not-investment-advice qualification with the calculator.
- Use `codex:gpt-5.6-sol` for all phases.
- Do not put the email address, allocations, or personal score in a URL, cookie, local storage, session storage, `console` output, or server log. The signup and verification request bodies contain only the fields specified below and do not include the score or allocations.

## Phase 1 - Define Calculator Semantics and Architectural Exception

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=CLAUDE.md -->
<!-- pilot:touches=docs/MODEL.md -->
<!-- pilot:touches=docs/API-CONTRACT.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js -->

### Requirements

- Amend `CLAUDE.md` with a narrow exception permitting deterministic, browser-visible personalization derived solely from an already-published event and visitor inputs.
- State that this exception does not permit reproducing or modifying the upstream financial-stress model, ingesting new data, making LLM calls, or persisting personal inputs.
- In the same `CLAUDE.md` edit, change the band-sync location from `public/index.html` to `public/render.js`. Do not change band ranges, labels, colors, or the `public/about.html` obligation.
- In `docs/MODEL.md` §0, replace the unqualified "computes nothing" claim with the same narrow exception so it does not contradict the new section.
- Qualify `docs/MODEL.md` §8 open item 2 so it does not still require an unqualified "compute nothing" rule.
- Correct every stale `GAUGE_BANDS` location note in `docs/MODEL.md`, including the regime-band paragraph and §8 open item 1, to `public/render.js` without changing any band range, label, or meaning. Do not edit `public/about.html`. Do not renumber existing model sections.
- Add a `## Personal Liquidity Exposure` section to `docs/MODEL.md` immediately after the §1 regime-band subsection. It distinguishes the derived personal metric from `event.final_score`.
- Define allocation inputs as percentages for:
  - Equities / cash-like assets (`equities`, share `t`).
  - BTC (`btc`, share `b`).
  - ETH (`eth`, share `e`).
  - XRP (`xrp`, share `x`).
- Require each allocation to be a finite number from 0 through 100, and require the four allocations to total exactly 100. Missing keys are invalid. Do not coerce strings, repair totals, default missing keys to zero, or treat out-of-range values as zero.
- Define schema handling from the API contract:
  - Absent, null, or `""` `schema_version` has major version 0.
  - A version string is accepted only when it matches `/^(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*))*$/` with no trimming. Its major version is the integer before the first dot, or the whole string when it contains only digits. `"1.0"` and `"1"` are major 1. `"0.0"` and `"0"` are major 0.
  - Leading zeros (`"01"`, `"1.00"`), whitespace, prerelease suffixes, and every non-string value other than null make the calculator unavailable.
  - Major version 1 or later uses the v1 scale. Major version 0 uses the legacy scale.
  - Schema is validated even when every crypto allocation is zero.
- Define utility normalization:
  - v1: `utility_score` must be a finite number from 0.0 through 1.0 and is used unchanged.
  - Legacy: `utility_score` must be a finite number from 0 through 100 and is divided by 100.
  - Reject booleans, strings, nulls, nonfinite numbers, and out-of-range values. Never infer the scale from the magnitude.
- Look up each crypto utility on `asset_triggers[].asset` by trimming and case-insensitive exact equality with `BTC`, `ETH`, or `XRP`. Do not use substring or alias matching. If several entries match, use the first in array order.
- A null or non-object event, a missing `asset_triggers`, or a non-array `asset_triggers` contributes no matches and does not throw. Skip entries that are not non-null objects and skip entries whose `asset` is not a string.
- Define shares `t`, `b`, `e`, and `x` as each allocation divided by 100, with no intermediate rounding.
- Define normalized utilities as `uBTC`, `uETH`, and `uXRP`.
- Define the formula exactly as:
  - `weightedFragility = t + b * (2 - uBTC) + e * (2 - uETH) + x * (2 - uXRP)`.
  - `leverageMultiplier = 1.15` when leverage/margin is selected, otherwise `1`.
  - `raw = final_score * weightedFragility * leverageMultiplier`.
  - `personalExposure = Math.round(clamp(raw, 0, 100))`, where clamp is inclusive and happens before rounding. `Math.round` is nearest integer; nonnegative halves round away from zero.
- Explain that a utility of 1 gives that crypto asset the same weight as equities/cash-like, while a utility of 0 doubles its weight. Leverage multiplies the combined result by 1.15. High utility therefore removes only the additional crypto-plumbing penalty; it never makes crypto weigh less than equities/cash-like.
- Require `event.final_score` to be a finite number from 0 through 100. Reject values outside that range rather than clamping them. Numeric non-integers inside the range are accepted. A null or non-object event has a missing `final_score`.
- Require a valid matching utility only for a crypto asset whose allocation is nonzero. Ignore missing or invalid utilities for a zero allocation.
- Map the rounded result through the existing `gaugeBand` helper and the six canonical bands. Do not define a second band table. Where band edges overlap, the existing first match wins: 15 is Accommodative, 35 is Mild Watchfulness, 55 is Contained Tension, 75 is Restrictive Policy, and 90 is Policy-Forcing Danger Zone.
- Document that these band labels are reused as a severity vocabulary for personal exposure under current published conditions. They are not a statement that policy is in that regime and not a policy-regime prediction.
- Pin these worked examples in the model section:
  - Score 40, allocations 100/0/0/0, unleveraged → raw 40 → 40.
  - Score 40, allocations 40/30/20/10, utilities 0.80/0.50/0.20, unleveraged → weighted fragility 1.24 → raw 49.6 → 50. The same utilities encoded as legacy 80/50/20 under major version 0 produce 50.
  - The same mixed inputs with leverage → raw 57.04 → 57.
  - Score 1, allocation 100% BTC, utility 0.5, unleveraged → raw 1.5 → 2.
  - Score 100, allocation 100% BTC, utility 0, leveraged → raw 230 → clamp 100 → 100.
- Update `docs/API-CONTRACT.md` to document this as a consumer-derived value, not a new wire field and not a new endpoint.
- Document the existing general mailing-list value as `financial_stress_alerts`, separate from the calculator.
- Document calculator signup as `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`.
- Document verification as the existing `POST /verifyEmailCode` body `{ username, code }`, where `username` is the submitted email. The verification body has no list field.
- Preserve the contract rule that all event fields are optional and specify that insufficient inputs make only the calculator unavailable.

### Acceptance Criteria

- The architecture documentation expressly permits this bounded derived calculation without weakening the upstream contract boundary.
- `CLAUDE.md` and `docs/MODEL.md` do not contradict each other about local computation or about where `GAUGE_BANDS` lives.
- The formula, worked examples, validation, normalization, asset matching, leverage behavior, band reuse, and missing-data behavior are unambiguous.
- `docs/API-CONTRACT.md` adds no required event field or new endpoint.
- `financial_stress_alerts` and `liquiditywatch-exposure-calculator` are documented as different list values.
- The configured verification command succeeds.

## Phase 2 - Implement and Test Pure Exposure Helpers

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/render.js -->
<!-- pilot:touches=test/exposure-calculator.test.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add a top-level function `computePersonalExposure(event, allocations, leveraged)` to `public/render.js`, plus the pure helpers it needs. `allocations` is `{ equities, btc, eth, xrp }`.
- Keep the helpers DOM-independent and cover:
  - Allocation validation.
  - Asset-trigger lookup using trimmed, case-insensitive exact `asset` matches for BTC, ETH, and XRP.
  - Contract-aware utility normalization, implemented separately from `scaledUnitPercent`.
  - Personal exposure calculation.
  - Reusing `gaugeBand` for the derived result.
  - Producing a safe result object.
- Keep helpers compatible with both direct browser loading and CommonJS use. Define `computePersonalExposure` so the classic script exposes it as a global, and add it to `RENDER_EXPORTS`.
- Validate in this order and return the first failure: `allocations`, `leverage`, `schema`, `final_score`, `utility`.
- Return a structured unavailable result, and do not throw, for invalid allocations, a non-boolean leverage flag, an unparsable `schema_version`, a null or non-object event, a missing or out-of-range `final_score`, or missing/invalid utility data required by a nonzero crypto allocation.
- A missing or non-array `asset_triggers` value contributes no matches. It therefore causes a `utility` failure only when a nonzero crypto allocation requires a matching utility; it does not make a zero-crypto allocation unavailable.
- Use this result shape:
  - Success: `{ ok: true, score, bandLabel, bandColor, explanation }`.
  - Unavailable: `{ ok: false, reason, message }`, where `reason` is `allocations`, `leverage`, `schema`, `final_score`, or `utility`, and `message` is a non-empty string that contains no digit characters.
- `score` is the rounded integer. `bandLabel` and `bandColor` come from `gaugeBand(score)`. Do not add another band table.
- `explanation` is one concise sentence generated from the result. It names the band, says whether any allocated crypto utility raised exposure above the equities/cash-like baseline or all allocated crypto utilities matched it, and says whether leverage was applied. For a zero crypto allocation, say that utility does not change the result. It contains no digit characters and does not include the numeric score.
- Do not require utility data for crypto assets with zero allocation.
- After validating all source inputs, require the computed `weightedFragility`, multiplier, and `raw` product to be finite. If that defensive check fails, return `{ ok: false, reason: "final_score", message }` and do not throw. Clamp `raw` inclusively to 0–100 before `Math.round`, even when valid inputs produce a value above 100. Do not clamp or silently repair invalid allocations, invalid leverage, invalid schema versions, or invalid upstream values.
- Keep calculation helpers free of fetches, storage, timers, global mutable state, and HTML/DOM access.
- Add `node:test` coverage without introducing a test dependency. Require `computePersonalExposure` and `gaugeBand` from `public/render.js`.
- Cover at least:
  - All five worked examples from Phase 1, including identical legacy and v1 results.
  - A 100% equities/cash-like allocation, including one with a non-string `schema_version`, which is unavailable.
  - Leveraged versus unleveraged results.
  - Raw-result clamping at 100 and rejection of `final_score` below 0 or above 100.
  - Case-insensitive exact asset lookup, trimming, and first-match precedence.
  - Rejection of substring matches such as `WBTC`.
  - Non-array `asset_triggers`, non-object entries, and non-string `asset` values do not throw.
  - A zero-crypto allocation succeeds with missing or non-array `asset_triggers` when its other inputs are valid.
  - A null event with valid allocations and a boolean leverage flag returns `reason: "final_score"` and does not throw.
  - Allocation totals other than 100.
  - Negative, over-100, nonnumeric, string, and nonfinite allocations, plus a missing allocation key.
  - Missing or invalid `final_score`, including nonfinite values.
  - Missing or invalid utility for an allocated crypto asset, including a boolean, and a legacy value interpreted only on the legacy scale.
  - Missing or invalid utility for an unallocated crypto asset.
  - Absent, null, and `""` schema as legacy; `"0"` and `"0.0"` as legacy; `"1"` and `"1.0"` as v1.
  - Rejection of `"01"`, `"1.00"`, `" 1.0"`, `"1.0.0-beta"`, and a non-string schema other than null.
  - A non-boolean leverage flag as unavailable.
  - Reuse of the canonical `gaugeBand` label at 0, 15, 35, 55, 75, 90, and 100, with the first matching band winning on each overlap.
  - An explanation and unavailable message that contain no digit characters.

### Acceptance Criteria

- `computePersonalExposure(event, allocations, leveraged)` deterministically produces the documented score.
- Legacy and v1 payloads representing the same utilities produce the same result.
- Invalid or incomplete inputs, including a null event and malformed triggers required by an allocated crypto asset, return an unavailable result and never throw during normal use.
- A zero-crypto allocation does not require `asset_triggers`.
- Valid inputs whose raw result exceeds 100 are clamped to 100 before rounding.
- No second band table is introduced.
- `public/render.js` remains valid in Node and the browser.
- All focused tests and the configured syntax checks pass.

## Phase 3 - Add the Gated Calculator Experience

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/index.html -->
<!-- pilot:touches=server.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:read=public/render.js -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add a Personal Liquidity Exposure section to `public/index.html` immediately after `section#stress-score` and before the subscore section.
- The page must call the global `computePersonalExposure`. Do not reimplement the formula in the page script.
- Include labeled dropdowns for equities/cash-like, BTC, ETH, and XRP. Each offers 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, and 100. Default to 100, 0, 0, and 0. Include an unchecked leverage/margin checkbox and a Calculate button.
- Convert a selected option to a number only when its value matches `/^(?:0|100|[1-9]0)$/`. Pass those numbers and the boolean `checked` value to `computePersonalExposure`. Do not pass raw DOM strings.
- Give every calculator control and status element an id beginning with `exposure-`. Do not reuse `signup-form`, `signup-email`, `signup-status`, `signup-submit`, `verify-form`, `verify-code`, or `verify-submit`.
- Include public explanatory copy describing:
  - What the calculator measures.
  - The deterministic formula at a readable level, including the 1.15 leverage multiplier.
  - That current macro stress sets the baseline, crypto utility can only add a plumbing penalty, and utility of 1 matches equities/cash-like.
  - That the reused band label describes personal-exposure severity and is not a policy-regime call.
  - That the output is informational and not investment advice.
- Validate that allocations total exactly 100 and announce actionable errors without opening the email gate.
- A current calculation is the last helper result whose controls have not changed since Calculate was pressed. Changing allocations or leverage invalidates it.
- After a valid current calculation, before access is granted:
  - Show the derived band and one-line explanation immediately.
  - Keep the personalized numeric score masked.
  - Do not place that score in the DOM, a data attribute, a title, an aria attribute, the live region, or the explanation.
  - Show a calculator-specific email form explaining that signup reveals the number.
- Submit calculator emails to `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`. Trim the email. If the trimmed email is empty, do not send a request and leave controls enabled.
- Treat a network failure, non-JSON response, non-2xx response, or falsy `success` as signup failure and keep the numeric score hidden.
- If signup succeeds and `needsVerification` is truthy, show a calculator-specific verification-code form and do not reveal the number.
- If signup succeeds and `needsVerification` is not truthy, grant access and reveal the numeric score immediately when a current successful calculation remains valid.
- Submit verification as `POST /verifyEmailCode` with exactly `{ username, code }`, where `username` is the calculator email stored in memory. Trim the code. If the trimmed code is empty, do not send a request and leave controls enabled. Do not include a list field.
- A 2xx verification response whose JSON has truthy `success` grants access. Reveal the number immediately only if a current successful calculation is still valid. If the calculation was cleared or invalidated, keep the number hidden; the next successful Calculate reveals its number without another signup or verification.
- Verification failure, network failure, or a non-JSON response does not grant access and keeps the number hidden.
- Insert API `message` values with `textContent` only when they are strings. Otherwise use a generic fallback. The live region must not contain the numeric score until access is granted and a current successful calculation exists.
- Keep calculator form state, pending email, status messages, verification state, and access state independent from the existing mailing-list forms.
- While a signup or verification request is pending, disable the calculator controls and both calculator submit buttons.
- When that request settles, re-enable every visible calculator control. This includes signup failure, verification failure, a signup that needs verification, and a response that grants access. An empty-input return that does not send a request also leaves controls enabled. Do not leave a visible control disabled after the request settles.
- Once access is granted during the page session, hide the calculator email and verification forms and allow recalculation without another signup. Keep allocations, access, and results in memory only.
- If allocations or leverage change before access is granted, clear the current band, explanation, and any pending score. If signup has not succeeded, hide the calculator email form until the next successful Calculate. Do not reveal a cleared result if verification completes first.
- If signup already succeeded and only verification remains, an input change does not require a second signup and the verification form stays available. Successful verification grants access but reveals a number only when a newly calculated result is current.
- After access has been granted, input changes do not revoke access. Clear the visible numeric score, band, and explanation immediately, and show the new number only after the next successful Calculate.
- Add `<script type="application/json" id="exposure-calculator-context">null</script>` to `public/index.html`.
- Update `server.js` so an available cached SSR event replaces that placeholder. Preserve every existing SSR replacement. When there is no cached event, leave the placeholder as null and preserve today's early static fallback. Calculator projection must not throw; a malformed event still server-renders the existing score panel.
- Serialize a projection with only these rules:
  - Include `final_score` only when it is a finite number.
  - For `schema_version`, preserve calculator validation semantics:
    - If the property is absent or its value is null, omit it.
    - If its value is a string, copy it unchanged.
    - For every other value, serialize `schema_version` as the boolean `false`, which is an invalid-schema sentinel rejected by `computePersonalExposure`.
  - If `asset_triggers` is not an array, serialize `asset_triggers` as `[]`.
  - Otherwise include one object per entry that is a non-null object, in order, shaped as `{ asset, utility_score }`. Copy `asset` only when it is a string; otherwise use `null`. Copy `utility_score` only when it is a finite number; otherwise use `null`.
- The invalid-schema sentinel must never be interpreted as absent or legacy. This preserves the result that the full source event would produce while avoiding serialization of arbitrary non-string values.
- Escape JSON embedded in HTML by replacing `&` with `\u0026`, `<` with `\u003c`, `>` with `\u003e`, U+2028 with `\u2028`, and U+2029 with `\u2029`, so values cannot terminate the script element or inject markup.
- The calculator reads the projection into memory once. When the JSON placeholder is null, use the event from the page's existing `loadStressScore()` path once it arrives. Do not start a second financial-stress fetch. Do not rewrite the script element on later updates.
- Every call to `renderEventIntoPage(event)` with a non-null object replaces the in-memory calculator context with that event. Do not compare timestamps. A null or non-object argument leaves the calculator context unchanged and preserves the existing main-panel null behavior.
- If the current calculation is still valid for the current controls when context is replaced, recompute it with `computePersonalExposure` without another signup or fetch. If access is granted, update the visible number; otherwise update only the band and explanation. If recomputation is unavailable, clear the score and show the unavailable message without revoking access. Do not recalculate a missing or invalidated calculation merely because context was replaced.
- Do not move focus when recalculation or an event refresh updates the number.
- After the signup or verification response that first grants access, move focus to the result element only when that response also reveals a current numeric result. If access is granted while no current calculation exists, do not move focus; focus the result after the next successful Calculate reveals the number.
- Make the result element programmatically focusable with `tabindex="-1"` and do not add it to the tab order.
- Do not change the existing cache TTL.
- Disable calculation with a clear temporary/unavailable message when required event data is absent, while leaving the rest of the page functional.
- Style the section consistently with existing panels. At `max-width: 480px`, stack its controls in one column.
- Use an `aria-live="polite"` region for validation, signup, verification, and reveal status.

### Acceptance Criteria

- Visitors can configure and calculate an allocation using keyboard or pointer controls on desktop and mobile layouts.
- The default 100/0/0/0 allocation is valid, and only the listed 10-point choices are offered.
- Invalid totals and unavailable upstream data produce clear messages without breaking the page.
- The band and explanation are visible after calculation, while the numeric score is absent from the DOM until the required signup flow succeeds.
- Calculator signup uses exactly `liquiditywatch-exposure-calculator`; the existing signup still uses `financial_stress_alerts`.
- Verification uses exactly `{ username, code }`.
- A missing `needsVerification` field on an otherwise successful signup grants access and reveals a current number; a truthy value requires verification.
- Verification-required users cannot gain access before successful code verification.
- Signup or verification failures do not reveal the number, and visible calculator controls are enabled again after the request settles.
- Changing inputs before access clears the unrevealed result and hides a not-yet-submitted email form. A late verification can grant access but cannot reveal a stale score.
- After access is granted, changing inputs clears the visible number until the next successful Calculate and does not require another signup.
- Successful users can recalculate during the same page session without another email submission.
- A later non-null event rendered by the existing refresh updates a still-current calculation without an additional request to `/api/financial-stress-monitor`, and does not resurrect an invalidated calculation.
- Calculator actions cause no additional request to `/api/financial-stress-monitor`.
- SSR-provided calculator context contains only the projected fields, is safely serialized, does not throw on malformed triggers, and is replaced in memory when the client renders a new event.
- An invalid non-string source `schema_version` remains invalid in the SSR projection and cannot be mistaken for an absent legacy version.
- The main score, optional panels, newsletter content, and existing mailing-list flow retain their behavior.
- The focused tests and configured verification checks pass.
```

Raw Response:

```text
---STATUS---
status: revise
reason: The SSR projection drops invalid non-string schema versions, incorrectly converting them into valid legacy inputs and potentially producing a score.
```spec
# Personal Liquidity Exposure Calculator

## Overview

Add a deterministic Personal Liquidity Exposure calculator to the existing LiquidityWatch page. Visitors select a coarse portfolio allocation and leverage status; the calculator combines those inputs with the already-published financial-stress event.

The calculator, methodology, exposure band, and explanation remain public. The personalized numeric score is revealed only after successful mailing-list signup and, when required, email verification. This is a free lead-generation feature using the existing signup endpoints, with no payment, LLM call, upstream scoring change, or separate data-fetching path.

The debate transcript at `docs/debates/2026-09-22-liquidity-exposure-calculator/transcript.md` is not an input. Do not implement its ungated score, scenario delta, saved mix, alerts, or paid threshold.

## Goals

- Calculate a deterministic 0–100 personal exposure score from the current event and visitor-supplied allocations.
- Reuse the six existing LiquidityWatch bands and render-helper conventions.
- Support both legacy and v1 `asset_triggers[].utility_score` scales.
- Attribute conversions with the list value `liquiditywatch-exposure-calculator`.
- Reveal the numeric score only after successful signup or verification; the band and explanation stay public.
- Reuse the event already obtained by SSR or the existing page refresh.
- Preserve optional-field resilience and the no-build architecture.
- Add focused automated coverage for the calculation and validation rules.

## Non-Goals

- Changing the upstream financial-stress pipeline or its published score.
- Adding API fields, calculator endpoints, LLM calls, ingestion, payment, alerts, saved portfolios, history, sharing, or analytics.
- Treating the personal exposure score as investment advice or as a replacement for `event.final_score`.
- Persisting portfolio allocations or the calculated result.
- Refactoring the existing general mailing-list flow.
- Modifying environment files.
- Changing band ranges, labels, or colors, or adding a personal-exposure band table.
- Ungating the numeric score, showing a next-regime scenario delta, or following the debate transcript.

## Existing Files

- `CLAUDE.md` defines the presentation-only architecture and currently prohibits all local scoring. Its band-sync rule still names `public/index.html`, which is stale.
- `docs/MODEL.md` defines score semantics and the canonical six regime bands. Its runtime band-table sentences, including §8 open item 1, are stale: `GAUGE_BANDS` lives in `public/render.js`, not `public/index.html`. §8 open item 2 still says this repo computes nothing.
- `docs/API-CONTRACT.md` defines the optional event fields, legacy/v1 scales, and mailing-list endpoints. `asset_triggers[].asset` is the asset identifier. Signup is `POST /api/mailing-list/signup` with `{ email, list }` and a response of `{ success, needsVerification, message }`. Verification is `POST /verifyEmailCode` with `{ username, code }` and a response of `{ success, message }`. The contract does not yet name the list value `financial_stress_alerts`; the live general form in `public/index.html` does.
- `public/render.js` contains shared browser/SSR render helpers, `GAUGE_BANDS`, `gaugeBand`, and `RENDER_EXPORTS`. Top-level declarations are globals in the classic browser script and CommonJS exports in Node. `scaledUnitPercent` is only a display helper: it treats any present truthy `schema_version` as v1 and does not reject out-of-range values. The calculator must not use it.
- `public/index.html` contains the page, inline styles and behavior, live event refresh, and the existing mailing-list forms. It already loads `/render.js` before its inline script. The macro score lives in `section#stress-score`. The existing narrow layout breakpoint is `max-width: 480px`. `loadStressScore()` always fetches once on load and calls `renderEventIntoPage`.
- `server.js` fetches and caches the current event for SSR in `renderIndexHtml`. A null event returns the template unchanged. A throw falls back to the static file. It does not proxy mailing-list signup.
- `package.json` provides the existing no-build Node application.

## Shared Constraints

- Keep the entire implementation within 30 changed files and 3,200 changed lines.
- Do not modify `.env*`.
- Do not add a framework, bundler, transpiler, database, dependency, payment flow, or LLM call.
- The upstream financial-stress event remains authoritative; the personal score is a clearly labeled, consumer-derived presentation metric.
- All upstream fields remain optional. Calculator unavailability must not affect the main score panel or other page content.
- Do not fetch the financial-stress endpoint in response to calculator calculation, signup, or verification. Do not add a second financial-stress fetch; the existing `loadStressScore()` call remains the only client fetch.
- Escape or safely serialize all data inserted into HTML. Set calculator band, explanation, score, and status text with `textContent`, never `innerHTML`.
- Portfolio values and results remain in page memory only.
- Use semantic labels, keyboard-operable controls, visible focus states, accessible status messaging, and responsive styling.
- Keep the existing general mailing-list signup and its `financial_stress_alerts` attribution unchanged.
- Display an informational/not-investment-advice qualification with the calculator.
- Use `codex:gpt-5.6-sol` for all phases.
- Do not put the email address, allocations, or personal score in a URL, cookie, local storage, session storage, `console` output, or server log. The signup and verification request bodies contain only the fields specified below and do not include the score or allocations.

## Phase 1 - Define Calculator Semantics and Architectural Exception

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=CLAUDE.md -->
<!-- pilot:touches=docs/MODEL.md -->
<!-- pilot:touches=docs/API-CONTRACT.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js -->

### Requirements

- Amend `CLAUDE.md` with a narrow exception permitting deterministic, browser-visible personalization derived solely from an already-published event and visitor inputs.
- State that this exception does not permit reproducing or modifying the upstream financial-stress model, ingesting new data, making LLM calls, or persisting personal inputs.
- In the same `CLAUDE.md` edit, change the band-sync location from `public/index.html` to `public/render.js`. Do not change band ranges, labels, colors, or the `public/about.html` obligation.
- In `docs/MODEL.md` §0, replace the unqualified "computes nothing" claim with the same narrow exception so it does not contradict the new section.
- Qualify `docs/MODEL.md` §8 open item 2 so it does not still require an unqualified "compute nothing" rule.
- Correct every stale `GAUGE_BANDS` location note in `docs/MODEL.md`, including the regime-band paragraph and §8 open item 1, to `public/render.js` without changing any band range, label, or meaning. Do not edit `public/about.html`. Do not renumber existing model sections.
- Add a `## Personal Liquidity Exposure` section to `docs/MODEL.md` immediately after the §1 regime-band subsection. It distinguishes the derived personal metric from `event.final_score`.
- Define allocation inputs as percentages for:
  - Equities / cash-like assets (`equities`, share `t`).
  - BTC (`btc`, share `b`).
  - ETH (`eth`, share `e`).
  - XRP (`xrp`, share `x`).
- Require each allocation to be a finite number from 0 through 100, and require the four allocations to total exactly 100. Missing keys are invalid. Do not coerce strings, repair totals, default missing keys to zero, or treat out-of-range values as zero.
- Define schema handling from the API contract:
  - Absent, null, or `""` `schema_version` has major version 0.
  - A version string is accepted only when it matches `/^(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*))*$/` with no trimming. Its major version is the integer before the first dot, or the whole string when it contains only digits. `"1.0"` and `"1"` are major 1. `"0.0"` and `"0"` are major 0.
  - Leading zeros (`"01"`, `"1.00"`), whitespace, prerelease suffixes, and every non-string value other than null make the calculator unavailable.
  - Major version 1 or later uses the v1 scale. Major version 0 uses the legacy scale.
  - Schema is validated even when every crypto allocation is zero.
- Define utility normalization:
  - v1: `utility_score` must be a finite number from 0.0 through 1.0 and is used unchanged.
  - Legacy: `utility_score` must be a finite number from 0 through 100 and is divided by 100.
  - Reject booleans, strings, nulls, nonfinite numbers, and out-of-range values. Never infer the scale from the magnitude.
- Look up each crypto utility on `asset_triggers[].asset` by trimming and case-insensitive exact equality with `BTC`, `ETH`, or `XRP`. Do not use substring or alias matching. If several entries match, use the first in array order.
- A null or non-object event, a missing `asset_triggers`, or a non-array `asset_triggers` contributes no matches and does not throw. Skip entries that are not non-null objects and skip entries whose `asset` is not a string.
- Define shares `t`, `b`, `e`, and `x` as each allocation divided by 100, with no intermediate rounding.
- Define normalized utilities as `uBTC`, `uETH`, and `uXRP`.
- Define the formula exactly as:
  - `weightedFragility = t + b * (2 - uBTC) + e * (2 - uETH) + x * (2 - uXRP)`.
  - `leverageMultiplier = 1.15` when leverage/margin is selected, otherwise `1`.
  - `raw = final_score * weightedFragility * leverageMultiplier`.
  - `personalExposure = Math.round(clamp(raw, 0, 100))`, where clamp is inclusive and happens before rounding. `Math.round` is nearest integer; nonnegative halves round away from zero.
- Explain that a utility of 1 gives that crypto asset the same weight as equities/cash-like, while a utility of 0 doubles its weight. Leverage multiplies the combined result by 1.15. High utility therefore removes only the additional crypto-plumbing penalty; it never makes crypto weigh less than equities/cash-like.
- Require `event.final_score` to be a finite number from 0 through 100. Reject values outside that range rather than clamping them. Numeric non-integers inside the range are accepted. A null or non-object event has a missing `final_score`.
- Require a valid matching utility only for a crypto asset whose allocation is nonzero. Ignore missing or invalid utilities for a zero allocation.
- Map the rounded result through the existing `gaugeBand` helper and the six canonical bands. Do not define a second band table. Where band edges overlap, the existing first match wins: 15 is Accommodative, 35 is Mild Watchfulness, 55 is Contained Tension, 75 is Restrictive Policy, and 90 is Policy-Forcing Danger Zone.
- Document that these band labels are reused as a severity vocabulary for personal exposure under current published conditions. They are not a statement that policy is in that regime and not a policy-regime prediction.
- Pin these worked examples in the model section:
  - Score 40, allocations 100/0/0/0, unleveraged → raw 40 → 40.
  - Score 40, allocations 40/30/20/10, utilities 0.80/0.50/0.20, unleveraged → weighted fragility 1.24 → raw 49.6 → 50. The same utilities encoded as legacy 80/50/20 under major version 0 produce 50.
  - The same mixed inputs with leverage → raw 57.04 → 57.
  - Score 1, allocation 100% BTC, utility 0.5, unleveraged → raw 1.5 → 2.
  - Score 100, allocation 100% BTC, utility 0, leveraged → raw 230 → clamp 100 → 100.
- Update `docs/API-CONTRACT.md` to document this as a consumer-derived value, not a new wire field and not a new endpoint.
- Document the existing general mailing-list value as `financial_stress_alerts`, separate from the calculator.
- Document calculator signup as `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`.
- Document verification as the existing `POST /verifyEmailCode` body `{ username, code }`, where `username` is the submitted email. The verification body has no list field.
- Preserve the contract rule that all event fields are optional and specify that insufficient inputs make only the calculator unavailable.

### Acceptance Criteria

- The architecture documentation expressly permits this bounded derived calculation without weakening the upstream contract boundary.
- `CLAUDE.md` and `docs/MODEL.md` do not contradict each other about local computation or about where `GAUGE_BANDS` lives.
- The formula, worked examples, validation, normalization, asset matching, leverage behavior, band reuse, and missing-data behavior are unambiguous.
- `docs/API-CONTRACT.md` adds no required event field or new endpoint.
- `financial_stress_alerts` and `liquiditywatch-exposure-calculator` are documented as different list values.
- The configured verification command succeeds.

## Phase 2 - Implement and Test Pure Exposure Helpers

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/render.js -->
<!-- pilot:touches=test/exposure-calculator.test.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add a top-level function `computePersonalExposure(event, allocations, leveraged)` to `public/render.js`, plus the pure helpers it needs. `allocations` is `{ equities, btc, eth, xrp }`.
- Keep the helpers DOM-independent and cover:
  - Allocation validation.
  - Asset-trigger lookup using trimmed, case-insensitive exact `asset` matches for BTC, ETH, and XRP.
  - Contract-aware utility normalization, implemented separately from `scaledUnitPercent`.
  - Personal exposure calculation.
  - Reusing `gaugeBand` for the derived result.
  - Producing a safe result object.
- Keep helpers compatible with both direct browser loading and CommonJS use. Define `computePersonalExposure` so the classic script exposes it as a global, and add it to `RENDER_EXPORTS`.
- Validate in this order and return the first failure: `allocations`, `leverage`, `schema`, `final_score`, `utility`.
- Return a structured unavailable result, and do not throw, for invalid allocations, a non-boolean leverage flag, an unparsable `schema_version`, a null or non-object event, a missing or out-of-range `final_score`, or missing/invalid utility data required by a nonzero crypto allocation.
- A missing or non-array `asset_triggers` value contributes no matches. It therefore causes a `utility` failure only when a nonzero crypto allocation requires a matching utility; it does not make a zero-crypto allocation unavailable.
- Use this result shape:
  - Success: `{ ok: true, score, bandLabel, bandColor, explanation }`.
  - Unavailable: `{ ok: false, reason, message }`, where `reason` is `allocations`, `leverage`, `schema`, `final_score`, or `utility`, and `message` is a non-empty string that contains no digit characters.
- `score` is the rounded integer. `bandLabel` and `bandColor` come from `gaugeBand(score)`. Do not add another band table.
- `explanation` is one concise sentence generated from the result. It names the band, says whether any allocated crypto utility raised exposure above the equities/cash-like baseline or all allocated crypto utilities matched it, and says whether leverage was applied. For a zero crypto allocation, say that utility does not change the result. It contains no digit characters and does not include the numeric score.
- Do not require utility data for crypto assets with zero allocation.
- After validating all source inputs, require the computed `weightedFragility`, multiplier, and `raw` product to be finite. If that defensive check fails, return `{ ok: false, reason: "final_score", message }` and do not throw. Clamp `raw` inclusively to 0–100 before `Math.round`, even when valid inputs produce a value above 100. Do not clamp or silently repair invalid allocations, invalid leverage, invalid schema versions, or invalid upstream values.
- Keep calculation helpers free of fetches, storage, timers, global mutable state, and HTML/DOM access.
- Add `node:test` coverage without introducing a test dependency. Require `computePersonalExposure` and `gaugeBand` from `public/render.js`.
- Cover at least:
  - All five worked examples from Phase 1, including identical legacy and v1 results.
  - A 100% equities/cash-like allocation, including one with a non-string `schema_version`, which is unavailable.
  - Leveraged versus unleveraged results.
  - Raw-result clamping at 100 and rejection of `final_score` below 0 or above 100.
  - Case-insensitive exact asset lookup, trimming, and first-match precedence.
  - Rejection of substring matches such as `WBTC`.
  - Non-array `asset_triggers`, non-object entries, and non-string `asset` values do not throw.
  - A zero-crypto allocation succeeds with missing or non-array `asset_triggers` when its other inputs are valid.
  - A null event with valid allocations and a boolean leverage flag returns `reason: "final_score"` and does not throw.
  - Allocation totals other than 100.
  - Negative, over-100, nonnumeric, string, and nonfinite allocations, plus a missing allocation key.
  - Missing or invalid `final_score`, including nonfinite values.
  - Missing or invalid utility for an allocated crypto asset, including a boolean, and a legacy value interpreted only on the legacy scale.
  - Missing or invalid utility for an unallocated crypto asset.
  - Absent, null, and `""` schema as legacy; `"0"` and `"0.0"` as legacy; `"1"` and `"1.0"` as v1.
  - Rejection of `"01"`, `"1.00"`, `" 1.0"`, `"1.0.0-beta"`, and a non-string schema other than null.
  - A non-boolean leverage flag as unavailable.
  - Reuse of the canonical `gaugeBand` label at 0, 15, 35, 55, 75, 90, and 100, with the first matching band winning on each overlap.
  - An explanation and unavailable message that contain no digit characters.

### Acceptance Criteria

- `computePersonalExposure(event, allocations, leveraged)` deterministically produces the documented score.
- Legacy and v1 payloads representing the same utilities produce the same result.
- Invalid or incomplete inputs, including a null event and malformed triggers required by an allocated crypto asset, return an unavailable result and never throw during normal use.
- A zero-crypto allocation does not require `asset_triggers`.
- Valid inputs whose raw result exceeds 100 are clamped to 100 before rounding.
- No second band table is introduced.
- `public/render.js` remains valid in Node and the browser.
- All focused tests and the configured syntax checks pass.

## Phase 3 - Add the Gated Calculator Experience

<!-- runner:model=codex:gpt-5.6-sol -->
<!-- pilot:touches=public/index.html -->
<!-- pilot:touches=server.js -->
<!-- runner:read=CLAUDE.md -->
<!-- runner:read=docs/MODEL.md -->
<!-- runner:read=docs/API-CONTRACT.md -->
<!-- runner:read=public/render.js -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->

### Requirements

- Add a Personal Liquidity Exposure section to `public/index.html` immediately after `section#stress-score` and before the subscore section.
- The page must call the global `computePersonalExposure`. Do not reimplement the formula in the page script.
- Include labeled dropdowns for equities/cash-like, BTC, ETH, and XRP. Each offers 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, and 100. Default to 100, 0, 0, and 0. Include an unchecked leverage/margin checkbox and a Calculate button.
- Convert a selected option to a number only when its value matches `/^(?:0|100|[1-9]0)$/`. Pass those numbers and the boolean `checked` value to `computePersonalExposure`. Do not pass raw DOM strings.
- Give every calculator control and status element an id beginning with `exposure-`. Do not reuse `signup-form`, `signup-email`, `signup-status`, `signup-submit`, `verify-form`, `verify-code`, or `verify-submit`.
- Include public explanatory copy describing:
  - What the calculator measures.
  - The deterministic formula at a readable level, including the 1.15 leverage multiplier.
  - That current macro stress sets the baseline, crypto utility can only add a plumbing penalty, and utility of 1 matches equities/cash-like.
  - That the reused band label describes personal-exposure severity and is not a policy-regime call.
  - That the output is informational and not investment advice.
- Validate that allocations total exactly 100 and announce actionable errors without opening the email gate.
- A current calculation is the last helper result whose controls have not changed since Calculate was pressed. Changing allocations or leverage invalidates it.
- After a valid current calculation, before access is granted:
  - Show the derived band and one-line explanation immediately.
  - Keep the personalized numeric score masked.
  - Do not place that score in the DOM, a data attribute, a title, an aria attribute, the live region, or the explanation.
  - Show a calculator-specific email form explaining that signup reveals the number.
- Submit calculator emails to `POST /api/mailing-list/signup` with exactly `{ email, list: "liquiditywatch-exposure-calculator" }`. Trim the email. If the trimmed email is empty, do not send a request and leave controls enabled.
- Treat a network failure, non-JSON response, non-2xx response, or falsy `success` as signup failure and keep the numeric score hidden.
- If signup succeeds and `needsVerification` is truthy, show a calculator-specific verification-code form and do not reveal the number.
- If signup succeeds and `needsVerification` is not truthy, grant access and reveal the numeric score immediately when a current successful calculation remains valid.
- Submit verification as `POST /verifyEmailCode` with exactly `{ username, code }`, where `username` is the calculator email stored in memory. Trim the code. If the trimmed code is empty, do not send a request and leave controls enabled. Do not include a list field.
- A 2xx verification response whose JSON has truthy `success` grants access. Reveal the number immediately only if a current successful calculation is still valid. If the calculation was cleared or invalidated, keep the number hidden; the next successful Calculate reveals its number without another signup or verification.
- Verification failure, network failure, or a non-JSON response does not grant access and keeps the number hidden.
- Insert API `message` values with `textContent` only when they are strings. Otherwise use a generic fallback. The live region must not contain the numeric score until access is granted and a current successful calculation exists.
- Keep calculator form state, pending email, status messages, verification state, and access state independent from the existing mailing-list forms.
- While a signup or verification request is pending, disable the calculator controls and both calculator submit buttons.
- When that request settles, re-enable every visible calculator control. This includes signup failure, verification failure, a signup that needs verification, and a response that grants access. An empty-input return that does not send a request also leaves controls enabled. Do not leave a visible control disabled after the request settles.
- Once access is granted during the page session, hide the calculator email and verification forms and allow recalculation without another signup. Keep allocations, access, and results in memory only.
- If allocations or leverage change before access is granted, clear the current band, explanation, and any pending score. If signup has not succeeded, hide the calculator email form until the next successful Calculate. Do not reveal a cleared result if verification completes first.
- If signup already succeeded and only verification remains, an input change does not require a second signup and the verification form stays available. Successful verification grants access but reveals a number only when a newly calculated result is current.
- After access has been granted, input changes do not revoke access. Clear the visible numeric score, band, and explanation immediately, and show the new number only after the next successful Calculate.
- Add `<script type="application/json" id="exposure-calculator-context">null</script>` to `public/index.html`.
- Update `server.js` so an available cached SSR event replaces that placeholder. Preserve every existing SSR replacement. When there is no cached event, leave the placeholder as null and preserve today's early static fallback. Calculator projection must not throw; a malformed event still server-renders the existing score panel.
- Serialize a projection with only these rules:
  - Include `final_score` only when it is a finite number.
  - For `schema_version`, preserve calculator validation semantics:
    - If the property is absent or its value is null, omit it.
    - If its value is a string, copy it unchanged.
    - For every other value, serialize `schema_version` as the boolean `false`, which is an invalid-schema sentinel rejected by `computePersonalExposure`.
  - If `asset_triggers` is not an array, serialize `asset_triggers` as `[]`.
  - Otherwise include one object per entry that is a non-null object, in order, shaped as `{ asset, utility_score }`. Copy `asset` only when it is a string; otherwise use `null`. Copy `utility_score` only when it is a finite number; otherwise use `null`.
- The invalid-schema sentinel must never be interpreted as absent or legacy. This preserves the result that the full source event would produce while avoiding serialization of arbitrary non-string values.
- Escape JSON embedded in HTML by replacing `&` with `\u0026`, `<` with `\u003c`, `>` with `\u003e`, U+2028 with `\u2028`, and U+2029 with `\u2029`, so values cannot terminate the script element or inject markup.
- The calculator reads the projection into memory once. When the JSON placeholder is null, use the event from the page's existing `loadStressScore()` path once it arrives. Do not start a second financial-stress fetch. Do not rewrite the script element on later updates.
- Every call to `renderEventIntoPage(event)` with a non-null object replaces the in-memory calculator context with that event. Do not compare timestamps. A null or non-object argument leaves the calculator context unchanged and preserves the existing main-panel null behavior.
- If the current calculation is still valid for the current controls when context is replaced, recompute it with `computePersonalExposure` without another signup or fetch. If access is granted, update the visible number; otherwise update only the band and explanation. If recomputation is unavailable, clear the score and show the unavailable message without revoking access. Do not recalculate a missing or invalidated calculation merely because context was replaced.
- Do not move focus when recalculation or an event refresh updates the number.
- After the signup or verification response that first grants access, move focus to the result element only when that response also reveals a current numeric result. If access is granted while no current calculation exists, do not move focus; focus the result after the next successful Calculate reveals the number.
- Make the result element programmatically focusable with `tabindex="-1"` and do not add it to the tab order.
- Do not change the existing cache TTL.
- Disable calculation with a clear temporary/unavailable message when required event data is absent, while leaving the rest of the page functional.
- Style the section consistently with existing panels. At `max-width: 480px`, stack its controls in one column.
- Use an `aria-live="polite"` region for validation, signup, verification, and reveal status.

### Acceptance Criteria

- Visitors can configure and calculate an allocation using keyboard or pointer controls on desktop and mobile layouts.
- The default 100/0/0/0 allocation is valid, and only the listed 10-point choices are offered.
- Invalid totals and unavailable upstream data produce clear messages without breaking the page.
- The band and explanation are visible after calculation, while the numeric score is absent from the DOM until the required signup flow succeeds.
- Calculator signup uses exactly `liquiditywatch-exposure-calculator`; the existing signup still uses `financial_stress_alerts`.
- Verification uses exactly `{ username, code }`.
- A missing `needsVerification` field on an otherwise successful signup grants access and reveals a current number; a truthy value requires verification.
- Verification-required users cannot gain access before successful code verification.
- Signup or verification failures do not reveal the number, and visible calculator controls are enabled again after the request settles.
- Changing inputs before access clears the unrevealed result and hides a not-yet-submitted email form. A late verification can grant access but cannot reveal a stale score.
- After access is granted, changing inputs clears the visible number until the next successful Calculate and does not require another signup.
- Successful users can recalculate during the same page session without another email submission.
- A later non-null event rendered by the existing refresh updates a still-current calculation without an additional request to `/api/financial-stress-monitor`, and does not resurrect an invalidated calculation.
- Calculator actions cause no additional request to `/api/financial-stress-monitor`.
- SSR-provided calculator context contains only the projected fields, is safely serialized, does not throw on malformed triggers, and is replaced in memory when the client renders a new event.
- An invalid non-string source `schema_version` remains invalid in the SSR projection and cannot be mistaken for an absent legacy version.
- The main score, optional panels, newsletter content, and existing mailing-list flow retain their behavior.
- The focused tests and configured verification checks pass.
```
```

### Reviewer 4: devin

Status: approved

Reason: Worked examples verified, gaugeBand overlap semantics correct, schema sentinel logic sound, SSR escaping complete, state machine covers all edge cases, no second-fetch rule consistently enforced, CLAUDE.md/MODEL.md stale-reference corrections scoped correctly.

Raw Response:

```text
---STATUS---
status: approved
reason: Worked examples verified, gaugeBand overlap semantics correct, schema sentinel logic sound, SSR escaping complete, state machine covers all edge cases, no second-fetch rule consistently enforced, CLAUDE.md/MODEL.md stale-reference corrections scoped correctly.
```

### Reviewer 5: local

Status: approved

Reason: The draft meets all specified requirements and acceptance criteria.

Raw Response:

```text
---STATUS---
status: approved
reason: The draft meets all specified requirements and acceptance criteria.
```

Round Result: not converged

At least one reviewer requested revision in round 2.

## Final Outcome

Needs human review after 2 rounds; spec-draft.md left in place.
## Round 1

### Draft Before Round

```text
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

### Reviewer 1: grok-build

Status: revise

Reason: Phase 1 and Phase 2 can diverge because the return contract, missing-score behavior, regime threshold source, rounding order, and local-save timing conflict or are unspecified.

Replacement Spec:

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
```

Raw Response:

```text
---STATUS---
status: revise
reason: Phase 1 and Phase 2 can diverge because the return contract, missing-score behavior, regime threshold source, rounding order, and local-save timing conflict or are unspecified.
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
```
```

### Reviewer 2: claude

Status: approved

Reason: Spec is internally consistent, precisely scoped, and handles the CLAUDE.md "compute nothing" tension transparently by codifying a narrow, tested, presentation-layer exception rather than silently violating it.

Raw Response:

```text
---STATUS---
status: approved
reason: Spec is internally consistent, precisely scoped, and handles the CLAUDE.md "compute nothing" tension transparently by codifying a narrow, tested, presentation-layer exception rather than silently violating it.
```

### Reviewer 3: codex

Status: approved

Reason: The draft is internally consistent, implementation-ready, and provides precise deterministic behavior, phase boundaries, testing requirements, and acceptance criteria.

Raw Response:

```text
---STATUS---
status: approved
reason: The draft is internally consistent, implementation-ready, and provides precise deterministic behavior, phase boundaries, testing requirements, and acceptance criteria.
```

### Reviewer 4: devin

Status: approved

Reason: Spec is internally consistent, respects all CLAUDE.md constraints, formula arithmetic is sound with correct dimensional analysis, resilience contract is maintained, test coverage is comprehensive, and both phases have clear acceptance criteria.

Raw Response:

```text
---STATUS---
status: approved
reason: Spec is internally consistent, respects all CLAUDE.md constraints, formula arithmetic is sound with correct dimensional analysis, resilience contract is maintained, test coverage is comprehensive, and both phases have clear acceptance criteria.
```

### Reviewer 5: local

Status: approved

Reason: (no reason provided by reviewer)

Raw Response:

```text
---STATUS---
status: approved
```

Round Result: not converged

At least one reviewer requested revision in round 1.

## Round 1

### Draft Before Round

```text
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

```

### Reviewer 1: grok-build

Status: revise

Reason: The next-regime bounds conflict with overlapping GAUGE_BANDS and gaugeBand's first match, and the new helpers are not actually visible to index.html's later classic script.

Replacement Spec:

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

Raw Response:

```text
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
```

### Reviewer 2: claude

Status: approved

Reason: Spec is internally consistent, technically well-specified (formula, fallback, scenario-boundary derivation all check out), respects the CLAUDE.md compute-nothing boundary by explicitly amending that doc to record the narrow exception, and has clear, testable acceptance criteria for both phases.

Raw Response:

```text
---STATUS---
status: approved
reason: Spec is internally consistent, technically well-specified (formula, fallback, scenario-boundary derivation all check out), respects the CLAUDE.md compute-nothing boundary by explicitly amending that doc to record the narrow exception, and has clear, testable acceptance criteria for both phases.
```

### Reviewer 3: codex

Status: approved

Reason: The draft is internally consistent, implementation-ready, and provides precise deterministic behavior, integration constraints, and testable acceptance criteria.

Raw Response:

```text
---STATUS---
status: approved
reason: The draft is internally consistent, implementation-ready, and provides precise deterministic behavior, integration constraints, and testable acceptance criteria.
```

### Reviewer 4: devin

Status: approved

Reason: Spec is technically coherent, formula and boundary semantics are self-consistent, repo constraints are respected, and phase separation is clean.

Raw Response:

```text
---STATUS---
status: approved
reason: Spec is technically coherent, formula and boundary semantics are self-consistent, repo constraints are respected, and phase separation is clean.
```

### Reviewer 5: local

Status: approved

Reason: (no reason provided by reviewer)

Raw Response:

```text
---STATUS---
status: approved
```

Round Result: not converged

At least one reviewer requested revision in round 1.

## Round 2

### Draft Before Round

```text
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

### Reviewer 1: grok-build

Status: revise

Reason: Allocation dropdowns yield strings while helpers reject numeric strings, and the draft never pins SSR replace anchors, non-array asset_triggers, or null storage writes.

Replacement Spec:

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
- `server.js` fetches and briefly caches the current event for SSR. `renderIndexHtml` injects that event by exact `String.prototype.replace` searches against the `index.html` template. Those search strings are the score-panel element whose placeholder is `Loading&hellip;`, plus the `hidden` subscore, classification, and newsletter section openers and their empty panel divs.
- `docs/MODEL.md` defines the headline score and its six regimes.
- `CLAUDE.md` defines the presentation-only repository boundary.
- `README.md` describes the deployed product and repository.
- `docs/API-CONTRACT.md` documents the existing event and mailing-list contracts. Asset utilities are `event.asset_triggers[].utility_score`, with `event.schema_version` selecting the v1 0–1 scale. Signup is `{ email, list }`. Verification is `{ username, code }` posted to `/verifyEmailCode`.

## Shared Constraints

- Keep the implementation within the no-build, framework-free CommonJS/browser pattern already used by `public/render.js`. Do not convert it to an ES module.
- The calculator is a narrow presentation-layer exception to the repository’s “compute nothing” rule: it may derive a user-facing score from published fields but must not alter, replace, or present itself as the upstream Financial Stress Score.
- Use the event already obtained by the existing page load. Calculator changes must never initiate another financial-stress API request.
- Treat every event field as optional. Missing or malformed asset utility data must degrade neutrally rather than disable the calculator or imply maximum risk.
- Normalize v1 and legacy utility-score scales through the existing `scaledUnitPercent(rawValue, schemaVersion)` convention, passing `event.schema_version` as `schemaVersion`. Do not reimplement that scale split.
- Use the existing `GAUGE_BANDS` and `gaugeBand` helpers. Do not create a second regime table or hard-code regime thresholds in the calculator.
- Clamp all source and derived values to their documented ranges. `scaledUnitPercent` may already round a resolved utility. The calculator itself rounds only the final displayed personal scores, using JavaScript `Math.round` (half away from zero for positive values), after clamping. Do not round stresses, base exposure, or the pre-clamp leveraged product.
- Portfolio percentages must be finite numbers from 0 through 100 inclusive and must total exactly 100 before a result is shown. Helper inputs must not coerce numeric strings. The page parses its own dropdown values before calling those helpers, as Phase 2 specifies; that parse does not apply to event fields or stored JSON.
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
- Resolve BTC, ETH, and XRP only from `event.asset_triggers`. If `asset_triggers` is missing or not an array, treat it as an empty list. Ignore entries that are null or not non-array objects. Identify a remaining entry by case-insensitive `asset` (`String(asset).toUpperCase()` equals `BTC`, `ETH`, or `XRP`). The first matching entry wins. Read `utility_score` only. Do not filter on `score_kind`, do not coerce with `Number`, and do not invent a new event field. This resolution must not throw.
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
  - Use the next band’s `min` when `gaugeBand(next.min) === nextBand` by object identity.
  - Otherwise use `currentBand.max + 1` when `gaugeBand(currentBand.max + 1) === nextBand` by object identity.
  - If neither probe classifies as that same next band, `scenario` is `null`. Do not scan further entries or invent another offset.
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
  - a missing `asset_triggers`, a non-array `asset_triggers`, a null entry, and a non-object entry do not throw and use the neutral fallback;
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
- Malformed `asset_triggers` does not throw.
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
<!-- runner:read=server.js -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js && node -e "const fs=require('fs');const html=fs.readFileSync('public/index.html','utf8');const anchors=['<div class=\"score-panel\" id=\"score-panel\">\n      <div class=\"empty-state\">Loading&hellip;</div>\n    </div>','<section id=\"subscore-breakdown\" hidden>','<div class=\"subscore-panel\" id=\"subscore-panel\"></div>','<section id=\"classification-body\" hidden>','<div class=\"classification-panel\" id=\"classification-panel\"></div>','<section id=\"newsletter-body\" hidden>','<div class=\"newsletter-panel\" id=\"newsletter-panel\"></div>'];if(anchors.some(s=>!html.includes(s))){console.error('SSR anchor missing');process.exit(1);}" -->

### Requirements

- Add a responsive “Personal Liquidity Exposure” section to `public/index.html` after `section#stress-score` and before `section#subscore-breakdown`. Keep its markup outside `#score-panel` and outside every node whose `innerHTML` `renderEventIntoPage` replaces.
- Do not modify `server.js`. Every existing `renderIndexHtml` search string must still occur byte-for-byte in `index.html`, including the score panel’s `Loading&hellip;` placeholder and the `hidden` attributes on the subscore, classification, and newsletter sections. Add the calculator as a new sibling section without rewriting those anchors.
- Call calculator helpers through `globalThis.RENDER_EXPORTS`. Do not reimplement the formula and do not reference top-level `const` names from `render.js`.
- Provide accessible labeled dropdowns for cash/equities, BTC, ETH, and XRP allocations using 10-point increments from 0% through 100%, plus a leverage/margin checkbox.
- Parse each selected allocation with a base-10 conversion that accepts only that control’s own option values (`"0"`, `"10"`, …, `"100"`). Pass the resulting numbers, never the raw strings, to `normalizeExposureMix` and `computePersonalExposure`. This is the only allowed numeric-string conversion. Do not apply it to event fields or to stored JSON.
- Initialize the controls from `DEFAULT_EXPOSURE_MIX` unless `parseStoredExposureMix` returns a valid saved mix whose four percentages are all members of those dropdown increments. Otherwise ignore the stored mix and use the default.
- Retain the argument of every `renderEventIntoPage` call, including nullish events, and recalculate immediately. Assign the retained event at the start of `renderEventIntoPage`, before its nullish early return, so a later nullish call clears a previous personal score into the unavailable state. Also recalculate when client refresh replaces that event. Call exported `computePersonalExposure` on that retained event and the current numeric mix. Do not fetch inside calculator handlers.
- Leave `loadStressScore` as the only financial-stress fetch. Its existing failure path does not call `renderEventIntoPage` and must not be given a second fetch. On that failure, keep the last retained event when one exists; if none has been retained yet, remain in the unavailable state.
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
  - whenever the mix is valid, save the string from `serializeExposureMix` under `EXPOSURE_MIX_STORAGE_KEY`; immediately before a calculator signup submission, save again only when that call returns a string;
  - never write `null`, never store the string `"null"`, and never remove the key because the current mix is invalid;
  - restore through `parseStoredExposureMix` on later visits, ignoring `null` safely;
  - ignore storage read and write exceptions and continue with the in-memory mix;
  - POST to the existing `/api/mailing-list/signup` endpoint with exactly `{ email, list: EXPOSURE_ALERT_LIST }` and no portfolio fields;
  - allow that signup whether or not the current mix is valid;
  - preserve the existing verification-code behavior: both forms POST `{ username, code }` to `/verifyEmailCode`, using that form’s own pending email as `username`;
  - use separate mutable pending-email state, status regions, and verify controls for the calculator and general signup forms;
  - state that the mix is stored in this browser and that signup covers material LiquidityWatch updates. Do not claim that the current API stores the allocation or already performs server-side personalized dispatch.
- Keep the existing general `financial_stress_alerts` signup independently functional, including its existing payload.
- Factor duplicated signup/verification behavior into a small reusable client-side function if necessary, without adding a library or changing the general form’s endpoint payload. Each path must independently handle success, `needsVerification`, API errors, and network failures, including re-enabling the submit control after a failure.
- Make calculator status messages accessible with an `aria-live="polite"` region, preserve keyboard operation, and provide visible focus states for all new controls. Do not remove the focus outline unless a visible replacement is shown.
- Ensure the layout remains readable at the existing 480px mobile breakpoint, with no horizontal overflow and stacked allocation controls.
- Update `README.md` to mention the ungated calculator, its transparent derivative nature, the local saved mix, the scenario result, and the attributed optional alert signup.
- Do not modify `server.js` or `public/render.js` in this phase. The existing cached SSR event and existing browser refresh remain the only event-loading paths.

### Acceptance Criteria

- A visitor can calculate and inspect the score, band, scenario, and full formula without supplying an email.
- Changing any allocation or leverage control updates the result without a network request. The page passes parsed numbers into the helpers, so a valid on-grid mix is not rejected as a numeric string.
- Invalid totals never produce a score.
- The calculator computes for the event already passed to `renderEventIntoPage`, including a nullish event, and recomputes when client refresh replaces that event. Refreshing `#score-panel` does not destroy the calculator.
- A `loadStressScore` failure does not start another financial-stress fetch and does not discard an already retained event.
- Missing asset utilities still yield the deterministic neutral-fallback result.
- A valid on-grid mix survives reload through local storage; malformed stored data, or a mix that does not fit the dropdown increments, leaves the page on the default mix. An invalid in-memory mix does not overwrite a previously stored valid mix.
- Calculator signup sends exactly the exported calculator list attribution, while general signup retains `financial_stress_alerts`. Both verification posts use `{ username, code }`.
- Both signup paths handle success, verification-required responses, API errors, and retryable failures independently.
- Existing score, subscore, classification, briefing, and mailing-list rendering continue to work, including non-JS SSR injection, because every `renderIndexHtml` search string still matches `index.html`.
- The page remains usable on mobile and by keyboard.
- No new endpoint, dependency, financial-stress fetch, monetization surface, or email gate is introduced.
- The configured verification command passes.
```

Raw Response:

```text
I'll review the draft against the repository's presentation rules and the existing gauge, scale, and signup behavior it depends on.---STATUS---
status: revise
reason: Allocation dropdowns yield strings while helpers reject numeric strings, and the draft never pins SSR replace anchors, non-array asset_triggers, or null storage writes.
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
- `server.js` fetches and briefly caches the current event for SSR. `renderIndexHtml` injects that event by exact `String.prototype.replace` searches against the `index.html` template. Those search strings are the score-panel element whose placeholder is `Loading&hellip;`, plus the `hidden` subscore, classification, and newsletter section openers and their empty panel divs.
- `docs/MODEL.md` defines the headline score and its six regimes.
- `CLAUDE.md` defines the presentation-only repository boundary.
- `README.md` describes the deployed product and repository.
- `docs/API-CONTRACT.md` documents the existing event and mailing-list contracts. Asset utilities are `event.asset_triggers[].utility_score`, with `event.schema_version` selecting the v1 0–1 scale. Signup is `{ email, list }`. Verification is `{ username, code }` posted to `/verifyEmailCode`.

## Shared Constraints

- Keep the implementation within the no-build, framework-free CommonJS/browser pattern already used by `public/render.js`. Do not convert it to an ES module.
- The calculator is a narrow presentation-layer exception to the repository’s “compute nothing” rule: it may derive a user-facing score from published fields but must not alter, replace, or present itself as the upstream Financial Stress Score.
- Use the event already obtained by the existing page load. Calculator changes must never initiate another financial-stress API request.
- Treat every event field as optional. Missing or malformed asset utility data must degrade neutrally rather than disable the calculator or imply maximum risk.
- Normalize v1 and legacy utility-score scales through the existing `scaledUnitPercent(rawValue, schemaVersion)` convention, passing `event.schema_version` as `schemaVersion`. Do not reimplement that scale split.
- Use the existing `GAUGE_BANDS` and `gaugeBand` helpers. Do not create a second regime table or hard-code regime thresholds in the calculator.
- Clamp all source and derived values to their documented ranges. `scaledUnitPercent` may already round a resolved utility. The calculator itself rounds only the final displayed personal scores, using JavaScript `Math.round` (half away from zero for positive values), after clamping. Do not round stresses, base exposure, or the pre-clamp leveraged product.
- Portfolio percentages must be finite numbers from 0 through 100 inclusive and must total exactly 100 before a result is shown. Helper inputs must not coerce numeric strings. The page parses its own dropdown values before calling those helpers, as Phase 2 specifies; that parse does not apply to event fields or stored JSON.
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
- Resolve BTC, ETH, and XRP only from `event.asset_triggers`. If `asset_triggers` is missing or not an array, treat it as an empty list. Ignore entries that are null or not non-array objects. Identify a remaining entry by case-insensitive `asset` (`String(asset).toUpperCase()` equals `BTC`, `ETH`, or `XRP`). The first matching entry wins. Read `utility_score` only. Do not filter on `score_kind`, do not coerce with `Number`, and do not invent a new event field. This resolution must not throw.
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
  - Use the next band’s `min` when `gaugeBand(next.min) === nextBand` by object identity.
  - Otherwise use `currentBand.max + 1` when `gaugeBand(currentBand.max + 1) === nextBand` by object identity.
  - If neither probe classifies as that same next band, `scenario` is `null`. Do not scan further entries or invent another offset.
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
  - a missing `asset_triggers`, a non-array `asset_triggers`, a null entry, and a non-object entry do not throw and use the neutral fallback;
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
- Malformed `asset_triggers` does not throw.
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
<!-- runner:read=server.js -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js && node -e "const fs=require('fs');const html=fs.readFileSync('public/index.html','utf8');const anchors=['<div class=\"score-panel\" id=\"score-panel\">\n      <div class=\"empty-state\">Loading&hellip;</div>\n    </div>','<section id=\"subscore-breakdown\" hidden>','<div class=\"subscore-panel\" id=\"subscore-panel\"></div>','<section id=\"classification-body\" hidden>','<div class=\"classification-panel\" id=\"classification-panel\"></div>','<section id=\"newsletter-body\" hidden>','<div class=\"newsletter-panel\" id=\"newsletter-panel\"></div>'];if(anchors.some(s=>!html.includes(s))){console.error('SSR anchor missing');process.exit(1);}" -->

### Requirements

- Add a responsive “Personal Liquidity Exposure” section to `public/index.html` after `section#stress-score` and before `section#subscore-breakdown`. Keep its markup outside `#score-panel` and outside every node whose `innerHTML` `renderEventIntoPage` replaces.
- Do not modify `server.js`. Every existing `renderIndexHtml` search string must still occur byte-for-byte in `index.html`, including the score panel’s `Loading&hellip;` placeholder and the `hidden` attributes on the subscore, classification, and newsletter sections. Add the calculator as a new sibling section without rewriting those anchors.
- Call calculator helpers through `globalThis.RENDER_EXPORTS`. Do not reimplement the formula and do not reference top-level `const` names from `render.js`.
- Provide accessible labeled dropdowns for cash/equities, BTC, ETH, and XRP allocations using 10-point increments from 0% through 100%, plus a leverage/margin checkbox.
- Parse each selected allocation with a base-10 conversion that accepts only that control’s own option values (`"0"`, `"10"`, …, `"100"`). Pass the resulting numbers, never the raw strings, to `normalizeExposureMix` and `computePersonalExposure`. This is the only allowed numeric-string conversion. Do not apply it to event fields or to stored JSON.
- Initialize the controls from `DEFAULT_EXPOSURE_MIX` unless `parseStoredExposureMix` returns a valid saved mix whose four percentages are all members of those dropdown increments. Otherwise ignore the stored mix and use the default.
- Retain the argument of every `renderEventIntoPage` call, including nullish events, and recalculate immediately. Assign the retained event at the start of `renderEventIntoPage`, before its nullish early return, so a later nullish call clears a previous personal score into the unavailable state. Also recalculate when client refresh replaces that event. Call exported `computePersonalExposure` on that retained event and the current numeric mix. Do not fetch inside calculator handlers.
- Leave `loadStressScore` as the only financial-stress fetch. Its existing failure path does not call `renderEventIntoPage` and must not be given a second fetch. On that failure, keep the last retained event when one exists; if none has been retained yet, remain in the unavailable state.
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
  - whenever the mix is valid, save the string from `serializeExposureMix` under `EXPOSURE_MIX_STORAGE_KEY`; immediately before a calculator signup submission, save again only when that call returns a string;
  - never write `null`, never store the string `"null"`, and never remove the key because the current mix is invalid;
  - restore through `parseStoredExposureMix` on later visits, ignoring `null` safely;
  - ignore storage read and write exceptions and continue with the in-memory mix;
  - POST to the existing `/api/mailing-list/signup` endpoint with exactly `{ email, list: EXPOSURE_ALERT_LIST }` and no portfolio fields;
  - allow that signup whether or not the current mix is valid;
  - preserve the existing verification-code behavior: both forms POST `{ username, code }` to `/verifyEmailCode`, using that form’s own pending email as `username`;
  - use separate mutable pending-email state, status regions, and verify controls for the calculator and general signup forms;
  - state that the mix is stored in this browser and that signup covers material LiquidityWatch updates. Do not claim that the current API stores the allocation or already performs server-side personalized dispatch.
- Keep the existing general `financial_stress_alerts` signup independently functional, including its existing payload.
- Factor duplicated signup/verification behavior into a small reusable client-side function if necessary, without adding a library or changing the general form’s endpoint payload. Each path must independently handle success, `needsVerification`, API errors, and network failures, including re-enabling the submit control after a failure.
- Make calculator status messages accessible with an `aria-live="polite"` region, preserve keyboard operation, and provide visible focus states for all new controls. Do not remove the focus outline unless a visible replacement is shown.
- Ensure the layout remains readable at the existing 480px mobile breakpoint, with no horizontal overflow and stacked allocation controls.
- Update `README.md` to mention the ungated calculator, its transparent derivative nature, the local saved mix, the scenario result, and the attributed optional alert signup.
- Do not modify `server.js` or `public/render.js` in this phase. The existing cached SSR event and existing browser refresh remain the only event-loading paths.

### Acceptance Criteria

- A visitor can calculate and inspect the score, band, scenario, and full formula without supplying an email.
- Changing any allocation or leverage control updates the result without a network request. The page passes parsed numbers into the helpers, so a valid on-grid mix is not rejected as a numeric string.
- Invalid totals never produce a score.
- The calculator computes for the event already passed to `renderEventIntoPage`, including a nullish event, and recomputes when client refresh replaces that event. Refreshing `#score-panel` does not destroy the calculator.
- A `loadStressScore` failure does not start another financial-stress fetch and does not discard an already retained event.
- Missing asset utilities still yield the deterministic neutral-fallback result.
- A valid on-grid mix survives reload through local storage; malformed stored data, or a mix that does not fit the dropdown increments, leaves the page on the default mix. An invalid in-memory mix does not overwrite a previously stored valid mix.
- Calculator signup sends exactly the exported calculator list attribution, while general signup retains `financial_stress_alerts`. Both verification posts use `{ username, code }`.
- Both signup paths handle success, verification-required responses, API errors, and retryable failures independently.
- Existing score, subscore, classification, briefing, and mailing-list rendering continue to work, including non-JS SSR injection, because every `renderIndexHtml` search string still matches `index.html`.
- The page remains usable on mobile and by keyboard.
- No new endpoint, dependency, financial-stress fetch, monetization surface, or email gate is introduced.
- The configured verification command passes.
```
```

### Reviewer 2: claude

Status: approved

Reason: Draft is internally consistent, respects CLAUDE.md's compute-nothing/API-contract/band-sync/resilience rules via an explicit, self-documenting narrow exception, and specifies a deterministic, fully-tested formula with no upstream contract or SSR-anchor changes.

Raw Response:

```text
---STATUS---
status: approved
reason: Draft is internally consistent, respects CLAUDE.md's compute-nothing/API-contract/band-sync/resilience rules via an explicit, self-documenting narrow exception, and specifies a deterministic, fully-tested formula with no upstream contract or SSR-anchor changes.
```

### Reviewer 3: codex

Status: revise

Reason: Stored-mix parsing is contradictory: “partial” data must be rejected, but a missing `leveraged` field currently normalizes successfully to `false`.

Replacement Spec:

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
- `server.js` fetches and briefly caches the current event for SSR. `renderIndexHtml` injects that event by exact `String.prototype.replace` searches against the `index.html` template. Those search strings are the score-panel element whose placeholder is `Loading&hellip;`, plus the `hidden` subscore, classification, and newsletter section openers and their empty panel divs.
- `docs/MODEL.md` defines the headline score and its six regimes.
- `CLAUDE.md` defines the presentation-only repository boundary.
- `README.md` describes the deployed product and repository.
- `docs/API-CONTRACT.md` documents the existing event and mailing-list contracts. Asset utilities are `event.asset_triggers[].utility_score`, with `event.schema_version` selecting the v1 0–1 scale. Signup is `{ email, list }`. Verification is `{ username, code }` posted to `/verifyEmailCode`.

## Shared Constraints

- Keep the implementation within the no-build, framework-free CommonJS/browser pattern already used by `public/render.js`. Do not convert it to an ES module.
- The calculator is a narrow presentation-layer exception to the repository’s “compute nothing” rule: it may derive a user-facing score from published fields but must not alter, replace, or present itself as the upstream Financial Stress Score.
- Use the event already obtained by the existing page load. Calculator changes must never initiate another financial-stress API request.
- Treat every event field as optional. Missing or malformed asset utility data must degrade neutrally rather than disable the calculator or imply maximum risk.
- Normalize v1 and legacy utility-score scales through the existing `scaledUnitPercent(rawValue, schemaVersion)` convention, passing `event.schema_version` as `schemaVersion`. Do not reimplement that scale split.
- Use the existing `GAUGE_BANDS` and `gaugeBand` helpers. Do not create a second regime table or hard-code regime thresholds in the calculator.
- Clamp all source and derived values to their documented ranges. `scaledUnitPercent` may already round a resolved utility. The calculator itself rounds only the final displayed personal scores, using JavaScript `Math.round` (half away from zero for positive values), after clamping. Do not round stresses, base exposure, or the pre-clamp leveraged product.
- Portfolio percentages must be finite numbers from 0 through 100 inclusive and must total exactly 100 before a result is shown. Helper inputs must not coerce numeric strings. The page parses its own dropdown values before calling those helpers, as Phase 2 specifies; that parse does not apply to event fields or stored JSON.
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
  - `parseStoredExposureMix(raw)`: accept a version-1 JSON string or a non-array object. Require `v`, `cashEquities`, `btc`, `eth`, `xrp`, and `leveraged` to be present as own properties, require `v === 1`, validate the percentage and leverage values with `normalizeExposureMix`, and return the normalized mix object. A present `leveraged` value follows `normalizeExposureMix`: only strict `true` becomes `true`, and every other value becomes `false`. Return `null` for corrupt JSON, non-objects, arrays, a missing or non-1 `v`, any missing required stored field, obsolete, partial, or invalid data. Do not mutate the input and do not throw.
  - `computePersonalExposure(event, mix)`: do not mutate `event` or `mix`. A null or non-object event does not throw. Return:
    - `ok: false`, `reason: "invalid-mix"`, `current: null`, `scenario: null`, and `components: null` when the mix is invalid. This reason wins even if `event` is missing or `final_score` is also missing.
    - `ok: false`, `reason: "missing-score"`, `current: null`, `scenario: null`, and `components: null` when the mix is valid but `event` is missing or `event.final_score` is not a finite number. Do not coerce strings.
    - Otherwise `ok: true`, `reason: null`, plus `current`, `scenario`, and `components`.
- Resolve BTC, ETH, and XRP only from `event.asset_triggers`. If `asset_triggers` is missing or not an array, treat it as an empty list. Ignore entries that are null or not non-array objects. Identify a remaining entry by case-insensitive `asset` (`String(asset).toUpperCase()` equals `BTC`, `ETH`, or `XRP`). The first matching entry wins. Read `utility_score` only. Do not filter on `score_kind`, do not coerce with `Number`, and do not invent a new event field. This resolution must not throw.
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
  - Use the next band’s `min` when `gaugeBand(next.min) === nextBand` by object identity.
  - Otherwise use `currentBand.max + 1` when `gaugeBand(currentBand.max + 1) === nextBand` by object identity.
  - If neither probe classifies as that same next band, `scenario` is `null`. Do not scan further entries or invent another offset.
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
  - a missing `asset_triggers`, a non-array `asset_triggers`, a null entry, and a non-object entry do not throw and use the neutral fallback;
  - no `Number()` coercion of `null` or numeric strings into a real utility;
  - invalid allocations, non-finite values, values outside 0–100, and totals other than exactly 100;
  - all six personal-score bands and their existing first-match boundary values;
  - next-regime macro bounds, unchanged fallback utilities, personal score, personal band, and signed delta, plus `scenario: null` in the highest regime;
  - a null event, a missing score, and a non-finite `final_score` returning `missing-score` without throwing;
  - invalid mix taking precedence over a missing event or missing score;
  - non-mutation of the supplied event and mix;
  - round-trip, rejection, and non-throwing behavior of `serializeExposureMix` and `parseStoredExposureMix`, including a missing required stored field, a non-1 `v`, and corrupt JSON.
- Update `docs/MODEL.md` with a clearly separated “Personal Liquidity Exposure” presentation derivative. Document the exact formula, `schema_version` utility scaling, neutral utility fallback and its reuse in the scenario, leverage-then-clamp-then-round order, the overlapping-band scenario rule, signed delta, interpretation, and its distinction from the upstream headline model. Do not change the headline band table.
- Update `CLAUDE.md` to record this calculator as the sole narrow deterministic presentation derivative currently allowed, while retaining the prohibition on pipeline scoring, ingestion, and LLM calls.
- The configured verification command includes `node --test test/exposure-calculator.test.js`.

### Acceptance Criteria

- The same input event and portfolio always produce the same integer result.
- Tests independently demonstrate the documented arithmetic, fallback, and next-regime entry behavior.
- No helper accesses DOM, network, storage, environment, or time APIs.
- Malformed `asset_triggers` does not throw.
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
<!-- runner:read=server.js -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js && node -e "const fs=require('fs');const html=fs.readFileSync('public/index.html','utf8');const anchors=['<div class=\"score-panel\" id=\"score-panel\">\n      <div class=\"empty-state\">Loading&hellip;</div>\n    </div>','<section id=\"subscore-breakdown\" hidden>','<div class=\"subscore-panel\" id=\"subscore-panel\"></div>','<section id=\"classification-body\" hidden>','<div class=\"classification-panel\" id=\"classification-panel\"></div>','<section id=\"newsletter-body\" hidden>','<div class=\"newsletter-panel\" id=\"newsletter-panel\"></div>'];if(anchors.some(s=>!html.includes(s))){console.error('SSR anchor missing');process.exit(1);}" -->

### Requirements

- Add a responsive “Personal Liquidity Exposure” section to `public/index.html` after `section#stress-score` and before `section#subscore-breakdown`. Keep its markup outside `#score-panel` and outside every node whose `innerHTML` `renderEventIntoPage` replaces.
- Do not modify `server.js`. Every existing `renderIndexHtml` search string must still occur byte-for-byte in `index.html`, including the score panel’s `Loading&hellip;` placeholder and the `hidden` attributes on the subscore, classification, and newsletter sections. Add the calculator as a new sibling section without rewriting those anchors.
- Call calculator helpers through `globalThis.RENDER_EXPORTS`. Do not reimplement the formula and do not reference top-level `const` names from `render.js`.
- Provide accessible labeled dropdowns for cash/equities, BTC, ETH, and XRP allocations using 10-point increments from 0% through 100%, plus a leverage/margin checkbox.
- Parse each selected allocation with a base-10 conversion that accepts only that control’s own option values (`"0"`, `"10"`, …, `"100"`). Pass the resulting numbers, never the raw strings, to `normalizeExposureMix` and `computePersonalExposure`. This is the only allowed numeric-string conversion. Do not apply it to event fields or to stored JSON.
- Initialize the controls from `DEFAULT_EXPOSURE_MIX` unless `parseStoredExposureMix` returns a valid saved mix whose four percentages are all members of those dropdown increments. Otherwise ignore the stored mix and use the default.
- Retain the argument of every `renderEventIntoPage` call, including nullish events, and recalculate immediately. Assign the retained event at the start of `renderEventIntoPage`, before its nullish early return, so a later nullish call clears a previous personal score into the unavailable state. Also recalculate when client refresh replaces that event. Call exported `computePersonalExposure` on that retained event and the current numeric mix. Do not fetch inside calculator handlers.
- Leave `loadStressScore` as the only financial-stress fetch. Its existing failure path does not call `renderEventIntoPage` and must not be given a second fetch. On that failure, keep the last retained event when one exists; if none has been retained yet, remain in the unavailable state.
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
  - whenever the mix is valid, save the string from `serializeExposureMix` under `EXPOSURE_MIX_STORAGE_KEY`; immediately before a calculator signup submission, save again only when that call returns a string;
  - never write `null`, never store the string `"null"`, and never remove the key because the current mix is invalid;
  - restore through `parseStoredExposureMix` on later visits, ignoring `null` safely;
  - ignore storage read and write exceptions and continue with the in-memory mix;
  - POST to the existing `/api/mailing-list/signup` endpoint with exactly `{ email, list: EXPOSURE_ALERT_LIST }` and no portfolio fields;
  - allow that signup whether or not the current mix is valid;
  - preserve the existing verification-code behavior: both forms POST `{ username, code }` to `/verifyEmailCode`, using that form’s own pending email as `username`;
  - use separate mutable pending-email state, status regions, and verify controls for the calculator and general signup forms;
  - state that the mix is stored in this browser and that signup covers material LiquidityWatch updates. Do not claim that the current API stores the allocation or already performs server-side personalized dispatch.
- Keep the existing general `financial_stress_alerts` signup independently functional, including its existing payload.
- Factor duplicated signup/verification behavior into a small reusable client-side function if necessary, without adding a library or changing the general form’s endpoint payload. Each path must independently handle success, `needsVerification`, API errors, and network failures, including re-enabling the submit control after a failure.
- Make calculator status messages accessible with an `aria-live="polite"` region, preserve keyboard operation, and provide visible focus states for all new controls. Do not remove the focus outline unless a visible replacement is shown.
- Ensure the layout remains readable at the existing 480px mobile breakpoint, with no horizontal overflow and stacked allocation controls.
- Update `README.md` to mention the ungated calculator, its transparent derivative nature, the local saved mix, the scenario result, and the attributed optional alert signup.
- Do not modify `server.js` or `public/render.js` in this phase. The existing cached SSR event and existing browser refresh remain the only event-loading paths.

### Acceptance Criteria

- A visitor can calculate and inspect the score, band, scenario, and full formula without supplying an email.
- Changing any allocation or leverage control updates the result without a network request. The page passes parsed numbers into the helpers, so a valid on-grid mix is not rejected as a numeric string.
- Invalid totals never produce a score.
- The calculator computes for the event already passed to `renderEventIntoPage`, including a nullish event, and recomputes when client refresh replaces that event. Refreshing `#score-panel` does not destroy the calculator.
- A `loadStressScore` failure does not start another financial-stress fetch and does not discard an already retained event.
- Missing asset utilities still yield the deterministic neutral-fallback result.
- A valid on-grid mix survives reload through local storage; malformed stored data, or a mix that does not fit the dropdown increments, leaves the page on the default mix. An invalid in-memory mix does not overwrite a previously stored valid mix.
- Calculator signup sends exactly the exported calculator list attribution, while general signup retains `financial_stress_alerts`. Both verification posts use `{ username, code }`.
- Both signup paths handle success, verification-required responses, API errors, and retryable failures independently.
- Existing score, subscore, classification, briefing, and mailing-list rendering continue to work, including non-JS SSR injection, because every `renderIndexHtml` search string still matches `index.html`.
- The page remains usable on mobile and by keyboard.
- No new endpoint, dependency, financial-stress fetch, monetization surface, or email gate is introduced.
- The configured verification command passes.
```

Raw Response:

```text
---STATUS---
status: revise
reason: Stored-mix parsing is contradictory: “partial” data must be rejected, but a missing `leveraged` field currently normalizes successfully to `false`.
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
- `server.js` fetches and briefly caches the current event for SSR. `renderIndexHtml` injects that event by exact `String.prototype.replace` searches against the `index.html` template. Those search strings are the score-panel element whose placeholder is `Loading&hellip;`, plus the `hidden` subscore, classification, and newsletter section openers and their empty panel divs.
- `docs/MODEL.md` defines the headline score and its six regimes.
- `CLAUDE.md` defines the presentation-only repository boundary.
- `README.md` describes the deployed product and repository.
- `docs/API-CONTRACT.md` documents the existing event and mailing-list contracts. Asset utilities are `event.asset_triggers[].utility_score`, with `event.schema_version` selecting the v1 0–1 scale. Signup is `{ email, list }`. Verification is `{ username, code }` posted to `/verifyEmailCode`.

## Shared Constraints

- Keep the implementation within the no-build, framework-free CommonJS/browser pattern already used by `public/render.js`. Do not convert it to an ES module.
- The calculator is a narrow presentation-layer exception to the repository’s “compute nothing” rule: it may derive a user-facing score from published fields but must not alter, replace, or present itself as the upstream Financial Stress Score.
- Use the event already obtained by the existing page load. Calculator changes must never initiate another financial-stress API request.
- Treat every event field as optional. Missing or malformed asset utility data must degrade neutrally rather than disable the calculator or imply maximum risk.
- Normalize v1 and legacy utility-score scales through the existing `scaledUnitPercent(rawValue, schemaVersion)` convention, passing `event.schema_version` as `schemaVersion`. Do not reimplement that scale split.
- Use the existing `GAUGE_BANDS` and `gaugeBand` helpers. Do not create a second regime table or hard-code regime thresholds in the calculator.
- Clamp all source and derived values to their documented ranges. `scaledUnitPercent` may already round a resolved utility. The calculator itself rounds only the final displayed personal scores, using JavaScript `Math.round` (half away from zero for positive values), after clamping. Do not round stresses, base exposure, or the pre-clamp leveraged product.
- Portfolio percentages must be finite numbers from 0 through 100 inclusive and must total exactly 100 before a result is shown. Helper inputs must not coerce numeric strings. The page parses its own dropdown values before calling those helpers, as Phase 2 specifies; that parse does not apply to event fields or stored JSON.
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
  - `parseStoredExposureMix(raw)`: accept a version-1 JSON string or a non-array object. Require `v`, `cashEquities`, `btc`, `eth`, `xrp`, and `leveraged` to be present as own properties, require `v === 1`, validate the percentage and leverage values with `normalizeExposureMix`, and return the normalized mix object. A present `leveraged` value follows `normalizeExposureMix`: only strict `true` becomes `true`, and every other value becomes `false`. Return `null` for corrupt JSON, non-objects, arrays, a missing or non-1 `v`, any missing required stored field, obsolete, partial, or invalid data. Do not mutate the input and do not throw.
  - `computePersonalExposure(event, mix)`: do not mutate `event` or `mix`. A null or non-object event does not throw. Return:
    - `ok: false`, `reason: "invalid-mix"`, `current: null`, `scenario: null`, and `components: null` when the mix is invalid. This reason wins even if `event` is missing or `final_score` is also missing.
    - `ok: false`, `reason: "missing-score"`, `current: null`, `scenario: null`, and `components: null` when the mix is valid but `event` is missing or `event.final_score` is not a finite number. Do not coerce strings.
    - Otherwise `ok: true`, `reason: null`, plus `current`, `scenario`, and `components`.
- Resolve BTC, ETH, and XRP only from `event.asset_triggers`. If `asset_triggers` is missing or not an array, treat it as an empty list. Ignore entries that are null or not non-array objects. Identify a remaining entry by case-insensitive `asset` (`String(asset).toUpperCase()` equals `BTC`, `ETH`, or `XRP`). The first matching entry wins. Read `utility_score` only. Do not filter on `score_kind`, do not coerce with `Number`, and do not invent a new event field. This resolution must not throw.
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
  - Use the next band’s `min` when `gaugeBand(next.min) === nextBand` by object identity.
  - Otherwise use `currentBand.max + 1` when `gaugeBand(currentBand.max + 1) === nextBand` by object identity.
  - If neither probe classifies as that same next band, `scenario` is `null`. Do not scan further entries or invent another offset.
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
  - a missing `asset_triggers`, a non-array `asset_triggers`, a null entry, and a non-object entry do not throw and use the neutral fallback;
  - no `Number()` coercion of `null` or numeric strings into a real utility;
  - invalid allocations, non-finite values, values outside 0–100, and totals other than exactly 100;
  - all six personal-score bands and their existing first-match boundary values;
  - next-regime macro bounds, unchanged fallback utilities, personal score, personal band, and signed delta, plus `scenario: null` in the highest regime;
  - a null event, a missing score, and a non-finite `final_score` returning `missing-score` without throwing;
  - invalid mix taking precedence over a missing event or missing score;
  - non-mutation of the supplied event and mix;
  - round-trip, rejection, and non-throwing behavior of `serializeExposureMix` and `parseStoredExposureMix`, including a missing required stored field, a non-1 `v`, and corrupt JSON.
- Update `docs/MODEL.md` with a clearly separated “Personal Liquidity Exposure” presentation derivative. Document the exact formula, `schema_version` utility scaling, neutral utility fallback and its reuse in the scenario, leverage-then-clamp-then-round order, the overlapping-band scenario rule, signed delta, interpretation, and its distinction from the upstream headline model. Do not change the headline band table.
- Update `CLAUDE.md` to record this calculator as the sole narrow deterministic presentation derivative currently allowed, while retaining the prohibition on pipeline scoring, ingestion, and LLM calls.
- The configured verification command includes `node --test test/exposure-calculator.test.js`.

### Acceptance Criteria

- The same input event and portfolio always produce the same integer result.
- Tests independently demonstrate the documented arithmetic, fallback, and next-regime entry behavior.
- No helper accesses DOM, network, storage, environment, or time APIs.
- Malformed `asset_triggers` does not throw.
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
<!-- runner:read=server.js -->
<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js && node -e "const fs=require('fs');const html=fs.readFileSync('public/index.html','utf8');const anchors=['<div class=\"score-panel\" id=\"score-panel\">\n      <div class=\"empty-state\">Loading&hellip;</div>\n    </div>','<section id=\"subscore-breakdown\" hidden>','<div class=\"subscore-panel\" id=\"subscore-panel\"></div>','<section id=\"classification-body\" hidden>','<div class=\"classification-panel\" id=\"classification-panel\"></div>','<section id=\"newsletter-body\" hidden>','<div class=\"newsletter-panel\" id=\"newsletter-panel\"></div>'];if(anchors.some(s=>!html.includes(s))){console.error('SSR anchor missing');process.exit(1);}" -->

### Requirements

- Add a responsive “Personal Liquidity Exposure” section to `public/index.html` after `section#stress-score` and before `section#subscore-breakdown`. Keep its markup outside `#score-panel` and outside every node whose `innerHTML` `renderEventIntoPage` replaces.
- Do not modify `server.js`. Every existing `renderIndexHtml` search string must still occur byte-for-byte in `index.html`, including the score panel’s `Loading&hellip;` placeholder and the `hidden` attributes on the subscore, classification, and newsletter sections. Add the calculator as a new sibling section without rewriting those anchors.
- Call calculator helpers through `globalThis.RENDER_EXPORTS`. Do not reimplement the formula and do not reference top-level `const` names from `render.js`.
- Provide accessible labeled dropdowns for cash/equities, BTC, ETH, and XRP allocations using 10-point increments from 0% through 100%, plus a leverage/margin checkbox.
- Parse each selected allocation with a base-10 conversion that accepts only that control’s own option values (`"0"`, `"10"`, …, `"100"`). Pass the resulting numbers, never the raw strings, to `normalizeExposureMix` and `computePersonalExposure`. This is the only allowed numeric-string conversion. Do not apply it to event fields or to stored JSON.
- Initialize the controls from `DEFAULT_EXPOSURE_MIX` unless `parseStoredExposureMix` returns a valid saved mix whose four percentages are all members of those dropdown increments. Otherwise ignore the stored mix and use the default.
- Retain the argument of every `renderEventIntoPage` call, including nullish events, and recalculate immediately. Assign the retained event at the start of `renderEventIntoPage`, before its nullish early return, so a later nullish call clears a previous personal score into the unavailable state. Also recalculate when client refresh replaces that event. Call exported `computePersonalExposure` on that retained event and the current numeric mix. Do not fetch inside calculator handlers.
- Leave `loadStressScore` as the only financial-stress fetch. Its existing failure path does not call `renderEventIntoPage` and must not be given a second fetch. On that failure, keep the last retained event when one exists; if none has been retained yet, remain in the unavailable state.
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
  - whenever the mix is valid, save the string from `serializeExposureMix` under `EXPOSURE_MIX_STORAGE_KEY`; immediately before a calculator signup submission, save again only when that call returns a string;
  - never write `null`, never store the string `"null"`, and never remove the key because the current mix is invalid;
  - restore through `parseStoredExposureMix` on later visits, ignoring `null` safely;
  - ignore storage read and write exceptions and continue with the in-memory mix;
  - POST to the existing `/api/mailing-list/signup` endpoint with exactly `{ email, list: EXPOSURE_ALERT_LIST }` and no portfolio fields;
  - allow that signup whether or not the current mix is valid;
  - preserve the existing verification-code behavior: both forms POST `{ username, code }` to `/verifyEmailCode`, using that form’s own pending email as `username`;
  - use separate mutable pending-email state, status regions, and verify controls for the calculator and general signup forms;
  - state that the mix is stored in this browser and that signup covers material LiquidityWatch updates. Do not claim that the current API stores the allocation or already performs server-side personalized dispatch.
- Keep the existing general `financial_stress_alerts` signup independently functional, including its existing payload.
- Factor duplicated signup/verification behavior into a small reusable client-side function if necessary, without adding a library or changing the general form’s endpoint payload. Each path must independently handle success, `needsVerification`, API errors, and network failures, including re-enabling the submit control after a failure.
- Make calculator status messages accessible with an `aria-live="polite"` region, preserve keyboard operation, and provide visible focus states for all new controls. Do not remove the focus outline unless a visible replacement is shown.
- Ensure the layout remains readable at the existing 480px mobile breakpoint, with no horizontal overflow and stacked allocation controls.
- Update `README.md` to mention the ungated calculator, its transparent derivative nature, the local saved mix, the scenario result, and the attributed optional alert signup.
- Do not modify `server.js` or `public/render.js` in this phase. The existing cached SSR event and existing browser refresh remain the only event-loading paths.

### Acceptance Criteria

- A visitor can calculate and inspect the score, band, scenario, and full formula without supplying an email.
- Changing any allocation or leverage control updates the result without a network request. The page passes parsed numbers into the helpers, so a valid on-grid mix is not rejected as a numeric string.
- Invalid totals never produce a score.
- The calculator computes for the event already passed to `renderEventIntoPage`, including a nullish event, and recomputes when client refresh replaces that event. Refreshing `#score-panel` does not destroy the calculator.
- A `loadStressScore` failure does not start another financial-stress fetch and does not discard an already retained event.
- Missing asset utilities still yield the deterministic neutral-fallback result.
- A valid on-grid mix survives reload through local storage; malformed stored data, or a mix that does not fit the dropdown increments, leaves the page on the default mix. An invalid in-memory mix does not overwrite a previously stored valid mix.
- Calculator signup sends exactly the exported calculator list attribution, while general signup retains `financial_stress_alerts`. Both verification posts use `{ username, code }`.
- Both signup paths handle success, verification-required responses, API errors, and retryable failures independently.
- Existing score, subscore, classification, briefing, and mailing-list rendering continue to work, including non-JS SSR injection, because every `renderIndexHtml` search string still matches `index.html`.
- The page remains usable on mobile and by keyboard.
- No new endpoint, dependency, financial-stress fetch, monetization surface, or email gate is introduced.
- The configured verification command passes.
```
```

### Reviewer 4: devin

Status: approved

Reason: Spec is internally consistent, edge cases (overlapping band boundaries, fallback-utility reuse in scenario, storage guard rails, SSR anchor preservation, event-retention lifecycle) are fully covered and cross-phase constraints align.

Raw Response:

```text
---STATUS---
status: approved
reason: Spec is internally consistent, edge cases (overlapping band boundaries, fallback-utility reuse in scenario, storage guard rails, SSR anchor preservation, event-retention lifecycle) are fully covered and cross-phase constraints align.
```

### Reviewer 5: local

Status: approved

Reason: (no reason provided by reviewer)

Raw Response:

```text
---STATUS---
status: approved
```

Round Result: not converged

At least one reviewer requested revision in round 2.

## Final Outcome

Needs human review after 2 rounds; spec-draft.md left in place.
