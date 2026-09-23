# LiquidityWatch — API Contract

**Status:** v0.1 draft. The wire format between the scoring pipeline (elsewhere in the E3D
stack) and this front end. Model semantics are in [`MODEL.md`](./MODEL.md); this document
is *transport only*.

**Pipeline producer, pinned down 2026-09-08:** `spacepacket` (repo `spacepacket1/e3d`),
`server/financialStress/` — a three-LLM-stage pipeline (`providers/openaiDeepResearch.js`
→ `providers/grokCritic.js` → `providers/claudeNarrative.js`), orchestrated by
`worker.js`/`lifecycle.js`, persisted to ClickHouse via `repository.js`, mounted from
`server/spacepacket.js`. See the `spacepacket` entry in the `futco-mcp` knowledge base for
detail. This is informational only — per the rule below, nothing in this repo may depend
on that code; this contract stays the only joint.

Per the E3D integration law (`e3d-maps/docs/E3D_ECOSYSTEM_ARCHITECTURE.md`): stages are
joined "not by shared code but by shared contracts." This file **is** that joint for
LiquidityWatch. Change it deliberately and version it.

---

## Endpoints (current)

| Method | URL | Purpose |
|---|---|---|
| `GET` | `https://e3d.ai/api/financial-stress-monitor` | Latest published evaluation → `{ event }` |
| `POST` | `https://e3d.ai/api/mailing-list/signup` | `{ email, list }` → `{ success, message }` |

**Mailing-list signup is double opt-in, account-free.** `/api/mailing-list/signup` writes a
row keyed by email address only (no e3d.ai account is created) and emails a confirmation
*link*, not a code — clicking it hits an e3d.ai-hosted confirm endpoint directly. This
front end has nothing to render for that step and calls no follow-up endpoint; `success`
here means "signup accepted, confirmation email sent," not "subscribed." (Previously this
flowed through account creation + `/verifyEmailCode`; retired 2026-09-12 — that path
required a full e3d.ai account for a mailing-list-only action and its `OPTIONS` preflight
was never wired up, so verification always failed with a CORS error.)

**Proposed additions:**

| Method | URL | Purpose |
|---|---|---|
| `GET` | `…/financial-stress-monitor/history?limit=N` | Array of past `event`s (headline + sub-scores + trigger metrics only) for sparklines — see [Model open item 5 / §History](#history) |

---

## Scale convention

- **`event.final_score` and `event.final_score_before`** — integer **0–100**. The only
  0–100 fields. Product identity (the gauge, `about.html`).
- **Everything else with a magnitude** — float **0.0–1.0**: every sub-score `value`,
  trigger-metric `value`, node `state`, edge `confidence`, every probability. Matches
  `e3d-maps/schemas/` (`Field(ge=0.0, le=1.0)` universally) and the live `get_theses`
  `conviction`. The front end multiplies by 100 for display where it wants a percentage.
- **Categoricals** — lowercase snake_case string enums, values enumerated below. Reuse
  E3D `shared_enums` values verbatim where one exists (`SignalStrength`, `EdgeStatus`,
  `RiskLevel`).

`schema_version` (string, semver) is **required at the top of `event`** so the front end
can branch. Absent ⇒ treat as `"0.0"` (pre-contract; today's payload).

---

## `event` — current shape (v0.0, what the front end reads today)

```jsonc
{
  "event": {
    "final_score": 62,                    // int 0–100
    "final_score_before": 58,             // int 0–100, previous published

    "final_regime": "restrictive_policy", // free string; UI replaces [_-] with space
    "phase": { "value": 1 },              // 1 | 2 | 3

    "controlled_break_risk": {
      "value": 44,                        // TODAY: 0–100. v1: 0.0–1.0 (see migration)
      "previous_value": 41,
      "change_reason": "auction tail widened at the 30y"
    },
    "liquidity_response_probability": {
      "value": 30, "previous_value": 30, "change_reason": "…"
    },

    "dashboard_summary": "One-paragraph plain-language state.",
    "drivers": ["…", "…", "…"],           // string[]; UI shows first 5
    "next_triggers": ["…"],               // string[]; UI shows first 1

    "asset_triggers": [
      { "asset": "BTC", "role": "liquidity proxy", "note": "…", "utility_score": 55 },
      { "asset": "ETH", "role": "…",               "note": "…", "utility_score": 48 },
      { "asset": "XRP", "role": "optional bridge", "note": "…", "utility_score": 35 }
    ],

    "newsletter_body_html": "<h3>…</h3>…"  // trusted HTML, rendered as-is
  }
}
```

**Front-end resilience contract (already true, must stay true):** every field is
optional. `score-panel` renders from whatever subset is present; each helper
(`phaseBadgeHtml`, `triggerMetricsHtml`, `assetTriggersHtml`, …) null-checks first. New
fields therefore ship additively with zero front-end coordination — the pipeline can
populate `event.subscores` before the front end renders it, and vice versa.

---

## `event` — v1 additions

All additive. All optional. Ship independently.

### `schema_version`
```jsonc
"schema_version": "1.0"
```

### `policy_classifier` — categorical regime, parallel to the band
```jsonc
"policy_classifier": "stress_building"
// normal | stress_building | controlled_stabilization | systemic_backstop | monetary_regime_change
```

### Trajectory on headline + trigger metrics
E3D theses carry `conviction` + `conviction_velocity` + `conviction_acceleration`. Mirror
it. `previous_value` stays (min viable); these are the target.
```jsonc
"final_score_velocity": 4,        // points / publish-cycle, signed
"final_score_acceleration": 2,
"controlled_break_risk": {
  "value": 0.44, "previous_value": 0.41,
  "velocity": 0.03, "acceleration": 0.01,
  "change_reason": "…"
}
```

### `subscores` — the sub-engine panel (MODEL.md §3)
```jsonc
"subscores": {
  "treasury_stress":     { "value": 0.55, "previous_value": 0.5, "change_reason": "…",
                           "evidence": [{ "type": "series", "id": "DGS10", "summary": "10y 4.6%, +30bp MoM" }] },
  "funding_stress":      { "value": 0.20, "previous_value": 0.22, "change_reason": "…", "evidence": [] },
  "fed_response":        { "value": 0.15, "previous_value": 0.15, "change_reason": "still observing", "evidence": [] },
  "ai_economic_impulse": { "value": 0.70, "previous_value": 0.66, "change_reason": "…",
                           "classification": "inflationary",   // disinflationary | neutral | inflationary
                           "evidence": [] },
  "energy_stress":       { "value": 0.38, "previous_value": 0.30, "change_reason": "crack spreads widening", "evidence": [] },
  "global_liquidity":    { "value": 0.42, "previous_value": 0.40, "change_reason": "BOJ hawkish drift", "evidence": [] }
}
```
Each sub-score object: `value` (0–1, req), `previous_value`, `velocity?`,
`acceleration?`, `change_reason` (string), `evidence[]` (`{type, id, summary}` —
`type` ∈ `series` | `story` | `thesis` | `auction` | `news` | `filing`), plus
`classification` on `ai_economic_impulse` only.

### `crypto_phase`
```jsonc
"crypto_phase": 1        // 1 = Stress, 2 = Liquidity Expansion
```

### `classification_blocks` — Facts / Interpretation / Speculation (MODEL.md §7)
Structural, not prose. Rendered as three labeled sections; replaces leaning on
`dashboard_summary` + `newsletter_body_html` for this.
```jsonc
"classification_blocks": {
  "observed_facts": [
    { "text": "30y auction bid-to-cover 2.28, below trailing-6 avg 2.42.",
      "evidence": [{ "type": "auction", "id": "912810UF3-20260904", "summary": "TreasuryDirect results" }] }
  ],
  "interpretation": [
    { "text": "Weak indirect demand is lifting term premium rather than reflecting a growth repricing.",
      "confidence": 0.6 }
  ],
  "speculation": [
    { "text": "A second weak auction could pull an SRF expansion forward into this quarter.",
      "confidence": 0.25 }
  ]
}
```
`observed_facts[]` entries **must** carry `evidence`. `interpretation[]` /
`speculation[]` carry a `confidence` (0–1); `speculation` is always the lowest-confidence
tier and is labeled as such in the UI regardless of value.

### `asset_triggers` — v1 fields
```jsonc
{ "asset": "XRP", "role": "optional bridge", "note": "…",
  "utility_score": 0.35,               // 0.0–1.0 in v1
  "score_kind": "utility",             // "utility" (XRP) | "market_confirmation" (others) — was UI-derived
  "bridge_role": "optional_bridge",    // XRP only, derived from utility_score bands (MODEL.md §5):
                                       //   adjacent_asset <0.25 | optional_bridge <0.5 | growing_liquidity_layer <0.75 | core_routing_asset
  "flow_composition": "stablecoin_to_stablecoin" // XRP only: stablecoin_to_stablecoin | stablecoin_via_xrp | mixed  (MODEL.md §5 A vs B)
}
```

---

## `event.causal_graph` (MODEL.md §6)

Aligned to `e3d-maps/schemas/flow_graph.py`. **Snapshot pattern:** each published `event`
carries one immutable graph snapshot. Append-only history downstream; the front end only
needs the latest.

```jsonc
"causal_graph": {
  "snapshot": {
    "id": "lw-cg-20260908T1305Z",
    "schema_version": "1.0",
    "node_count": 22,
    "edge_count": 27,
    "created_at": "2026-09-08T13:05:20Z",
    "created_by_agent": "liquiditywatch-synth",   // provenance, per NavigationSignal
    "model": "…"
  },

  "nodes": [
    {
      "id": "oil_shock",                 // stable slug; matches MODEL.md §6.2
      "label": "Oil Shock",
      "domain": "energy",                // energy|rates|funding|credit|policy|ai|macro|global|crypto
      "state": 0.40,                     // 0.0–1.0 current stress/activation
      "state_label": "elevated",         // calm | normal | elevated | high | acute  (display bucket)
      "trend": "rising",                 // rising | falling | flat   (sign of velocity)
      "velocity": 0.06,                  // optional, 0–1 per cycle, signed
      "change_reason": "Brent +12% MoM on supply headlines",
      "evidence": [
        { "type": "series", "id": "DCOILBRENTEU", "summary": "Brent $92, +12% MoM" }
      ]
    }
    // …one per MODEL.md §6.2
  ],

  "edges": [
    {
      "id": "e_oil_infl",
      "origin": "oil_shock",             // FlowEdge.origin
      "destination": "inflation",        // FlowEdge.destination
      "polarity": "amplifies",           // amplifies | dampens | constrains   (LW-specific; not in FlowEdge)
      "strength": "strong",              // SignalStrength: weak | moderate | strong   (reused verbatim)
      "confidence": 0.70,                // 0.0–1.0   (reused verbatim)
      "edge_status": "strengthening",    // EdgeStatus: active | new | strengthening | weakening | closed  (reused verbatim)
      "note": "Energy passthrough to headline CPI running above core.",
      "source_node_ids": ["oil_shock"]   // provenance; cf. FlowEdge.source_signal_ids
    }
    // …one per MODEL.md §6.3
  ]
}
```

### Rules

- **Structure is authored, not emitted.** `nodes[].id` / `edges[].{origin,destination,polarity}`
  come from `MODEL.md` §6.2–6.3. The pipeline fills `state`, `state_label`, `trend`,
  `velocity`, `change_reason`, `evidence`, `strength`, `confidence`, `edge_status`, `note`
  each cycle. It does **not** invent structure inline — a proposed new node/edge goes in a
  separate `causal_graph.proposed` array (same shape, ignored by the default renderer) and
  is promoted only by a human editing `MODEL.md` (E3D `StoryHypothesis` pattern).
- **Every edge's endpoints must resolve** to a node `id` present in `nodes[]`. Front end
  drops dangling edges silently.
- **`edge_status` is the "is this link hot" signal** — not a boolean. `strengthening` /
  `weakening` render with emphasis; `closed` renders greyed or hidden.
- **Unknown enum value** ⇒ front end renders the edge/node in a neutral default state
  rather than dropping it (matches `e3d-maps` `allow_unknown_signal_types` leniency), and
  logs. Unknown `domain` ⇒ `macro`.

---

## History

`GET …/financial-stress-monitor/history?limit=N` → newest-first array of trimmed events:

```jsonc
[
  { "created_at": "2026-09-08T13:05Z", "schema_version": "1.0",
    "final_score": 62,
    "controlled_break_risk": 0.44, "liquidity_response_probability": 0.30,
    "phase": 1,
    "subscores": { "treasury_stress": 0.55, "funding_stress": 0.20, "fed_response": 0.15,
                   "ai_economic_impulse": 0.70, "energy_stress": 0.38, "global_liquidity": 0.42 } }
  // …
]
```
Flat scalars only (no `change_reason`, `evidence`, graph). Powers sparklines under each
score. Cache-friendly; the front end fetches it once per load.

---

## Versioning policy

- **Additive fields** (new optional key) — no version bump required; the resilience
  contract covers it. Bump the `minor` when a batch lands so the front end can gate
  features (`schema_version >= "1.1"`).
- **Semantic change to an existing field** (e.g. `controlled_break_risk.value` 0–100 →
  0.0–1.0) — bump `major`, and the front end must branch on `schema_version` for one
  release cycle, then drop the old branch.
- **Removal / rename** — `major` bump + a deprecation cycle where both keys ship.

### Migration: trigger-metric `value` 0–100 → 0.0–1.0

Today `controlled_break_risk.value` / `liquidity_response_probability.value` are 0–100
(see `metricDeltaHtml` in `index.html`, which does `Math.round(value)` + `/100` label
text). v1 makes them 0.0–1.0 for scale consistency. Cutover:

1. Pipeline adds `schema_version: "1.0"` and emits these as 0.0–1.0.
2. Front end: `const v = event.schema_version ? m.value : m.value / 100;` then format as
   `%`.
3. After one published cycle at `1.0`, drop the ternary.

`final_score` / `final_score_before` are **not** affected — they stay 0–100 forever.
