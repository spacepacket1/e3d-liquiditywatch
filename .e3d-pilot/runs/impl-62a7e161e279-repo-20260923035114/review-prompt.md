You are the review stage of an autonomous repo-improvement pipeline.
Read the executed diff below and comment on correctness, regressions,
and scope-creep. Keep the response concise and actionable.

After your comments, end your response with exactly this block, on its
own lines, verbatim -- no markdown heading, comment, or bold syntax
around any of these lines:

---VERDICT---
status: approved
reason: <one-line reason>

Use "status: blocked" in place of "status: approved" only for a real
defect that must be fixed before this is merged -- a regression, a
correctness bug, a security issue. Not a style nit or an optional
suggestion; those belong in your comments above, not in a blocked verdict.
The line "---VERDICT---" must appear verbatim and on its own line; it is
a fixed parser marker, not a section title to be reworded or restyled.

Executed diff:

```diff
diff --git a/.codex-spec-runner/context.md b/.codex-spec-runner/context.md
new file mode 100644
index 0000000..7b3b160
--- /dev/null
+++ b/.codex-spec-runner/context.md
@@ -0,0 +1,34 @@
+# Shared Repo Context
+
+- Timestamp: 2026-09-22 21:47:19 PDT
+- Root directory: /var/folders/vn/jrwn6x0579v_26grcpvwp_200000gn/T/e3d-pilot.impl-62a7e161e279-repo-20260923035114.RPppUp
+- Git branch: e3d-pilot/impl-62a7e161e279-repo-20260923035114
+
+## Git Status Summary
+- ?? .codex-spec-runner/
+- ?? .e3d-pilot/
+- ?? node_modules
+
+## Top-Level Layout
+- .codex-spec-runner
+- .e3d-pilot
+- .git
+- .gitignore
+- CLAUDE.md
+- docs
+- node_modules
+- package-lock.json
+- package.json
+- public
+- README.md
+- server.js
+
+## Detected Package and Config Files
+- package-lock.json
+- package.json
+
+## Likely Verification Commands
+- npm test
+
+## Common Read Files
+- package.json (present)
diff --git a/.codex-spec-runner/manifest.tsv b/.codex-spec-runner/manifest.tsv
new file mode 100644
index 0000000..6d53654
--- /dev/null
+++ b/.codex-spec-runner/manifest.tsv
@@ -0,0 +1,2 @@
+2026-09-22T21:47:19-0700	/var/folders/vn/jrwn6x0579v_26grcpvwp_200000gn/T//e3d-pilot.impl-62a7e161e279-repo-20260923035114.RPppUp/.e3d-pilot/runs/impl-62a7e161e279-repo-20260923035114/spec-final.md	1	Deterministic Calculator Model	codex	gpt-5.6-sol	exec	0	0
+2026-09-22T21:52:33-0700	/var/folders/vn/jrwn6x0579v_26grcpvwp_200000gn/T//e3d-pilot.impl-62a7e161e279-repo-20260923035114.RPppUp/.e3d-pilot/runs/impl-62a7e161e279-repo-20260923035114/spec-final.md	2	Ungated Calculator and Alert Signup Experience	codex	gpt-5.6-sol	exec	0	0
diff --git a/.codex-spec-runner/summaries/phase-1.md b/.codex-spec-runner/summaries/phase-1.md
new file mode 100644
index 0000000..123ac56
--- /dev/null
+++ b/.codex-spec-runner/summaries/phase-1.md
@@ -0,0 +1,36 @@
+# Phase 1 Summary
+
+- Phase: 1
+- Title: Deterministic Calculator Model
+- Provider: codex
+- Model: gpt-5.6-sol
+- Completed: 2026-09-22T21:47:19-0700
+- Exit status: 0
+
+## Implementation Handoff
+
+- Implemented the Phase 1 deterministic Personal Liquidity Exposure model in `public/render.js`.
+- Exported the required defaults, storage/list constants, mix normalization/storage helpers, and calculator contract.
+- Browser classic-script loading now publishes the same export object on `globalThis.RENDER_EXPORTS`.
+- Calculator inputs remain pure and DOM/network/storage/time independent; invalid inputs return the specified failures.
+- Asset utilities use first-match case-insensitive lookup and existing schema-aware scaling, with neutral fallbacks.
+- Current and next-regime scores reuse `GAUGE_BANDS`/`gaugeBand`, including shared-edge first-match behavior.
+- Scenario utilities reuse current fallbacks; leverage, clamp, and final rounding follow the specified order.
+- Added focused built-in Node coverage in `test/exposure-calculator.test.js` for arithmetic, boundaries, fallbacks, scenarios, persistence, browser export, errors, and non-mutation.
+- Documented the derivative formula and interpretation in `docs/MODEL.md` without changing the headline band table.
+- Updated `CLAUDE.md` to identify this as the sole narrow presentation-derivative exception.
+- Passed: `node --check server.js`, `node --check public/render.js`, and all 16 calculator tests.
+- `npm install` could not complete because registry DNS is unavailable (`ENOTFOUND registry.npmjs.org`); no dependency or lockfile changes were made.
+- Unresolved follow-ups: none for Phase 1; Phase 2 UI work remains intentionally out of scope.
+
+## Verification
+- passed: `npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js`
+
+## Worktree Snapshot
+- ` M CLAUDE.md`
+- ` M docs/MODEL.md`
+- ` M package-lock.json`
+- ` M public/render.js`
+- `?? .codex-spec-runner/`
+- `?? .e3d-pilot/`
+- `?? test/`
diff --git a/.codex-spec-runner/summaries/phase-2.md b/.codex-spec-runner/summaries/phase-2.md
new file mode 100644
index 0000000..3e5c766
--- /dev/null
+++ b/.codex-spec-runner/summaries/phase-2.md
@@ -0,0 +1,40 @@
+# Phase 2 Summary
+
+- Phase: 2
+- Title: Ungated Calculator and Alert Signup Experience
+- Provider: codex
+- Model: gpt-5.6-sol
+- Completed: 2026-09-22T21:52:33-0700
+- Exit status: 0
+
+## Implementation Handoff
+
+- Added the responsive, ungated Personal Liquidity Exposure section between the headline score and subscore sections.
+- Preserved every exact SSR replacement anchor and kept the calculator outside all dynamically replaced panels.
+- Added labeled 0–100 allocation dropdowns, leverage control, inline validation, unavailable state, shared gauge result, interpretation, scenario, disclaimer, and expandable full methodology/components.
+- Calculator calls only `globalThis.RENDER_EXPORTS` helpers and parses only verified dropdown option values as base-10 integers.
+- Retained every event passed to `renderEventIntoPage`, including nullish values, and recalculates without adding a financial-stress fetch.
+- Added guarded local restoration/persistence for valid on-grid mixes; invalid mixes never overwrite saved valid state.
+- Added an independent optional calculator alert/verification flow using the exported calculator list and no portfolio payload.
+- Refactored general and calculator signup behavior through one reusable closure, retaining separate pending emails, controls, and status regions.
+- Preserved the general `financial_stress_alerts` payload and `{ username, code }` verification contract.
+- Updated README coverage for the derivative, local mix, scenario, and attributed optional alerts.
+- Added focused Phase 2 UI/runtime tests for anchors, option grids, retained/null events, persistence, restoration, payloads, verification, and failures.
+- Passed the configured verification command, including `npm install`, syntax checks, 16 model tests, and all SSR anchor checks.
+- Passed 8 additional Phase 2 UI/runtime tests and `git diff --check`.
+- Browser/HTTP visual smoke testing was unavailable because browser tooling was not exposed and local port binding is blocked (`EPERM`).
+- Unresolved implementation follow-ups: none.
+
+## Verification
+- passed: `npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js && node -e "const fs=require('fs');const html=fs.readFileSync('public/index.html','utf8');const anchors=['<div class=\"score-panel\" id=\"score-panel\">\n      <div class=\"empty-state\">Loading&hellip;</div>\n    </div>','<section id=\"subscore-breakdown\" hidden>','<div class=\"subscore-panel\" id=\"subscore-panel\"></div>','<section id=\"classification-body\" hidden>','<div class=\"classification-panel\" id=\"classification-panel\"></div>','<section id=\"newsletter-body\" hidden>','<div class=\"newsletter-panel\" id=\"newsletter-panel\"></div>'];if(anchors.some(s=>!html.includes(s))){console.error('SSR anchor missing');process.exit(1);}"`
+
+## Worktree Snapshot
+- ` M CLAUDE.md`
+- ` M README.md`
+- ` M docs/MODEL.md`
+- ` M package-lock.json`
+- ` M public/index.html`
+- ` M public/render.js`
+- `?? .codex-spec-runner/`
+- `?? .e3d-pilot/`
+- `?? test/`
diff --git a/.e3d-pilot/runs/impl-62a7e161e279-repo-20260923035114/spec-final.md b/.e3d-pilot/runs/impl-62a7e161e279-repo-20260923035114/spec-final.md
new file mode 100644
index 0000000..76bb676
--- /dev/null
+++ b/.e3d-pilot/runs/impl-62a7e161e279-repo-20260923035114/spec-final.md
@@ -0,0 +1,197 @@
+# Personal Liquidity Exposure Calculator
+
+## Overview
+
+Add a fully ungated, deterministic Personal Liquidity Exposure calculator to the existing single-page LiquidityWatch experience. It uses the already-loaded financial-stress event, requires no additional data fetches or LLM calls, exposes its methodology, shows a next-regime scenario, and converts through the existing mailing-list flow.
+
+## Goals
+
+- Calculate a transparent 0–100 exposure score from portfolio allocations, leverage, `event.final_score`, and BTC/ETH/XRP `utility_score` values.
+- Reuse the existing six LiquidityWatch regime bands through the existing `GAUGE_BANDS` table and `gaugeBand` helper.
+- Show the current result and a next-macro-regime scenario without an email gate.
+- Save one valid mix locally and attribute alert signups with `list: "liquiditywatch-exposure-calculator"`.
+- Preserve the existing general mailing-list signup and verification flow.
+- Provide deterministic unit coverage for scoring, boundaries, missing data, scenario calculations, and stored-mix parsing.
+
+## Non-Goals
+
+- Paid plans, billing, custom thresholds, multiple portfolios, allocation history, sharing, or a public API.
+- New upstream fields, endpoints, data fetching, LLM calls, schedulers, or scoring-pipeline code.
+- Implementing downstream personalized email dispatch, which remains owned by the external API producer.
+- Treating the calculator as investment advice or a market-price prediction.
+- Persisting portfolio allocations on the server; the mix is saved only in the visitor’s browser.
+- Changing `docs/API-CONTRACT.md`, `server.js`, `public/about.html`, or any regime boundary.
+- “Fixing” the inclusive overlapping edges in `GAUGE_BANDS` or in `gaugeBand`.
+
+## Existing Files
+
+- `public/render.js` contains build-free helpers shared by browser rendering and server-side rendering. `GAUGE_BANDS`, `gaugeBand`, and `scaledUnitPercent` already live here. `RENDER_EXPORTS` is assigned to `module.exports` only under Node. Top-level `const` bindings in this classic script are not visible to the later inline script in `public/index.html`; top-level `function` declarations are.
+- `public/index.html` contains the page markup, styles, client refresh, mailing-list signup, and verification logic. `renderEventIntoPage` replaces the contents of `#score-panel` and the analytical panels. `loadStressScore` is the only client financial-stress fetch.
+- `server.js` fetches and briefly caches the current event for SSR. `renderIndexHtml` injects that event by exact `String.prototype.replace` searches against the `index.html` template. Those search strings are the score-panel element whose placeholder is `Loading&hellip;`, plus the `hidden` subscore, classification, and newsletter section openers and their empty panel divs.
+- `docs/MODEL.md` defines the headline score and its six regimes.
+- `CLAUDE.md` defines the presentation-only repository boundary.
+- `README.md` describes the deployed product and repository.
+- `docs/API-CONTRACT.md` documents the existing event and mailing-list contracts. Asset utilities are `event.asset_triggers[].utility_score`, with `event.schema_version` selecting the v1 0–1 scale. Signup is `{ email, list }`. Verification is `{ username, code }` posted to `/verifyEmailCode`.
+
+## Shared Constraints
+
+- Keep the implementation within the no-build, framework-free CommonJS/browser pattern already used by `public/render.js`. Do not convert it to an ES module.
+- The calculator is a narrow presentation-layer exception to the repository’s “compute nothing” rule: it may derive a user-facing score from published fields but must not alter, replace, or present itself as the upstream Financial Stress Score.
+- Use the event already obtained by the existing page load. Calculator changes must never initiate another financial-stress API request.
+- Treat every event field as optional. Missing or malformed asset utility data must degrade neutrally rather than disable the calculator or imply maximum risk.
+- Normalize v1 and legacy utility-score scales through the existing `scaledUnitPercent(rawValue, schemaVersion)` convention, passing `event.schema_version` as `schemaVersion`. Do not reimplement that scale split.
+- Use the existing `GAUGE_BANDS` and `gaugeBand` helpers. Do not create a second regime table or hard-code regime thresholds in the calculator.
+- Clamp all source and derived values to their documented ranges. `scaledUnitPercent` may already round a resolved utility. The calculator itself rounds only the final displayed personal scores, using JavaScript `Math.round` (half away from zero for positive values), after clamping. Do not round stresses, base exposure, or the pre-clamp leveraged product.
+- Portfolio percentages must be finite numbers from 0 through 100 inclusive and must total exactly 100 before a result is shown. Helper inputs must not coerce numeric strings. The page parses its own dropdown values before calling those helpers, as Phase 2 specifies; that parse does not apply to event fields or stored JSON.
+- Preserve both existing mailing-list forms and the `/verifyEmailCode` flow.
+- Do not add dependencies, a build step, analytics, cookies, or server-side portfolio storage.
+- Keep all calculator copy explicit that it is an informational stress sensitivity, not expected performance, loss probability, or investment advice. Do not use “expected return”, “probability of loss”, “will lose”, or price targets.
+- Keep the complete change below 30 files and 3,200 changed lines.
+
+## Phase 1 — Deterministic Calculator Model
+
+<!-- runner:model=codex:gpt-5.6-sol -->
+<!-- pilot:touches=public/render.js -->
+<!-- pilot:touches=test/exposure-calculator.test.js -->
+<!-- pilot:touches=docs/MODEL.md -->
+<!-- pilot:touches=CLAUDE.md -->
+<!-- runner:read=docs/API-CONTRACT.md -->
+<!-- runner:read=docs/MODEL.md -->
+<!-- runner:read=public/render.js -->
+<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js -->
+
+### Requirements
+
+- Add pure, DOM-free calculator helpers to `public/render.js` and put them on `RENDER_EXPORTS` for Node tests. When `module.exports` is unavailable, assign that same object to `globalThis.RENDER_EXPORTS` so the later classic script in `index.html` can call it. Do not rely on top-level `const` names crossing script tags.
+- Export this exact contract:
+  - `DEFAULT_EXPOSURE_MIX`: `{ cashEquities: 70, btc: 10, eth: 10, xrp: 10, leveraged: false }`.
+  - `EXPOSURE_MIX_STORAGE_KEY`: `"liquiditywatch.personalExposureMix.v1"`.
+  - `EXPOSURE_ALERT_LIST`: `"liquiditywatch-exposure-calculator"`.
+  - `normalizeExposureMix(mix)`: return `{ ok: true, mix }` or `{ ok: false, reason: "invalid-mix" }`. Do not mutate the input. A valid mix is a non-null, non-array object whose `cashEquities`, `btc`, `eth`, and `xrp` are each finite numbers in `[0, 100]` and sum to exactly 100. `leveraged` is `true` only when the input value is strictly `true`; any other leverage value means `false` when the percentages are valid. Return a new object containing only those five fields.
+  - `serializeExposureMix(mix)`: normalize first. Return `null` when invalid. Otherwise return a JSON string `{ v: 1, cashEquities, btc, eth, xrp, leveraged }` of the normalized mix.
+  - `parseStoredExposureMix(raw)`: accept a version-1 JSON string or a non-array object. Require `v`, `cashEquities`, `btc`, `eth`, `xrp`, and `leveraged` to be present as own properties, require `v === 1`, validate the percentage and leverage values with `normalizeExposureMix`, and return the normalized mix object. A present `leveraged` value follows `normalizeExposureMix`: only strict `true` becomes `true`, and every other value becomes `false`. Return `null` for corrupt JSON, non-objects, arrays, a missing or non-1 `v`, any missing required stored field, obsolete, partial, or invalid data. Do not mutate the input and do not throw.
+  - `computePersonalExposure(event, mix)`: do not mutate `event` or `mix`. A null or non-object event does not throw. Return:
+    - `ok: false`, `reason: "invalid-mix"`, `current: null`, `scenario: null`, and `components: null` when the mix is invalid. This reason wins even if `event` is missing or `final_score` is also missing.
+    - `ok: false`, `reason: "missing-score"`, `current: null`, `scenario: null`, and `components: null` when the mix is valid but `event` is missing or `event.final_score` is not a finite number. Do not coerce strings.
+    - Otherwise `ok: true`, `reason: null`, plus `current`, `scenario`, and `components`.
+- Resolve BTC, ETH, and XRP only from `event.asset_triggers`. If `asset_triggers` is missing or not an array, treat it as an empty list. Ignore entries that are null or not non-array objects. Identify a remaining entry by case-insensitive `asset` (`String(asset).toUpperCase()` equals `BTC`, `ETH`, or `XRP`). The first matching entry wins. Read `utility_score` only. Do not filter on `score_kind`, do not coerce with `Number`, and do not invent a new event field. This resolution must not throw.
+- Derive the current score with this public formula:
+  - Let `M` be finite `event.final_score`, clamped to 0–100.
+  - Let each asset utility `U` be `scaledUnitPercent(utility_score, event.schema_version)`, then clamped to 0–100.
+  - If the matching entry is absent, `utility_score` is not a finite number, or the scaled result is not a finite number, use `U = 100 - M` and mark that utility as a fallback. That choice makes the asset’s stress equal to `M`, neutral relative to the macro component. Compute this fallback once from the current clamped `M`.
+  - Cash/equities stress is `M`.
+  - Each crypto asset’s stress is `0.70 × M + 0.30 × (100 - U)`.
+  - Base exposure is `(cashEquities × cashStress + btc × btcStress + eth × ethStress + xrp × xrpStress) / 100`.
+  - If `leveraged` is strictly `true`, multiply base exposure by `1.15`; otherwise use `1`.
+  - Clamp that product to 0–100, then round once with `Math.round` to produce the displayed integer score.
+- `current` is `{ score, band }`, where `score` is that rounded integer and `band` is the existing `gaugeBand(score)` result, including that helper’s current first-match boundary behavior.
+- `components` uses exactly this shape, and Phase 2 must render methodology from it rather than recomputing:
+  - `macroScore`: clamped, unrounded `M`.
+  - `utilities.btc`, `utilities.eth`, and `utilities.xrp`: each `{ score, fallback }`, where `score` is the resolved `U` and `fallback` is `true` only for the neutral path.
+  - `stresses.cashEquities`, `stresses.btc`, `stresses.eth`, and `stresses.xrp`: the four unrounded stresses.
+  - `baseExposure`: the unrounded weighted exposure.
+  - `leverageFactor`: `1.15` or `1`.
+  - `preClampScore`: the unrounded value after multiplying by the leverage factor and before the final clamp and round. This may lie outside 0–100.
+- Derive the next-regime scenario from `GAUGE_BANDS` and `gaugeBand` only. After `gaugeBand` classifies clamped `M`, find that band’s object in `GAUGE_BANDS` and take the next array entry. If there is no next entry, `scenario` is `null`. Otherwise choose the scenario macro input as follows:
+  - Use the next band’s `min` when `gaugeBand(next.min) === nextBand` by object identity.
+  - Otherwise use `currentBand.max + 1` when `gaugeBand(currentBand.max + 1) === nextBand` by object identity.
+  - If neither probe classifies as that same next band, `scenario` is `null`. Do not scan further entries or invent another offset.
+  - The current table’s inclusive shared edges make the first branch fail: `gaugeBand` keeps 15, 35, 55, 75, and 90 in the lower band. The second branch therefore yields exactly 16, 36, 56, 76, and 91. Those are entry points, not the stored `min` values (`0, 15, 35, 55, 75, 90`). Do not hard-code either list in the calculator.
+  - Replace `M` with that scenario macro input and keep allocation, leverage, and the already resolved utility values unchanged. Do not recompute a neutral fallback from the scenario macro input. Recalculate stresses, base, leverage, clamp, round, and `gaugeBand` with the same formula.
+  - `scenario` is `{ macroScore, score, band, delta }`. `macroScore` is the scenario macro input. `score` is the rounded personal score. `band` is `gaugeBand(score)` for that personal score, not a separately classified macro band. `delta` is the integer `scenario.score - current.score`.
+- Tests must read the exported `GAUGE_BANDS` and `gaugeBand` and assert that this derivation, not a literal table rewrite, produces exactly 16, 36, 56, 76, and 91, and that the highest band’s label is Market Dysfunction. Also assert that `gaugeBand` at 15, 35, 55, 75, and 90 stays on the lower band.
+- Add focused Node built-in tests covering:
+  - all-cash/equities exposure, where an unlevered 100% cash/equities mix displays the rounded clamped macro score;
+  - crypto-weighted exposure, with the expected value calculated from the documented formula;
+  - leveraged clamping after multiplication and before rounding, including a `preClampScore` above 100;
+  - `Math.round` half-away-from-zero behavior on a positive `.5` result at or below 100;
+  - legacy and v1 utility scales through the existing `scaledUnitPercent` behavior, including passing `schema_version`;
+  - case-insensitive asset lookup and first-match wins;
+  - missing and malformed utility fallbacks, including non-numbers, non-finite values, and the identity that fallback crypto stress equals `M`;
+  - a missing `asset_triggers`, a non-array `asset_triggers`, a null entry, and a non-object entry do not throw and use the neutral fallback;
+  - no `Number()` coercion of `null` or numeric strings into a real utility;
+  - invalid allocations, non-finite values, values outside 0–100, and totals other than exactly 100;
+  - all six personal-score bands and their existing first-match boundary values;
+  - next-regime macro bounds, unchanged fallback utilities, personal score, personal band, and signed delta, plus `scenario: null` in the highest regime;
+  - a null event, a missing score, and a non-finite `final_score` returning `missing-score` without throwing;
+  - invalid mix taking precedence over a missing event or missing score;
+  - non-mutation of the supplied event and mix;
+  - round-trip, rejection, and non-throwing behavior of `serializeExposureMix` and `parseStoredExposureMix`, including a missing required stored field, a non-1 `v`, and corrupt JSON.
+- Update `docs/MODEL.md` with a clearly separated “Personal Liquidity Exposure” presentation derivative. Document the exact formula, `schema_version` utility scaling, neutral utility fallback and its reuse in the scenario, leverage-then-clamp-then-round order, the overlapping-band scenario rule, signed delta, interpretation, and its distinction from the upstream headline model. Do not change the headline band table.
+- Update `CLAUDE.md` to record this calculator as the sole narrow deterministic presentation derivative currently allowed, while retaining the prohibition on pipeline scoring, ingestion, and LLM calls.
+- The configured verification command includes `node --test test/exposure-calculator.test.js`.
+
+### Acceptance Criteria
+
+- The same input event and portfolio always produce the same integer result.
+- Tests independently demonstrate the documented arithmetic, fallback, and next-regime entry behavior.
+- No helper accesses DOM, network, storage, environment, or time APIs.
+- Malformed `asset_triggers` does not throw.
+- No API contract, upstream score semantics, or regime boundary is changed.
+- The methodology in `docs/MODEL.md` exactly matches the tested implementation.
+- `node --test test/exposure-calculator.test.js` passes.
+- The configured verification command passes.
+
+## Phase 2 — Ungated Calculator and Alert Signup Experience
+
+<!-- runner:model=codex:gpt-5.6-sol -->
+<!-- pilot:touches=public/index.html -->
+<!-- pilot:touches=README.md -->
+<!-- runner:read=public/render.js -->
+<!-- runner:read=docs/API-CONTRACT.md -->
+<!-- runner:read=docs/MODEL.md -->
+<!-- runner:read=server.js -->
+<!-- runner:verify=npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js && node -e "const fs=require('fs');const html=fs.readFileSync('public/index.html','utf8');const anchors=['<div class=\"score-panel\" id=\"score-panel\">\n      <div class=\"empty-state\">Loading&hellip;</div>\n    </div>','<section id=\"subscore-breakdown\" hidden>','<div class=\"subscore-panel\" id=\"subscore-panel\"></div>','<section id=\"classification-body\" hidden>','<div class=\"classification-panel\" id=\"classification-panel\"></div>','<section id=\"newsletter-body\" hidden>','<div class=\"newsletter-panel\" id=\"newsletter-panel\"></div>'];if(anchors.some(s=>!html.includes(s))){console.error('SSR anchor missing');process.exit(1);}" -->
+
+### Requirements
+
+- Add a responsive “Personal Liquidity Exposure” section to `public/index.html` after `section#stress-score` and before `section#subscore-breakdown`. Keep its markup outside `#score-panel` and outside every node whose `innerHTML` `renderEventIntoPage` replaces.
+- Do not modify `server.js`. Every existing `renderIndexHtml` search string must still occur byte-for-byte in `index.html`, including the score panel’s `Loading&hellip;` placeholder and the `hidden` attributes on the subscore, classification, and newsletter sections. Add the calculator as a new sibling section without rewriting those anchors.
+- Call calculator helpers through `globalThis.RENDER_EXPORTS`. Do not reimplement the formula and do not reference top-level `const` names from `render.js`.
+- Provide accessible labeled dropdowns for cash/equities, BTC, ETH, and XRP allocations using 10-point increments from 0% through 100%, plus a leverage/margin checkbox.
+- Parse each selected allocation with a base-10 conversion that accepts only that control’s own option values (`"0"`, `"10"`, …, `"100"`). Pass the resulting numbers, never the raw strings, to `normalizeExposureMix` and `computePersonalExposure`. This is the only allowed numeric-string conversion. Do not apply it to event fields or to stored JSON.
+- Initialize the controls from `DEFAULT_EXPOSURE_MIX` unless `parseStoredExposureMix` returns a valid saved mix whose four percentages are all members of those dropdown increments. Otherwise ignore the stored mix and use the default.
+- Retain the argument of every `renderEventIntoPage` call, including nullish events, and recalculate immediately. Assign the retained event at the start of `renderEventIntoPage`, before its nullish early return, so a later nullish call clears a previous personal score into the unavailable state. Also recalculate when client refresh replaces that event. Call exported `computePersonalExposure` on that retained event and the current numeric mix. Do not fetch inside calculator handlers.
+- Leave `loadStressScore` as the only financial-stress fetch. Its existing failure path does not call `renderEventIntoPage` and must not be given a second fetch. On that failure, keep the last retained event when one exists; if none has been retained yet, remain in the unavailable state.
+- Keep the controls usable before event data arrives. Until the result is `ok`, show a calm unavailable/loading state and no score when the retained event has no finite `final_score`.
+- When the mix is invalid, show an inline validation message and suppress the score, scenario, and methodology values. `computePersonalExposure` reports only `invalid-mix` in that case, so the page must also inspect the retained event: if the mix is invalid and the score is missing, show both the validation message and the unavailable state.
+- For an `ok` result, show:
+  - the ungated 0–100 `current.score`;
+  - the shared LiquidityWatch band name and color from `current.band.label` and `current.band.color`, using the existing gauge presentation;
+  - a concise stress-sensitivity interpretation with no return, loss, probability, or price-target claim;
+  - when `scenario` exists, its personal score, next macro score, and signed delta (positive values shown with `+`); when `scenario` is `null`, an “already highest macro regime” message;
+  - a visible expandable methodology explanation that quotes the documented formula and displays the returned `components`, including fallback utilities and `preClampScore`. Do not recompute those values in `index.html`.
+- Clearly distinguish the personal derivative from the upstream U.S. Financial Stress Score.
+- Include an informational/not-investment-advice disclaimer adjacent to the result.
+- Add a dedicated optional alert signup within the calculator section:
+  - whenever the mix is valid, save the string from `serializeExposureMix` under `EXPOSURE_MIX_STORAGE_KEY`; immediately before a calculator signup submission, save again only when that call returns a string;
+  - never write `null`, never store the string `"null"`, and never remove the key because the current mix is invalid;
+  - restore through `parseStoredExposureMix` on later visits, ignoring `null` safely;
+  - ignore storage read and write exceptions and continue with the in-memory mix;
+  - POST to the existing `/api/mailing-list/signup` endpoint with exactly `{ email, list: EXPOSURE_ALERT_LIST }` and no portfolio fields;
+  - allow that signup whether or not the current mix is valid;
+  - preserve the existing verification-code behavior: both forms POST `{ username, code }` to `/verifyEmailCode`, using that form’s own pending email as `username`;
+  - use separate mutable pending-email state, status regions, and verify controls for the calculator and general signup forms;
+  - state that the mix is stored in this browser and that signup covers material LiquidityWatch updates. Do not claim that the current API stores the allocation or already performs server-side personalized dispatch.
+- Keep the existing general `financial_stress_alerts` signup independently functional, including its existing payload.
+- Factor duplicated signup/verification behavior into a small reusable client-side function if necessary, without adding a library or changing the general form’s endpoint payload. Each path must independently handle success, `needsVerification`, API errors, and network failures, including re-enabling the submit control after a failure.
+- Make calculator status messages accessible with an `aria-live="polite"` region, preserve keyboard operation, and provide visible focus states for all new controls. Do not remove the focus outline unless a visible replacement is shown.
+- Ensure the layout remains readable at the existing 480px mobile breakpoint, with no horizontal overflow and stacked allocation controls.
+- Update `README.md` to mention the ungated calculator, its transparent derivative nature, the local saved mix, the scenario result, and the attributed optional alert signup.
+- Do not modify `server.js` or `public/render.js` in this phase. The existing cached SSR event and existing browser refresh remain the only event-loading paths.
+
+### Acceptance Criteria
+
+- A visitor can calculate and inspect the score, band, scenario, and full formula without supplying an email.
+- Changing any allocation or leverage control updates the result without a network request. The page passes parsed numbers into the helpers, so a valid on-grid mix is not rejected as a numeric string.
+- Invalid totals never produce a score.
+- The calculator computes for the event already passed to `renderEventIntoPage`, including a nullish event, and recomputes when client refresh replaces that event. Refreshing `#score-panel` does not destroy the calculator.
+- A `loadStressScore` failure does not start another financial-stress fetch and does not discard an already retained event.
+- Missing asset utilities still yield the deterministic neutral-fallback result.
+- A valid on-grid mix survives reload through local storage; malformed stored data, or a mix that does not fit the dropdown increments, leaves the page on the default mix. An invalid in-memory mix does not overwrite a previously stored valid mix.
+- Calculator signup sends exactly the exported calculator list attribution, while general signup retains `financial_stress_alerts`. Both verification posts use `{ username, code }`.
+- Both signup paths handle success, verification-required responses, API errors, and retryable failures independently.
+- Existing score, subscore, classification, briefing, and mailing-list rendering continue to work, including non-JS SSR injection, because every `renderIndexHtml` search string still matches `index.html`.
+- The page remains usable on mobile and by keyboard.
+- No new endpoint, dependency, financial-stress fetch, monetization surface, or email gate is introduced.
+- The configured verification command passes.
diff --git a/CLAUDE.md b/CLAUDE.md
index cb6cbfc..079071c 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -14,9 +14,12 @@ lives **elsewhere in the E3D stack**. It is not in this repo and must not be add
 
 ## Rules
 
-1. **Compute nothing.** This repo renders a model it is handed. No scoring, no data
-   ingestion, no LLM calls. If a change needs new computed data, it needs a new field in
-   the API contract, not new code here.
+1. **Compute nothing upstream.** This repo renders a model it is handed. The sole narrow
+   exception is the deterministic Personal Liquidity Exposure presentation derivative
+   documented in `docs/MODEL.md`; it derives an informational visitor-specific score only
+   from published event fields and a local allocation. No pipeline scoring, data
+   ingestion, or LLM calls belong here. Any other computed model data requires a new API
+   contract field, not new presentation code.
 2. **The integration boundary is `docs/API-CONTRACT.md`** — the JSON contract with the
    `e3d.ai` API (`/api/financial-stress-monitor`, `/api/mailing-list/signup`,
    `/verifyEmailCode`). No shared code with the pipeline; the contract is the only joint.
diff --git a/README.md b/README.md
index 6f8830f..fa74a58 100644
--- a/README.md
+++ b/README.md
@@ -27,13 +27,15 @@ Every evaluation is stored, but only ones judged *materially different* from the
 - **A live gauge, 0–100** across six regimes — from *Accommodative* through *Mild Watchfulness*, *Contained Tension*, *Restrictive Policy*, the *Policy-Forcing Danger Zone*, up to *Market Dysfunction*.
 - **Trigger metrics tracked cycle-over-cycle**: Controlled Break Risk (odds current stress breaks into an uncontrolled crisis), Liquidity Response Probability (odds the Fed/Treasury actually supplies new support soon), and Phase (tightening → liquidity response beginning → full backstop underway).
 - **Asset triggers for BTC, ETH, and XRP** — a utility score for how much each is actually functioning as settlement/bridge liquidity right now, not just price momentum.
+- **An ungated Personal Liquidity Exposure calculator** — a transparent presentation derivative of the published U.S. Financial Stress Score, using a mix saved only in your browser. It shows the current personal stress sensitivity, its full formula, and a next-macro-regime scenario without requiring an email.
+- **Optional calculator alerts** — signup is attributed to the exposure calculator and covers material LiquidityWatch updates; portfolio allocations are not sent to or stored by the signup API.
 - **A mailing list** that emails you only on material moves — see [`/about`](https://liquiditywatch.e3d.ai/about.html) for the full methodology and scale.
 
 Fully automated end to end: a material evaluation publishes the moment the three-stage process completes, with no human-approval gate in the path. Not investment advice — an AI research and synthesis process, provided for informational purposes only.
 
 ## This repo
 
-Just the static front end: an Express server (`server.js`) serving `public/` — the gauge, the score panel, and the mailing-list signup — which reads live data from the `e3d.ai` API (`/api/financial-stress-monitor`, `/api/mailing-list/signup`). The scoring pipeline itself lives elsewhere in the E3D stack.
+Just the static front end: an Express server (`server.js`) serving `public/` — the gauge, score panel, deterministic personal-exposure calculator, and mailing-list signups — which reads live data from the `e3d.ai` API (`/api/financial-stress-monitor`, `/api/mailing-list/signup`). The scoring pipeline itself lives elsewhere in the E3D stack.
 
 ```
 npm install
diff --git a/docs/MODEL.md b/docs/MODEL.md
index 13b418c..417b6c7 100644
--- a/docs/MODEL.md
+++ b/docs/MODEL.md
@@ -51,7 +51,7 @@ human-authored; deterministic code decides what publishes.
 policy-forcing financial-system stress. This is the product's identity and stays 0–100
 (the gauge, the newsletter, `about.html`).
 
-> **Scale convention.** The headline score is the *only* 0–100 field. Every other
+> **Scale convention.** The headline score is the *only upstream* 0–100 field. Every other
 > magnitude in the model — sub-scores, node states, edge confidence, probabilities — is a
 > float **0.0–1.0**, matching E3D's `shared_enums`/`FlowGraph` convention
 > (`Field(ge=0.0, le=1.0)` throughout `e3d-maps/schemas/`). The front end scales for
@@ -81,6 +81,55 @@ liquidity ops, coordinated messaging; `SYSTEMIC_BACKSTOP` = emergency facilities
 guarantees; `MONETARY_REGIME_CHANGE` = yield-curve control, financial repression, major
 currency change.
 
+## 1.1 Personal Liquidity Exposure (presentation derivative)
+
+Personal Liquidity Exposure is the sole narrow deterministic score derived in this
+presentation repository. It is an informational 0–100 stress-sensitivity view of a
+visitor's chosen cash/equities, BTC, ETH, and XRP allocation. It is not the upstream U.S.
+Financial Stress Score, expected performance, a loss probability, investment advice, or
+a market-price prediction. The upstream headline model and its band table are unchanged.
+
+Let `M` be `final_score` clamped to 0–100. For each of BTC, ETH, and XRP, the calculator
+uses the first case-insensitive matching `asset_triggers` entry and reads only its
+`utility_score`. It passes that value and `schema_version` through
+`scaledUnitPercent`: v1 values use the 0.0–1.0 scale, while legacy events without a
+schema version use 0–100. The scaled utility `U` is clamped to 0–100. Missing,
+non-numeric, non-finite, or otherwise unusable utilities instead use the neutral fallback
+`U = 100 - M`; this makes that asset's stress exactly `M`.
+
+The component stresses and weighted exposure are:
+
+```
+cashStress = M
+cryptoStress(U) = 0.70 * M + 0.30 * (100 - U)
+baseExposure = (cashEquities * cashStress
+              + btc * btcStress
+              + eth * ethStress
+              + xrp * xrpStress) / 100
+preClampScore = baseExposure * (leveraged ? 1.15 : 1)
+personalScore = Math.round(clamp(preClampScore, 0, 100))
+```
+
+Allocations are percentages from 0 through 100 and must total exactly 100. Leverage is
+applied before clamping, and the displayed score is rounded only once, after clamping.
+The displayed score uses the existing headline regime-band labels and their existing
+first-match behavior at shared inclusive boundaries.
+
+The next-regime scenario is also presentation-only. The current macro band is found by
+classifying clamped `M` with `gaugeBand`; its next entry comes directly from the existing
+ordered band table. Because adjacent bands share inclusive boundaries, the next band's
+stored `min` is used only if `gaugeBand(next.min)` identifies that next band by object
+identity. Otherwise `currentBand.max + 1` is used only if it identifies the next band by
+the same test. If neither probe matches, or the current band is the last one, there is no
+scenario.
+
+The scenario replaces `M` with that next-regime macro input while keeping the allocation,
+leverage, and already resolved current utilities unchanged. In particular, a neutral
+fallback is computed once from current `M` and is not recomputed for the scenario. The
+same stress, weighting, leverage, clamp, round, and personal-band steps then run again.
+Its delta is the signed integer `scenario personalScore - current personalScore`; it
+describes sensitivity to the next macro regime, not a forecast.
+
 ---
 
 ## 2. Trigger metrics
diff --git a/package-lock.json b/package-lock.json
index 724dc0d..7d02417 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -1,28 +1,38 @@
 {
   "name": "e3d-liquiditywatch",
   "version": "1.0.0",
-  "lockfileVersion": 1,
+  "lockfileVersion": 3,
   "requires": true,
-  "dependencies": {
-    "accepts": {
+  "packages": {
+    "": {
+      "name": "e3d-liquiditywatch",
+      "version": "1.0.0",
+      "dependencies": {
+        "express": "^4.18.2"
+      }
+    },
+    "node_modules/accepts": {
       "version": "1.3.8",
       "resolved": "https://registry.npmjs.org/accepts/-/accepts-1.3.8.tgz",
       "integrity": "sha512-PYAthTa2m2VKxuvSD3DPC/Gy+U+sOA1LAuT8mkmRuvw+NACSaeXEQ+NHcVF7rONl6qcaxV3Uuemwawk+7+SJLw==",
-      "requires": {
+      "dependencies": {
         "mime-types": "~2.1.34",
         "negotiator": "0.6.3"
+      },
+      "engines": {
+        "node": ">= 0.6"
       }
     },
-    "array-flatten": {
+    "node_modules/array-flatten": {
       "version": "1.1.1",
       "resolved": "https://registry.npmjs.org/array-flatten/-/array-flatten-1.1.1.tgz",
       "integrity": "sha512-PCVAQswWemu6UdxsDFFX/+gVeYqKAod3D3UVm91jHwynguOwAvYPhx8nNlM++NqRcK6CxxpUafjmhIdKiHibqg=="
     },
-    "body-parser": {
+    "node_modules/body-parser": {
       "version": "1.20.6",
       "resolved": "https://registry.npmjs.org/body-parser/-/body-parser-1.20.6.tgz",
       "integrity": "sha512-p5tAzS57i5MV9fZFDj9LeIiTZEufbSe2eDozP+ElheSUq1m74CRq1jI4mYNDdVs9vQztXFLuk/Gd6BWTdwRJ5g==",
-      "requires": {
+      "dependencies": {
         "bytes": "~3.1.2",
         "content-type": "~1.0.5",
         "debug": "2.6.9",
@@ -35,125 +45,175 @@
         "raw-body": "~2.5.3",
         "type-is": "~1.6.18",
         "unpipe": "~1.0.0"
+      },
+      "engines": {
+        "node": ">= 0.8",
+        "npm": "1.2.8000 || >= 1.4.16"
       }
     },
-    "bytes": {
+    "node_modules/bytes": {
       "version": "3.1.2",
       "resolved": "https://registry.npmjs.org/bytes/-/bytes-3.1.2.tgz",
-      "integrity": "sha512-/Nf7TyzTx6S3yRJObOAV7956r8cr2+Oj8AC5dt8wSP3BQAoeX58NoHyCU8P8zGkNXStjTSi6fzO6F0pBdcYbEg=="
+      "integrity": "sha512-/Nf7TyzTx6S3yRJObOAV7956r8cr2+Oj8AC5dt8wSP3BQAoeX58NoHyCU8P8zGkNXStjTSi6fzO6F0pBdcYbEg==",
+      "engines": {
+        "node": ">= 0.8"
+      }
     },
-    "call-bind-apply-helpers": {
+    "node_modules/call-bind-apply-helpers": {
       "version": "1.0.2",
       "resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
       "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
-      "requires": {
+      "dependencies": {
         "es-errors": "^1.3.0",
         "function-bind": "^1.1.2"
+      },
+      "engines": {
+        "node": ">= 0.4"
       }
     },
-    "call-bound": {
+    "node_modules/call-bound": {
       "version": "1.0.4",
       "resolved": "https://registry.npmjs.org/call-bound/-/call-bound-1.0.4.tgz",
       "integrity": "sha512-+ys997U96po4Kx/ABpBCqhA9EuxJaQWDQg7295H4hBphv3IZg0boBKuwYpt4YXp6MZ5AmZQnU/tyMTlRpaSejg==",
-      "requires": {
+      "dependencies": {
         "call-bind-apply-helpers": "^1.0.2",
         "get-intrinsic": "^1.3.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
       }
     },
-    "content-disposition": {
+    "node_modules/content-disposition": {
       "version": "0.5.4",
       "resolved": "https://registry.npmjs.org/content-disposition/-/content-disposition-0.5.4.tgz",
       "integrity": "sha512-FveZTNuGw04cxlAiWbzi6zTAL/lhehaWbTtgluJh4/E95DqMwTmha3KZN1aAWA8cFIhHzMZUvLevkw5Rqk+tSQ==",
-      "requires": {
+      "dependencies": {
         "safe-buffer": "5.2.1"
+      },
+      "engines": {
+        "node": ">= 0.6"
       }
     },
-    "content-type": {
+    "node_modules/content-type": {
       "version": "1.0.5",
       "resolved": "https://registry.npmjs.org/content-type/-/content-type-1.0.5.tgz",
-      "integrity": "sha512-nTjqfcBFEipKdXCv4YDQWCfmcLZKm81ldF0pAopTvyrFGVbcR6P/VAAd5G7N+0tTr8QqiU0tFadD6FK4NtJwOA=="
+      "integrity": "sha512-nTjqfcBFEipKdXCv4YDQWCfmcLZKm81ldF0pAopTvyrFGVbcR6P/VAAd5G7N+0tTr8QqiU0tFadD6FK4NtJwOA==",
+      "engines": {
+        "node": ">= 0.6"
+      }
     },
-    "cookie": {
+    "node_modules/cookie": {
       "version": "0.7.2",
       "resolved": "https://registry.npmjs.org/cookie/-/cookie-0.7.2.tgz",
-      "integrity": "sha512-yki5XnKuf750l50uGTllt6kKILY4nQ1eNIQatoXEByZ5dWgnKqbnqmTrBE5B4N7lrMJKQ2ytWMiTO2o0v6Ew/w=="
+      "integrity": "sha512-yki5XnKuf750l50uGTllt6kKILY4nQ1eNIQatoXEByZ5dWgnKqbnqmTrBE5B4N7lrMJKQ2ytWMiTO2o0v6Ew/w==",
+      "engines": {
+        "node": ">= 0.6"
+      }
     },
-    "cookie-signature": {
+    "node_modules/cookie-signature": {
       "version": "1.0.7",
       "resolved": "https://registry.npmjs.org/cookie-signature/-/cookie-signature-1.0.7.tgz",
       "integrity": "sha512-NXdYc3dLr47pBkpUCHtKSwIOQXLVn8dZEuywboCOJY/osA0wFSLlSawr3KN8qXJEyX66FcONTH8EIlVuK0yyFA=="
     },
-    "debug": {
+    "node_modules/debug": {
       "version": "2.6.9",
       "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
       "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
-      "requires": {
+      "dependencies": {
         "ms": "2.0.0"
       }
     },
-    "depd": {
+    "node_modules/depd": {
       "version": "2.0.0",
       "resolved": "https://registry.npmjs.org/depd/-/depd-2.0.0.tgz",
-      "integrity": "sha512-g7nH6P6dyDioJogAAGprGpCtVImJhpPk/roCzdb3fIh61/s/nPsfR6onyMwkCAR/OlC3yBC0lESvUoQEAssIrw=="
+      "integrity": "sha512-g7nH6P6dyDioJogAAGprGpCtVImJhpPk/roCzdb3fIh61/s/nPsfR6onyMwkCAR/OlC3yBC0lESvUoQEAssIrw==",
+      "engines": {
+        "node": ">= 0.8"
+      }
     },
-    "destroy": {
+    "node_modules/destroy": {
       "version": "1.2.0",
       "resolved": "https://registry.npmjs.org/destroy/-/destroy-1.2.0.tgz",
-      "integrity": "sha512-2sJGJTaXIIaR1w4iJSNoN0hnMY7Gpc/n8D4qSCJw8QqFWXf7cuAgnEHxBpweaVcPevC2l3KpjYCx3NypQQgaJg=="
+      "integrity": "sha512-2sJGJTaXIIaR1w4iJSNoN0hnMY7Gpc/n8D4qSCJw8QqFWXf7cuAgnEHxBpweaVcPevC2l3KpjYCx3NypQQgaJg==",
+      "engines": {
+        "node": ">= 0.8",
+        "npm": "1.2.8000 || >= 1.4.16"
+      }
     },
-    "dunder-proto": {
+    "node_modules/dunder-proto": {
       "version": "1.0.1",
       "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
       "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
-      "requires": {
+      "dependencies": {
         "call-bind-apply-helpers": "^1.0.1",
         "es-errors": "^1.3.0",
         "gopd": "^1.2.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
       }
     },
-    "ee-first": {
+    "node_modules/ee-first": {
       "version": "1.1.1",
       "resolved": "https://registry.npmjs.org/ee-first/-/ee-first-1.1.1.tgz",
       "integrity": "sha512-WMwm9LhRUo+WUaRN+vRuETqG89IgZphVSNkdFgeb6sS/E4OrDIN7t48CAewSHXc6C8lefD8KKfr5vY61brQlow=="
     },
-    "encodeurl": {
+    "node_modules/encodeurl": {
       "version": "2.0.0",
       "resolved": "https://registry.npmjs.org/encodeurl/-/encodeurl-2.0.0.tgz",
-      "integrity": "sha512-Q0n9HRi4m6JuGIV1eFlmvJB7ZEVxu93IrMyiMsGC0lrMJMWzRgx6WGquyfQgZVb31vhGgXnfmPNNXmxnOkRBrg=="
+      "integrity": "sha512-Q0n9HRi4m6JuGIV1eFlmvJB7ZEVxu93IrMyiMsGC0lrMJMWzRgx6WGquyfQgZVb31vhGgXnfmPNNXmxnOkRBrg==",
+      "engines": {
+        "node": ">= 0.8"
+      }
     },
-    "es-define-property": {
+    "node_modules/es-define-property": {
       "version": "1.0.1",
       "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
-      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g=="
+      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
+      "engines": {
+        "node": ">= 0.4"
+      }
     },
-    "es-errors": {
+    "node_modules/es-errors": {
       "version": "1.3.0",
       "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
-      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw=="
+      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
+      "engines": {
+        "node": ">= 0.4"
+      }
     },
-    "es-object-atoms": {
+    "node_modules/es-object-atoms": {
       "version": "1.1.2",
       "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.2.tgz",
       "integrity": "sha512-HWcBoN6NileqtSydK2FqHbS/LoDd2pqrnQHLyJzBj4kOp/ky2MWMN694xOfkK8/SnUsW2DH7EfyVlydKCsm1Zw==",
-      "requires": {
+      "dependencies": {
         "es-errors": "^1.3.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
       }
     },
-    "escape-html": {
+    "node_modules/escape-html": {
       "version": "1.0.3",
       "resolved": "https://registry.npmjs.org/escape-html/-/escape-html-1.0.3.tgz",
       "integrity": "sha512-NiSupZ4OeuGwr68lGIeym/ksIZMJodUGOSCZ/FSnTxcrekbvqrgdUxlJOMpijaKZVjAJrWrGs/6Jy8OMuyj9ow=="
     },
-    "etag": {
+    "node_modules/etag": {
       "version": "1.8.1",
       "resolved": "https://registry.npmjs.org/etag/-/etag-1.8.1.tgz",
-      "integrity": "sha512-aIL5Fx7mawVa300al2BnEE4iNvo1qETxLrPI/o05L7z6go7fCw1J6EQmbK4FmJ2AS7kgVF/KEZWufBfdClMcPg=="
+      "integrity": "sha512-aIL5Fx7mawVa300al2BnEE4iNvo1qETxLrPI/o05L7z6go7fCw1J6EQmbK4FmJ2AS7kgVF/KEZWufBfdClMcPg==",
+      "engines": {
+        "node": ">= 0.6"
+      }
     },
-    "express": {
+    "node_modules/express": {
       "version": "4.22.2",
       "resolved": "https://registry.npmjs.org/express/-/express-4.22.2.tgz",
       "integrity": "sha512-IuL+Elrou2ZvCFHs18/CIzy2Nzvo25nZ1/D2eIZlz7c+QUayAcYoiM2BthCjs+EBHVpjYjcuLDAiCWgeIX3X1Q==",
-      "requires": {
+      "dependencies": {
         "accepts": "~1.3.8",
         "array-flatten": "1.1.1",
         "body-parser": "~1.20.5",
@@ -185,13 +245,20 @@
         "type-is": "~1.6.18",
         "utils-merge": "1.0.1",
         "vary": "~1.1.2"
+      },
+      "engines": {
+        "node": ">= 0.10.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/express"
       }
     },
-    "finalhandler": {
+    "node_modules/finalhandler": {
       "version": "1.3.2",
       "resolved": "https://registry.npmjs.org/finalhandler/-/finalhandler-1.3.2.tgz",
       "integrity": "sha512-aA4RyPcd3badbdABGDuTXCMTtOneUCAYH/gxoYRTZlIJdF0YPWuGqiAsIrhNnnqdXGswYk6dGujem4w80UJFhg==",
-      "requires": {
+      "dependencies": {
         "debug": "2.6.9",
         "encodeurl": "~2.0.0",
         "escape-html": "~1.0.3",
@@ -199,28 +266,40 @@
         "parseurl": "~1.3.3",
         "statuses": "~2.0.2",
         "unpipe": "~1.0.0"
+      },
+      "engines": {
+        "node": ">= 0.8"
       }
     },
-    "forwarded": {
+    "node_modules/forwarded": {
       "version": "0.2.0",
       "resolved": "https://registry.npmjs.org/forwarded/-/forwarded-0.2.0.tgz",
-      "integrity": "sha512-buRG0fpBtRHSTCOASe6hD258tEubFoRLb4ZNA6NxMVHNw2gOcwHo9wyablzMzOA5z9xA9L1KNjk/Nt6MT9aYow=="
+      "integrity": "sha512-buRG0fpBtRHSTCOASe6hD258tEubFoRLb4ZNA6NxMVHNw2gOcwHo9wyablzMzOA5z9xA9L1KNjk/Nt6MT9aYow==",
+      "engines": {
+        "node": ">= 0.6"
+      }
     },
-    "fresh": {
+    "node_modules/fresh": {
       "version": "0.5.2",
       "resolved": "https://registry.npmjs.org/fresh/-/fresh-0.5.2.tgz",
-      "integrity": "sha512-zJ2mQYM18rEFOudeV4GShTGIQ7RbzA7ozbU9I/XBpm7kqgMywgmylMwXHxZJmkVoYkna9d2pVXVXPdYTP9ej8Q=="
+      "integrity": "sha512-zJ2mQYM18rEFOudeV4GShTGIQ7RbzA7ozbU9I/XBpm7kqgMywgmylMwXHxZJmkVoYkna9d2pVXVXPdYTP9ej8Q==",
+      "engines": {
+        "node": ">= 0.6"
+      }
     },
-    "function-bind": {
+    "node_modules/function-bind": {
       "version": "1.1.2",
       "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
-      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA=="
+      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
     },
-    "get-intrinsic": {
+    "node_modules/get-intrinsic": {
       "version": "1.3.0",
       "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
       "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
-      "requires": {
+      "dependencies": {
         "call-bind-apply-helpers": "^1.0.2",
         "es-define-property": "^1.0.1",
         "es-errors": "^1.3.0",
@@ -231,185 +310,290 @@
         "has-symbols": "^1.1.0",
         "hasown": "^2.0.2",
         "math-intrinsics": "^1.1.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
       }
     },
-    "get-proto": {
+    "node_modules/get-proto": {
       "version": "1.0.1",
       "resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
       "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
-      "requires": {
+      "dependencies": {
         "dunder-proto": "^1.0.1",
         "es-object-atoms": "^1.0.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
       }
     },
-    "gopd": {
+    "node_modules/gopd": {
       "version": "1.2.0",
       "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
-      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg=="
+      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
     },
-    "has-symbols": {
+    "node_modules/has-symbols": {
       "version": "1.1.0",
       "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
-      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ=="
+      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
     },
-    "hasown": {
+    "node_modules/hasown": {
       "version": "2.0.4",
       "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.4.tgz",
       "integrity": "sha512-T2UbfbBEF32wiepXIsMlTW9+dDYC6wMh/t/vYA4tuOMKqWz/n3vr1NFSxQiyP+zk2mXsoMA/i/7qV6LKut1t1A==",
-      "requires": {
+      "dependencies": {
         "function-bind": "^1.1.2"
+      },
+      "engines": {
+        "node": ">= 0.4"
       }
     },
-    "http-errors": {
+    "node_modules/http-errors": {
       "version": "2.0.1",
       "resolved": "https://registry.npmjs.org/http-errors/-/http-errors-2.0.1.tgz",
       "integrity": "sha512-4FbRdAX+bSdmo4AUFuS0WNiPz8NgFt+r8ThgNWmlrjQjt1Q7ZR9+zTlce2859x4KSXrwIsaeTqDoKQmtP8pLmQ==",
-      "requires": {
+      "dependencies": {
         "depd": "~2.0.0",
         "inherits": "~2.0.4",
         "setprototypeof": "~1.2.0",
         "statuses": "~2.0.2",
         "toidentifier": "~1.0.1"
+      },
+      "engines": {
+        "node": ">= 0.8"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/express"
       }
     },
-    "iconv-lite": {
+    "node_modules/iconv-lite": {
       "version": "0.4.24",
       "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.4.24.tgz",
       "integrity": "sha512-v3MXnZAcvnywkTUEZomIActle7RXXeedOR31wwl7VlyoXO4Qi9arvSenNQWne1TcRwhCL1HwLI21bEqdpj8/rA==",
-      "requires": {
+      "dependencies": {
         "safer-buffer": ">= 2.1.2 < 3"
+      },
+      "engines": {
+        "node": ">=0.10.0"
       }
     },
-    "inherits": {
+    "node_modules/inherits": {
       "version": "2.0.4",
       "resolved": "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
       "integrity": "sha512-k/vGaX4/Yla3WzyMCvTQOXYeIHvqOKtnqBduzTHpzpQZzAskKMhZ2K+EnBiSM9zGSoIFeMpXKxa4dYeZIQqewQ=="
     },
-    "ipaddr.js": {
+    "node_modules/ipaddr.js": {
       "version": "1.9.1",
       "resolved": "https://registry.npmjs.org/ipaddr.js/-/ipaddr.js-1.9.1.tgz",
-      "integrity": "sha512-0KI/607xoxSToH7GjN1FfSbLoU0+btTicjsQSWQlh/hZykN8KpmMf7uYwPW3R+akZ6R/w18ZlXSHBYXiYUPO3g=="
+      "integrity": "sha512-0KI/607xoxSToH7GjN1FfSbLoU0+btTicjsQSWQlh/hZykN8KpmMf7uYwPW3R+akZ6R/w18ZlXSHBYXiYUPO3g==",
+      "engines": {
+        "node": ">= 0.10"
+      }
     },
-    "math-intrinsics": {
+    "node_modules/math-intrinsics": {
       "version": "1.1.0",
       "resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
-      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g=="
+      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
+      "engines": {
+        "node": ">= 0.4"
+      }
     },
-    "media-typer": {
+    "node_modules/media-typer": {
       "version": "0.3.0",
       "resolved": "https://registry.npmjs.org/media-typer/-/media-typer-0.3.0.tgz",
-      "integrity": "sha512-dq+qelQ9akHpcOl/gUVRTxVIOkAJ1wR3QAvb4RsVjS8oVoFjDGTc679wJYmUmknUF5HwMLOgb5O+a3KxfWapPQ=="
+      "integrity": "sha512-dq+qelQ9akHpcOl/gUVRTxVIOkAJ1wR3QAvb4RsVjS8oVoFjDGTc679wJYmUmknUF5HwMLOgb5O+a3KxfWapPQ==",
+      "engines": {
+        "node": ">= 0.6"
+      }
     },
-    "merge-descriptors": {
+    "node_modules/merge-descriptors": {
       "version": "1.0.3",
       "resolved": "https://registry.npmjs.org/merge-descriptors/-/merge-descriptors-1.0.3.tgz",
-      "integrity": "sha512-gaNvAS7TZ897/rVaZ0nMtAyxNyi/pdbjbAwUpFQpN70GqnVfOiXpeUUMKRBmzXaSQ8DdTX4/0ms62r2K+hE6mQ=="
+      "integrity": "sha512-gaNvAS7TZ897/rVaZ0nMtAyxNyi/pdbjbAwUpFQpN70GqnVfOiXpeUUMKRBmzXaSQ8DdTX4/0ms62r2K+hE6mQ==",
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
     },
-    "methods": {
+    "node_modules/methods": {
       "version": "1.1.2",
       "resolved": "https://registry.npmjs.org/methods/-/methods-1.1.2.tgz",
-      "integrity": "sha512-iclAHeNqNm68zFtnZ0e+1L2yUIdvzNoauKU4WBA3VvH/vPFieF7qfRlwUZU+DA9P9bPXIS90ulxoUoCH23sV2w=="
+      "integrity": "sha512-iclAHeNqNm68zFtnZ0e+1L2yUIdvzNoauKU4WBA3VvH/vPFieF7qfRlwUZU+DA9P9bPXIS90ulxoUoCH23sV2w==",
+      "engines": {
+        "node": ">= 0.6"
+      }
     },
-    "mime": {
+    "node_modules/mime": {
       "version": "1.6.0",
       "resolved": "https://registry.npmjs.org/mime/-/mime-1.6.0.tgz",
-      "integrity": "sha512-x0Vn8spI+wuJ1O6S7gnbaQg8Pxh4NNHb7KSINmEWKiPE4RKOplvijn+NkmYmmRgP68mc70j2EbeTFRsrswaQeg=="
+      "integrity": "sha512-x0Vn8spI+wuJ1O6S7gnbaQg8Pxh4NNHb7KSINmEWKiPE4RKOplvijn+NkmYmmRgP68mc70j2EbeTFRsrswaQeg==",
+      "bin": {
+        "mime": "cli.js"
+      },
+      "engines": {
+        "node": ">=4"
+      }
     },
-    "mime-db": {
+    "node_modules/mime-db": {
       "version": "1.52.0",
       "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
-      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg=="
+      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
+      "engines": {
+        "node": ">= 0.6"
+      }
     },
-    "mime-types": {
+    "node_modules/mime-types": {
       "version": "2.1.35",
       "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
       "integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
-      "requires": {
+      "dependencies": {
         "mime-db": "1.52.0"
+      },
+      "engines": {
+        "node": ">= 0.6"
       }
     },
-    "ms": {
+    "node_modules/ms": {
       "version": "2.0.0",
       "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
       "integrity": "sha512-Tpp60P6IUJDTuOq/5Z8cdskzJujfwqfOTkrwIwj7IRISpnkJnT6SyJ4PCPnGMoFjC9ddhal5KVIYtAt97ix05A=="
     },
-    "negotiator": {
+    "node_modules/negotiator": {
       "version": "0.6.3",
       "resolved": "https://registry.npmjs.org/negotiator/-/negotiator-0.6.3.tgz",
-      "integrity": "sha512-+EUsqGPLsM+j/zdChZjsnX51g4XrHFOIXwfnCVPGlQk/k5giakcKsuxCObBRu6DSm9opw/O6slWbJdghQM4bBg=="
+      "integrity": "sha512-+EUsqGPLsM+j/zdChZjsnX51g4XrHFOIXwfnCVPGlQk/k5giakcKsuxCObBRu6DSm9opw/O6slWbJdghQM4bBg==",
+      "engines": {
+        "node": ">= 0.6"
+      }
     },
-    "object-inspect": {
+    "node_modules/object-inspect": {
       "version": "1.13.4",
       "resolved": "https://registry.npmjs.org/object-inspect/-/object-inspect-1.13.4.tgz",
-      "integrity": "sha512-W67iLl4J2EXEGTbfeHCffrjDfitvLANg0UlX3wFUUSTx92KXRFegMHUVgSqE+wvhAbi4WqjGg9czysTV2Epbew=="
+      "integrity": "sha512-W67iLl4J2EXEGTbfeHCffrjDfitvLANg0UlX3wFUUSTx92KXRFegMHUVgSqE+wvhAbi4WqjGg9czysTV2Epbew==",
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
     },
-    "on-finished": {
+    "node_modules/on-finished": {
       "version": "2.4.1",
       "resolved": "https://registry.npmjs.org/on-finished/-/on-finished-2.4.1.tgz",
       "integrity": "sha512-oVlzkg3ENAhCk2zdv7IJwd/QUD4z2RxRwpkcGY8psCVcCYZNq4wYnVWALHM+brtuJjePWiYF/ClmuDr8Ch5+kg==",
-      "requires": {
+      "dependencies": {
         "ee-first": "1.1.1"
+      },
+      "engines": {
+        "node": ">= 0.8"
       }
     },
-    "parseurl": {
+    "node_modules/parseurl": {
       "version": "1.3.3",
       "resolved": "https://registry.npmjs.org/parseurl/-/parseurl-1.3.3.tgz",
-      "integrity": "sha512-CiyeOxFT/JZyN5m0z9PfXw4SCBJ6Sygz1Dpl0wqjlhDEGGBP1GnsUVEL0p63hoG1fcj3fHynXi9NYO4nWOL+qQ=="
+      "integrity": "sha512-CiyeOxFT/JZyN5m0z9PfXw4SCBJ6Sygz1Dpl0wqjlhDEGGBP1GnsUVEL0p63hoG1fcj3fHynXi9NYO4nWOL+qQ==",
+      "engines": {
+        "node": ">= 0.8"
+      }
     },
-    "path-to-regexp": {
+    "node_modules/path-to-regexp": {
       "version": "0.1.13",
       "resolved": "https://registry.npmjs.org/path-to-regexp/-/path-to-regexp-0.1.13.tgz",
       "integrity": "sha512-A/AGNMFN3c8bOlvV9RreMdrv7jsmF9XIfDeCd87+I8RNg6s78BhJxMu69NEMHBSJFxKidViTEdruRwEk/WIKqA=="
     },
-    "proxy-addr": {
+    "node_modules/proxy-addr": {
       "version": "2.0.7",
       "resolved": "https://registry.npmjs.org/proxy-addr/-/proxy-addr-2.0.7.tgz",
       "integrity": "sha512-llQsMLSUDUPT44jdrU/O37qlnifitDP+ZwrmmZcoSKyLKvtZxpyV0n2/bD/N4tBAAZ/gJEdZU7KMraoK1+XYAg==",
-      "requires": {
+      "dependencies": {
         "forwarded": "0.2.0",
         "ipaddr.js": "1.9.1"
+      },
+      "engines": {
+        "node": ">= 0.10"
       }
     },
-    "qs": {
+    "node_modules/qs": {
       "version": "6.15.3",
       "resolved": "https://registry.npmjs.org/qs/-/qs-6.15.3.tgz",
       "integrity": "sha512-O9gl3zCl5h5blw1KGUzQKhA5oUXSl8rwUIM5o0S3nCXMliSvy5Dzx7/DJcI+SwgICv+IneSZwhBh1oSyEHA71A==",
-      "requires": {
+      "dependencies": {
         "es-define-property": "^1.0.1",
         "side-channel": "^1.1.1"
+      },
+      "engines": {
+        "node": ">=0.6"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
       }
     },
-    "range-parser": {
+    "node_modules/range-parser": {
       "version": "1.2.1",
       "resolved": "https://registry.npmjs.org/range-parser/-/range-parser-1.2.1.tgz",
-      "integrity": "sha512-Hrgsx+orqoygnmhFbKaHE6c296J+HTAQXoxEF6gNupROmmGJRoyzfG3ccAveqCBrwr/2yxQ5BVd/GTl5agOwSg=="
+      "integrity": "sha512-Hrgsx+orqoygnmhFbKaHE6c296J+HTAQXoxEF6gNupROmmGJRoyzfG3ccAveqCBrwr/2yxQ5BVd/GTl5agOwSg==",
+      "engines": {
+        "node": ">= 0.6"
+      }
     },
-    "raw-body": {
+    "node_modules/raw-body": {
       "version": "2.5.3",
       "resolved": "https://registry.npmjs.org/raw-body/-/raw-body-2.5.3.tgz",
       "integrity": "sha512-s4VSOf6yN0rvbRZGxs8Om5CWj6seneMwK3oDb4lWDH0UPhWcxwOWw5+qk24bxq87szX1ydrwylIOp2uG1ojUpA==",
-      "requires": {
+      "dependencies": {
         "bytes": "~3.1.2",
         "http-errors": "~2.0.1",
         "iconv-lite": "~0.4.24",
         "unpipe": "~1.0.0"
+      },
+      "engines": {
+        "node": ">= 0.8"
       }
     },
-    "safe-buffer": {
+    "node_modules/safe-buffer": {
       "version": "5.2.1",
       "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
-      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ=="
+      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
+      "funding": [
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/feross"
+        },
+        {
+          "type": "patreon",
+          "url": "https://www.patreon.com/feross"
+        },
+        {
+          "type": "consulting",
+          "url": "https://feross.org/support"
+        }
+      ]
     },
-    "safer-buffer": {
+    "node_modules/safer-buffer": {
       "version": "2.1.2",
       "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
       "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg=="
     },
-    "send": {
+    "node_modules/send": {
       "version": "0.19.2",
       "resolved": "https://registry.npmjs.org/send/-/send-0.19.2.tgz",
       "integrity": "sha512-VMbMxbDeehAxpOtWJXlcUS5E8iXh6QmN+BkRX1GARS3wRaXEEgzCcB10gTQazO42tpNIya8xIyNx8fll1OFPrg==",
-      "requires": {
+      "dependencies": {
         "debug": "2.6.9",
         "depd": "2.0.0",
         "destroy": "1.2.0",
@@ -424,107 +608,153 @@
         "range-parser": "~1.2.1",
         "statuses": "~2.0.2"
       },
-      "dependencies": {
-        "ms": {
-          "version": "2.1.3",
-          "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
-          "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA=="
-        }
+      "engines": {
+        "node": ">= 0.8.0"
       }
     },
-    "serve-static": {
+    "node_modules/send/node_modules/ms": {
+      "version": "2.1.3",
+      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
+      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA=="
+    },
+    "node_modules/serve-static": {
       "version": "1.16.3",
       "resolved": "https://registry.npmjs.org/serve-static/-/serve-static-1.16.3.tgz",
       "integrity": "sha512-x0RTqQel6g5SY7Lg6ZreMmsOzncHFU7nhnRWkKgWuMTu5NN0DR5oruckMqRvacAN9d5w6ARnRBXl9xhDCgfMeA==",
-      "requires": {
+      "dependencies": {
         "encodeurl": "~2.0.0",
         "escape-html": "~1.0.3",
         "parseurl": "~1.3.3",
         "send": "~0.19.1"
+      },
+      "engines": {
+        "node": ">= 0.8.0"
       }
     },
-    "setprototypeof": {
+    "node_modules/setprototypeof": {
       "version": "1.2.0",
       "resolved": "https://registry.npmjs.org/setprototypeof/-/setprototypeof-1.2.0.tgz",
       "integrity": "sha512-E5LDX7Wrp85Kil5bhZv46j8jOeboKq5JMmYM3gVGdGH8xFpPWXUMsNrlODCrkoxMEeNi/XZIwuRvY4XNwYMJpw=="
     },
-    "side-channel": {
+    "node_modules/side-channel": {
       "version": "1.1.1",
       "resolved": "https://registry.npmjs.org/side-channel/-/side-channel-1.1.1.tgz",
       "integrity": "sha512-6x6dK6zJdpTzF4sQeNYxwtvBzf6Eg4GtlesS94HOvTudUeyK2WXAaIfmDgsyslYrRBeFIlsi54AYsFGUuhmvrQ==",
-      "requires": {
+      "dependencies": {
         "es-errors": "^1.3.0",
         "object-inspect": "^1.13.4",
         "side-channel-list": "^1.0.1",
         "side-channel-map": "^1.0.1",
         "side-channel-weakmap": "^1.0.2"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
       }
     },
-    "side-channel-list": {
+    "node_modules/side-channel-list": {
       "version": "1.0.1",
       "resolved": "https://registry.npmjs.org/side-channel-list/-/side-channel-list-1.0.1.tgz",
       "integrity": "sha512-mjn/0bi/oUURjc5Xl7IaWi/OJJJumuoJFQJfDDyO46+hBWsfaVM65TBHq2eoZBhzl9EchxOijpkbRC8SVBQU0w==",
-      "requires": {
+      "dependencies": {
         "es-errors": "^1.3.0",
         "object-inspect": "^1.13.4"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
       }
     },
-    "side-channel-map": {
+    "node_modules/side-channel-map": {
       "version": "1.0.1",
       "resolved": "https://registry.npmjs.org/side-channel-map/-/side-channel-map-1.0.1.tgz",
       "integrity": "sha512-VCjCNfgMsby3tTdo02nbjtM/ewra6jPHmpThenkTYh8pG9ucZ/1P8So4u4FGBek/BjpOVsDCMoLA/iuBKIFXRA==",
-      "requires": {
+      "dependencies": {
         "call-bound": "^1.0.2",
         "es-errors": "^1.3.0",
         "get-intrinsic": "^1.2.5",
         "object-inspect": "^1.13.3"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
       }
     },
-    "side-channel-weakmap": {
+    "node_modules/side-channel-weakmap": {
       "version": "1.0.2",
       "resolved": "https://registry.npmjs.org/side-channel-weakmap/-/side-channel-weakmap-1.0.2.tgz",
       "integrity": "sha512-WPS/HvHQTYnHisLo9McqBHOJk2FkHO/tlpvldyrnem4aeQp4hai3gythswg6p01oSoTl58rcpiFAjF2br2Ak2A==",
-      "requires": {
+      "dependencies": {
         "call-bound": "^1.0.2",
         "es-errors": "^1.3.0",
         "get-intrinsic": "^1.2.5",
         "object-inspect": "^1.13.3",
         "side-channel-map": "^1.0.1"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
       }
     },
-    "statuses": {
+    "node_modules/statuses": {
       "version": "2.0.2",
       "resolved": "https://registry.npmjs.org/statuses/-/statuses-2.0.2.tgz",
-      "integrity": "sha512-DvEy55V3DB7uknRo+4iOGT5fP1slR8wQohVdknigZPMpMstaKJQWhwiYBACJE3Ul2pTnATihhBYnRhZQHGBiRw=="
+      "integrity": "sha512-DvEy55V3DB7uknRo+4iOGT5fP1slR8wQohVdknigZPMpMstaKJQWhwiYBACJE3Ul2pTnATihhBYnRhZQHGBiRw==",
+      "engines": {
+        "node": ">= 0.8"
+      }
     },
-    "toidentifier": {
+    "node_modules/toidentifier": {
       "version": "1.0.1",
       "resolved": "https://registry.npmjs.org/toidentifier/-/toidentifier-1.0.1.tgz",
-      "integrity": "sha512-o5sSPKEkg/DIQNmH43V0/uerLrpzVedkUh8tGNvaeXpfpuwjKenlSox/2O/BTlZUtEe+JG7s5YhEz608PlAHRA=="
+      "integrity": "sha512-o5sSPKEkg/DIQNmH43V0/uerLrpzVedkUh8tGNvaeXpfpuwjKenlSox/2O/BTlZUtEe+JG7s5YhEz608PlAHRA==",
+      "engines": {
+        "node": ">=0.6"
+      }
     },
-    "type-is": {
+    "node_modules/type-is": {
       "version": "1.6.18",
       "resolved": "https://registry.npmjs.org/type-is/-/type-is-1.6.18.tgz",
       "integrity": "sha512-TkRKr9sUTxEH8MdfuCSP7VizJyzRNMjj2J2do2Jr3Kym598JVdEksuzPQCnlFPW4ky9Q+iA+ma9BGm06XQBy8g==",
-      "requires": {
+      "dependencies": {
         "media-typer": "0.3.0",
         "mime-types": "~2.1.24"
+      },
+      "engines": {
+        "node": ">= 0.6"
       }
     },
-    "unpipe": {
+    "node_modules/unpipe": {
       "version": "1.0.0",
       "resolved": "https://registry.npmjs.org/unpipe/-/unpipe-1.0.0.tgz",
-      "integrity": "sha512-pjy2bYhSsufwWlKwPc+l3cN7+wuJlK6uz0YdJEOlQDbl6jo/YlPi4mb8agUkVC8BF7V8NuzeyPNqRksA3hztKQ=="
+      "integrity": "sha512-pjy2bYhSsufwWlKwPc+l3cN7+wuJlK6uz0YdJEOlQDbl6jo/YlPi4mb8agUkVC8BF7V8NuzeyPNqRksA3hztKQ==",
+      "engines": {
+        "node": ">= 0.8"
+      }
     },
-    "utils-merge": {
+    "node_modules/utils-merge": {
       "version": "1.0.1",
       "resolved": "https://registry.npmjs.org/utils-merge/-/utils-merge-1.0.1.tgz",
-      "integrity": "sha512-pMZTvIkT1d+TFGvDOqodOclx0QWkkgi6Tdoa8gC8ffGAAqz9pzPTZWAybbsHHoED/ztMtkv/VoYTYyShUn81hA=="
+      "integrity": "sha512-pMZTvIkT1d+TFGvDOqodOclx0QWkkgi6Tdoa8gC8ffGAAqz9pzPTZWAybbsHHoED/ztMtkv/VoYTYyShUn81hA==",
+      "engines": {
+        "node": ">= 0.4.0"
+      }
     },
-    "vary": {
+    "node_modules/vary": {
       "version": "1.1.2",
       "resolved": "https://registry.npmjs.org/vary/-/vary-1.1.2.tgz",
-      "integrity": "sha512-BNGbWLfd0eUPabhkXUVm0j8uuvREyTh5ovRa/dyow/BqAbZJyC+5fU+IzQOzmAKzYqYRAISoRhdQr3eIZ/PXqg=="
+      "integrity": "sha512-BNGbWLfd0eUPabhkXUVm0j8uuvREyTh5ovRa/dyow/BqAbZJyC+5fU+IzQOzmAKzYqYRAISoRhdQr3eIZ/PXqg==",
+      "engines": {
+        "node": ">= 0.8"
+      }
     }
   }
 }
diff --git a/public/index.html b/public/index.html
index 6e89592..a063248 100644
--- a/public/index.html
+++ b/public/index.html
@@ -274,6 +274,80 @@
     opacity: 0.8;
   }
 
+  .exposure-shell {
+    background: var(--panel);
+    border: 1px solid var(--panel-border);
+    border-radius: 12px;
+    padding: 22px;
+  }
+  .allocation-grid {
+    display: grid;
+    grid-template-columns: repeat(4, minmax(0, 1fr));
+    gap: 12px;
+  }
+  .allocation-field label {
+    display: block;
+    margin-bottom: 5px;
+    color: var(--text-dim);
+    font-size: 12px;
+    font-weight: 600;
+  }
+  .allocation-field select {
+    width: 100%;
+    min-width: 0;
+    background: var(--bg);
+    border: 1px solid var(--panel-border);
+    border-radius: 8px;
+    padding: 9px 12px;
+    color: var(--text);
+    font: inherit;
+  }
+  .leverage-control {
+    display: inline-flex;
+    align-items: center;
+    gap: 9px;
+    margin-top: 14px;
+    cursor: pointer;
+  }
+  .leverage-control input { width: 18px; height: 18px; accent-color: var(--gold); }
+  .allocation-field select:focus-visible,
+  .leverage-control input:focus-visible,
+  #personal-exposure .signup-form input:focus-visible,
+  #personal-exposure .signup-form button:focus-visible,
+  #personal-methodology summary:focus-visible {
+    outline: 3px solid var(--cyan);
+    outline-offset: 2px;
+  }
+  .exposure-validation { min-height: 1.5em; margin-top: 10px; color: var(--red); font-size: 13px; }
+  .personal-result { margin-top: 8px; }
+  .personal-result .gauge-wrap { max-width: 280px; }
+  .personal-result .gauge-score-number { font-size: 64px; }
+  .personal-interpretation { max-width: 620px; margin: 12px auto 0; color: var(--text-dim); font-size: 14px; }
+  .scenario-panel {
+    margin-top: 18px;
+    padding: 12px 14px;
+    background: rgba(77, 214, 232, 0.06);
+    border: 1px solid rgba(77, 214, 232, 0.2);
+    border-radius: 8px;
+    font-size: 14px;
+  }
+  .personal-methodology { margin-top: 16px; }
+  .personal-methodology summary { color: var(--cyan); cursor: pointer; font-weight: 600; }
+  .methodology-body { margin-top: 10px; color: var(--text-dim); font-size: 13px; }
+  .formula {
+    overflow-x: auto;
+    padding: 10px 12px;
+    background: var(--bg);
+    border-radius: 8px;
+    color: var(--text);
+    white-space: pre-wrap;
+  }
+  .component-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 16px; }
+  .component-grid div { min-width: 0; }
+  .calculator-alerts { margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--panel-border); }
+  .calculator-alerts h3 { margin: 0; font-size: 17px; }
+  .calculator-alerts p { margin: 5px 0 0; color: var(--text-dim); font-size: 13px; }
+
   .signup-panel {
     background: var(--panel);
     border: 1px solid var(--panel-border);
@@ -329,6 +403,9 @@
     .signup-panel { padding: 18px 16px; }
     .signup-form { flex-direction: column; }
     .signup-form input, .signup-form button { width: 100%; }
+    .exposure-shell { padding: 16px 14px 18px; }
+    .allocation-grid, .component-grid { grid-template-columns: 1fr; }
+    .personal-result .gauge-score-number { font-size: 54px; }
   }
 </style>
 </head>
@@ -351,6 +428,51 @@
     <div class="disclaimer">Not investment advice. This score reflects an AI-driven research and synthesis process; it is provided for informational purposes only.</div>
   </section>
 
+  <section id="personal-exposure">
+    <h2>Personal Liquidity Exposure</h2>
+    <div class="subhead">An ungated, transparent stress-sensitivity derivative of the upstream U.S. Financial Stress Score.</div>
+    <div class="exposure-shell">
+      <div class="allocation-grid">
+        <div class="allocation-field">
+          <label for="exposure-cash-equities">Cash / equities allocation</label>
+          <select id="exposure-cash-equities"><option value="0">0%</option><option value="10">10%</option><option value="20">20%</option><option value="30">30%</option><option value="40">40%</option><option value="50">50%</option><option value="60">60%</option><option value="70">70%</option><option value="80">80%</option><option value="90">90%</option><option value="100">100%</option></select>
+        </div>
+        <div class="allocation-field">
+          <label for="exposure-btc">BTC allocation</label>
+          <select id="exposure-btc"><option value="0">0%</option><option value="10">10%</option><option value="20">20%</option><option value="30">30%</option><option value="40">40%</option><option value="50">50%</option><option value="60">60%</option><option value="70">70%</option><option value="80">80%</option><option value="90">90%</option><option value="100">100%</option></select>
+        </div>
+        <div class="allocation-field">
+          <label for="exposure-eth">ETH allocation</label>
+          <select id="exposure-eth"><option value="0">0%</option><option value="10">10%</option><option value="20">20%</option><option value="30">30%</option><option value="40">40%</option><option value="50">50%</option><option value="60">60%</option><option value="70">70%</option><option value="80">80%</option><option value="90">90%</option><option value="100">100%</option></select>
+        </div>
+        <div class="allocation-field">
+          <label for="exposure-xrp">XRP allocation</label>
+          <select id="exposure-xrp"><option value="0">0%</option><option value="10">10%</option><option value="20">20%</option><option value="30">30%</option><option value="40">40%</option><option value="50">50%</option><option value="60">60%</option><option value="70">70%</option><option value="80">80%</option><option value="90">90%</option><option value="100">100%</option></select>
+        </div>
+      </div>
+      <label class="leverage-control" for="exposure-leveraged"><input type="checkbox" id="exposure-leveraged"> Uses leverage or margin</label>
+      <div class="exposure-validation" id="exposure-validation" aria-live="polite"></div>
+      <div class="personal-result" id="personal-result" aria-live="polite">
+        <div class="empty-state">Waiting for the current U.S. Financial Stress Score&hellip;</div>
+      </div>
+      <div class="disclaimer">Informational stress sensitivity only; this personal derivative is not the upstream U.S. Financial Stress Score and is not investment advice.</div>
+
+      <div class="calculator-alerts">
+        <h3>Optional LiquidityWatch alerts</h3>
+        <p>Your valid mix is stored only in this browser. Signup covers material LiquidityWatch updates; the allocation is not sent with signup.</p>
+        <form class="signup-form" id="exposure-signup-form">
+          <input type="email" id="exposure-signup-email" aria-label="Email for LiquidityWatch calculator alerts" placeholder="you@example.com" required autocomplete="email">
+          <button type="submit" id="exposure-signup-submit">Subscribe</button>
+        </form>
+        <form class="signup-form" id="exposure-verify-form" hidden>
+          <input type="text" id="exposure-verify-code" aria-label="Calculator alert verification code" placeholder="6-digit code from your email" required inputmode="numeric" autocomplete="one-time-code">
+          <button type="submit" id="exposure-verify-submit">Verify</button>
+        </form>
+        <div class="signup-status" id="exposure-signup-status" aria-live="polite"></div>
+      </div>
+    </div>
+  </section>
+
   <section id="subscore-breakdown" hidden>
     <h2>Sub-Engine Breakdown</h2>
     <div class="subhead">How each domain is contributing to the headline score.</div>
@@ -391,6 +513,144 @@
 <script src="/render.js"></script>
 <script>
 const API_BASE = 'https://e3d.ai';
+let retainedExposureEvent = null;
+
+const exposureControls = {
+  cashEquities: document.getElementById('exposure-cash-equities'),
+  btc: document.getElementById('exposure-btc'),
+  eth: document.getElementById('exposure-eth'),
+  xrp: document.getElementById('exposure-xrp'),
+  leveraged: document.getElementById('exposure-leveraged'),
+};
+
+function allocationFromControl(control) {
+  const raw = control.value;
+  const isOwnOption = Array.from(control.options).some((option) => option.value === raw);
+  return isOwnOption ? parseInt(raw, 10) : NaN;
+}
+
+function currentExposureMix() {
+  return {
+    cashEquities: allocationFromControl(exposureControls.cashEquities),
+    btc: allocationFromControl(exposureControls.btc),
+    eth: allocationFromControl(exposureControls.eth),
+    xrp: allocationFromControl(exposureControls.xrp),
+    leveraged: exposureControls.leveraged.checked,
+  };
+}
+
+function exposureMixFitsControls(mix) {
+  return ['cashEquities', 'btc', 'eth', 'xrp'].every((key) => (
+    Array.from(exposureControls[key].options).some((option) => option.value === String(mix[key]))
+  ));
+}
+
+function saveExposureMix(mix) {
+  const serialized = globalThis.RENDER_EXPORTS.serializeExposureMix(mix);
+  if (typeof serialized !== 'string') return;
+  try {
+    localStorage.setItem(globalThis.RENDER_EXPORTS.EXPOSURE_MIX_STORAGE_KEY, serialized);
+  } catch (_error) {
+    // Local storage may be unavailable; the in-memory controls still work.
+  }
+}
+
+function componentValue(value) {
+  return globalThis.RENDER_EXPORTS.escapeHtml(String(value));
+}
+
+function utilityComponent(label, utility) {
+  return `${label} utility: ${componentValue(utility.score)}${utility.fallback ? ' (neutral fallback)' : ''}`;
+}
+
+function renderPersonalExposureResult(result) {
+  const resultPanel = document.getElementById('personal-result');
+  const scoreColor = globalThis.RENDER_EXPORTS.escapeHtml(result.current.band.color);
+  const bandLabel = globalThis.RENDER_EXPORTS.escapeHtml(result.current.band.label);
+  const scenarioHtml = result.scenario
+    ? `<div class="scenario-panel"><strong>Next macro regime scenario:</strong> personal score ${componentValue(result.scenario.score)}/100 at macro score ${componentValue(result.scenario.macroScore)} (${result.scenario.delta > 0 ? '+' : ''}${componentValue(result.scenario.delta)}).</div>`
+    : '<div class="scenario-panel"><strong>Next macro regime scenario:</strong> already highest macro regime.</div>';
+  const components = result.components;
+
+  resultPanel.innerHTML = `
+    <div class="gauge-section">
+      <div class="gauge-wrap">${globalThis.RENDER_EXPORTS.buildGaugeSvg(result.current.score)}</div>
+      <div class="gauge-score-wrap">
+        <span class="gauge-score-number" style="color:${scoreColor}">${componentValue(result.current.score)}</span><span class="gauge-score-suffix">/100</span>
+        <div class="gauge-band-label" style="color:${scoreColor}">${bandLabel}</div>
+      </div>
+      <div class="personal-interpretation">This value describes how sensitive the selected mix is to the current published liquidity-stress setting. Higher values indicate greater stress sensitivity.</div>
+    </div>
+    ${scenarioHtml}
+    <details class="personal-methodology" id="personal-methodology">
+      <summary>Methodology and returned components</summary>
+      <div class="methodology-body">
+        <p>This presentation derivative uses the documented formula:</p>
+        <div class="formula">cashStress = M
+cryptoStress(U) = 0.70 × M + 0.30 × (100 − U)
+baseExposure = (cashEquities × cashStress
+              + btc × btcStress
+              + eth × ethStress
+              + xrp × xrpStress) / 100
+preClampScore = baseExposure × (leveraged ? 1.15 : 1)
+personalScore = Math.round(clamp(preClampScore, 0, 100))</div>
+        <div class="component-grid">
+          <div>Macro score: ${componentValue(components.macroScore)}</div>
+          <div>Leverage factor: ${componentValue(components.leverageFactor)}</div>
+          <div>${utilityComponent('BTC', components.utilities.btc)}</div>
+          <div>${utilityComponent('ETH', components.utilities.eth)}</div>
+          <div>${utilityComponent('XRP', components.utilities.xrp)}</div>
+          <div>Cash / equities stress: ${componentValue(components.stresses.cashEquities)}</div>
+          <div>BTC stress: ${componentValue(components.stresses.btc)}</div>
+          <div>ETH stress: ${componentValue(components.stresses.eth)}</div>
+          <div>XRP stress: ${componentValue(components.stresses.xrp)}</div>
+          <div>Base exposure: ${componentValue(components.baseExposure)}</div>
+          <div>Pre-clamp score: ${componentValue(components.preClampScore)}</div>
+        </div>
+      </div>
+    </details>`;
+}
+
+function recalculatePersonalExposure() {
+  const mix = currentExposureMix();
+  const normalized = globalThis.RENDER_EXPORTS.normalizeExposureMix(mix);
+  const validation = document.getElementById('exposure-validation');
+  const resultPanel = document.getElementById('personal-result');
+  const hasScore = !!retainedExposureEvent
+    && typeof retainedExposureEvent.final_score === 'number'
+    && Number.isFinite(retainedExposureEvent.final_score);
+
+  validation.textContent = normalized.ok ? '' : 'Allocations must total exactly 100%.';
+  if (normalized.ok) saveExposureMix(mix);
+
+  const result = globalThis.RENDER_EXPORTS.computePersonalExposure(retainedExposureEvent, mix);
+  if (!result.ok) {
+    resultPanel.innerHTML = hasScore
+      ? ''
+      : '<div class="empty-state">Waiting for the current U.S. Financial Stress Score&hellip;</div>';
+    return;
+  }
+  renderPersonalExposureResult(result);
+}
+
+function initializeExposureControls() {
+  let initialMix = globalThis.RENDER_EXPORTS.DEFAULT_EXPOSURE_MIX;
+  try {
+    const raw = localStorage.getItem(globalThis.RENDER_EXPORTS.EXPOSURE_MIX_STORAGE_KEY);
+    const storedMix = globalThis.RENDER_EXPORTS.parseStoredExposureMix(raw);
+    if (storedMix && exposureMixFitsControls(storedMix)) initialMix = storedMix;
+  } catch (_error) {
+    // Storage failures leave the documented default mix selected.
+  }
+
+  ['cashEquities', 'btc', 'eth', 'xrp'].forEach((key) => {
+    exposureControls[key].value = String(initialMix[key]);
+    exposureControls[key].addEventListener('change', recalculatePersonalExposure);
+  });
+  exposureControls.leveraged.checked = initialMix.leveraged === true;
+  exposureControls.leveraged.addEventListener('change', recalculatePersonalExposure);
+  recalculatePersonalExposure();
+}
 
 // Renders one event into the page. Shared shape with server.js's SSR pass
 // (both call the same render.js functions) - this is what keeps the page
@@ -398,6 +658,8 @@ const API_BASE = 'https://e3d.ai';
 // if SSR didn't have data yet (e.g. the very first deploy, or the live API
 // being briefly unreachable when a request came in).
 function renderEventIntoPage(event) {
+  retainedExposureEvent = event;
+  recalculatePersonalExposure();
   const panel = document.getElementById('score-panel');
   if (!event) {
     panel.innerHTML = EMPTY_STATE_HTML;
@@ -427,77 +689,104 @@ async function loadStressScore() {
   }
 }
 
-function setStatus(message, kind) {
-  const el = document.getElementById('signup-status');
-  el.textContent = message;
-  el.className = 'signup-status' + (kind ? ' ' + kind : '');
-}
+function setupSignupFlow(config) {
+  const signupForm = document.getElementById(config.signupFormId);
+  const emailInput = document.getElementById(config.emailInputId);
+  const signupSubmit = document.getElementById(config.signupSubmitId);
+  const verifyForm = document.getElementById(config.verifyFormId);
+  const codeInput = document.getElementById(config.codeInputId);
+  const verifySubmit = document.getElementById(config.verifySubmitId);
+  const status = document.getElementById(config.statusId);
+  let pendingEmail = '';
 
-let pendingEmail = '';
+  function setStatus(message, kind) {
+    status.textContent = message;
+    status.className = 'signup-status' + (kind ? ' ' + kind : '');
+  }
 
-document.getElementById('signup-form').addEventListener('submit', async (e) => {
-  e.preventDefault();
-  const emailInput = document.getElementById('signup-email');
-  const submitBtn = document.getElementById('signup-submit');
-  const email = emailInput.value.trim();
-  if (!email) return;
-  submitBtn.disabled = true;
-  setStatus('Submitting…', '');
-  try {
-    const res = await fetch(`${API_BASE}/api/mailing-list/signup`, {
-      method: 'POST',
-      headers: { 'Content-Type': 'application/json' },
-      body: JSON.stringify({ email, list: 'financial_stress_alerts' }),
-    });
-    const data = await res.json();
-    if (!res.ok || !data.success) {
-      setStatus(data.message || 'Something went wrong. Please try again.', 'error');
-      submitBtn.disabled = false;
-      return;
+  signupForm.addEventListener('submit', async (event) => {
+    event.preventDefault();
+    const email = emailInput.value.trim();
+    if (!email) return;
+    if (config.beforeSignup) config.beforeSignup();
+    signupSubmit.disabled = true;
+    setStatus('Submitting…', '');
+    try {
+      const response = await fetch(`${API_BASE}/api/mailing-list/signup`, {
+        method: 'POST',
+        headers: { 'Content-Type': 'application/json' },
+        body: JSON.stringify({ email, list: config.list }),
+      });
+      const data = await response.json();
+      if (!response.ok || !data.success) {
+        setStatus(data.message || 'Something went wrong. Please try again.', 'error');
+        signupSubmit.disabled = false;
+        return;
+      }
+      pendingEmail = email;
+      if (data.needsVerification) {
+        setStatus('Check your email for a verification code.', 'ok');
+        verifyForm.hidden = false;
+        emailInput.disabled = true;
+      } else {
+        setStatus('You’re subscribed.', 'ok');
+        signupSubmit.textContent = 'Subscribed';
+      }
+    } catch (_error) {
+      setStatus('Something went wrong. Please try again.', 'error');
+      signupSubmit.disabled = false;
     }
-    pendingEmail = email;
-    if (data.needsVerification) {
-      setStatus('Check your email for a verification code.', 'ok');
-      document.getElementById('verify-form').hidden = false;
-      emailInput.disabled = true;
-    } else {
-      setStatus('You’re subscribed.', 'ok');
-      submitBtn.textContent = 'Subscribed';
-    }
-  } catch (err) {
-    setStatus('Something went wrong. Please try again.', 'error');
-    submitBtn.disabled = false;
-  }
-});
+  });
 
-document.getElementById('verify-form').addEventListener('submit', async (e) => {
-  e.preventDefault();
-  const codeInput = document.getElementById('verify-code');
-  const submitBtn = document.getElementById('verify-submit');
-  const code = codeInput.value.trim();
-  if (!code || !pendingEmail) return;
-  submitBtn.disabled = true;
-  setStatus('Verifying…', '');
-  try {
-    const res = await fetch(`${API_BASE}/verifyEmailCode`, {
-      method: 'POST',
-      headers: { 'Content-Type': 'application/json' },
-      body: JSON.stringify({ username: pendingEmail, code }),
-    });
-    const data = await res.json();
-    if (!res.ok || !data.success) {
-      setStatus(data.message || 'Invalid or expired code.', 'error');
-      submitBtn.disabled = false;
-      return;
+  verifyForm.addEventListener('submit', async (event) => {
+    event.preventDefault();
+    const code = codeInput.value.trim();
+    if (!code || !pendingEmail) return;
+    verifySubmit.disabled = true;
+    setStatus('Verifying…', '');
+    try {
+      const response = await fetch(`${API_BASE}/verifyEmailCode`, {
+        method: 'POST',
+        headers: { 'Content-Type': 'application/json' },
+        body: JSON.stringify({ username: pendingEmail, code }),
+      });
+      const data = await response.json();
+      if (!response.ok || !data.success) {
+        setStatus(data.message || 'Invalid or expired code.', 'error');
+        verifySubmit.disabled = false;
+        return;
+      }
+      setStatus('You’re subscribed and verified.', 'ok');
+      verifyForm.hidden = true;
+    } catch (_error) {
+      setStatus('Something went wrong. Please try again.', 'error');
+      verifySubmit.disabled = false;
     }
-    setStatus('You’re subscribed and verified.', 'ok');
-    document.getElementById('verify-form').hidden = true;
-  } catch (err) {
-    setStatus('Something went wrong. Please try again.', 'error');
-    submitBtn.disabled = false;
-  }
-});
+  });
+}
 
+initializeExposureControls();
+setupSignupFlow({
+  signupFormId: 'signup-form',
+  emailInputId: 'signup-email',
+  signupSubmitId: 'signup-submit',
+  verifyFormId: 'verify-form',
+  codeInputId: 'verify-code',
+  verifySubmitId: 'verify-submit',
+  statusId: 'signup-status',
+  list: 'financial_stress_alerts',
+});
+setupSignupFlow({
+  signupFormId: 'exposure-signup-form',
+  emailInputId: 'exposure-signup-email',
+  signupSubmitId: 'exposure-signup-submit',
+  verifyFormId: 'exposure-verify-form',
+  codeInputId: 'exposure-verify-code',
+  verifySubmitId: 'exposure-verify-submit',
+  statusId: 'exposure-signup-status',
+  list: globalThis.RENDER_EXPORTS.EXPOSURE_ALERT_LIST,
+  beforeSignup: () => saveExposureMix(currentExposureMix()),
+});
 loadStressScore();
 </script>
 
diff --git a/public/render.js b/public/render.js
index f129ac8..24f3987 100644
--- a/public/render.js
+++ b/public/render.js
@@ -112,6 +112,186 @@ function scaledUnitPercent(rawValue, schemaVersion) {
   return Math.round(unit * 100);
 }
 
+const DEFAULT_EXPOSURE_MIX = {
+  cashEquities: 70,
+  btc: 10,
+  eth: 10,
+  xrp: 10,
+  leveraged: false,
+};
+const EXPOSURE_MIX_STORAGE_KEY = 'liquiditywatch.personalExposureMix.v1';
+const EXPOSURE_ALERT_LIST = 'liquiditywatch-exposure-calculator';
+
+function normalizeExposureMix(mix) {
+  if (!mix || typeof mix !== 'object' || Array.isArray(mix)) {
+    return { ok: false, reason: 'invalid-mix' };
+  }
+
+  const percentages = [mix.cashEquities, mix.btc, mix.eth, mix.xrp];
+  const validPercentages = percentages.every((value) => (
+    typeof value === 'number'
+    && Number.isFinite(value)
+    && value >= 0
+    && value <= 100
+  ));
+  if (!validPercentages || percentages.reduce((sum, value) => sum + value, 0) !== 100) {
+    return { ok: false, reason: 'invalid-mix' };
+  }
+
+  return {
+    ok: true,
+    mix: {
+      cashEquities: mix.cashEquities,
+      btc: mix.btc,
+      eth: mix.eth,
+      xrp: mix.xrp,
+      leveraged: mix.leveraged === true,
+    },
+  };
+}
+
+function serializeExposureMix(mix) {
+  const normalized = normalizeExposureMix(mix);
+  if (!normalized.ok) return null;
+  return JSON.stringify({ v: 1, ...normalized.mix });
+}
+
+function parseStoredExposureMix(raw) {
+  let stored = raw;
+  try {
+    if (typeof raw === 'string') stored = JSON.parse(raw);
+    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return null;
+
+    const requiredFields = ['v', 'cashEquities', 'btc', 'eth', 'xrp', 'leveraged'];
+    if (!requiredFields.every((field) => Object.prototype.hasOwnProperty.call(stored, field))) return null;
+    if (stored.v !== 1) return null;
+
+    const normalized = normalizeExposureMix(stored);
+    return normalized.ok ? normalized.mix : null;
+  } catch (_error) {
+    return null;
+  }
+}
+
+function clampPercent(value) {
+  return Math.max(0, Math.min(100, value));
+}
+
+function personalExposureAtMacro(macroScore, mix, utilities) {
+  const stresses = {
+    cashEquities: macroScore,
+    btc: 0.70 * macroScore + 0.30 * (100 - utilities.btc.score),
+    eth: 0.70 * macroScore + 0.30 * (100 - utilities.eth.score),
+    xrp: 0.70 * macroScore + 0.30 * (100 - utilities.xrp.score),
+  };
+  const baseExposure = (
+    mix.cashEquities * stresses.cashEquities
+    + mix.btc * stresses.btc
+    + mix.eth * stresses.eth
+    + mix.xrp * stresses.xrp
+  ) / 100;
+  const leverageFactor = mix.leveraged === true ? 1.15 : 1;
+  const preClampScore = baseExposure * leverageFactor;
+  const score = Math.round(clampPercent(preClampScore));
+
+  return { score, stresses, baseExposure, leverageFactor, preClampScore };
+}
+
+function computePersonalExposure(event, mix) {
+  const normalized = normalizeExposureMix(mix);
+  const invalidResult = (reason) => ({
+    ok: false,
+    reason,
+    current: null,
+    scenario: null,
+    components: null,
+  });
+  if (!normalized.ok) return invalidResult('invalid-mix');
+  if (!event || typeof event !== 'object' || Array.isArray(event)
+      || typeof event.final_score !== 'number' || !Number.isFinite(event.final_score)) {
+    return invalidResult('missing-score');
+  }
+
+  const macroScore = clampPercent(event.final_score);
+  const fallbackUtility = 100 - macroScore;
+  const triggers = Array.isArray(event.asset_triggers) ? event.asset_triggers : [];
+  const utilities = {};
+
+  ['btc', 'eth', 'xrp'].forEach((assetKey) => {
+    let rawUtility;
+    let found = false;
+    for (const entry of triggers) {
+      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
+      try {
+        if (String(entry.asset).toUpperCase() === assetKey.toUpperCase()) {
+          rawUtility = entry.utility_score;
+          found = true;
+          break;
+        }
+      } catch (_error) {
+        // A malformed entry is ignored just like any other unusable trigger.
+      }
+    }
+
+    const scaled = found && typeof rawUtility === 'number' && Number.isFinite(rawUtility)
+      ? scaledUnitPercent(rawUtility, event.schema_version)
+      : null;
+    const fallback = !Number.isFinite(scaled);
+    utilities[assetKey] = {
+      score: fallback ? fallbackUtility : clampPercent(scaled),
+      fallback,
+    };
+  });
+
+  const currentCalculation = personalExposureAtMacro(macroScore, normalized.mix, utilities);
+  const current = {
+    score: currentCalculation.score,
+    band: gaugeBand(currentCalculation.score),
+  };
+
+  let scenario = null;
+  const currentMacroBand = gaugeBand(macroScore);
+  const currentBandIndex = GAUGE_BANDS.indexOf(currentMacroBand);
+  const nextBand = GAUGE_BANDS[currentBandIndex + 1];
+  if (nextBand) {
+    let scenarioMacroScore = null;
+    if (gaugeBand(nextBand.min) === nextBand) {
+      scenarioMacroScore = nextBand.min;
+    } else if (gaugeBand(currentMacroBand.max + 1) === nextBand) {
+      scenarioMacroScore = currentMacroBand.max + 1;
+    }
+
+    if (scenarioMacroScore !== null) {
+      const scenarioCalculation = personalExposureAtMacro(
+        scenarioMacroScore,
+        normalized.mix,
+        utilities,
+      );
+      scenario = {
+        macroScore: scenarioMacroScore,
+        score: scenarioCalculation.score,
+        band: gaugeBand(scenarioCalculation.score),
+        delta: scenarioCalculation.score - currentCalculation.score,
+      };
+    }
+  }
+
+  return {
+    ok: true,
+    reason: null,
+    current,
+    scenario,
+    components: {
+      macroScore,
+      utilities,
+      stresses: currentCalculation.stresses,
+      baseExposure: currentCalculation.baseExposure,
+      leverageFactor: currentCalculation.leverageFactor,
+      preClampScore: currentCalculation.preClampScore,
+    },
+  };
+}
+
 // velocity/acceleration are already in the same unit as the value they
 // describe (see docs/API-CONTRACT.md); render them as a short trend note
 // rather than raw numbers, which are meaningless without the scale.
@@ -325,6 +505,13 @@ const RENDER_EXPORTS = {
   PHASE_LABELS,
   phaseBadgeHtml,
   scaledUnitPercent,
+  DEFAULT_EXPOSURE_MIX,
+  EXPOSURE_MIX_STORAGE_KEY,
+  EXPOSURE_ALERT_LIST,
+  normalizeExposureMix,
+  serializeExposureMix,
+  parseStoredExposureMix,
+  computePersonalExposure,
   trendNoteHtml,
   metricDeltaHtml,
   triggerMetricsHtml,
@@ -350,4 +537,6 @@ const RENDER_EXPORTS = {
 // same logic, zero duplication either way.
 if (typeof module !== 'undefined' && module.exports) {
   module.exports = RENDER_EXPORTS;
+} else if (typeof globalThis !== 'undefined') {
+  globalThis.RENDER_EXPORTS = RENDER_EXPORTS;
 }
diff --git a/test/exposure-calculator.test.js b/test/exposure-calculator.test.js
new file mode 100644
index 0000000..d1a96f4
--- /dev/null
+++ b/test/exposure-calculator.test.js
@@ -0,0 +1,256 @@
+'use strict';
+
+const test = require('node:test');
+const assert = require('node:assert/strict');
+const fs = require('node:fs');
+const vm = require('node:vm');
+
+const {
+  DEFAULT_EXPOSURE_MIX,
+  EXPOSURE_MIX_STORAGE_KEY,
+  EXPOSURE_ALERT_LIST,
+  GAUGE_BANDS,
+  gaugeBand,
+  normalizeExposureMix,
+  serializeExposureMix,
+  parseStoredExposureMix,
+  computePersonalExposure,
+} = require('../public/render.js');
+
+const allCash = { cashEquities: 100, btc: 0, eth: 0, xrp: 0, leveraged: false };
+const allBtc = { cashEquities: 0, btc: 100, eth: 0, xrp: 0, leveraged: false };
+
+test('classic-script loading exposes the calculator through globalThis', () => {
+  const source = fs.readFileSync(require.resolve('../public/render.js'), 'utf8');
+  const context = {};
+  vm.runInNewContext(source, context);
+  assert.equal(typeof context.RENDER_EXPORTS.computePersonalExposure, 'function');
+  assert.equal(
+    context.RENDER_EXPORTS.EXPOSURE_MIX_STORAGE_KEY,
+    'liquiditywatch.personalExposureMix.v1',
+  );
+});
+
+test('exports the calculator constants and normalizes a new five-field mix', () => {
+  assert.deepEqual(DEFAULT_EXPOSURE_MIX, {
+    cashEquities: 70, btc: 10, eth: 10, xrp: 10, leveraged: false,
+  });
+  assert.equal(EXPOSURE_MIX_STORAGE_KEY, 'liquiditywatch.personalExposureMix.v1');
+  assert.equal(EXPOSURE_ALERT_LIST, 'liquiditywatch-exposure-calculator');
+
+  const input = { ...DEFAULT_EXPOSURE_MIX, leveraged: 'yes', ignored: 123 };
+  const normalized = normalizeExposureMix(input);
+  assert.deepEqual(normalized, { ok: true, mix: DEFAULT_EXPOSURE_MIX });
+  assert.notStrictEqual(normalized.mix, input);
+  assert.equal(input.ignored, 123);
+});
+
+test('rejects invalid allocation shapes, values, and totals without coercion', () => {
+  const invalid = [
+    null,
+    [],
+    { ...allCash, cashEquities: '100' },
+    { ...allCash, cashEquities: NaN },
+    { ...allCash, cashEquities: Infinity },
+    { ...allCash, cashEquities: -1, btc: 101 },
+    { ...allCash, cashEquities: 99 },
+  ];
+  for (const mix of invalid) {
+    assert.deepEqual(normalizeExposureMix(mix), { ok: false, reason: 'invalid-mix' });
+  }
+});
+
+test('all-cash exposure clamps the macro score and rounds only the displayed result', () => {
+  assert.equal(computePersonalExposure({ final_score: 42.4 }, allCash).current.score, 42);
+  assert.equal(computePersonalExposure({ final_score: 120 }, allCash).current.score, 100);
+  assert.equal(computePersonalExposure({ final_score: -12 }, allCash).current.score, 0);
+
+  const half = computePersonalExposure({ final_score: 20.5 }, allCash);
+  assert.equal(half.components.macroScore, 20.5);
+  assert.equal(half.components.preClampScore, 20.5);
+  assert.equal(half.current.score, 21);
+});
+
+test('crypto-weighted exposure follows the documented formula', () => {
+  const event = {
+    final_score: 40,
+    schema_version: 1,
+    asset_triggers: [
+      { asset: 'BTC', utility_score: 0.2 },
+      { asset: 'ETH', utility_score: 0.4 },
+      { asset: 'XRP', utility_score: 0.6 },
+    ],
+  };
+  const mix = { cashEquities: 25, btc: 25, eth: 25, xrp: 25, leveraged: false };
+  const result = computePersonalExposure(event, mix);
+  const expectedStresses = { cashEquities: 40, btc: 52, eth: 46, xrp: 40 };
+  const expectedBase = (25 * 40 + 25 * 52 + 25 * 46 + 25 * 40) / 100;
+
+  assert.deepEqual(result.components.stresses, expectedStresses);
+  assert.equal(result.components.baseExposure, expectedBase);
+  assert.equal(result.current.score, Math.round(expectedBase));
+});
+
+test('leverage is applied before clamp and final rounding', () => {
+  const result = computePersonalExposure(
+    { final_score: 95 },
+    { ...allCash, leveraged: true },
+  );
+  assert.equal(result.components.baseExposure, 95);
+  assert.equal(result.components.leverageFactor, 1.15);
+  assert.equal(result.components.preClampScore, 95 * 1.15);
+  assert.ok(result.components.preClampScore > 100);
+  assert.equal(result.current.score, 100);
+});
+
+test('uses existing legacy and v1 utility scaling with schema_version', () => {
+  const legacy = computePersonalExposure({
+    final_score: 40,
+    asset_triggers: [{ asset: 'BTC', utility_score: 20 }],
+  }, allBtc);
+  const v1 = computePersonalExposure({
+    final_score: 40,
+    schema_version: 1,
+    asset_triggers: [{ asset: 'BTC', utility_score: 0.2 }],
+  }, allBtc);
+  assert.deepEqual(legacy.components.utilities.btc, { score: 20, fallback: false });
+  assert.deepEqual(v1.components.utilities.btc, { score: 20, fallback: false });
+  assert.equal(legacy.current.score, 52);
+  assert.equal(v1.current.score, 52);
+});
+
+test('asset lookup is case-insensitive and the first matching entry wins', () => {
+  const result = computePersonalExposure({
+    final_score: 50,
+    schema_version: 1,
+    asset_triggers: [
+      { asset: 'btc', utility_score: 0.1 },
+      { asset: 'BTC', utility_score: 0.9 },
+    ],
+  }, allBtc);
+  assert.deepEqual(result.components.utilities.btc, { score: 10, fallback: false });
+  assert.equal(result.current.score, 62);
+});
+
+test('missing and malformed utilities use the neutral fallback without coercion', () => {
+  const malformedValues = [undefined, null, '0.2', NaN, Infinity, Number.MAX_VALUE];
+  for (const utility_score of malformedValues) {
+    const result = computePersonalExposure({
+      final_score: 40,
+      schema_version: 1,
+      asset_triggers: [{ asset: 'BTC', utility_score }],
+    }, allBtc);
+    assert.deepEqual(result.components.utilities.btc, { score: 60, fallback: true });
+    assert.equal(result.components.stresses.btc, 40);
+    assert.equal(result.current.score, 40);
+  }
+});
+
+test('malformed asset_triggers never throw and fall back neutrally', () => {
+  const triggerLists = [undefined, {}, [null], [7], [[], null, 'BTC']];
+  for (const asset_triggers of triggerLists) {
+    let result;
+    assert.doesNotThrow(() => {
+      result = computePersonalExposure({ final_score: 30, asset_triggers }, allBtc);
+    });
+    assert.deepEqual(result.components.utilities.btc, { score: 70, fallback: true });
+    assert.equal(result.components.stresses.btc, 30);
+  }
+});
+
+test('personal scores use all six existing bands and retain first-match boundaries', () => {
+  const entries = [0, 16, 36, 56, 76, 91];
+  assert.deepEqual(
+    entries.map((score) => computePersonalExposure({ final_score: score }, allCash).current.band.label),
+    GAUGE_BANDS.map((band) => band.label),
+  );
+  assert.equal(GAUGE_BANDS.at(-1).label, 'Market Dysfunction');
+
+  for (let index = 0; index < GAUGE_BANDS.length - 1; index += 1) {
+    const sharedEdge = GAUGE_BANDS[index].max;
+    assert.strictEqual(gaugeBand(sharedEdge), GAUGE_BANDS[index]);
+  }
+});
+
+test('next-regime inputs are derived from the band objects and overlapping boundaries', () => {
+  const derivedEntries = GAUGE_BANDS.slice(0, -1).map((band, index) => {
+    const nextBand = GAUGE_BANDS[index + 1];
+    if (gaugeBand(nextBand.min) === nextBand) return nextBand.min;
+    if (gaugeBand(band.max + 1) === nextBand) return band.max + 1;
+    return null;
+  });
+  assert.deepEqual(derivedEntries, [16, 36, 56, 76, 91]);
+
+  const currentBandEntries = [0, ...derivedEntries.slice(0, -1)];
+  for (let index = 0; index < derivedEntries.length; index += 1) {
+    const macro = currentBandEntries[index];
+    const result = computePersonalExposure({ final_score: macro }, allCash);
+    assert.equal(result.scenario.macroScore, derivedEntries[index]);
+    assert.equal(result.scenario.score, derivedEntries[index]);
+    assert.strictEqual(result.scenario.band, gaugeBand(derivedEntries[index]));
+    assert.equal(result.scenario.delta, result.scenario.score - result.current.score);
+  }
+  assert.equal(computePersonalExposure({ final_score: 91 }, allCash).scenario, null);
+});
+
+test('scenario reuses current fallback utilities instead of recomputing them', () => {
+  const result = computePersonalExposure({ final_score: 10 }, allBtc);
+  assert.deepEqual(result.components.utilities.btc, { score: 90, fallback: true });
+  assert.equal(result.current.score, 10);
+  assert.deepEqual(result.scenario, {
+    macroScore: 16,
+    score: 14,
+    band: GAUGE_BANDS[0],
+    delta: 4,
+  });
+});
+
+test('missing scores fail safely while invalid mix takes precedence', () => {
+  for (const event of [null, {}, { final_score: '40' }, { final_score: NaN }, { final_score: Infinity }]) {
+    assert.deepEqual(computePersonalExposure(event, allCash), {
+      ok: false, reason: 'missing-score', current: null, scenario: null, components: null,
+    });
+  }
+  for (const event of [null, {}, { final_score: NaN }]) {
+    assert.deepEqual(computePersonalExposure(event, { ...allCash, cashEquities: 99 }), {
+      ok: false, reason: 'invalid-mix', current: null, scenario: null, components: null,
+    });
+  }
+});
+
+test('calculation does not mutate the event or mix', () => {
+  const event = {
+    final_score: 40,
+    schema_version: 1,
+    asset_triggers: [{ asset: 'btc', utility_score: 0.2 }],
+  };
+  const mix = { ...DEFAULT_EXPOSURE_MIX };
+  const eventBefore = structuredClone(event);
+  const mixBefore = structuredClone(mix);
+  computePersonalExposure(event, mix);
+  assert.deepEqual(event, eventBefore);
+  assert.deepEqual(mix, mixBefore);
+});
+
+test('stored mixes round-trip and invalid storage is rejected without throwing', () => {
+  const serialized = serializeExposureMix({ ...DEFAULT_EXPOSURE_MIX, extra: true });
+  assert.equal(serialized, JSON.stringify({ v: 1, ...DEFAULT_EXPOSURE_MIX }));
+  assert.deepEqual(parseStoredExposureMix(serialized), DEFAULT_EXPOSURE_MIX);
+  assert.deepEqual(parseStoredExposureMix({
+    v: 1, ...DEFAULT_EXPOSURE_MIX, leveraged: 'true', extra: 'ignored',
+  }), DEFAULT_EXPOSURE_MIX);
+
+  assert.equal(serializeExposureMix({ ...DEFAULT_EXPOSURE_MIX, btc: 11 }), null);
+  const rejected = [
+    '{broken',
+    'null',
+    '[]',
+    { ...DEFAULT_EXPOSURE_MIX },
+    { v: 2, ...DEFAULT_EXPOSURE_MIX },
+    { v: 1, ...DEFAULT_EXPOSURE_MIX, eth: '10' },
+  ];
+  for (const raw of rejected) {
+    assert.doesNotThrow(() => parseStoredExposureMix(raw));
+    assert.equal(parseStoredExposureMix(raw), null);
+  }
+});
diff --git a/test/phase2-ui.test.js b/test/phase2-ui.test.js
new file mode 100644
index 0000000..59d59d9
--- /dev/null
+++ b/test/phase2-ui.test.js
@@ -0,0 +1,176 @@
+'use strict';
+
+const test = require('node:test');
+const assert = require('node:assert/strict');
+const fs = require('node:fs');
+const vm = require('node:vm');
+const renderExports = require('../public/render.js');
+
+const html = fs.readFileSync(require.resolve('../public/index.html'), 'utf8');
+
+function pageHarness(storedValue = null) {
+  const ids = [
+    'exposure-cash-equities', 'exposure-btc', 'exposure-eth', 'exposure-xrp',
+    'exposure-leveraged', 'exposure-validation', 'personal-result',
+    'score-panel', 'subscore-panel', 'subscore-breakdown', 'classification-panel',
+    'classification-body', 'newsletter-panel', 'newsletter-body',
+    'signup-form', 'signup-email', 'signup-submit', 'verify-form', 'verify-code',
+    'verify-submit', 'signup-status', 'exposure-signup-form', 'exposure-signup-email',
+    'exposure-signup-submit', 'exposure-verify-form', 'exposure-verify-code',
+    'exposure-verify-submit', 'exposure-signup-status',
+  ];
+  const selectIds = new Set([
+    'exposure-cash-equities', 'exposure-btc', 'exposure-eth', 'exposure-xrp',
+  ]);
+  const elements = Object.fromEntries(ids.map((id) => [id, {
+    id,
+    value: '',
+    checked: false,
+    disabled: false,
+    hidden: id.includes('verify-form'),
+    innerHTML: '',
+    textContent: '',
+    className: '',
+    options: selectIds.has(id)
+      ? Array.from({ length: 11 }, (_, index) => ({ value: String(index * 10) }))
+      : [],
+    listeners: {},
+    addEventListener(type, listener) { this.listeners[type] = listener; },
+  }]));
+  const storage = new Map();
+  if (storedValue !== null) storage.set(renderExports.EXPOSURE_MIX_STORAGE_KEY, storedValue);
+  const requests = [];
+  const context = {
+    ...renderExports,
+    RENDER_EXPORTS: renderExports,
+    document: { getElementById: (id) => elements[id] },
+    localStorage: {
+      getItem: (key) => storage.has(key) ? storage.get(key) : null,
+      setItem: (key, value) => storage.set(key, value),
+    },
+    fetch: (...args) => {
+      requests.push(args);
+      return new Promise(() => {});
+    },
+  };
+  const inlineScript = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
+  vm.runInNewContext(inlineScript, context);
+  return { context, elements, storage, requests };
+}
+
+test('calculator is a sibling between the headline and SSR analytical anchors', () => {
+  const scoreClose = html.indexOf('</section>', html.indexOf('<section id="stress-score">'));
+  const calculator = html.indexOf('<section id="personal-exposure">');
+  const subscores = html.indexOf('<section id="subscore-breakdown" hidden>');
+  assert.ok(scoreClose < calculator && calculator < subscores);
+
+  const scorePanelStart = html.indexOf('<div class="score-panel" id="score-panel">');
+  const scorePanelEnd = html.indexOf('</div>', scorePanelStart);
+  assert.ok(calculator > scorePanelEnd);
+});
+
+test('each allocation control contains exactly the 10-point option grid', () => {
+  const expected = Array.from({ length: 11 }, (_, index) => String(index * 10));
+  for (const id of ['exposure-cash-equities', 'exposure-btc', 'exposure-eth', 'exposure-xrp']) {
+    const select = html.match(new RegExp(`<select id="${id}">([\\s\\S]*?)<\\/select>`));
+    assert.ok(select, `${id} is present`);
+    const values = Array.from(select[1].matchAll(/<option value="(\d+)">/g), (match) => match[1]);
+    assert.deepEqual(values, expected);
+  }
+  assert.match(html, /isOwnOption \? parseInt\(raw, 10\) : NaN/);
+});
+
+test('calculator uses shared exports, retained events, and guarded local persistence', () => {
+  assert.match(html, /retainedExposureEvent = event;\s+recalculatePersonalExposure\(\);/);
+  assert.match(html, /globalThis\.RENDER_EXPORTS\.normalizeExposureMix\(mix\)/);
+  assert.match(html, /globalThis\.RENDER_EXPORTS\.computePersonalExposure\(retainedExposureEvent, mix\)/);
+  assert.match(html, /globalThis\.RENDER_EXPORTS\.parseStoredExposureMix\(raw\)/);
+  assert.match(html, /if \(typeof serialized !== 'string'\) return;/);
+  assert.doesNotMatch(html, /localStorage\.removeItem/);
+});
+
+test('signup flows retain independent forms and required list attribution', () => {
+  assert.match(html, /list: 'financial_stress_alerts'/);
+  assert.match(html, /list: globalThis\.RENDER_EXPORTS\.EXPOSURE_ALERT_LIST/);
+  assert.match(html, /body: JSON\.stringify\(\{ email, list: config\.list \}\)/);
+  assert.match(html, /body: JSON\.stringify\(\{ username: pendingEmail, code \}\)/);
+  assert.match(html, /statusId: 'signup-status'/);
+  assert.match(html, /statusId: 'exposure-signup-status'/);
+});
+
+test('calculator recomputes from retained and null events without overwriting a valid saved mix', () => {
+  const harness = pageHarness();
+  const { context, elements, storage } = harness;
+  assert.equal(elements['exposure-cash-equities'].value, '70');
+
+  context.renderEventIntoPage({ final_score: 40 });
+  assert.match(elements['personal-result'].innerHTML, />40<\/span>/);
+  const validStored = storage.get(renderExports.EXPOSURE_MIX_STORAGE_KEY);
+
+  elements['exposure-cash-equities'].value = '60';
+  elements['exposure-cash-equities'].listeners.change();
+  assert.equal(elements['exposure-validation'].textContent, 'Allocations must total exactly 100%.');
+  assert.equal(elements['personal-result'].innerHTML, '');
+  assert.equal(storage.get(renderExports.EXPOSURE_MIX_STORAGE_KEY), validStored);
+
+  context.renderEventIntoPage(null);
+  assert.match(elements['personal-result'].innerHTML, /Waiting for the current/);
+  assert.equal(elements['exposure-validation'].textContent, 'Allocations must total exactly 100%.');
+});
+
+test('only valid on-grid stored mixes initialize the allocation controls', () => {
+  const saved = renderExports.serializeExposureMix({
+    cashEquities: 40, btc: 20, eth: 20, xrp: 20, leveraged: true,
+  });
+  const restored = pageHarness(saved).elements;
+  assert.equal(restored['exposure-cash-equities'].value, '40');
+  assert.equal(restored['exposure-leveraged'].checked, true);
+
+  const offGrid = JSON.stringify({
+    v: 1, cashEquities: 65, btc: 15, eth: 10, xrp: 10, leveraged: false,
+  });
+  assert.equal(pageHarness(offGrid).elements['exposure-cash-equities'].value, '70');
+  assert.equal(pageHarness('{broken').elements['exposure-cash-equities'].value, '70');
+});
+
+test('calculator signup remains available for an invalid mix and verifies its own pending email', async () => {
+  const { context, elements, requests } = pageHarness();
+  elements['exposure-cash-equities'].value = '60';
+  elements['exposure-cash-equities'].listeners.change();
+  elements['exposure-signup-email'].value = 'calculator@example.com';
+
+  context.fetch = async (url, options) => {
+    requests.push([url, options]);
+    return { ok: true, json: async () => ({ success: true, needsVerification: true }) };
+  };
+  await elements['exposure-signup-form'].listeners.submit({ preventDefault() {} });
+  const signup = JSON.parse(requests.at(-1)[1].body);
+  assert.deepEqual(signup, {
+    email: 'calculator@example.com',
+    list: renderExports.EXPOSURE_ALERT_LIST,
+  });
+  assert.equal(elements['exposure-verify-form'].hidden, false);
+
+  elements['exposure-verify-code'].value = '123456';
+  await elements['exposure-verify-form'].listeners.submit({ preventDefault() {} });
+  assert.deepEqual(JSON.parse(requests.at(-1)[1].body), {
+    username: 'calculator@example.com', code: '123456',
+  });
+});
+
+test('general signup keeps its attribution and re-enables submission after an API error', async () => {
+  const { context, elements, requests } = pageHarness();
+  elements['signup-email'].value = 'general@example.com';
+  context.fetch = async (url, options) => {
+    requests.push([url, options]);
+    return { ok: false, json: async () => ({ success: false, message: 'Retry later' }) };
+  };
+
+  await elements['signup-form'].listeners.submit({ preventDefault() {} });
+  assert.deepEqual(JSON.parse(requests.at(-1)[1].body), {
+    email: 'general@example.com', list: 'financial_stress_alerts',
+  });
+  assert.equal(elements['signup-submit'].disabled, false);
+  assert.equal(elements['signup-status'].textContent, 'Retry later');
+  assert.equal(elements['exposure-signup-status'].textContent, '');
+});

```
