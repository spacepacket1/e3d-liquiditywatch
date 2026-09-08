You are one of several AI models in a structured debate. A human needs decisive
guidance on three linked strategic questions about a product called LiquidityWatch.
This brief is self-contained — you do not need repo access.

═══════════════════════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════════════════════

**LiquidityWatch** (liquiditywatch.e3d.ai) publishes a single U.S. Financial Stress
Score, 0–100, answering one question: "how close is the U.S. financial system to a
point where policymakers are forced to act?" A three-stage AI pipeline produces it
(deep-research scoring → independent critique that doesn't see the first number →
narrative synthesis). Fully automated, no human-approval gate, publishes only when a
reading is materially different from the last one. Alongside the score it publishes
trigger metrics (Controlled Break Risk, Liquidity Response Probability, Phase) and
per-asset notes for BTC/ETH/XRP.

It is part of **E3D**, a personal ecosystem of ~20 repos (blockchain analytics, an
agent trading floor, a navigation-intelligence service, dev-automation tooling). The
LiquidityWatch git repo under discussion is the **front end only** — a static Express
site. The scoring pipeline lives elsewhere in the E3D stack. The two are joined by a
versioned JSON contract, never shared code (this is an explicit ecosystem rule).

**What was just designed in a working session:**

- `MODEL.md` — a **curated causal stress-propagation graph** as the core object:
  ~22 human-authored nodes (Oil Shock, Inflation, Fed Constraint, Treasury Liquidity,
  Repo Stress, Credit Stress, AI Capex, Power Demand, Crypto Liquidity, …) and ~27
  human-authored directional edges with a polarity (amplifies / dampens / constrains).
  Each publish cycle, the AI pipeline updates node *states* (0–1) and edge
  *activations* — it does not invent structure. Reuses the schema conventions of an
  existing E3D service (`e3d-maps`), whose graph primitive is `FlowGraph`
  (snapshot + typed edges with strength, confidence, and a lifecycle status of
  active/new/strengthening/weakening/closed).

- `API-CONTRACT.md` — additive JSON contract: sub-scores, a
  facts/interpretation/speculation split, the causal-graph payload, a history endpoint.

- `VISION.md` — the framing under debate. Its claims: LiquidityWatch is "not a
  dashboard" but "the first domain-specific implementation of the E3D
  intelligence-graph architecture," and potentially "the first public demonstration"
  of a thesis that next-generation AI products are "persistent intelligence systems
  that build and maintain models of reality," built on a universal primitive:
  **Entity → Relationship → Event → Decision → Outcome → Learning.**

**Relevant existing E3D prior art (already built, not hypothetical):**

- `e3d-corp` — described in its own repo as "a generic
  Event→Opportunity→Proposal→Decision→Action→Outcome→Experience runtime." I.e. the
  VISION.md primitive already exists as running code, young but real.
- `e3d-maps` — already runs this pattern for on-chain data with the learning loop
  *closed*: it emits predictions, then later scores them against what actually
  happened (`PredictionOutcome`, `SignalUtilityScore`) and feeds that back.

**The "outcome loop" for LiquidityWatch** would mean: recording that a specific
published call (e.g. "STRESS_BUILDING, Controlled Break Risk 0.44," on a given date)
was or wasn't followed by an actual Fed/Treasury liquidity response within some
window, and tracking the model's calibration over time. This is **not** in the
original product spec.

**Relevant history:** an earlier E3D strategic proposal was cut hard by a second-
opinion review — "multi-agent investment committee, thesis graph, regime classifier,
6 phases, before anything was proven to work" was reduced to a minimal MVP. Scope
discipline is a known weak point for this team.

═══════════════════════════════════════════════════════════════════════════
THE THREE QUESTIONS
═══════════════════════════════════════════════════════════════════════════

**Q1 — Build ON e3d-corp, or merely shaped like it?**
Should LiquidityWatch's model/decision layer be implemented as a domain instance of
the `e3d-corp` runtime — sharing its Event/Decision/Outcome storage, lifecycle, and
tooling — or as its own standalone implementation that only follows the same
conceptual shape? Give a decisive recommendation and name the concrete costs of each
path: coupling and version risk, reuse benefit, time-to-ship, blast radius if
`e3d-corp` changes under it. Assume `e3d-corp` is real but immature.

**Q2 — Is the outcome loop the real differentiator, and is it v1 scope?**
`VISION.md` claims that closing the outcome loop is what makes LiquidityWatch a
"learning system" rather than a graph renderer, and implies it belongs in scope from
the start. Is that sound, or motivated reasoning dressed as principle? Is building it
in v1 disciplined, or the same over-scoping that has bitten this team before?
Decide: outcome loop in v1, fast-follow, or later — and why.

**Q3 — Public positioning.**
Should LiquidityWatch be presented publicly as "a persistent intelligence system that
maintains a live model of the financial system" (the E3D world-model thesis), or as
"an AI-run U.S. financial-stress monitor" (concrete, immediately legible)? Does
committing to the grander framing in public foreclose options, or open a credibility
gap while the outcome loop doesn't yet exist? One recommendation.

═══════════════════════════════════════════════════════════════════════════
HOW TO ANSWER
═══════════════════════════════════════════════════════════════════════════

Be decisive, not hedgy. Name trade-offs concretely. If you think any question rests
on a false premise, say so directly instead of answering around it.

In every round after the first, end with exactly these lines:

POSITION:
  Q1: <one sentence>
  Q2: <one sentence>
  Q3: <one sentence>
status: approved|revise

("approved" = a person acting on your three answers and a person acting on every
other participant's three answers would make the same decisions. Extra nuance or
caveats do not count as disagreement. "revise" = on at least one question, someone
following your answer would act differently than someone following another
participant's.)
