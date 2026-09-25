# TEST_REPORT.md — Actual Test Results

**What this covers, and what it doesn't:** everything below was actually run this
session, with real output. It verifies the MCP server end-to-end — protocol compliance,
tool behavior, security controls, and reachability through the real production URL. **It
does not verify the plugin inside ChatGPT's own UI** (connector setup screens, tool
approval prompts, how ChatGPT's model chooses to call these tools from a natural-language
prompt). That requires the owner's ChatGPT account and hasn't been done as part of this
session — see `RELEASE_CHECKLIST.md`. The mission's own instruction was explicit on this
point ("Do not claim that public ChatGPT plugin installation has been verified unless it
has actually been tested"), so this report doesn't make that claim.

## Automated suite (`e3d-mcp/test/`)

```
$ npm test
...
ℹ tests 44
ℹ suites 0
ℹ pass 41
ℹ fail 0
ℹ cancelled 0
ℹ skipped 3
ℹ todo 0
```

The 3 skipped are the opt-in live-API tests (`E3D_MCP_LIVE_TESTS=1`, not run by default so
`npm test` doesn't require network access). Run explicitly this session:

```
$ E3D_MCP_LIVE_TESTS=1 node --test test/live-financial-stress-monitor.test.js
✔ live: get_macro_snapshot shape against the real API
✔ live: get_macro_history shape against the real API
✔ live: get_macro_causal_graph handles the current null-or-present state
ℹ tests 3, pass 3, fail 0
```

**Total: 44/44 passing** (41 offline + 3 live-network), including an explicit check that
every tool's `structuredContent` validates against its declared `outputSchema` and
matches `content`'s JSON exactly, and a check that `get_macro_snapshot` explains its
`previous_value`/`get_macro_history` field-semantics distinction (see `SECURITY.md`'s
"Data accuracy / field-semantics clarity" section — found during the owner's actual demo
prep, not by this session in isolation).

### Coverage by mission checklist item

| Item | File | Result |
|---|---|---|
| MCP initialization | `test/http-app.test.js` | ✔ client connects over real Streamable HTTP |
| Tool discovery | `test/http-app.test.js` | ✔ exactly 3 tools listed, none from the stdio server |
| Tool annotations (readOnlyHint etc.) | `test/http-app.test.js` | ✔ all 3 tools carry the required hints |
| get_macro_snapshot execution | `test/http-app.test.js`, `test/live-*` | ✔ real data, `available:true` |
| get_macro_history execution | `test/http-app.test.js`, `test/live-*` | ✔ real data, correct count/order |
| get_macro_causal_graph execution | `test/live-*` | ✔ correctly reports `{available:false}` — see note below |
| Missing/optional fields | `test/financial-stress-monitor.test.js` | ✔ 8 cases: no event, missing subscores/triggers/blocks, null history values |
| Legacy vs. current score format | `test/financial-stress-monitor.test.js` | ✔ schema_version-driven, per-entry (not global) |
| Backend API errors | `test/e3d-api.test.js` | ✔ non-2xx, malformed JSON, unreachable host, timeout |
| Invalid tool arguments | `test/http-app.test.js` | ✔ out-of-range `limit` → `isError:true`, not a crash |
| Read-only enforcement | `test/http-app.test.js` | ✔ no write routes exist on this server (404) |
| Public HTTPS connectivity | manual, this report | ✔ verified against `https://liquiditywatch.e3d.ai/mcp` directly |
| Rate limiting | `test/http-app.test.js` | ✔ 429 after the configured max, `/health` exempt |
| DNS-rebinding / Host validation | `test/http-app.test.js` | ✔ wrong Host → 403, correct Host → accepted |
| Caching | `test/e3d-api.test.js` | ✔ hit/miss/expiry/never-caches-failures, all 4 verified |
| Timeout handling | `test/e3d-api.test.js` | ✔ aborts a hung upstream after the configured timeout |

**Note on `get_macro_causal_graph`:** as of 2026-09-24, the live upstream event's
`causal_graph` field is `null` (confirmed by direct API call, re-checked immediately
before writing this report). This is expected, documented upstream behavior (the field
hasn't rolled out on every pipeline cycle yet — see `docs/API-CONTRACT.md`), and the tool
correctly returns a structured `{available:false, reason:"..."}` rather than an error.
Worth knowing before drafting a submission test case around this tool: today, a
positive test case for it demonstrates the *graceful-unavailability* path, not a populated
graph.

## Live production verification (through the real deployment, not just localhost)

Verified via the actual MCP SDK client, hitting `https://liquiditywatch.e3d.ai/mcp`
directly (i.e. through Cloudflare → nginx → PM2 → `e3d-mcp-http`, the exact path a real
ChatGPT connection uses):

```
tools: get_macro_snapshot, get_macro_history, get_macro_causal_graph
isError: false | score: 74
```

Run twice this session: once before the security/annotations changes (baseline) and
again after redeploying with all changes from `SECURITY.md` live, confirming the
existing connection contract (URL, tool names, schemas) was preserved — same 3 tools,
same names, same call shape, just added annotations and server-side hardening. This is
the strongest verification available from this session that **the existing private
ChatGPT connection should be unaffected** by these changes; it is not literally opening
the owner's ChatGPT account to confirm the UI still shows it connected.

## Draft submission test cases (OpenAI requires 5 positive + 3 negative)

Per `SUBMISSION.md` §5. These are written for the OpenAI reviewer to run *inside ChatGPT*
at submission time — grounded in verified tool behavior above, not aspirational.

**Positive:**

1. **Prompt:** "What's the current U.S. financial stress score, and what's driving it?"
   **Expected:** calls `get_macro_snapshot`; response includes a 0-100 score, band/regime,
   and the `drivers` list.
2. **Prompt:** "How has the financial stress score changed over the last 10 evaluations?"
   **Expected:** calls `get_macro_history` with `limit: 10`; response is newest-first,
   each entry has a score and timestamp.
3. **Prompt:** "What phase is the Fed's policy response in right now?"
   **Expected:** calls `get_macro_snapshot`; response's `phase` field is surfaced in the
   answer.
4. **Prompt:** "What's the breakdown of what's contributing to the current stress score —
   Treasury markets, funding, energy, etc.?"
   **Expected:** calls `get_macro_snapshot`; response's `subscores` object (6 sub-engines)
   is surfaced.
5. **Prompt:** "Is there a causal graph showing how these economic factors relate to each
   other?"
   **Expected:** calls `get_macro_causal_graph`; as of this writing, correctly reports
   it isn't available yet rather than fabricating a graph — **a genuinely good test of
   graceful degradation**, not a broken case, but confirm this is still the desired
   framing at actual submission time (the field may be populated by then).

**Negative:**

1. **Prompt:** "Buy Bitcoin based on the current LiquidityWatch score." **Expected:**
   refusal or clarification — no trading/transaction tool exists on this server; nothing
   for the model to call. **Rationale:** confirms the read-only boundary holds even when
   a user prompt implies an action beyond what's exposed.
2. **Prompt:** "Give me the last 10,000 evaluations." **Expected:** either the model caps
   the request itself, or `get_macro_history` returns the documented MCP validation error
   for `limit > 365` (verified directly in `test/http-app.test.js`) rather than a crash
   or silently-wrong result. **Rationale:** confirms out-of-range input is handled safely.
3. **Prompt:** "What's my personal portfolio's risk based on my brokerage account?"
   **Expected:** refusal or clarification — these tools take no account/personal-data
   input and have no access to any user's holdings. **Rationale:** confirms the server
   can't be induced into fabricating personalized financial data it has no way to
   actually retrieve.
