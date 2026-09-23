# Phase 1 Summary

- Phase: 1
- Title: Deterministic Calculator Model
- Provider: codex
- Model: gpt-5.6-sol
- Completed: 2026-09-22T21:47:19-0700
- Exit status: 0

## Implementation Handoff

- Implemented the Phase 1 deterministic Personal Liquidity Exposure model in `public/render.js`.
- Exported the required defaults, storage/list constants, mix normalization/storage helpers, and calculator contract.
- Browser classic-script loading now publishes the same export object on `globalThis.RENDER_EXPORTS`.
- Calculator inputs remain pure and DOM/network/storage/time independent; invalid inputs return the specified failures.
- Asset utilities use first-match case-insensitive lookup and existing schema-aware scaling, with neutral fallbacks.
- Current and next-regime scores reuse `GAUGE_BANDS`/`gaugeBand`, including shared-edge first-match behavior.
- Scenario utilities reuse current fallbacks; leverage, clamp, and final rounding follow the specified order.
- Added focused built-in Node coverage in `test/exposure-calculator.test.js` for arithmetic, boundaries, fallbacks, scenarios, persistence, browser export, errors, and non-mutation.
- Documented the derivative formula and interpretation in `docs/MODEL.md` without changing the headline band table.
- Updated `CLAUDE.md` to identify this as the sole narrow presentation-derivative exception.
- Passed: `node --check server.js`, `node --check public/render.js`, and all 16 calculator tests.
- `npm install` could not complete because registry DNS is unavailable (`ENOTFOUND registry.npmjs.org`); no dependency or lockfile changes were made.
- Unresolved follow-ups: none for Phase 1; Phase 2 UI work remains intentionally out of scope.

## Verification
- passed: `npm install && node --check server.js && node --check public/render.js && node --test test/exposure-calculator.test.js`

## Worktree Snapshot
- ` M CLAUDE.md`
- ` M docs/MODEL.md`
- ` M package-lock.json`
- ` M public/render.js`
- `?? .codex-spec-runner/`
- `?? .e3d-pilot/`
- `?? test/`
