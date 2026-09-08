# Debate

**Question:** You are one of several AI models in a structured debate. A human needs decisive
guidance on three linked questions about an implementation spec for a product called
LiquidityWatch. This brief is self-contained — you do not need repo access.

═══════════════════════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════════════════════

**LiquidityWatch** publishes a single U.S. Financial Stress Score, 0-100, answering "how
close is the U.S. financial system to a point where policymakers are forced to act?" A
three-stage AI pipeline produces it: Stage 1 (OpenAI deep research — score, drivers,
evidence), Stage 2/2b (Grok, independent critique of Stage 1's evidence bundle without
seeing Stage 1's score, escalating to a targeted search if the two disagree past a
threshold), Stage 3 (Claude, narrative synthesis). Fully automated, no human-approval
gate, publishes only when a reading is materially different from the last one. The
pipeline is **already built and running in production** — this debate is about a spec to
extend it, not about the base architecture.

**Two repos, joined only by a versioned JSON contract, never shared code** (an explicit,
hard ecosystem rule): a front-end repo (static site, renders the model, computes nothing)
and a pipeline repo (the actual scoring, described above). This is settled architecture,
not open for debate here.

**What the pipeline emits publicly today (v0.0, verified against the running code)**: one
headline score, one free-text regime label, a phase enum, two trigger metrics
(Controlled Break Risk, Liquidity Response Probability — both currently 0-100 scale), 3-5
driver strings, up to 3 "next trigger" strings, 3 asset notes (BTC/ETH/XRP, each with a
0-100 "utility/confirmation" score), and one paragraph of narrative prose. Nothing more
structured than that reaches the public API.

**A newer model spec (already written, not yet built)** describes a richer "multi-domain
stress-propagation model": six sub-engine scores (Treasury stress, Funding stress, Fed
response, AI Economic Impulse, Energy stress, Global Liquidity — each 0.0-1.0 with
evidence), a structural Facts/Interpretation/Speculation split (replacing the one prose
paragraph), a categorical policy classifier parallel to the score band, and — the most
novel piece — a **human-authored causal graph**: ~22 nodes (Oil Shock, Inflation, Fed
Constraint, Treasury Liquidity, Repo Stress, Credit Stress, AI Capex, Power Demand, Crypto
Liquidity, ...) and ~27 directional edges with a polarity (amplifies/dampens/constrains).
The graph's *structure* is fixed and human-authored (a deliberate design law: "AI
suggests, code decides" — the LLM pipeline may only propose a new node/edge, which lands
in a separate `proposed` array a human must promote by hand; it can never edit structure
inline). Each publish cycle, the pipeline re-scores every existing node's *state*
(0.0-1.0, a stress/activation level) and every edge's *activation* (is this link
currently hot).

**A separate, already-resolved strategic decision (a prior debate, full consensus, same
team, same day)** settled three things relevant here:
1. This build is standalone — it does not depend on or share runtime/storage with any
   other internal automation platform, despite conceptual kinship.
2. **The "outcome loop" — scoring whether a published call like "STRESS_BUILDING on date
   X" was actually followed by a real Fed/Treasury response — is explicitly a
   fast-follow, NOT v1 scope**, because real liquidity-response events are too rare to
   score honestly yet (scoring on ~0 samples would be "calibration theater"). What **is**
   v1 scope: recording, for every published call, an immutable ID, timestamp, an archived
   payload snapshot, model/prompt provenance, and a **falsifiable-claim spec** — four
   fields making the eventual scoring possible without a redesign: `response_type` (the
   category of action that would count, including `none_expected`), `responsible_
   authority` (`fed`/`treasury`/`both`), `qualifying_action` (one human-checkable
   sentence — not "a response," a specific fact someone can look up and confirm or deny),
   and `observation_window` (a bounded number of days after which, absent the qualifying
   action, the claim scores as "no response"). This four-field spec exists in the model
   docs. It does **not** yet exist anywhere in the pipeline's build spec described below.
3. Public positioning stays concrete ("an AI-run U.S. financial-stress monitor"), not
   grand ("a persistent intelligence system") — irrelevant to this debate, included only
   for completeness.

There is also **known team history relevant here**: an earlier proposal for a different
part of this same ecosystem was cut hard by a second-opinion review — "multi-agent
investment committee, thesis graph, regime classifier, 6 phases, before anything was
proven to work" was reduced to a minimal MVP. Scope discipline is a documented weak point
for this team, not a hypothetical concern.

**The actual 6-phase implementation spec now written for the pipeline side** (to be run
phase-by-phase, each phase an isolated AI coding session against the real codebase):

- **Phase 1** — schema version marker, migrate the two trigger metrics + asset scores
  from 0-100 to 0.0-1.0, add code-computed (not LLM-computed) velocity/acceleration on
  the headline score and both trigger metrics.
- **Phase 2** — the six sub-engine scores, additive alongside the pipeline's existing
  free-text state fields (which stay, untouched, feeding the narrative stage as before).
- **Phase 3** — the Facts/Interpretation/Speculation structural split: Stage 1 emits
  facts-with-mandatory-evidence, Stage 3 emits interpretation and speculation
  (speculation always the lowest-confidence tier by definition, regardless of its own
  confidence number).
- **Phase 4** — the policy classifier (LLM-judged, from observed policymaker behavior,
  not derived from the score alone) plus XRP-specific asset-trigger fields, one of which
  (`bridge_role`) is derived deterministically in code from the score and one of which
  (`flow_composition` — is money actually routing through XRP or bypassing it) is a real
  LLM judgment call.
- **Phase 5** — the causal graph. Requires a new, hand-authored data file in the pipeline
  repo that duplicates the front-end repo's node/edge list (no shared code between repos,
  so this is a deliberate, manually-synced duplication — a structure change in one repo
  with no matching edit in the other is a silent bug). Extends the Stage 1 prompt to
  score all ~22 nodes and ~27 edges every cycle, keyed to the fixed ids, with a separate
  never-auto-merged `proposed` array for genuinely new node/edge suggestions. Explicitly
  flagged in the spec itself as the highest-risk phase: the cost/latency impact of adding
  49 more structured-output items to every Stage 1 call has not been measured against
  the current baseline before this phase would run.
- **Phase 6** — a `/history` endpoint returning trimmed flat scalars (no evidence, no
  narrative) for sparklines, powered by whatever's already been persisted by the earlier
  phases. No LLM/prompt changes at all.

Each phase is additive to the public wire contract (per an existing, load-bearing
resilience rule: every API field is optional, every consumer null-checks before using a
field) — so nothing here can break what's live today regardless of which phases ship.

═══════════════════════════════════════════════════════════════════════════
THE THREE QUESTIONS
═══════════════════════════════════════════════════════════════════════════

**Q1 — Is this spec's scope and sequencing right, given this team's documented
scope-discipline problem?**
Six phases, several of them genuinely substantial (Phase 5 alone rewrites Stage 1's
prompt shape and adds a new data file that must be hand-synced across two repos
forever). Is building all six now the right call, or should some be cut/deferred out of
this spec entirely — Phase 5 in particular, given its self-flagged unmeasured cost risk?
Is the ordering (foundational → subscores → facts/interp/spec split → classifier/asset
fields → causal graph → history) defensible, or should something be reordered? Give a
decisive recommendation: ship all six as ordered, cut/defer specific phases (name which),
or reorder (say the new order) — and say why in terms of the concrete risk, not just
"seems fine."

**Q2 — The falsifiable-claim instrumentation is missing from this spec. Should it be
added, and where?**
The team's own most recent decision says v1 must record, for every published call, a
falsifiable-claim spec (`response_type`/`responsible_authority`/`qualifying_action`/
`observation_window`) — specifically so a later, separate fast-follow effort can score
outcomes without a pipeline redesign. This 6-phase build spec doesn't include it anywhere.
Is that a real gap that should be closed in this same spec (say which phase, or as a new
phase and where in the sequence), or is it legitimately out of scope for this spec and
better left for a separate, smaller one? If the latter, say why leaving a known, already-
decided requirement unaddressed here isn't just scope drift in the other direction.

**Q3 — Is hand-syncing the causal graph's structure across two repos, forever, the right
integration pattern — or does "no shared code between repos" need a narrower reading
here?**
The ecosystem law is "no shared code, only a versioned JSON contract." Phase 5 applies
that literally to *structure data* (which nodes exist, how they connect), not just to
logic — producing two hand-maintained copies of the same ~49-item list that must never
drift, with only a test in one repo (checking the copy doesn't have dangling edges) as a
safety net, and nothing checking the two repos' copies actually match each other. Is a
manually-synced duplicate the right call here, or does structure-as-data deserve a
different treatment than logic-as-code under the same law (e.g., one repo publishes the
structure as a versioned data artifact the other fetches/checks against, without either
importing the other's *code*)? Decide, and name the concrete failure mode of whichever
answer you don't pick.

═══════════════════════════════════════════════════════════════════════════
HOW TO ANSWER
═══════════════════════════════════════════════════════════════════════════

Be decisive, not hedgy. Name trade-offs concretely. If you think any question rests on a
false premise, say so directly instead of answering around it.

In every round after the first, end with exactly these lines:

POSITION:
  Q1: <one sentence>
  Q2: <one sentence>
  Q3: <one sentence>
status: approved|revise

("approved" = a person acting on your three answers and a person acting on every other
participant's three answers would make the same decisions. Extra nuance or caveats do not
count as disagreement. "revise" = on at least one question, someone following your answer
would act differently than someone following another participant's.)

## Round 1 -- claude

**Q1 — Cut Phase 5 from this spec; ship 1, 2, 3, 4, 6 as ordered.**
Phase 5 is the one phase the spec itself admits it can't cost — 49 more structured-output items per Stage 1 call, no baseline measurement. That's exactly the shape of the failure this team already had (multi-agent investment committee, thesis graph, 6 phases, cut before proof). Don't repeat it: split Phase 5 into its own follow-on spec, gated on a cheap pre-step (run Stage 1 with the 49 extra fields against real inputs, measure latency/cost delta, then decide). Phases 1→4→6 are otherwise correctly sequenced — foundational units before anything depends on them, subscores before the classifier that might reference them, history last since it only reads what's already persisted. No reorder needed among the kept phases.

**Q2 — Real gap, close it inside this spec, as a new phase inserted right after Phase 1.**
This isn't optional polish — it's an already-decided v1 requirement from a settled debate, and skipping it here is scope drift in the omission direction, which is just as much a discipline failure as over-building. It belongs early, not bolted on later: `response_type`/`responsible_authority`/`qualifying_action`/`observation_window` need to be attached to *every* published call from the moment publishing resumes after this build, or you accumulate a backlog of calls the fast-follow can never retroactively score. It's also cheap and independent — a small Stage 3 prompt addition plus a persisted record, no dependency on subscores, the F/I/S split, or the graph. Put it before Phase 2, not after Phase 4 — there's no reason to gate it behind unrelated, riskier work.

**Q3 — Manual duplication is wrong, and this repo's own rules already say why.**
CLAUDE.md rule 7 states the causal graph's structure is human-authored in `docs/MODEL.md` — in the front-end repo. Phase 5 as written has the pipeline repo hand-author a *second* copy of that same structure. That's not "no shared code, shared contract" — that's two humans maintaining one fact in two places with no cross-check. The fix that actually follows the ecosystem law: the front-end repo publishes the graph structure (ids, edges, polarity) as a versioned data artifact — the same kind of joint already used for the API contract — and the pipeline repo fetches/validates against it at build or cycle-start, never hand-copies it. `docs/MODEL.md` stays the single source of truth; the pipeline gets a generated, checked snapshot, not a parallel hand-write.
Failure mode if you keep hand-sync: a human edits/renames a node in `MODEL.md`, forgets the pipeline's copy, Stage 1 keeps scoring a stale id or silently drops a renamed one — no test catches it because the only existing check (dangling-edge test) lives in one repo and never compares against the other. That's a silent, compounding drift bug, discovered only when a user notices the graph doesn't match the doc.

POSITION:
  Q1: Ship phases 1, 2, 3, 4, 6 now; pull Phase 5 out into its own follow-on spec gated on a measured cost/latency test.
  Q2: The falsifiable-claim fields are a real, already-decided gap — add them as a new phase inserted right after Phase 1, not deferred.
  Q3: Reject hand-sync; front-end's `docs/MODEL.md` stays canonical and publishes the graph structure as a versioned data artifact the pipeline fetches/validates, never hand-copies.
status: approved

## Round 1 -- codex

Q1: Do not ship all six as ordered. Ship **1 → 2 → 3 → falsifiable claims → 6 → 4**, and defer Phase 5 until two prerequisites exist: a measured Stage 1 cost/latency/reliability benchmark for the extra 49 outputs, and a single-source graph contract as described in Q3. Phase 6 should move ahead of the classifier because it is cheap, creates immediate longitudinal value, and changes no prompts. Phase 4 is bounded enough to retain, but it is less foundational than history and claim capture.

One premise is false: optional fields do not make changing an existing field from 0–100 to 0–1 non-breaking. That is a semantic breaking change if the field name remains unchanged. Phase 1 must either introduce new field names, publish a new contract version with consumers branching on it, or temporarily dual-write both scales.

Q2: Yes, its omission is a real spec defect. Add a dedicated phase immediately after Phase 3, when evidence and epistemic roles have become structured. It must generate and validate the four claim fields, assign the immutable publication ID and timestamp, capture prompt/model provenance, and archive the exact payload atomically with publication. This is instrumentation, not the deferred outcome loop: it records predictions prospectively but does not judge them. Leaving it to another spec risks shipping calls that can never be evaluated cleanly, recreating precisely the later redesign the prior decision intended to prevent.

The observation window needs a bounded integer plus explicit unit, and `none_expected` must still state what absence is predicted and when it becomes assessable.

Q3: Do not hand-sync the graph. “No shared code” should not be misread as “duplicate authoritative data.” Make the pipeline’s graph definition a canonical, versioned JSON artifact under the wire contract. Each reading references its graph-definition version; the front end consumes a pinned artifact at build time or fetches the matching version at runtime. Contract validation should cover IDs, edge endpoints, polarity enums, uniqueness, and compatibility.

This preserves repository and runtime separation: neither repository imports the other’s code. The rejected alternative has an inevitable silent-drift failure mode—both local copies can pass their own integrity tests while disagreeing on an ID or edge, causing valid pipeline activations to be omitted, mislabeled, or rendered against the wrong topology. Conversely, runtime-only fetching without pinning would make historical readings change meaning, so immutable versioned definitions are load-bearing.

## Round 1 -- grok-build

**Q1 — Cut Phase 5 from this spec. Ship 1→2→3→4→6 as ordered. Do not reorder the rest.**

This team already had a six-phase graph-and-classifier plan cut to an MVP for the same reason: unproven surface area before a measured win. Phase 5 is that pattern again. It rewrites Stage 1’s output shape, adds ~49 structured items per cycle with **unmeasured** cost/latency on a live, ungated publisher, and creates a permanent dual-repo structure file. That is not a sequencing nit; it is a production-risk item the spec itself flags and then still schedules. Defer it until a spike measures Stage 1 cost against today’s baseline. If the spike is cheap, Phase 5 becomes its own spec.

Keep 1–4 and 6. Phase 1 is scale/schema hygiene the later fields sit on. Phase 2 is the actual model extension. Phase 3 is the epistemic contract (facts vs interpretation vs speculation). Phase 4 is additive product fields on an already-public asset slot, not a new architecture. Phase 6 is the cheap user-visible win and needs no LLM work; it does **not** need the graph. Putting history after the graph would hostage sparklines to the riskiest phase.

Do not cut Phase 4 to perform discipline. Cutting the self-flagged, unmeasured rewrite is the discipline. Shipping “all six as written” repeats the documented failure.

**Q2 — Real gap. Fold the four claim fields (plus immutable id, timestamp, archived payload, prompt/model provenance) into Phase 1. Not a new phase, not a later spec.**

The prior decision already split this: outcome **scoring** is a fast-follow; claim **instrumentation** is v1. This spec implements v1 richness and omits the one v1 requirement that makes the fast-follow possible without a redesign. That is not prudence; it is dropping a decided persistence field while adding subscores and a graph.

Phase 1 is the right home: it already introduces the schema version marker and persisted scalars. These four fields are small, code-shaped (the pipeline can require them on every publish), and worthless if they start after weeks of richer publishes. A separate later spec is how “already decided” work loses to the next shiny phase. Leaving it out here is scope drift toward novelty, not away from it.

**Q3 — Hand-syncing structure forever is the wrong reading of “no shared code.” Structure is contract data. Publish it as a versioned JSON artifact both repos pin to.**

The law forbids shared **code**, not a shared **contract**. Node ids, edge ids, and polarity **are** the contract for Phase 5 (when it happens). Two hand-copied ~49-item lists with a dangling-edge test in one repo do not enforce equality. The failure mode of the spec’s pattern: a human edits one copy, the other silently diverges, and the live UI draws a graph the pipeline is not scoring (or the pipeline scores nodes the UI dropped). That is a lying dashboard, not a style issue.

Canonical structure file in the versioned API contract (or a `graph-structure@vN.json` the contract names). Pipeline scores against those ids; frontend renders against the same pin; CI in both repos checksums the pin. Neither imports the other’s runtime. The failure mode of **that** choice is deploy skew if someone ships without bumping the pin — which is visible and testable, unlike silent dual-copy drift.

## Round 2 -- claude

Q1: I largely land where claude and grok-build did — cut Phase 5, ship 1→2→3→4→6, gate the graph phase on an actual measured Stage-1 cost/latency spike rather than scheduling the unmeasured version. That's the same move this team already had to make once before (thesis-graph/investment-committee), and repeating the unmeasured-49-fields choice would be ignoring a lesson they already paid for.

Codex's reorder (6 before 4) is a reasonable optimization but not decisive — Phase 6 has zero prompt risk either way, so whether it lands before or after Phase 4 doesn't change what ships or what's deferred. I wouldn't fight over it.

Codex's other point is the one addition that actually matters and the others missed it: changing the trigger-metrics/asset-score fields from 0–100 to 0.0–1.0 *in place* is a breaking change for any consumer reading the old scale, even though the field stays "present." The repo's own resilience rule ("every field is optional, consumers null-check") only covers *absence*, not *silent unit change* — a consumer that doesn't null-check the scale, just the presence, will silently misinterpret a score. Phase 1 needs either a renamed field, a contract version bump consumers branch on, or a dual-write window. This is a correctness gap in the spec, not a nuance, and I'd fold it into Q1's answer for Phase 1 specifically.

Q2: Full agreement across all three that this is a real, already-decided gap and belongs early in this same spec, not a separate one. The exact phase number (right after Phase 1 vs. folded into Phase 1 vs. after Phase 3) is genuinely minor — all three agree it precedes Phase 4/5, is independent of subscores and the graph, and must apply to every publish from the moment this spec ships. An implementer following any of the three lands in the same place: claim fields exist and are populated before richer phases go out.

Q3: Full agreement — hand-syncing is wrong, publish the graph structure as a versioned data artifact (part of or alongside the API contract) that both repos pin to and validate against, never a parallel hand-write. The named failure mode (silent structural drift between two copies, caught by neither repo's own tests) is the same across all three answers, and the fix is the same pattern already used for the API contract itself. No daylight here.

Net: three independent models converged on cut-Phase-5-pending-measurement, close-the-claim-gap-early-in-this-spec, and reject-hand-sync-for-a-versioned-artifact. The remaining differences (exact phase slot for claim fields, 4-vs-6 ordering) are implementation nuance, not decision-changing. Codex's breaking-change catch on Phase 1's scale migration is worth folding in explicitly, but doesn't change any of the three headline recommendations.

POSITION: Cut Phase 5 pending a measured cost spike (ship 1→2→3→4→6, with Phase 1's 0–100→0.0–1.0 migration versioned/renamed rather than silently reused), add the falsifiable-claim fields early in this same spec rather than deferring them, and replace hand-synced graph duplication with a single versioned structure artifact both repos pin to.
status: approved

## Round 2 -- codex

My prior core position holds, but I would simplify the sequence to the emerging consensus: ship Phases 1–4 and 6 in their existing order, and remove Phase 5 into a separately approved follow-on. Moving history earlier offers limited benefit because the retained phases are additive, while changing the published sequence creates needless implementation churn. Phase 5 should require measured cost, latency, structured-output reliability, and a resolved graph contract before approval.

One unresolved defect remains: Phase 1’s 0–100 to 0–1 migration is not automatically non-breaking merely because fields are optional. Reusing field names with new semantics can silently corrupt older consumers. Dual-write renamed fields or require version-aware interpretation during migration.

Grok is right that claim capture belongs in Phase 1. I previously placed it after Phase 3 to benefit from the epistemic split, but that dependency is unnecessary and delays prospective records. Phase 1 should establish the immutable publication ID, timestamp, exact archived payload, provenance, and validated four-field claim specification. Outcome adjudication remains deferred. Claude’s separate post-Phase-1 phase is acceptable architecturally, but it permits an avoidable interval in which publications remain unevaluable.

All three answers correctly reject permanent hand-syncing. The graph definition is contract data, not shared executable code. It should be an immutable, versioned JSON artifact, with each reading recording its graph version and both repos validating/pinning it. I would not canonize `docs/MODEL.md` itself, as Claude suggests; prose documentation is a poor machine authority. The JSON artifact should be canonical and the documentation generated from or checked against it. Manual copies can each pass local validation while disagreeing, yielding a UI that renders a different topology from the one scored. Runtime fetching without immutable pinning is also unacceptable because it could reinterpret historical readings.

POSITION: Ship Phases 1–4 and 6 in order, fold complete falsifiable-claim capture into Phase 1, defer Phase 5 behind measured performance and reliability gates, and use one canonical immutable versioned graph JSON artifact rather than hand-synced copies.
status: revise

## Round 2 -- grok-build

**Q1 — Cut Phase 5. Keep 1→2→3→4→6. Do not reorder 4 and 6.**

Phase 5 is the same failure this team already had: a graph rewrite scheduled before a measured win. Unmeasured +49 Stage 1 structured outputs on an ungated publisher is production risk, not a later sequencing nit. Spike cost/latency first; then a follow-on spec.

Codex is wrong to put Phase 6 before Phase 4. History only reads what was persisted. Shipping 4 first makes the first `/history` include the policy/XRP scalars; swapping them is discipline theater. The cut that matters is Phase 5.

Codex is right on one Phase 1 fact, not on sequence: renaming 0–100 fields to 0.0–1.0 under the same names is a semantic break. Dual-write, new names, or a contract version — inside Phase 1, not a reason to reshuffle.

**Q2 — Real gap. New phase immediately after Phase 1. I am changing this from “fold into Phase 1.”**

The prior decision already split scoring (fast-follow) from instrumentation (v1). Omitting the four fields here is omission-drift. Every publish after this build needs them or you mint calls the fast-follow cannot score.

Folding into Phase 1 was wrong: that session is schema/scale/velocity (code). Claims need Stage 3 prompt work, validation (`none_expected` still names the absent action and when it becomes assessable; `observation_window` is a bounded integer **with unit**), plus immutable id, timestamp, payload archive, and prompt/model provenance. Isolated sessions exist so that mix does not happen.

Codex is wrong to wait until after Phase 3. `qualifying_action` does not require F/I/S. Gating a decided persistence field behind two substantial phases is how “already decided” loses.

**Q3 — Reject hand-sync. Structure is contract data. `docs/MODEL.md` stays the authoring source of truth.**

Codex inverts the design law by making the pipeline canonical. Nodes, edges, polarity are authored in the front-end model doc; the pipeline fills states. Publish that structure as a versioned JSON artifact both repos pin. Neither imports the other’s code. Each published reading stores the graph-definition version it scored against — otherwise a later topology rewrite silently rewrites history (Codex’s real point; Claude underweights it).

Hand-sync failure: one copy is edited, the other is not, each repo’s local test still passes, the UI draws a graph the pipeline is not scoring. Fetch-latest-without-pin failure: old readings change meaning.

POSITION:
  Q1: Ship 1→2→3→4→6 as ordered; defer Phase 5 to a follow-on spec gated on a measured Stage 1 cost/latency spike.
  Q2: Add falsifiable-claim instrumentation (four fields plus id/timestamp/archive/provenance) as a new phase immediately after Phase 1, not folded in and not after Phase 3.
  Q3: Reject hand-sync; MODEL.md remains SoT, published as a versioned graph artifact both repos pin, with that version recorded on every reading.
status: revise

## Round 3 -- claude

Consensus has converged on all three questions; the remaining daylight is cosmetic, not decisional.

**Q1**: Unanimous now — cut Phase 5 pending a measured cost/latency spike, ship 1→2→3→4→6 in that order, and fix Phase 1's 0–100→0.0–1.0 migration so it doesn't silently break consumers reading the old scale (rename, version, or dual-write). Codex's earlier 6-before-4 reorder is gone from their latest position, so that disagreement is resolved. No one is proposing a different sequence anymore.

**Q2**: All three agree the falsifiable-claim gap is real and must close early in this same spec, before Phase 3/4/5. The only leftover disagreement is whether it's folded into Phase 1 (codex) or a standalone phase immediately after Phase 1 (grok-build). Grok-build's reasoning is stronger — Phase 1 is a schema/scale/code-velocity session, while claim capture needs Stage 3 prompt changes and validation logic (`observation_window` units, `none_expected` semantics); mixing those is exactly the kind of scope-blur this team has already been burned by once. But this is a session-boundary choice, not a build-order choice: either way, an implementer ships claim fields on every publish before subscores or the graph exist. Nobody acting on any of the three answers produces a different outcome for the fast-follow team. I'll note the preference (separate phase, per grok-build) without treating it as blocking.

**Q3**: Also converged in substance. Codex's phrasing — "the JSON artifact should be canonical and documentation generated from or checked against it" — sounds like a break from "MODEL.md stays SoT," but it isn't one in practice. The actionable requirement all three land on is identical: a single versioned, immutable JSON structure artifact that both repos pin to, with the graph version recorded on every published reading, and no repo hand-transcribing a second copy. Whether a human edits MODEL.md and a build step regenerates/validates the JSON, or edits the JSON directly and MODEL.md is generated/checked against it, is an authoring-workflow detail internal to whichever repo owns the file — it doesn't change what the pipeline or front-end does at runtime, and it doesn't change the failure mode either side is trying to avoid (silent drift between two hand-maintained copies, or historical readings reinterpreted by an unpinned fetch). I'd resolve it as: pick whichever repo already owns node/edge authorship today (sounds like the front-end/MODEL.md side, per this team's own docs) as the human-edit surface, generate the JSON from it via CI, and have the pipeline pin to specific versions of that generated JSON. That's compatible with codex's concern without demoting MODEL.md as the place humans actually write structure changes.

Net: no participant's answer would cause a different build action at this point. The remaining differences are session-boundary and authoring-workflow preferences, not decision divergence.

POSITION: Cut Phase 5 pending a measured Stage-1 cost/latency spike (ship 1→2→3→4→6, versioning Phase 1's scale migration rather than silently reusing field names); add the falsifiable-claim fields immediately after Phase 1, before Phase 3/4/5; and replace hand-synced graph duplication with a single versioned JSON structure artifact both repos pin to and record per reading, authored from MODEL.md and generated/validated in CI rather than hand-transcribed.
status: approved

## Round 3 -- codex

I’m changing one detail: Grok is right that claim instrumentation should be a distinct Phase 1b immediately after Phase 1. It requires prompt changes, schema validation, immutable archival, and provenance—not merely Phase 1’s deterministic schema/velocity work. Separating the sessions improves auditability without delaying it behind unrelated model expansion. Every subsequent publication must include the complete claim record; outcome adjudication remains out of scope.

Q1 is settled correctly: ship 1→1b→2→3→4→6 and remove Phase 5 into a separately approved follow-on. Before reconsideration, benchmark its incremental cost, latency, completion rate, and structured-output validity against explicit budgets, and resolve graph distribution. Also fix Phase 1’s false “additive” premise: changing existing fields from 0–100 to 0–1 under unchanged names is a semantic breaking change. Use new names with dual-write or mandatory version-aware decoding.

Q3 still contains a real disagreement. I reject Grok’s claim that `MODEL.md` should remain the source of truth. Human authorship does not make prose a safe machine authority. A canonical immutable JSON graph artifact should be reviewed and promoted by humans; documentation can be generated from or validated against it. Both repos must pin and validate the artifact version, and every reading must record that version. Otherwise hand-maintained copies can each pass local integrity tests while describing different graphs; “fetch latest” can also reinterpret historical readings.

Claude’s “approved” assessment is therefore too generous: Phase 1 versus a separate Phase 1b changes implementation boundaries, and prose-versus-JSON authority changes the release process. Those are actionable differences, not framing.

POSITION: Ship 1→1b→2→3→4→6 with a safe scale migration, make 1b capture immutable falsifiable claims and provenance, defer Phase 5 behind measured performance/reliability gates, and use canonical immutable versioned graph JSON—not hand-sync or prose—as the authority both repos pin.
status: revise

## Round 3 -- grok-build

**Q1 holds.** Cut Phase 5 from this spec. Ship `1→2→3→4→6`. Do not swap 4 and 6.

Phase 5 is the same unmeasured graph bet this team already had to kill. Forty-nine extra Stage 1 structured outputs on an ungated publisher is production risk, not a later sequencing nit. Spike cost, latency, and structured-output reliability first; then a follow-on spec that also has a resolved graph contract (Q3). Codex is right that Phase 6-before-4 is not worth reshuffling the written sequence. Codex is also right on the Phase 1 defect: renaming 0–100 fields to 0.0–1.0 in place is a silent semantic break. Optional fields cover absence, not unit change. Dual-write, new names, or a contract version — inside Phase 1.

**Q2 — I am tightening, not reversing.** This spec must close the already-decided gap. Outcome scoring stays fast-follow. Instrumentation (four claim fields plus immutable id, timestamp, archived payload, provenance) is v1 and must be on **every publish of this build**. Waiting until after Phase 3 is how a settled requirement dies.

Last round I over-weighted session packaging. The load-bearing rule is the **release train**, not the phase number: nothing from this spec goes to production until claim fields are populated and validated (`none_expected` still names the absent action; `observation_window` is a bounded integer **with unit**). Folding that into the Phase 1 session (Codex) or a 1b session that ships with Phase 1 (my prior call) is the same decision. Gating it behind Phase 2/3 is not. I will not fight Codex on which isolated session types the schema if they ship together.

**Q3 holds, and this is still the real split.** Hand-sync is wrong. “No shared code” never meant “no shared data contract.” Structure is contract data, same pattern as the API contract.

Codex is right that markdown is a poor **machine** authority and that each reading must store the graph-definition version it scored against (fetch-latest without a pin rewrites history). Codex is wrong to make the JSON the **authoring** source. The design law is: humans promote nodes/edges **into the doc**; the pipeline fills states. Invert that and people edit a 49-item JSON in the pipeline repo while `MODEL.md` rots — the same silent drift, different file.

Correct split: `MODEL.md` is the human authoring source; a versioned JSON artifact is extracted from it; both repos pin to that artifact; CI fails if doc and JSON diverge. Neither repo imports the other’s code.

Hand-sync failure: each copy’s local tests pass, UI draws a graph the pipeline is not scoring. JSON-as-authoring failure: the promote-into-the-doc law dies and the two sources still drift.

POSITION: Ship 1→2→3→4→6 with Phase 1’s scale change versioned/dual-written, put falsifiable-claim capture on the Phase 1 release train (not after Phase 3), defer Phase 5 behind a measured Stage 1 spike plus a versioned graph artifact authored in MODEL.md and pinned as JSON.
status: revise


## Synthesis (claude)

FINAL ANSWER: Cut Phase 5 out of this spec entirely and defer it to a follow-on gated on a measured Stage 1 cost/latency/reliability spike plus a resolved graph-artifact contract; ship Phases 1→2→3→4→6 in order, with Phase 1's 0–100→0.0–1.0 migration done via renamed fields, a version bump, or dual-write (never a silent same-name reuse). Add the falsifiable-claim instrumentation (response_type/responsible_authority/qualifying_action/observation_window plus immutable id, timestamp, archived payload, provenance) to this same spec's release train immediately after Phase 1 — before Phase 3/4/5 — since it's an already-decided v1 requirement and gating it behind unrelated richer phases is scope drift by omission. Reject hand-syncing the causal graph structure across repos; make it a single versioned, immutable JSON artifact — authored from MODEL.md, generated/validated in CI, pinned by both repos, with the graph version recorded on every published reading — so neither shared code nor silent dual-copy drift occurs.

CONSENSUS: majority
DISSENT: Codex holds out on making the JSON artifact itself the authoring source (vs. MODEL.md-as-authored/JSON-as-generated per claude and grok-build), and mildly prefers a separate "Phase 1b" session for claim capture vs. folding it into Phase 1's release train — neither changes what ships or in what order.
