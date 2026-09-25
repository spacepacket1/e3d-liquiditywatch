# LISTING.md — Proposed Public Listing Copy

Reuses the existing LiquidityWatch/E3D/FutCo brand identity throughout — nothing here is
a new name, logo, or visual identity. Refined from the draft copy supplied in the mission
brief against OpenAI's listing guidance (concise short description; longer description
covering the actual workflow; no unsupported guarantee claims) and against what the
implementation actually does (verified in `TEST_REPORT.md`).

## Identity

| Field | Value |
|---|---|
| Name | LiquidityWatch |
| Publisher | FutCo LLC |
| Product family | E3D |
| Website | https://liquiditywatch.e3d.ai |
| Support contact | `support@e3d.ai` (Cloudflare Email Routing, confirmed live 2026-09-25 — forwards to the owner); support page at https://liquiditywatch.e3d.ai/support |
| Privacy policy | https://liquiditywatch.e3d.ai/privacy (published 2026-09-25) |
| Terms of service | https://liquiditywatch.e3d.ai/terms (published 2026-09-25) |

## Short description

> AI-powered macroeconomic intelligence connecting financial stress, Treasury markets,
> monetary policy, energy, global liquidity, and cryptocurrency markets.

Used verbatim from the brief — concise, accurately scoped to what the three tools
actually return (no changes needed).

## Long description

> LiquidityWatch provides access to E3D's macroeconomic intelligence platform through
> ChatGPT. Explore current financial stress conditions, Treasury and funding markets,
> Federal Reserve policy, energy-market developments, global liquidity, and
> cryptocurrency implications. Retrieve historical financial stress evaluations, examine
> how sub-indicators (Treasury stress, funding stress, Fed/Treasury response, AI economic
> impulse, energy stress, global liquidity) have changed over time, and — when available —
> explore the causal relationships connecting macroeconomic developments to
> financial-market conditions.
>
> LiquidityWatch distinguishes three tiers of information in everything it reports:
> observed facts (each with a source), analytical interpretation, and explicitly
> lower-confidence speculation — helping you tell what's measured from what's inferred.
>
> **Informational only.** LiquidityWatch does not provide financial or investment advice,
> guaranteed forecasts, or independently verified probabilities. Its headline score and
> risk indicators are produced by an AI research/critique/synthesis pipeline and reflect
> that pipeline's analytical judgment, not calibrated statistical forecasts.

Changes from the brief's draft: added the explicit informational-only / no-advice /
no-guaranteed-forecast sentence, per the mission's own instruction not to claim
"guaranteed forecasts, independently verified probabilities, investment returns,
personalized financial advice, or real-time market data" beyond what's actually true.
This matches the disclaimer language already live on liquiditywatch.e3d.ai
(`public/index.html`'s `.disclaimer` text) and `public/about.html`, and the
`risk_metric_methodology_note` every tool response carries.

One claim to watch: "current financial stress conditions" and similar could be read as
implying real-time data. The underlying evaluation is **published periodically** (roughly
daily, per the pipeline's own cadence — see `get_macro_snapshot`'s `published_at`
timestamp), not streamed continuously. Consider whether OpenAI's review flags this;
if so, the fix is qualifying language ("as of the latest published evaluation") rather
than a data-freshness claim.

## Category & keywords

Not confirmed against the actual submission portal's taxonomy (not reachable from this
session — see `SUBMISSION.md` §10). Suggested, to be adjusted to whatever categories the
portal actually offers:

- **Category:** Finance / Economics / Data & Analytics (whichever the portal calls its
  closest equivalent — "Finance" alone risks over-scoping if the portal treats that
  category as implying trading/brokerage functionality, which LiquidityWatch has none of)
- **Keywords:** macroeconomics, financial stress, Treasury markets, Federal Reserve,
  monetary policy, liquidity, energy markets, cryptocurrency, financial data,
  macro intelligence

## Example / starter prompts

Grounded in what the three tools actually return (verified in `TEST_REPORT.md`), not
aspirational:

1. "What's the current U.S. financial stress score, and what's driving it?"
2. "How has the financial stress score changed over the past few weeks?"
3. "What phase is the Fed's policy response in right now?"
4. "What's LiquidityWatch's read on how energy markets are affecting financial stress?"
5. "Show me the causal relationships behind the current stress reading." **Decided
   2026-09-24, re-confirmed still `null` on the live API at the time of this decision:**
   keep this prompt as-is rather than dropping or rewording it. `get_macro_causal_graph`
   correctly returns a structured `{available:false, reason:"..."}` today, which is
   itself a legitimate thing to demonstrate — it shows the tool degrades gracefully
   instead of fabricating a graph, exactly the behavior a reviewer should want to see. If
   the upstream pipeline populates `causal_graph` before submission, this prompt then
   demonstrates the richer path instead — either outcome is a good test case, so no
   further wording change is needed either way.

## Disclosure/disclaimer language already live and consistent with this listing

- `public/index.html`: *"Not investment advice. This score reflects an AI-driven research
  and synthesis process; it is provided for informational purposes only."*
- `public/about.html`: *"This score and its narrative are produced by an AI research and
  synthesis process and are provided for informational purposes only. They are not a
  recommendation to buy, sell, or hold any asset."*

No new disclaimer language needed on the website itself for the listing copy above to be
accurate — the existing disclaimers already cover it.
