# LiquidityWatch — Public ChatGPT Plugin

**Status:** private connection live and working; public directory submission **not yet
started** — see [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) for exactly what's
outstanding. This directory is the submission package prepared for when the owner is
ready to submit.

---

## What this is

LiquidityWatch already runs as a private ChatGPT connection, connected directly to the
owner's own account. This package prepares the same, unmodified MCP server for **public**
listing in OpenAI's Plugin Directory — the same underlying service, not a second one (see
[Architecture](#architecture) below for why that matters).

## Architecture

**One MCP endpoint, two clients.** `https://liquiditywatch.e3d.ai/mcp` is the single
production MCP server — Streamable HTTP transport, three read-only tools. Both the
existing private ChatGPT connection and a future public listing point at this exact same
URL. There is no separate "public" server to build, deploy, or keep in sync — connecting
publicly is a change in OpenAI's directory metadata about this endpoint, not a change to
the endpoint itself.

```
ChatGPT (private, owner's account)  ─┐
                                      ├──► https://liquiditywatch.e3d.ai/mcp
ChatGPT (future: public directory)  ─┘         │
                                                ▼
                                      nginx (TLS, Host-header allowlist)
                                                │
                                                ▼
                                 PM2 app e3d-mcp-http (127.0.0.1:3010)
                                      lib/http-app.js — server-http.js
                                                │
                                                ▼
                              https://e3d.ai/api/financial-stress-monitor(/history)
                                   (spacepacket — the E3D hub server)
```

- **Repo:** `e3d-mcp` (GitHub: `spacepacket1/e3d-mcp`) — `server-http.js` / `lib/http-app.js`
  / `lib/financial-stress-monitor.js` / `lib/e3d-api.js`. Full technical README there.
- **This repo** (`e3d-liquiditywatch`) is the presentation layer the MCP tools read the
  same public data from — see `docs/API-CONTRACT.md` and `docs/MODEL.md` for the wire
  format and score semantics the tools shape their output around.
- **Tools:** `get_macro_snapshot`, `get_macro_history`, `get_macro_causal_graph` — all
  read-only, all unauthenticated (the underlying data is already public on
  liquiditywatch.e3d.ai). No write, trading, account, or mailing-list tools exist on this
  server, by construction, not configuration — see `SECURITY.md`.

## Package contents

| File | Purpose |
|---|---|
| [`SUBMISSION.md`](./SUBMISSION.md) | Current OpenAI submission procedure, with sourced requirements and access dates |
| [`LISTING.md`](./LISTING.md) | Final proposed public listing copy (name, descriptions, category, example prompts) |
| [`SECURITY.md`](./SECURITY.md) | Security/operational review against the audit checklist, and what changed as a result |
| [`PRIVACY_REVIEW.md`](./PRIVACY_REVIEW.md) | Privacy-policy/publisher-info requirements and the gaps found (owner action needed) |
| [`PRIVACY_POLICY_DRAFT_TEMPLATE.md`](./PRIVACY_POLICY_DRAFT_TEMPLATE.md) | Structural skeleton for legal counsel — **not real legal text, not for publication as-is** |
| [`TERMS_OF_SERVICE_DRAFT_TEMPLATE.md`](./TERMS_OF_SERVICE_DRAFT_TEMPLATE.md) | Same, for terms of service |
| [`TEST_REPORT.md`](./TEST_REPORT.md) | Actual automated + live test results |
| [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) | Done vs. outstanding, with exactly who does what next |
