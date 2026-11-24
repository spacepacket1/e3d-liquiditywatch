# Proposal: per-date archive permalinks

**Status:** proposal, not part of the contract. Nothing in this repo depends on it.
`docs/API-CONTRACT.md` stays the only joint with the pipeline; if this is accepted, the
endpoint below is added there first (rule 2) and this file is deleted.

## Why

Search engines, assistants and people link to a *page about a date* ("the score hit 79 on
Oct 4"), not to a homepage whose content changes daily. A stable URL per reading gives
LiquidityWatch something to be cited and linked, and a place for each day's briefing to be
indexed. Today `/history` returns only the headline, sub-scores and trigger metrics, with no
briefing text, so an archive page built from it would be thin.

## Proposed API addition (pipeline side)

`GET https://e3d.ai/api/financial-stress-monitor/by-date/{YYYY-MM-DD}` -> `{ event }`

- Returns the latest **published** evaluation for that UTC date, the same `event` shape as
  `/financial-stress-monitor` (every field optional; the existing resilience rules apply).
- `404` with `{ "event": null }` when no published evaluation exists for that date.
- Dates before the first reading or in the future also `404`.
- Past dates are immutable once published: send `Cache-Control: public, max-age=86400`.
  (Today's date stays short-cached.)
- Same CORS allow-list as the other endpoints.

Optional, makes the sitemap cheap: `GET .../financial-stress-monitor/dates` -> `["2026-09-03", ...]`
(dates that have a published evaluation). Without it, the front end can derive the list from
`/history`, accepting that history includes unpublished cycles (see API-CONTRACT section History).

## Front-end plan (this repo, after the API ships)

- Route `/YYYY-MM-DD` in `server.js`, server-rendered with the existing `buildScorePanelHtml`
  and friends against the fetched event. No new rendering code, no build step.
- Per-page `<title>`, description (`liveSummaryText`), canonical `https://liquiditywatch.e3d.ai/YYYY-MM-DD`
  and Open Graph image `/score-card.png?date=YYYY-MM-DD` (the card route takes an optional date).
- Previous/next day links and a link back to the live dashboard; a banner that says it is a
  past reading.
- Sitemap: `server.js` serves `/sitemap.xml` dynamically (static pages + archive dates) instead
  of the static file.
- Unknown or 404 dates return a real 404 page, not a soft 200.

## Open questions for the pipeline owner

1. Is one published evaluation per UTC day guaranteed, or can there be several? (Proposal: latest wins.)
2. Are non-material (`not_applicable`) days published? They should get a page only if the
   briefing has content worth indexing.
3. Is there any reason past briefings must not be re-served publicly (retention, corrections)?
   If corrections happen, the immutability and cache headers above need a purge path.
