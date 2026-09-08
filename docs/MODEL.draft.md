# LiquidityWatch — Model Spec (DRAFT / captured verbatim)

> **Status:** raw draft. This is the architecture spec supplied by Chris (2026-09-08),
> captured verbatim so it survives a session restart. It has **not** yet been reconciled
> against the actual repo boundary or the E3D on-chain data surface. The cleaned,
> reconciled version will become `docs/MODEL.md`. See
> `docs/liquiditywatch-session-notes.md` for decisions and open questions.

---

## Framing

What has been built conceptually with **LiquidityWatch** is not just a "Fed tracker" or
crypto dashboard. It is a **multi-domain stress propagation model**.

Key insight:

> Financial crises are rarely caused by one metric. They emerge when independent systems
> become coupled: rates, collateral, liquidity, energy, leverage, policy, technology
> investment, and risk assets begin reinforcing each other.

The repo should represent these as **nodes and relationships**, not just a list of
indicators.

---

# LiquidityWatch — Macro + Crypto Intelligence Model

## Core Mission

LiquidityWatch answers:

> "Is the global financial system moving toward normal conditions, controlled
> stabilization, systemic stress, or a monetary regime change—and what does that imply
> for crypto assets?"

The system should not predict markets. It should:

1. Observe measurable conditions.
2. Score stress vectors.
3. Identify regime transitions.
4. Explain causal chains.
5. Separate facts from interpretation.

---

# 1. Treasury Market Stress Engine

## Purpose

Detect whether the world's largest bond market is functioning normally.

## Inputs

### Interest Rate Stress

Track:

* U.S. 10-year Treasury yield
* U.S. 30-year Treasury yield
* 2s10s curve
* 10s30s curve
* real yields
* term premium

### Rising yields are not automatically bad. Differentiate:

**Healthy growth rise** — GDP ↑, AI investment ↑, productivity ↑, yields ↑ = normal

**Stress rise** — deficits ↑, foreign buyers weaken, auction demand falls, term premium
rises = stress

## Treasury Auction Health

Track:

* bid-to-cover ratio
* indirect bidder participation
* dealer take-down percentage
* tail size

Interpretation: weak auction ⇒ Treasury supply > demand ⇒ potential consequence: yield ↑

## Treasury Liquidity

Track:

* bid/ask spreads
* market depth
* volatility
* dealer balance sheet capacity

Bad signals: wider spreads, lower liquidity, price moves without volume.

---

# 2. Funding Market Stress

## Purpose

Detect hidden leverage problems.

## Repo

Track: SOFR, SOFR-IORB spread, repo rates, Standing Repo Facility usage.

Normal: repo stable. Stress: cash scarcity.

## Basis Trade Risk

Track Treasury futures basis. Institution buys Treasury cash, shorts Treasury futures,
uses leverage. If volatility rises ⇒ margin calls ⇒ forced unwind ⇒ potential Treasury
selling pressure.

## Credit Stress

Track: CCC spreads, high yield spreads, investment grade spreads, default rates.

CCC is the weakest corporate debt. It often breaks before investment-grade markets.

---

# 3. Federal Reserve / Treasury Response Engine

## Purpose

Determine if policymakers are still observing or actively intervening.

## Fed Tools

**Normal:** interest rates, QT/QE, reserves.

**Liquidity Tools:** Standing Repo Facility, discount window, emergency lending, swap lines.

**Balance Sheet — separate:**

* **True QE** — Fed buys assets broadly.
* **Not-QE liquidity** — Treasury buybacks, reserve management, technical operations.

## Treasury Actions

Track: Treasury buybacks, debt issuance changes, cash balance changes.

---

# 4. Policy Regime Classifier

LiquidityWatch should always output one of:

* **NORMAL** — conditions functioning. E.g. yields stable, credit normal, Fed inactive.
* **STRESS BUILDING** — pressure increasing. Yields rising, spreads widening, volatility
  rising, leverage under pressure. *(Current state: STRESS BUILDING.)*
* **CONTROLLED STABILIZATION** — authorities intervene. Repo operations increase, Treasury
  liquidity operations, coordinated messaging.
* **SYSTEMIC BACKSTOP** — major intervention. Emergency facilities, QE, guarantees.
* **MONETARY REGIME CHANGE** — structural change. Yield curve control, financial
  repression, major currency changes.

---

# 5. Controlled Break Risk Score (0–100)

> "How much stress exists while policymakers still have tools available but have not
> deployed them?"

**Increase score:** Treasury volatility, credit stress, funding stress, leverage, oil
shock, FX stress.

**Reduce score:** Fed intervention, liquidity injections, stable markets.

---

# 6. Liquidity Response Probability (0–100)

> "If current conditions continue, how likely is a meaningful Fed/Treasury response?"

**Increase:** Treasury dysfunction, credit event, unemployment spike, repo stress.

**Decrease:** inflation high, economy strong, policymakers constrained.

---

# 7. Crypto Liquidity Engine

## Purpose

Translate macro liquidity into crypto implications.

## BTC

Track: BTC vs Nasdaq, BTC dominance, ETF flows, volatility, correlation with liquidity.

Classification question: risk asset? digital gold? liquidity proxy?

## ETH

Track: ETF flows, staking, DeFi activity, L2 activity.

## XRP/XLM

Higher beta. Track: regulatory catalysts, institutional adoption, liquidity utility.

---

# 8. XRP Liquidity Utility Model (0–100)

Critical: do NOT confuse **ecosystem growth** with **XRP value capture**.

## Inputs

### XRPL Activity

Track: transaction volume, DEX volume, AMM volume, liquidity pools.

### Stablecoins

Track: RLUSD supply, XRPL stablecoin supply, market share.

Key question — are stablecoins:

* **A)** Stablecoin → Stablecoin, or
* **B)** Stablecoin → XRP → Stablecoin

Only **B** strongly increases XRP utility.

### Payments

Track: Ripple partners, payment corridors, settlement volume.

### Bridge Function

Is XRP becoming:

* **0–25** Adjacent asset
* **25–50** Optional bridge *(current)*
* **50–75** Growing liquidity layer
* **75–100** Core routing asset

---

# 9. AI Economic Impulse Engine

The newest and most differentiated component. The question:

> Is AI investment delaying recession and monetary easing?

## Direct AI Capex

Track companies: OpenAI, Anthropic, Microsoft, Google, Amazon, Meta, Nvidia ecosystem.

Inputs: data centers, GPU purchases, announced capex, financing.

## Physical Economy Effects

* **Construction** — electricians, HVAC, concrete, steel, plumbing, contractors.
* **Infrastructure** — power plants, nuclear, natural gas, transmission, transformers,
  fiber.
* **Manufacturing** — chips, servers, networking equipment, cooling systems.
* **Regional Multipliers** — a data center creates direct construction workers, then
  restaurants, housing, teachers, healthcare, retail, local government.

## AI Economic Impulse Score (0–100)

Higher = AI is supporting growth. Classify:

* **DISINFLATIONARY** — AI improves productivity faster than demand (automation lowers
  costs).
* **NEUTRAL** — growth support without major inflation effect.
* **INFLATIONARY** — AI competes for electricity, labor, capital, land. *(Current:
  INFLATIONARY.)*

---

# 10. Energy System Layer (new)

Because: **oil ≠ gasoline.**

* **Crude** — Brent, WTI.
* **Refining** — crack spreads, refinery utilization.
* **Fuel Stress** — diesel inventories, gasoline inventories, shipping fuel.
* **Energy Transition** — nuclear restarts, SMRs, uranium, grid investment.

Connection: AI → electricity demand → nuclear/grid investment.

---

# 11. Global Liquidity Layer

* **Japan** — BOJ policy, yen, carry trade.
* **China** — stimulus, capital flows.
* **Dollar** — DXY, swap lines.

---

# Final Output Format

Every LiquidityWatch update should produce:

```
REGIME:
NORMAL / STRESS BUILDING / CONTROLLED STABILIZATION / SYSTEMIC BACKSTOP / MONETARY REGIME CHANGE

Controlled Break Risk:
XX/100

Liquidity Response Probability:
XX/100

Stress Level:
X/10


Crypto Phase:
Phase 1 Stress
Phase 2 Liquidity Expansion


BTC:
impact

ETH:
impact

XRP:
utility score
role


AI Economic Impulse:
XX/100

Classification:
DISINFLATIONARY / NEUTRAL / INFLATIONARY


Energy Stress:
score


Major Drivers:
1.
2.
3.


Observed Facts:

...


Interpretation:

...


Speculation:

...
```

---

## The bigger E3D opportunity

The natural E3D representation is **a causal graph of financial stress propagation.**

Nodes / chains:

```
Oil Shock
     ↓
Inflation
     ↓
Fed Constraint
     ↓
Treasury Stress
     ↓
Credit Stress
     ↓
Liquidity Response
     ↓
Crypto
```

and:

```
AI Capex
     ↓
Power Demand
     ↓
Energy Investment
     ↓
GDP Support
     ↓
Higher Rates
     ↓
Treasury Pressure
```

This is where E3D has a structural advantage: not just displaying numbers, but showing
**relationships and evolving causality**. This is no longer just "add more indicators" —
it is a **financial intelligence graph engine**.

Source reference: <https://molt.midoci.com/post/63b982d4-d6dc-41e4-9dc9-099099411e44>
