You are one of several AI models in a structured debate. A human needs decisive
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
