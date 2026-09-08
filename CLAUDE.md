# CLAUDE.md — e3d-liquiditywatch

Short rules for working in this repo. Not a README (see `README.md`) and not the model
(see `docs/MODEL.md`).

## What this repo is

The **presentation stage** of LiquidityWatch, and nothing else. An Express server
(`server.js`) serving static files from `public/` (`index.html`, `about.html`). Live at
`liquiditywatch.e3d.ai`.

The three-stage scoring pipeline (research → independent critique → narrative synthesis)
lives **elsewhere in the E3D stack**. It is not in this repo and must not be added here.

## Rules

1. **Compute nothing.** This repo renders a model it is handed. No scoring, no data
   ingestion, no LLM calls. If a change needs new computed data, it needs a new field in
   the API contract, not new code here.
2. **The integration boundary is `docs/API-CONTRACT.md`** — the JSON contract with the
   `e3d.ai` API (`/api/financial-stress-monitor`, `/api/mailing-list/signup`,
   `/verifyEmailCode`). No shared code with the pipeline; the contract is the only joint.
   This follows the E3D ecosystem law: stages are joined "by shared contracts, not shared
   code" (`e3d-maps/docs/E3D_ECOSYSTEM_ARCHITECTURE.md`).
3. **Model semantics live in `docs/MODEL.md`.** When the meaning of a score, band, regime,
   or the causal graph is in question, that document is the source of truth.
4. **Band table sync.** `docs/MODEL.md` §1 is the source of truth for the 0–100 bands and
   regimes. `GAUGE_BANDS` in `public/index.html` and the prose in `public/about.html` must
   match it. Change the doc first.
5. **Scale.** `final_score` / `final_score_before` are integers **0–100** (product
   identity). Every other magnitude — sub-scores, node states, edge confidence,
   probabilities — is a float **0.0–1.0**, matching E3D `shared_enums`. See
   `docs/API-CONTRACT.md` §Scale.
6. **Resilience contract.** Every API field is optional. Every render helper null-checks
   before using a field, and the panel renders from whatever subset is present. New API
   fields ship additively with no front-end coordination. Do not break this — it is what
   lets the two halves evolve independently.
7. **AI suggests, code decides.** The causal graph's *structure* (nodes, edges,
   polarity) is human-authored in `docs/MODEL.md`. The pipeline fills in per-cycle
   *states* only. A model-proposed new node/edge renders as provisional until a human
   promotes it into the doc.
8. **No build step.** `public/` is served as-is. No bundler, no framework, no transpile.
   Keep `index.html` self-contained (inline `<style>`/`<script>`).

## Run

```
npm install
npm start        # serves public/ on :3008 (or $PORT)
```

## Ecosystem context

Part of E3D — a FutCo intelligence product. For how this repo relates to the others, ask
the `futco-mcp` MCP server (`get_repo e3d-liquiditywatch`, `get_repo ecosystem-overview`).
LiquidityWatch is intended as the first domain-specific implementation of the E3D
intelligence-graph architecture (`Entity → Relationship → Event → Decision → Outcome →
Learning`), not a standalone dashboard — see `docs/MODEL.md` §6 and `docs/VISION.md`.
