# LiquidityWatch vision-strategy debate — result

**Date:** 2026-09-08
**Machine:** mac-mini 10.0.0.42
**Providers:** claude, codex, grok-build (3 external LLM families; synthesizer: claude)
**Rounds:** converged after round 2 of a max 3 (round 3 skipped — all participants agreed)
**Convergence:** full consensus, all three questions, both rounds

Full transcript: [`run/transcript.md`](./run/transcript.md).

---

## Q1 — Build on `e3d-corp`, or merely shaped like it?

**FINAL ANSWER:** Standalone implementation. Mirror `e3d-corp`'s
Entity→Relationship→Event→Decision→Outcome→Learning shape and identifiers — same nouns,
same node/edge naming conventions — but do not share its runtime or storage. `e3d-corp` is
an immature action runtime; LiquidityWatch is a publish product. Coupling a live public
score to an unstable dependency's schema churn is the wrong trade regardless of the reuse
on offer. The concrete reuse actually worth taking (typed edges, confidence, lifecycle
status) is already available as a schema convention via `e3d-maps`, not gated behind a
runtime dependency on `e3d-corp`. Revisit a real `e3d-corp` instance only after `e3d-corp`
stabilizes *and* LiquidityWatch has an actual Decision/Outcome stream to justify it.

Notable refinement (codex, round 2): the repo's own "contracts not code" law is a *local*
join law between this front end and its pipeline — it doesn't automatically settle
whether to depend on `e3d-corp`'s runtime. The standalone call is still correct, but on
its own merits (immaturity, blast radius, no coordinated-migration benefit), not because
an ecosystem-wide rule already decided it.

**CONSENSUS:** full
**DISSENT:** none

---

## Q2 — Is the outcome loop the real differentiator, and is it v1 scope?

**FINAL ANSWER:** Fast-follow, not v1 — and VISION.md's implication that it belongs in
scope from the start doesn't hold up. Ship v1 with outcome-*ready* instrumentation only:
immutable call ID, timestamp, archived payload (score, phase, Controlled Break Risk,
Liquidity Response Probability), model/prompt/version provenance, and a **falsifiable
claim spec per call** (expected response type, responsible authority, qualifying action,
observation window). That is recording, not a learning loop, and it's what makes
retrospective scoring possible later without redesigning anything. Actual outcome
labeling, scoring, and calibration are a fast-follow triggered by accumulating enough
real dated calls — explicitly **not** a calendar deadline (round 2 corrected an initial
"2-3 months" guess: Fed/Treasury liquidity responses are rare, so elapsed time doesn't
guarantee a usable sample; scoring on n≈0 would be "calibration theater," worse than no
loop at all).

Notable refinement (codex/grok-build, round 2): the outcome loop is not the product's
*sole* differentiator — the curated causal graph, blind independent critique, and
publish-only-on-material-change already differentiate it from a plain dashboard. The loop
substantiates the *stronger* "learning system" claim; it doesn't create the weaker
"differentiated monitor" claim, which already exists without it.

**CONSENSUS:** full
**DISSENT:** none — minor phrasing differences on the fast-follow trigger and on whether
the loop is the sole differentiator; no participant proposed building the scorer in v1.

---

## Q3 — Public positioning.

**FINAL ANSWER:** Lead publicly with "an AI-run U.S. financial-stress monitor." Describe
the causal graph as the product's **mechanism**, not its **category**. Reserve
"persistent intelligence system" / world-model framing for internal docs
(`VISION.md`) until the outcome loop has produced a real track record. Committing to the
grander framing now is a credibility gap, not an option-preserving choice: it also
mis-sets the failure mode, since a quiet publish cycle (no reading changed) would read as
"the world-model failed" rather than "the monitor had nothing new to say." The internal
claim — "first domain-specific instance of the E3D intelligence-graph architecture" — can
stay in `VISION.md` as a design rationale; it does not need to be, and should not be, the
public pitch.

**CONSENSUS:** full
**DISSENT:** none

---

## Assessment

Three concrete edits, all confirming and tightening what's already drafted rather than
reversing it. **`MODEL.md` §8 item 5** should stop reading as an open decision and instead
record the resolution: v1 ships instrumentation only (call ID, timestamp, payload
snapshot, provenance, and — new, not in the current draft — a structured falsifiable-claim
spec per call: response type / authority / window); scoring, labeling, and calibration are
a fast-follow gated on accumulated real calls, explicitly not a calendar trigger.
**`VISION.md`'s "open strategic question"** section (the Q3 framing debate) should be
closed out: state the concrete-monitor-public / world-model-internal resolution directly
rather than leaving it unsettled, and adjust point 4 ("the outcome loop is the point,
eventually") to note it is fast-follow by design, not an implicit v1 commitment. No change
needed to `VISION.md`'s `e3d-corp` table row — it already describes conceptual kinship,
not runtime sharing, so Q1's answer doesn't contradict it; worth adding one sentence
making the "standalone, shaped-like" boundary explicit so a future reader doesn't infer
otherwise. Public-facing copy (`README.md`, `about.html`) was checked and already uses
concrete monitor language, not world-model framing — no change needed there.
