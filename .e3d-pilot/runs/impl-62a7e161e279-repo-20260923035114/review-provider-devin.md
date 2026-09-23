**Correctness observations:**

- `normalizeExposureMix` uses `reduce`-sum `!== 100` which can fail for non-integer inputs due to floating-point. Benign in practice since the UI constrains to 10-point integer increments, but the helper itself accepts arbitrary numbers.
- `Number.MAX_VALUE` in the malformed-utility test is handled correctly: `scaledUnitPercent` produces `Infinity`, `Number.isFinite` fails, fallback triggers. ✓
- `else if (typeof globalThis !== 'undefined')` correctly blocks the browser export path in Node, while the `vm.runInNewContext` harness exercises it cleanly. ✓
- `retainedExposureEvent` is assigned before the early-return in `renderEventIntoPage`, satisfying the nullish-clear requirement. ✓
- `beforeSignup` callback saves the mix only when `serializeExposureMix` returns a string (the guard is in `saveExposureMix`). ✓
- `escapeHtml` and `buildGaugeSvg` are called on `RENDER_EXPORTS` in the new `renderPersonalExposureResult` function but not added in this diff's export block — they must pre-exist. Verification passing confirms this; still worth auditing if the pre-existing export list is ever trimmed.

**Minor non-blocking notes:**

- `.codex-spec-runner/` and `.e3d-pilot/` runner artifacts are committed; they should either live in `.gitignore` or be explicitly excluded from the production tree. No functional impact.
- `package-lock.json` upgraded from lockfileVersion 1 → 3 as a side effect of running a newer npm. All package versions are unchanged; this is harmless.
- The floating-point sum tolerance issue noted above is low-risk given UI constraints, but a future non-UI caller could trip it.

---VERDICT---
status: approved
reason: implementation is arithmetically correct, SSR anchors preserved, signup flows independent, storage guards sound, and all stated verification passed
