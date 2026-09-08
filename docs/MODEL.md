# LiquidityWatch — Model

**Status:** reconciled v0.1. This is the authoritative model definition for LiquidityWatch,
reconciled against (a) the raw spec in [`MODEL.draft.md`](./MODEL.draft.md), (b) the repo
boundary, and (c) the E3D ecosystem conventions observed in `e3d-maps/schemas/`, the live
`e3d-ai` MCP surface, and `e3d-maps/docs/E3D_ECOSYSTEM_ARCHITECTURE.md`.

The **wire format** that carries this model between the pipeline and this front end is
specified separately in [`API-CONTRACT.md`](./API-CONTRACT.md). This document defines
*what the numbers mean*; that one defines *how they are transmitted*.

---

## 0. What LiquidityWatch is

A **multi-domain stress-propagation model**. Not a Fed tracker, not a crypto dashboard —
a model of how independent systems (rates, collateral, funding, energy, leverage, policy,
AI investment, risk assets) become coupled and reinforce each other.

It answers one question:

> Is the global financial system moving toward normal conditions, controlled
> stabilization, systemic stress, or a monetary regime change — and what does that imply
> for crypto assets?

It does **not** predict markets. It (1) observes measurable conditions, (2) scores stress
vectors, (3) identifies regime transitions, (4) explains causal chains, (5) separates
facts from interpretation.

### Where it sits in the E3D stack

Per `E3D_ECOSYSTEM_ARCHITECTURE.md`, E3D stages are "bolted together not by shared code
but by shared contracts… **no direct runtime imports**. Shared databases and API
contracts *are* the integration boundary." LiquidityWatch follows the same law:

- **This repo (`e3d-liquiditywatch`)** — the presentation stage. Express server serving
  `public/`. Renders the model; computes nothing.
- **The scoring pipeline** — lives elsewhere in the E3D stack (three-stage: research →
  independent critique → narrative synthesis). Produces the model.
- **The joint** — the JSON contract in `API-CONTRACT.md`, versioned. Nothing else.

And the ecosystem's non-negotiable design law applies verbatim: **AI suggests, code
decides.** LLM stages produce structured proposals; the causal-graph *structure* is
human-authored; deterministic code decides what publishes.

---

## 1. The headline score

**U.S. Financial Stress Score — integer 0–100.** Proximity × severity × probability of
policy-forcing financial-system stress. This is the product's identity and stays 0–100
(the gauge, the newsletter, `about.html`).

> **Scale convention.** The headline score is the *only* 0–100 field. Every other
> magnitude in the model — sub-scores, node states, edge confidence, probabilities — is a
> float **0.0–1.0**, matching E3D's `shared_enums`/`FlowGraph` convention
> (`Field(ge=0.0, le=1.0)` throughout `e3d-maps/schemas/`). The front end scales for
> display. See `API-CONTRACT.md` §Scale.

### Regime bands (6)

| Range | Regime | Meaning |
|---|---|---|
| 0–15 | Accommodative | Conditions functioning; yields stable, credit normal, Fed inactive |
| 15–35 | Mild Watchfulness | Minor pressure, no dysfunction |
| 35–55 | Contained Tension | Real but contained stress |
| 55–75 | Restrictive Policy | Active QT at multi-year-high yields; a genuinely undecided Fed decision belongs here even with no crisis signal |
| 75–90 | Policy-Forcing Danger Zone | Stress approaching the point of forced intervention |
| 90–100 | Market Dysfunction | Dysfunction or intervention underway |

These bands currently live in `public/index.html` (`GAUGE_BANDS`) and `about.html` prose.
**This table is now the source of truth**; those two must be kept in sync with it (see
[open items](#8-open-items)).

### Policy Regime Classifier (categorical, parallel to the band)

`NORMAL` · `STRESS_BUILDING` · `CONTROLLED_STABILIZATION` · `SYSTEMIC_BACKSTOP` ·
`MONETARY_REGIME_CHANGE`. Distinct from the band because it keys on *policymaker
behavior*, not just pressure: `CONTROLLED_STABILIZATION` = repo ops rising, Treasury
liquidity ops, coordinated messaging; `SYSTEMIC_BACKSTOP` = emergency facilities, QE,
guarantees; `MONETARY_REGIME_CHANGE` = yield-curve control, financial repression, major
currency change.

---

## 2. Trigger metrics

Tracked **explicitly against the last published reading**, not reasserted fresh each
cycle. Each carries its own `change_reason`. All 0.0–1.0.

| Metric | Question |
|---|---|
| **Controlled Break Risk** | How much stress exists while policymakers still have tools available but have not deployed them? Odds current stress breaks into an uncontrolled crisis rather than staying policy-managed. |
| **Liquidity Response Probability** | If current conditions continue, how likely is a meaningful Fed/Treasury response *soon* — distinct from how much response is already underway? |
| **Phase** | `1` tightening / policy-threat · `2` liquidity response beginning · `3` full backstop underway |

**Controlled Break Risk** rises with: Treasury volatility, credit stress, funding stress,
leverage, oil shock, FX stress. Falls with: Fed intervention, liquidity injections, stable
markets.

**Liquidity Response Probability** rises with: Treasury dysfunction, credit event,
unemployment spike, repo stress. Falls with: high inflation, strong economy, constrained
policymakers.

> **Trajectory, not just level.** E3D theses track `conviction` *plus* `conviction_velocity`
> and `conviction_acceleration`. LiquidityWatch should do the same for the headline score
> and each trigger metric — `previous_value` alone (today's front end) is the minimum;
> velocity/acceleration is the target. See `API-CONTRACT.md`.

---

## 3. Sub-engines (sub-scores)

Each is a 0.0–1.0 stress reading with a `change_reason` and evidence. The pipeline
computes them; this repo renders them as a panel. Additive — ship each as the field is
filled.

### 3.1 Treasury Market Stress
Is the world's largest bond market functioning?
- **Rate stress** — 10y, 30y, 2s10s, 10s30s, real yields, term premium. *Rising yields
  are not automatically bad*: separate a **healthy growth rise** (GDP↑, AI capex↑,
  productivity↑) from a **stress rise** (deficits↑, foreign demand weak, auction demand
  falling, term premium rising).
- **Auction health** — bid-to-cover, indirect bidder share, dealer take-down %, tail size.
  Weak auction ⇒ supply > demand ⇒ yield↑.
- **Liquidity** — bid/ask spreads, market depth, volatility, dealer balance-sheet
  capacity. Bad: wider spreads, thinner depth, price moves without volume.

### 3.2 Funding Market Stress
Hidden leverage.
- **Repo** — SOFR, SOFR–IORB spread, repo rates, Standing Repo Facility usage. Stress =
  cash scarcity.
- **Basis trade risk** — Treasury cash-futures basis. Leveraged long-cash / short-futures;
  a volatility spike ⇒ margin calls ⇒ forced unwind ⇒ Treasury selling pressure. (Feeds
  back into 3.1 liquidity.)
- **Credit** — CCC, HY, IG spreads, default rates. CCC breaks first.

### 3.3 Fed / Treasury Response
Still observing, or actively intervening?
- **Normal tools** — policy rate, QT/QE, reserves.
- **Liquidity tools** — SRF, discount window, emergency lending, swap lines.
- **Balance sheet** — separate **true QE** (broad asset purchases) from **not-QE
  liquidity** (Treasury buybacks, reserve management, technical ops).
- **Treasury actions** — buybacks, issuance-mix changes, cash-balance (TGA) changes.

### 3.4 AI Economic Impulse
Is AI investment delaying recession and monetary easing? *(newest, most differentiated)*
- **Direct capex** — OpenAI, Anthropic, Microsoft, Google, Amazon, Meta, Nvidia
  ecosystem: data centers, GPU purchases, announced capex, financing.
- **Physical economy** — construction (electricians, HVAC, concrete, steel, plumbing);
  infrastructure (power, nuclear, gas, transmission, transformers, fiber); manufacturing
  (chips, servers, networking, cooling); regional multipliers (a data center pulls in
  construction, then restaurants, housing, teachers, healthcare, retail, local
  government).
- **Classification** (categorical, published alongside the score): `DISINFLATIONARY`
  (productivity gains outrun demand) · `NEUTRAL` · `INFLATIONARY` (AI competes for
  electricity, labor, capital, land).

### 3.5 Energy System
Because **oil ≠ gasoline**.
- **Crude** — Brent, WTI.
- **Refining** — crack spreads, refinery utilization.
- **Fuel stress** — diesel inventories, gasoline inventories, shipping fuel.
- **Transition** — nuclear restarts, SMRs, uranium, grid investment. (AI → electricity
  demand → nuclear/grid investment: the coupling to 3.4.)

### 3.6 Global Liquidity
- **Japan** — BOJ policy, yen, carry trade.
- **China** — stimulus, capital flows.
- **Dollar** — DXY, swap lines.

---

## 4. Crypto engine

Translates macro liquidity into crypto implications. Per asset: a short trigger note, a
`role` classification, and a **0.0–1.0 score** whose meaning differs by asset (see
`assetScoreLabel` in `index.html` — "Utility" for XRP, "Market Confirmation" otherwise).

- **BTC** — BTC vs Nasdaq, dominance, ETF flows, volatility, correlation with liquidity.
  Role question: risk asset / digital gold / liquidity proxy?
- **ETH** — ETF flows, staking, DeFi activity, L2 activity.
- **XRP / XLM** — higher beta. Regulatory catalysts, institutional adoption, liquidity
  utility. XRP gets its own model (§5).

**Crypto Phase** (parallel to the policy Phase): `1` Stress · `2` Liquidity Expansion.

> **Live data source.** The `e3d-ai` MCP / `e3d.ai` API supplies the on-chain side:
> `get_token_info`, `get_token_prices`, `get_token_counterparties`, `search_stories`,
> `get_theses`. The crypto engine should cite these as evidence, not re-derive them.

---

## 5. XRP Liquidity Utility Model

**0.0–1.0.** Critical distinction: **ecosystem growth ≠ XRP value capture.**

Inputs:
- **XRPL activity** — transaction volume, DEX volume, AMM volume, liquidity pools.
- **Stablecoins** — RLUSD supply, total XRPL stablecoin supply, market share. Decisive
  question: are flows **(A)** Stablecoin → Stablecoin, or **(B)** Stablecoin → XRP →
  Stablecoin? Only **B** raises XRP utility.
- **Payments** — Ripple partners, payment corridors, settlement volume.

**Bridge-function band** (maps the 0.0–1.0 score to a role):

| Score | Role |
|---|---|
| 0.00–0.25 | Adjacent asset |
| 0.25–0.50 | Optional bridge *(current)* |
| 0.50–0.75 | Growing liquidity layer |
| 0.75–1.00 | Core routing asset |

---

## 6. The causal graph

The differentiated piece. A **curated stress-propagation graph**: human-authored nodes and
edges, per-cycle AI-updated states. **Not** a fitted dynamical system — there is no data or
identification strategy for estimated feedback coefficients, and claiming otherwise would
violate the facts-vs-interpretation rule.

### 6.1 Alignment with E3D `FlowGraph`

E3D already has a graph primitive — `e3d-maps/schemas/flow_graph.py`:

```python
class FlowEdge:
    id, snapshot_id, origin, destination,
    strength: SignalStrength,          # weak | moderate | strong
    confidence: float (0.0–1.0),
    hazard_level: RiskLevel,           # low | medium | high | critical
    source_signal_ids: list[str],
    edge_status: EdgeStatus,           # active | new | strengthening | weakening | closed
    created_at
class FlowGraphSnapshot:
    id, signal_count, node_count, edge_count, created_at
```

LiquidityWatch's causal graph **reuses these conventions**:
- **Snapshot pattern** — each publish is one immutable snapshot with `created_at` +
  counts. Append-only. (Matches E3D's append-only / explicit-record-ID rule.)
- **`origin` / `destination`** — string node ids on every edge.
- **`strength`** — reuse `SignalStrength` (`weak`/`moderate`/`strong`).
- **`confidence`** — 0.0–1.0.
- **`edge_status`** — reuse `EdgeStatus`. This *replaces* the straw-man `"active": true`
  boolean from the session notes: `strengthening` / `weakening` / `active` / `new` /
  `closed` is E3D's existing, richer vocabulary for "is this link hot right now."
- **Provenance** — every node state and edge carries `evidence: [{type, id, summary}]`,
  matching `NavigationSignal.evidence` / `FlowEdge.source_signal_ids`.

**Divergence from `FlowGraph`:** LiquidityWatch needs a rich **node object** (FlowGraph's
nodes are implicit, referenced only by id in edges) because a node *is* a sub-score. And
edges carry a causal **`polarity`** (`amplifies` / `dampens` / `constrains`) that
FlowGraph's flow edges don't need.

Full node/edge JSON shape: `API-CONTRACT.md` §causal_graph.

### 6.2 Seed nodes (~22 — Chris to review / trim / extend)

`domain` ∈ `energy` · `rates` · `funding` · `credit` · `policy` · `ai` · `macro` ·
`global` · `crypto`. `state` is 0.0–1.0.

| id | label | domain |
|---|---|---|
| `oil_shock` | Oil Shock | energy |
| `refining_stress` | Refining / Crack-Spread Stress | energy |
| `energy_investment` | Nuclear / Grid Investment | energy |
| `power_demand` | Electricity Demand | energy |
| `inflation` | Inflation | macro |
| `deficits` | Fiscal Deficits / Issuance | macro |
| `foreign_demand` | Foreign Treasury Demand | macro |
| `unemployment` | Labor-Market Slack | macro |
| `productivity` | Productivity | macro |
| `gdp_support` | GDP Support | macro |
| `term_premium` | Term Premium | rates |
| `yield_level` | Long-End Yield Level | rates |
| `auction_health` | Treasury Auction Health | rates |
| `treasury_liquidity` | Treasury Market Liquidity | rates |
| `repo_stress` | Repo / Funding Stress | funding |
| `basis_trade_risk` | Basis-Trade Unwind Risk | funding |
| `credit_stress` | Credit Spreads (CCC→IG) | credit |
| `fed_constraint` | Fed Policy Constraint | policy |
| `fed_response` | Fed / Treasury Liquidity Response | policy |
| `yen_carry` | Yen Carry Trade | global |
| `dxy` | Broad Dollar | global |
| `crypto_liquidity` | Crypto Liquidity Conditions | crypto |

(BTC/ETH/XRP terminal nodes optional — they may be better as the §4 asset panel than as
graph nodes.)

### 6.3 Seed edges (Chris to confirm polarity signs)

`polarity` ∈ `amplifies` (↑origin ⇒ ↑destination) · `dampens` (↑origin ⇒ ↓destination) ·
`constrains` (origin caps destination's range).

| origin | → | destination | polarity |
|---|---|---|---|
| `oil_shock` | → | `inflation` | amplifies |
| `refining_stress` | → | `inflation` | amplifies |
| `inflation` | → | `fed_constraint` | amplifies |
| `deficits` | → | `auction_health` | dampens |
| `foreign_demand` | → | `auction_health` | amplifies |
| `auction_health` | → | `term_premium` | dampens |
| `term_premium` | → | `yield_level` | amplifies |
| `gdp_support` | → | `yield_level` | amplifies |
| `yield_level` | → | `treasury_liquidity` | dampens |
| `treasury_liquidity` | → | `basis_trade_risk` | dampens |
| `basis_trade_risk` | → | `treasury_liquidity` | dampens |
| `basis_trade_risk` | → | `credit_stress` | amplifies |
| `yield_level` | → | `credit_stress` | amplifies |
| `credit_stress` | → | `fed_response` | amplifies |
| `repo_stress` | → | `fed_response` | amplifies |
| `treasury_liquidity` | → | `fed_response` | dampens |
| `fed_constraint` | → | `fed_response` | constrains |
| `fed_response` | → | `crypto_liquidity` | amplifies |
| `ai_capex` *(→ node TBD)* | → | `power_demand` | amplifies |
| `power_demand` | → | `energy_investment` | amplifies |
| `power_demand` | → | `inflation` | amplifies |
| `energy_investment` | → | `gdp_support` | amplifies |
| `gdp_support` | → | `fed_constraint` | amplifies |
| `productivity` | → | `inflation` | dampens |
| `unemployment` | → | `fed_response` | amplifies |
| `yen_carry` | → | `treasury_liquidity` | dampens |
| `dxy` | → | `crypto_liquidity` | dampens |

Two chains from the spec are fully present in this list:
`oil_shock → inflation → fed_constraint … → fed_response → crypto_liquidity`, and
`ai_capex → power_demand → energy_investment → gdp_support → fed_constraint / yield_level`.

### 6.4 New node/edge types → `proposed` then human-`validated`

Following E3D's `StoryHypothesis` pattern ("status starts as `proposed`; a human must
advance it to `validated` before the pipeline is updated"): the LLM may *propose* a new
node or edge in a cycle, but it renders as provisional until a human promotes it into this
document. Structure changes are human decisions; state updates are automated.

---

## 7. Output format

Every published evaluation produces:

```
REGIME:            <band label>  /  <policy classifier>
Financial Stress Score:   XX / 100        (Δ vs last: ±N)
Controlled Break Risk:    0.XX             (Δ, reason)
Liquidity Response Prob:   0.XX             (Δ, reason)
Phase:             1 | 2 | 3
Crypto Phase:      1 Stress | 2 Liquidity Expansion

Sub-scores:        treasury 0.XX · funding 0.XX · fed_response 0.XX
                   ai_impulse 0.XX (INFLATIONARY) · energy 0.XX · global 0.XX

BTC:   <note>   role: <…>            confirmation 0.XX
ETH:   <note>   role: <…>            confirmation 0.XX
XRP:   <note>   role: Optional bridge  utility 0.XX

Major Drivers:     1. …  2. …  3. …

── Observed Facts ──      (measurements only; each with a source)
── Interpretation ──      (what the facts imply; model judgment)
── Speculation ──         (explicitly flagged; lowest confidence)
```

### The Facts / Interpretation / Speculation split is structural

Not prose. Three separate arrays in the contract (`classification_blocks`), rendered as
three labeled sections. This is the single highest-value credibility feature for an
unsupervised AI product and mirrors the ecosystem's `evidence[]` discipline — nothing
asserted without a trail. Today's front end collapses this into `dashboard_summary` +
`newsletter_body_html`; that changes.

---

## 8. Open items

1. **Sync the band table.** `public/index.html` `GAUGE_BANDS` and `about.html` prose must
   cite §1 of this doc as source of truth (ideally `about.html` links here).
2. **Root instruction file.** The ecosystem uses `AGENTS.md` or `CLAUDE.md` at repo root
   for new repos (per `futco-mcp` `conventions`); this repo has neither. Add one — short,
   rule-based: "front end only, integrates via `docs/API-CONTRACT.md`, compute nothing
   here."
3. **Knowledge-base entry.** `e3d-liquiditywatch` is absent from `futco-mcp` (KB last
   reviewed 2026-08-06; repo born 2026-09-08). Add `futco-mcp/content/e3d-liquiditywatch.md`
   from `_TEMPLATE.md`.
4. **0–100 vs 0.0–1.0.** §1 proposes headline-only 0–100, everything else 0.0–1.0.
   Confirm before `API-CONTRACT.md` locks.
5. **Outcome loop — resolved, fast-follow.** E3D scores every prediction against reality
   later (`PredictionOutcome`, `SignalUtilityScore`). Resolved by debate 2026-09-08 (Q2,
   full consensus across claude/codex/grok-build — see
   [`debates/2026-09-08-vision-strategy/RESULT.md`](./debates/2026-09-08-vision-strategy/RESULT.md)):
   scoring "was the STRESS_BUILDING call followed by an actual response?" is **not v1**.
   Fed/Treasury liquidity responses are rare, so scoring before a usable sample of dated
   calls exists would be calibration theater, not calibration.
   - **v1 (instrumentation only):** every published call gets an immutable call ID,
     timestamp, an archived snapshot of the full payload (score, phase, Controlled Break
     Risk, Liquidity Response Probability), model/prompt/version provenance, and a
     **falsifiable-claim spec** — expected response type, responsible authority,
     qualifying action, observation window. This is recording, not a loop, but it's what
     makes the fast-follow possible without a redesign.
   - **Fast-follow (labeling / scoring / calibration):** triggered by accumulating enough
     real dated calls, explicitly **not** a calendar deadline.
   - Not the product's sole differentiator either way — the curated causal graph, blind
     independent critique, and publish-only-on-material-change already differentiate it
     from a plain dashboard without the loop.
6. **Structured `next_triggers`.** E3D theses use machine-checkable
   `invalidation_predicates: [{kind, …}]`. LiquidityWatch's `next_triggers` is a string
   array today; consider structured predicates.
