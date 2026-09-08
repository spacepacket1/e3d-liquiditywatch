# LiquidityWatch — Vision

**Status:** strategic framing, captured 2026-09-08. Not a spec. `MODEL.md` and
`API-CONTRACT.md` are what actually gets built; this explains *why the shape of those
documents matters* beyond LiquidityWatch itself.

---

## The one-line thesis

> LiquidityWatch is not a dashboard. It is the first domain-specific implementation of the
> E3D intelligence-graph architecture: a living causal model of reality that data sources
> keep updating — entities, relationships, hypotheses, scores, decisions, outcomes — and
> that any model or agent can reason over.

If it works, it is the first **public demonstration** of E3D's larger bet: that the next
generation of AI products are not chatbots. They are **persistent intelligence systems
that build and maintain models of reality.**

---

## Why this is the bet

The realization that ties several threads together:

**The advantage is not owning the smartest model. It is owning the system that
accumulates context, connects knowledge, remembers decisions, and lets any model operate
with that shared intelligence.**

A model alone is not the intelligence. The capability is:

```
Model + Context + Memory + Tools + Agents + Verification + Environment = Capability
```

So the useful question stops being "is Claude better than GPT" and becomes "which system
has the best accumulated understanding of my world." Models become interchangeable
reasoning engines plugged into an intelligence layer that outlives any of them.

### The world is a graph, not a document

A normal AI reads articles. An E3D system holds the relationships:

```
Iran conflict → oil price → diesel shortage → inflation → Fed policy
  → Treasury yields → crypto liquidity → BTC / XRP / ETH
```

The graph itself is the intelligence. The naive product renders the *nodes* as numbers
(`Oil $98 · BTC $80k · 10Y 4.8%`). The E3D product renders the *edges* — and keeps them
current.

### The externalized brain

Human and organizational knowledge is trapped in conversations, memory, emails, docs,
code, decisions. The move is to externalize it into a structure that improves itself:

```
Human intent → context graph → AI reasoning → actions → outcomes → learning
             → better context graph → …
```

A self-improving organizational memory. E3D-pilot was the first working piece of this — a
shared cognition layer where ChatGPT (ideas), Claude Code (code), and Codex (execution)
plug into one system that owns the decisions, hypotheses, experiments, failures, and
history, instead of each conversation losing everything.

---

## The common primitive

Every E3D surface reduces to the same shape:

**`Entity → Relationship → Event → Decision → Outcome → Learning`**

| Surface | The graph it maintains |
|---|---|
| **e3d-pilot** | Idea → Spec → Code → Commit → Test → Release → Outcome |
| **e3d-corp** | Event → Opportunity → Proposal → Decision → Action → Outcome → Experience *(this runtime already exists — the primitive in code)* |
| **e3d-maps** | Story/Thesis → NavigationSignal → RoutePrediction → PredictionOutcome → SignalUtilityScore |
| **e3d token intelligence** | Token → Chain → Liquidity → Holder → Exchange → Regulation |
| **Applied FutCo** | People → Projects → Decisions → Knowledge → Agents |
| **LiquidityWatch** | Macro event → Market impact → Policy response → Asset impact |

The "world model" that AI labs are racing toward is usually read as "AI understands
physics." There is a second reading that matters more for finance, software, and
organizations: **a world model is a model of the relationships between things** — entity,
relationship, event, decision, outcome. That is what E3D is.

---

## What this implies for how LiquidityWatch is built

The design choices in `MODEL.md` / `API-CONTRACT.md` are not local conveniences — they
are this thesis applied once, concretely:

1. **The causal graph is the product, not a widget.** `MODEL.md` §6. Human-authored
   structure, per-cycle AI-updated states, immutable snapshots, append-only history. It
   reuses E3D's `FlowGraph` primitive on purpose — LiquidityWatch's macro graph and
   e3d-maps' on-chain flow graph should be *the same kind of object* so they can
   eventually share tooling, storage, and a renderer.
2. **Provenance on everything.** Every node state, edge, and interpretation carries
   `evidence[]`. A model of reality that can't show its sources isn't one. This is also
   the Facts / Interpretation / Speculation split (`MODEL.md` §7) — the graph must be
   honest about which edges are measured and which are believed.
3. **Hypotheses are first-class and gated.** New nodes/edges enter as `proposed` and a
   human promotes them (`StoryHypothesis` pattern). The graph *grows*, but structure
   changes are human decisions.
4. **The outcome loop is the point, eventually.** `MODEL.md` §8 item 5. E3D scores every
   prediction against what actually happened (`PredictionOutcome`, `SignalUtilityScore`).
   LiquidityWatch closing that loop — "the STRESS_BUILDING call on date X was / wasn't
   followed by a real policy response" — is what turns it from a renderer into a
   *learning* system. It is not in the original spec; it is the thing that makes the
   vision real rather than decorative.
5. **Models stay interchangeable.** The three-stage pipeline already uses a different
   model per stage. Nothing in the contract or the graph names a model as load-bearing.
   The accumulated graph is the asset; the models are swappable workers.

---

## The open strategic question

Whether LiquidityWatch should be *positioned* publicly as "a persistent intelligence
system that maintains a model of the financial system" rather than "an AI stress monitor."
The first framing is the E3D thesis and is more defensible long-term; the second is easier
to explain on a landing page. This doc does not settle that — it records that the build
should not foreclose the first framing, and §4 above (the outcome loop) is the feature
that earns the right to make the claim.
