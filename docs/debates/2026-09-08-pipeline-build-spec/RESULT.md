# Pipeline build-spec review debate — result

**Date:** 2026-09-08
**Machine:** mac-mini 10.0.0.42
**Providers:** claude, codex, grok-build (3 external LLM families; synthesizer: claude)
**Rounds:** ran the full 3 of 3 — **did not fully converge** (codex still marked
`status: revise` at the end of round 3, on one point)
**Convergence:** majority consensus, all three questions; one live dissent (Q3, see below)

Subject under review: `~/e3d/docs/liquiditywatch-v1-contract-spec.md`, the 6-phase
`codex-spec-runner` spec written the same day to build the pipeline side of
LiquidityWatch's v1 API contract.

Full transcript: [`run/transcript.md`](./run/transcript.md).

---

## Q1 — Is the spec's scope and sequencing right?

**FINAL ANSWER (unanimous by round 3):** **Cut Phase 5 (causal graph) out of this spec
entirely.** Defer it to a separate follow-on spec, gated on two things that don't exist
yet: a measured Stage 1 cost/latency/structured-output-reliability spike from adding ~49
more scored items per cycle, and a resolved graph-artifact contract (see Q3). All three
participants independently named this the same failure this team was already burned by
once before (an earlier proposal cut for the same reason — scheduling an architecturally
heavy piece before any measured cost data). Ship Phases 1→2→3→4→6 in the written order —
Phase 6 need not move earlier (codex initially proposed this, then dropped it: Phase 6 is
purely additive either way, so its position doesn't change what ships or what's deferred).

**A defect in Phase 1 surfaced independently by codex, then confirmed by all three:** the
spec's plan to migrate `controlled_break_risk`/`liquidity_response_probability`/asset
scores from 0-100 to 0.0-1.0 *under the same field names* is a **silent breaking change**,
not a safe additive one. The repo's resilience rule ("every field optional, consumers
null-check") only covers a field's *absence*, not a *silent unit change* — a consumer that
checks presence but not scale will misinterpret the new values. Must be a renamed field, a
version bump consumers branch on, or a dual-write window — never a same-name reuse.

**CONSENSUS:** full
**DISSENT:** none (Phase 6 reordering was raised, then withdrawn by its own proposer)

---

## Q2 — Is the missing falsifiable-claim instrumentation a real gap?

**FINAL ANSWER (unanimous on substance):** Yes, real gap. Add the falsifiable-claim
instrumentation — `response_type`/`responsible_authority`/`qualifying_action`/
`observation_window`, plus immutable call ID, timestamp, archived payload snapshot, and
model/prompt provenance — to **this same spec's release train, immediately after Phase 1**
and before Phase 3/4/5. The team's own prior decision already split outcome *scoring*
(fast-follow) from claim *instrumentation* (v1, required from day one) — this build spec
implements the richer v1 fields while dropping the one already-decided v1 requirement that
makes the fast-follow possible without a redesign later. All three called this omission-
drift: gating a settled requirement behind unrelated richer phases (subscores, the F/I/S
split) is how "already decided" work loses to the next phase's novelty.

**Minor, non-decisional leftover disagreement:** whether this ships as part of Phase 1
itself (codex, initially) or as a distinct "Phase 1b" session (grok-build, then codex
came around to this in round 3) — Phase 1 is schema/scale/code-computed-velocity work,
while claim capture needs Stage 3 prompt changes and its own validation logic
(`observation_window` needs an explicit unit; `none_expected` needs defined semantics for
when a "no response predicted" claim becomes assessable). By round 3 the practical
recommendation converged: whichever session boundary is used, nothing from this spec ships
to production until the claim fields are populated and validated on every publish.

**CONSENSUS:** full on substance; minor session-packaging preference only
**DISSENT:** none that changes what ships or in what order

---

## Q3 — Is hand-syncing the causal-graph structure across repos the right pattern?

**FINAL ANSWER (majority, one live dissent):** No — reject hand-syncing. All three agree
"no shared code" was never meant to forbid a shared *data contract*; the graph's structure
(node/edge ids, polarity) is contract data, the same category as the API contract itself,
not executable logic. Replace the spec's planned hand-transcribed copy with a **single
versioned, immutable JSON structure artifact** that both repos pin to, validate against,
and — critically, a point codex raised and the others adopted — **record on every
published reading which graph-definition version it was scored against**, so a later
structure rewrite can never silently reinterpret historical readings.

**The live, unresolved dissent:** claude and grok-build hold that `docs/MODEL.md` (in the
front-end repo) stays the human **authoring** source — humans promote new nodes/edges into
that doc per the existing "AI suggests, code decides" law, and the JSON artifact is
generated from it and checked in CI. Codex holds that prose is "a poor machine authority"
and the immutable JSON artifact itself should be canonical, with documentation generated
from *or checked against* it — not demoting MODEL.md outright, but declining to name it
the source of truth. Grok-build's counter: inverting the authoring source risks the same
silent-drift failure mode in a different file (a human edits the 49-item JSON directly in
the pipeline repo while `MODEL.md` rots, unread). This was still live at the end of round
3 — codex explicitly kept `status: revise` over exactly this point.

**CONSENSUS:** majority (2 of 3 on MODEL.md-as-authoring-source; 1 of 3 wants JSON itself
canonical)
**DISSENT:** codex, on authoring-source only — not on the shared-conclusion that a
versioned pinned JSON artifact (however it's produced) replaces hand-sync.

---

## Assessment

This debate earns a real rewrite of `~/e3d/docs/liquiditywatch-v1-contract-spec.md`, not
just a note. Three concrete changes, in order of how much they change the spec:

1. **Cut Phase 5 from this spec.** Replace it with a short paragraph noting it's deferred
   to a follow-on spec gated on a measured Stage 1 cost/latency/reliability spike and a
   resolved graph-artifact contract (item 3 below) — don't delete the design thinking,
   just take it out of this spec's committed scope. Renumber Phase 6 to Phase 5 (or leave
   the ticket ID gap and note it — either is fine, consistency matters more than which).
2. **Add a new phase for falsifiable-claim instrumentation, immediately after Phase 1**
   (before what's currently Phase 3). Four fields plus immutable id/timestamp/payload
   archive/provenance, populated and validated on every publish from the moment this ships
   — not gated behind the richer phases. Also fix Phase 1 itself: the 0-100→0.0-1.0
   migration needs a renamed field, a version bump, or a dual-write window, not a same-name
   silent reuse (the current spec text doesn't call this out explicitly enough to survive
   an isolated `codex-spec-runner` session not re-deriving it from context).
3. **Rewrite Phase 5's design section** (kept as deferred-scope documentation, not deleted)
   to specify a versioned JSON structure artifact instead of hand-sync, with `MODEL.md` as
   the authoring source and the artifact generated/validated in CI (the majority position;
   flag codex's dissent — JSON-as-canonical — as a real open question for Chris to settle
   before that follow-on spec is written, not something this debate fully closed).

I have not yet applied these to the spec file — say the word and I will.
