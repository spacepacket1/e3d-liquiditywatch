# LiquidityWatch

**How close is the U.S. financial system to a point where policymakers are forced to act?**

![LiquidityWatch — Macro + Crypto Liquidity Intelligence](public/liquiditywatch3.jpg)

Live at **[liquiditywatch.e3d.ai](https://liquiditywatch.e3d.ai)** — a single U.S. Financial Stress Score, 0–100, that only makes noise when something material actually changes.

## Why this exists

Recession probability, VIX, inflation prints, Treasury yields — each tells you something, but none of them answer the question that actually matters for markets: *is the plumbing about to break, and is the Fed/Treasury about to step in?* That's a synthesis problem — Treasury-market mechanics, funding-market stress, and how policymakers are actually behaving, read together — not something you get from a single indicator or a dashboard full of them.

LiquidityWatch answers that one question, as one number, and stays quiet otherwise.

## How the score is produced

Every evaluation runs through three independent AI stages — a different model at each step, so no single model's judgment silently becomes the answer:

1. **Research & scoring** — a deep-research model does live web research across Treasury, funding-market, and Fed-policy sources and proposes a score.
2. **Independent critique** — a second model reviews the same evidence *without seeing the first model's number* and derives its own. A real disagreement between the two triggers a targeted follow-up search on the specific point in dispute.
3. **Narrative synthesis** — a third model writes the plain-language summary, explicitly explaining any disagreement rather than quietly averaging it away.

Every evaluation is stored, but only ones judged *materially different* from the last published reading trigger a new score, a notification, and a newsletter issue. No daily noise.

## What you get

- **A live gauge, 0–100** across six regimes — from *Accommodative* through *Mild Watchfulness*, *Contained Tension*, *Restrictive Policy*, the *Policy-Forcing Danger Zone*, up to *Market Dysfunction*.
- **Trigger metrics tracked cycle-over-cycle**: Controlled Break Risk (odds current stress breaks into an uncontrolled crisis), Liquidity Response Probability (odds the Fed/Treasury actually supplies new support soon), and Phase (tightening → liquidity response beginning → full backstop underway).
- **Asset triggers for BTC, ETH, and XRP** — a utility score for how much each is actually functioning as settlement/bridge liquidity right now, not just price momentum.
- **A mailing list** that emails you only on material moves — see [`/about`](https://liquiditywatch.e3d.ai/about.html) for the full methodology and scale.

Fully automated end to end: a material evaluation publishes the moment the three-stage process completes, with no human-approval gate in the path. Not investment advice — an AI research and synthesis process, provided for informational purposes only.

## This repo

Just the static front end: an Express server (`server.js`) serving `public/` — the gauge, the score panel, and the mailing-list signup — which reads live data from the `e3d.ai` API (`/api/financial-stress-monitor`, `/api/mailing-list/signup`). The scoring pipeline itself lives elsewhere in the E3D stack.

```
npm install
npm start   # serves public/ on :3008 (or $PORT)
```

Part of the [E3D](https://e3d.ai) ecosystem — a FutCo intelligence product.
