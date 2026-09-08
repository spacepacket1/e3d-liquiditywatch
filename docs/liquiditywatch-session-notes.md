# LiquidityWatch — session notes (2026-09-08)

Working notes from the session where Chris supplied the full model spec and asked what
can reasonably be added to `e3d-liquiditywatch`. Captured so it survives a restart
(`claude --continue`). Session:
<https://claude.ai/code/session_018NyCC6hwpo4n7yKYpgjQXa>

## The spec

Chris's full architecture spec is captured verbatim in `docs/MODEL.draft.md`. That is the
input to be reconciled into a clean `docs/MODEL.md`.

## Key architectural constraint (agreed)

**This repo is the static front end only.** It is an Express server (`server.js`) serving
`public/` (`index.html`, `about.html`), which fetch from `e3d.ai`:

- `GET  https://e3d.ai/api/financial-stress-monitor` → the `event` object (score, regime,
  phase, `controlled_break_risk`, `liquidity_response_probability`, `drivers`,
  `asset_triggers`, `dashboard_summary`, `next_triggers`, `newsletter_body_html`,
  `final_score` / `final_score_before`).
- `POST https://e3d.ai/api/mailing-list/signup`
- `POST https://e3d.ai/verifyEmailCode`

The three-stage scoring pipeline (research → independent critique → narrative synthesis)
lives elsewhere in the E3D stack, NOT in this repo.

Current front-end band definitions live in two places today: `about.html` prose and the
`GAUGE_BANDS` array in `public/index.html`. The 6 bands: 0–15 Accommodative, 15–35 Mild
Watchfulness, 35–55 Contained Tension, 55–75 Restrictive Policy, 75–90 Policy-Forcing
Danger Zone, 90–100 Market Dysfunction. Phase enum: 1 tightening/policy-threat,
2 liquidity response beginning, 3 full backstop underway.

## Where each part of the spec lands

| Spec piece | Home |
|---|---|
| Treasury / Funding / Fed-response engines, AI Impulse, Energy layer, XRP utility model — the scoring | pipeline repo (not here) |
| Data ingestion (FRED, auction results, SOFR/IORB, crack spreads, XRPL activity, ETF flows, capex) | pipeline repo |
| The JSON contract between pipeline and front end | **here** → `docs/API-CONTRACT.md` |
| New display surfaces: sub-scores, fact/interpretation/speculation split, causal graph viz | **here** |
| The formalized model document | **here** → `docs/MODEL.md` |

## Decisions reached

1. **Formalize as `docs/MODEL.md`** — clean, reconciled version of `MODEL.draft.md`; one
   source of truth both repos point at. Fold in the band + phase definitions currently
   scattered in `about.html` / `index.html`.
2. **`docs/API-CONTRACT.md`** — write down the current `event` shape plus additive,
   versioned extensions so the pipeline has a target. Front end already degrades
   gracefully on missing fields (every render helper null-checks first), so new
   sub-engines can be added additively:
   - `event.subscores: { treasury_stress, funding_stress, fed_response,
     ai_economic_impulse (with classification), energy_stress, global_liquidity }`,
     each `{ value, previous_value, change_reason }`.
   - `event.classification_blocks: { observed_facts[], interpretation[], speculation[] }`.
   - `event.causal_graph: { nodes[], edges[] }`.
3. **Fact / interpretation / speculation split** — make it structural in contract + UI,
   not collapsed into `dashboard_summary` + `newsletter_body_html`. Smallest change,
   biggest credibility payoff for an unsupervised AI product.
4. **Sub-score panels** — additive UI, ship each as the pipeline fills the field.
5. **Sub-score history / sparklines** — needs a new upstream
   `GET /api/financial-stress-monitor/history` endpoint.

## Causal graph — resolved

E3D has **no general-purpose macro causal-graph primitive.** Every graph tool in
`e3d-mcp` is an entity-relationship graph over blockchain data
(`get_token_counterparties`, `get_address_counterparties`, `search_stories`,
`get_theses`, `get_agent_candidates`). So:

- The stress-propagation graph (Oil Shock → Inflation → Fed Constraint → …) is **net-new
  for E3D**, and the node/edge list is **Chris's to author**.
- It is **NOT** a fitted dynamical system with estimated feedback coefficients — no data
  or identification strategy for that, and claiming it would undercut the
  facts-vs-interpretation discipline.
- **What it is:** a curated graph with human-authored edges and AI-updated node states.
  ~15–25 nodes (Oil Shock, Inflation, Fed Constraint, Treasury Stress, Funding Stress,
  Credit Stress, Liquidity Response, AI Capex, Power Demand, Energy Investment, GDP
  Support, Crypto, …). Edges typed (`amplifies` / `dampens` / `constrains`) and
  directional, authored once. Each cycle the pipeline sets each node's state (0–100 or a
  regime enum) and each edge's current "activation" (is this link hot right now?).
- Renders here as inline SVG or a small force layout; the two chains in the spec are the
  seed edge list. Value = showing which links are currently live, not a static diagram.

### Draft payload shape (straw man — revisit against `get_theses` schema)

```json
{
  "nodes": [
    { "id": "oil_shock", "label": "Oil Shock", "state": 40, "kind": "driver" },
    { "id": "inflation", "label": "Inflation", "state": 55, "kind": "condition" }
  ],
  "edges": [
    { "from": "oil_shock", "to": "inflation", "type": "amplifies", "active": true }
  ]
}
```

## Progress (session 2, after `claude --continue`)

**MCP schema-consistency check — DONE.** Findings from `e3d-maps/schemas/` (on disk at
`/home/ubuntu/e3d-maps`), live `e3d-ai` `get_theses`, and `futco-mcp`
`get_repo conventions` / `get_repo e3d-maps` / `E3D_ECOSYSTEM_ARCHITECTURE.md`:

- **`FlowGraph` is the house graph primitive** (`e3d-maps/schemas/flow_graph.py`):
  `FlowGraphSnapshot { id, node_count, edge_count, created_at }` + `FlowEdge { id,
  snapshot_id, origin, destination, strength(SignalStrength), confidence(0–1),
  hazard_level(RiskLevel), source_signal_ids[], edge_status(EdgeStatus), created_at }`.
  LiquidityWatch's causal graph now reuses `origin`/`destination`, `strength`,
  `confidence`, and especially **`EdgeStatus`** (active/new/strengthening/weakening/
  closed) — that replaces the straw-man `"active": true` boolean. Nodes are implicit in
  FlowGraph; LiquidityWatch adds a rich node object + a causal `polarity`
  (amplifies/dampens/constrains).
- **Everything is float 0.0–1.0** in E3D schemas (`Field(ge=0.0, le=1.0)` everywhere) and
  in live `get_theses` `conviction`. Decision recorded in MODEL.md: headline score stays
  0–100 (product identity); all sub-scores/node states/confidences/probabilities move to
  0.0–1.0. Trigger-metric `value` migration (0–100 → 0–1) spelled out in API-CONTRACT.md.
- **Trajectory triplet**: theses carry `conviction` + `conviction_velocity` +
  `conviction_acceleration`. Adopted as target for headline + trigger metrics (today's
  front end only has `previous_value`).
- **Provenance is mandatory** across every E3D object (`evidence:[{type,id,summary}]`,
  `supporting_*_ids`, `source_signal_ids`). Wired into sub-scores, `classification_blocks`,
  and graph nodes/edges in the contract.
- **"AI suggests, code decides"** is the ecosystem's stated non-negotiable law
  (`E3D_ECOSYSTEM_ARCHITECTURE.md` §1). Causal-graph *structure* is human-authored in
  MODEL.md; only *states* are LLM-updated. New node/edge types follow the
  `StoryHypothesis` `proposed → human-validated` gate.
- **Integration law**: "stages bolted together not by shared code but by shared
  contracts… no direct runtime imports." Confirms front-end/pipeline split; the JSON
  contract is the mandated (not optional) boundary.
- **Enums** reused from `e3d-maps/schemas/shared_enums.py`: `SignalStrength`
  (weak/moderate/strong), `EdgeStatus`, `RiskLevel` (low/medium/high/critical).
- **Housekeeping surfaced**: (a) repo has no root `AGENTS.md`/`CLAUDE.md` — ecosystem
  norm for new repos; (b) `e3d-liquiditywatch` absent from `futco-mcp` KB (last reviewed
  2026-08-06) — add `futco-mcp/content/e3d-liquiditywatch.md`.

**`docs/MODEL.md` — DRAFTED (v0.1).** Reconciled model: headline score + 6 bands +
policy classifier, trigger metrics, 6 sub-engines, crypto engine, XRP utility model,
causal graph with a **seed ~22-node / ~27-edge list** (Chris to review polarity signs +
trim/extend), output format with the structural Facts/Interpretation/Speculation split,
and an open-items list.

**`docs/API-CONTRACT.md` — DRAFTED (v0.1).** Current `event` shape (v0.0) + v1 additive
fields (`schema_version`, `policy_classifier`, `subscores`, `classification_blocks`,
`crypto_phase`, trajectory fields, `causal_graph` aligned to `FlowGraph`, `/history`
endpoint), the resilience contract, versioning policy, and the 0–100→0–1 migration steps.

## Housekeeping — DONE

- **`CLAUDE.md`** added at repo root (ecosystem norm; `spacepacket`/`e3d-maps` use
  `CLAUDE.md`). Short, rule-based: compute nothing here, contract is the only joint,
  MODEL.md is model-semantics source of truth, band-table sync, resilience contract,
  "AI suggests / code decides", no build step. Uncommitted (with `docs/`).
- **`docs/VISION.md`** added — captures the "context + memory + graph + agents" /
  externalized-brain / world-model framing and the `Entity → Relationship → Event →
  Decision → Outcome → Learning` primitive shared across e3d-pilot, e3d-corp, e3d-maps,
  token intel, Applied FutCo, LiquidityWatch. Frames LiquidityWatch as the first *public
  demonstration* of the E3D intelligence-graph thesis, and lists the 5 build implications
  (graph is the product; provenance on everything; hypotheses first-class + gated; the
  outcome loop is what makes it "learning" not decorative; models stay interchangeable).
  Uncommitted.
- **`futco-mcp/content/e3d-liquiditywatch.md`** written and **committed** to the
  `futco-mcp` repo (`e582e5d`, author fixed to Chris Bloom <spacepacket@gmail.com>). Not
  pushed. Verified live via `get_repo e3d-liquiditywatch`. Notes the `e3d-corp` kinship
  and the fact that the scoring pipeline's home repo is undocumented (flagged as a gap —
  "likely inside `spacepacket`, unconfirmed").

## Checked in + debate queued (end of session 2)

- All `docs/` + `CLAUDE.md` committed and **pushed** to `e3d-liquiditywatch` main
  (`e59ce48`). `futco-mcp` KB entry pushed (`e582e5d`). `e3d-pilot` pulled to latest
  (`3bb183e`) — `bin/e3d-debate` now present locally.
- `docs/debates/2026-09-08-vision-strategy/` committed + pushed (`9881fae`):
  `QUESTION.md` (self-contained 3-question brief) + `PROMPT.md` (run instructions).
  **Next physical action is Chris's:** run `PROMPT.md` in a Claude session on the mac
  mini `10.0.0.42` where `e3d-debate` is set up. That session runs the debate, writes
  `RESULT.md` + `run/transcript.md` into this dir, commits unpushed.
- `e3d-debate` = `e3d-pilot/bin/e3d-debate`, a standalone prototype (not wired into
  `bin/e3d-pilot`): N rounds across `lib/providers/*` adapters + convergence detection
  + a synthesizer pass. Runs here with `claude` + `codex` adapters (both CLIs present);
  `grok-build`/`devin` adapters exist but those CLIs are not installed on this box.

## Still open

0. **Chris runs the vision-strategy debate** on the mac mini (see above), then we fold
   `RESULT.md` back into `VISION.md` / `MODEL.md` §8.
1. **Chris review** of MODEL.md §6.2–6.3 (the seed node/edge list — polarity signs
   especially) and the open-items list (§8), esp. #4 (0–100 vs 0–1) and #5 (outcome loop).
2. **Pin down the scoring-pipeline repo.** Nothing in-repo or in `futco-mcp` says what
   produces `/api/financial-stress-monitor`. Needed before any pipeline-side contract
   work.
3. **Live crypto data** for BTC/ETH/XRP sections via `e3d-ai` MCP (`get_token_info`,
   `get_token_counterparties`, `search_stories`) — for populating the model, not designing
   it. Not started.
4. **Front-end build** — none started. Order per MODEL.md: Facts/Interpretation/Speculation
   split → sub-score panels → causal-graph SVG renderer. `spacepacket` client already
   bundles `three` + `react-force-graph` (per `futco-mcp` `get_repo spacepacket`) — prior
   art for the renderer if this repo ever takes a framework, though CLAUDE.md rule 8 says
   no build step here.
5. **Commit the `e3d-liquiditywatch` `docs/` + `CLAUDE.md`** when Chris is ready (not done
   — consistent with treating them as review drafts).

## MCP wiring done this session

- Cloned `spacepacket1/e3d-mcp` → `/home/ubuntu/e3d-mcp` and `spacepacket1/futco-mcp` →
  `/home/ubuntu/futco-mcp`; `npm install` in both.
- Registered both at **user scope** (`~/.claude.json`, all repos on this machine):
  - `e3d-ai` → `node /home/ubuntu/e3d-mcp/server.js`, with `E3D_API_KEY` from the
    environment.
  - `futco-mcp` → `node /home/ubuntu/futco-mcp/server.js` (no key; reads `content/*.md`).
- `claude mcp list` shows both `✔ Connected`. They were previously wired NOWHERE on this
  box (no `.mcp.json` anywhere, nothing in `~/.claude.json`). Tools become available on
  the next session start.

## Recommended proceed order

`docs/MODEL.md` → `docs/API-CONTRACT.md` → fact/interpretation/speculation split (contract
+ UI) → sub-score panels → causal-graph renderer. Everything past API-CONTRACT is gated on
the pipeline; MODEL + API-CONTRACT are not.
