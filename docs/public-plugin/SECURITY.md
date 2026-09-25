# SECURITY.md — Security & Operational Review

Audit against the mission's checklist, against the live `e3d-mcp` implementation
(`server-http.js`, `lib/http-app.js`, `lib/e3d-api.js`, `lib/financial-stress-monitor.js`).
Findings marked **Fixed** were changed this session and are live in production
(`e3d-mcp-http` PM2 app, restarted and verified — see `TEST_REPORT.md`). Findings marked
**No change needed** were audited and left alone deliberately, with reasoning.

## MCP protocol compliance / Streamable HTTP transport

**No change needed.** Already implemented via the official SDK
(`StreamableHTTPServerTransport`, stateless mode). Verified live over the real public
HTTPS endpoint in `TEST_REPORT.md`, and via 42 automated tests in `e3d-mcp/test/`.

## Tool discovery and invocation

**No change needed** for correctness. **Fixed** for OpenAI's metadata requirement: all
three tools now carry `readOnlyHint: true`, `destructiveHint: false`,
`idempotentHint: true`, `openWorldHint: true` (`lib/financial-stress-monitor.js`'s
`READ_ONLY_TOOL_ANNOTATIONS`, shared by both `server.js` and `server-http.js` so they
can't drift). Before this session, tools had names/descriptions/schemas but no
annotations — a documented OpenAI Apps SDK submission requirement
(see `SUBMISSION.md` §4).

**Fixed (follow-up):** all three tools now also declare an `outputSchema`
(`lib/tool-output-schemas.js`), flagged as a warning (not a blocker) by OpenAI's own
`chatgpt-app-submission` skill. Deliberately permissive on fields that are pure
passthrough of whatever the upstream API sends (`phase`, `subscores`, `asset_triggers`,
`classification_blocks` entries, causal-graph `nodes`/`edges`/`snapshot`,
`falsifiable_claim`) — over-specifying those would contradict this codebase's own
resilience contract ("every field is optional, never throw on an unexpected shape") the
moment the upstream API adds a field. Precise only where the shaping code itself
guarantees a fixed shape. Switched both `server.js` and `lib/http-app.js` from the
deprecated `tool()` registration to `registerTool()` to support this, and handlers now
return `structuredContent` alongside `content` (`okStructured()` in `lib/e3d-api.js`).
Verified empirically against real live data for both branches of the two
`{available: true|false}` tools before wiring it in, and covered by a new automated test
(`test/http-app.test.js`) plus a production round-trip through the real public URL.

## HTTP error handling

**No change needed.** A non-2xx or malformed upstream response never throws an unhandled
exception — `apiRequest` falls back to `{raw: text}` on non-JSON bodies and only throws
(caught by the MCP SDK's own per-tool error handling, surfaced as `isError: true`, never
a crash) on a genuine non-2xx status. Covered by
`test/e3d-api.test.js` and `test/http-app.test.js`.

## CORS

**Evaluated, not needed.** The Responses API / ChatGPT's MCP client calls a remote MCP
server server-to-server, not from a browser — OpenAI's own docs describe resending an
`authorization` parameter with each backend-issued request, which only makes sense for a
non-browser caller. No CORS headers were added; adding permissive CORS here would be pure
downside (it has no legitimate browser caller and would only ease unrelated
cross-origin abuse) with no upside for this use case.

## DNS-rebinding protection / allowed-host configuration

**No change needed — already correct, and now has explicit test coverage.**
`MCP_HTTP_ALLOWED_HOSTS=liquiditywatch.e3d.ai` (set in `ecosystem.config.cjs`) is the
only Host header the SDK's built-in DNS-rebinding middleware accepts. Verified directly:
a raw request with `Host: evil.example.com` gets `403`; the real nginx-forwarded
`Host: liquiditywatch.e3d.ai` is accepted. **Note surfaced by testing:** this check
applies to *every* route on the app, including `/health` — a bare loopback health check
with no Host override also gets `403` once `MCP_HTTP_ALLOWED_HOSTS` is set. This is
correct/intended behavior (defense in depth), not a bug, but worth knowing if `/health`
is ever wired into external monitoring — the monitor would need to send the matching Host
header too.

## HTTPS configuration

**No change needed.** Existing Let's Encrypt/Certbot certificate on the
`liquiditywatch.e3d.ai` nginx server block, reused (no new cert issued). Cloudflare sits
in front (the domain resolves to Cloudflare IPs), providing an additional TLS/proxy layer.

## Request validation

**No change needed.** Tool arguments are validated against each tool's zod schema before
the handler runs — an out-of-range `get_macro_history` `limit` (tested: `10000` against a
`max(365)` schema) returns a proper MCP tool error (`isError: true`,
"Invalid arguments... too_big"), not a crash or silent clamp. Verified in
`test/http-app.test.js`.

## Connection timeouts

**Fixed.** `apiRequest` previously had no timeout — a hung upstream could hang a tool
call indefinitely. Now aborts via `AbortController` after `E3D_API_TIMEOUT_MS`
(default 10s, configurable). Verified with a mock upstream that never responds in time
(`test/e3d-api.test.js`).

## Rate limiting and abuse protection

**Fixed.** No rate limiting previously existed on the public HTTP endpoint. Added
`express-rate-limit` (already a transitive dependency of `@modelcontextprotocol/sdk`, now
declared as a direct one) on `POST /mcp` and its `GET`/`DELETE` 405 handlers:
default 60 requests/IP/minute, configurable via `MCP_HTTP_RATE_LIMIT_MAX` /
`MCP_HTTP_RATE_LIMIT_WINDOW_MS`. **Deliberately excludes `/health`** so a monitoring
system hitting the limit doesn't look like an outage. Required `app.set("trust proxy", 1)`
to correctly key by real client IP rather than nginx's own loopback address — without it,
every client behind the proxy would have shared the same rate-limit bucket. Verified: 5
rapid requests against a `max: 3` test config show the first 3 succeed and later ones
return `429`.

This is IP-based and process-local (resets on restart, not shared across any future
horizontal scale-out) — adequate for the traffic this endpoint sees today. Revisit if
public listing drives meaningfully higher concurrent load.

## Logging and error reporting

**Fixed (minimally).** Added one structured access-log line per request
(`method path status duration_ms`) in `lib/http-app.js`. Deliberately does **not** log
request or response bodies — tool arguments here are trivial (`{}` or `{limit:N}`) but
the habit of not logging payloads at a public-facing boundary is the point, not today's
specific low sensitivity.

## Server availability and PM2 restart behavior

**Fixed.** Added `max_memory_restart: '200M'` to `ecosystem.config.cjs` as a safety net
against a memory leak degrading the process instead of restarting it. `autorestart: true`
was already set. Not changed: `instances: 1` (matches the sibling `cast-worker` PM2 app's
own convention on this host of using `cluster` mode with a single instance) — horizontal
scaling wasn't judged necessary for current/expected traffic; see §Public deployment
readiness below.

## Backend API failure handling

**No change needed** for correctness (see §HTTP error handling); **improved** by the new
timeout and cache (§Rate limiting/caching) reducing how often a backend failure is even
reachable under repeated calls.

## Response caching / public API dependency load

**Fixed.** Added a short in-memory TTL cache in `lib/e3d-api.js`'s `apiFetch` (GET-only —
never applied to `apiRequest`'s write path used by the stdio server's registry tools).
Default 30s, configurable via `E3D_API_CACHE_TTL_MS`. The underlying evaluation changes
roughly once per pipeline cycle (observed: ~daily, per `financial-stress-worker`'s PM2
cadence), so repeated `get_macro_snapshot` calls from a busy ChatGPT session don't each
hit `e3d.ai` — this is exactly the caching opportunity the mission asked to evaluate. Not
a new service: a plain in-memory `Map`, cleared on process restart, per-process (no
cross-instance cache invalidation to reason about since there's exactly one instance).
Failed requests are never cached (verified in `test/e3d-api.test.js`), so a transient
upstream outage doesn't get "frozen" into a repeated cached failure.

## Handling of large responses

**Evaluated, no change needed.** `get_macro_history`'s hard cap of 365 entries, each a
small flat object, bounds response size to tens of KB at most — not a concern at current
or plausible near-term scale. No streaming/pagination added; not warranted yet.

## Protection against accidental exposure of internal services, credentials, or admin operations

**No change needed — audited directly.** `server-http.js`/`lib/http-app.js` expose
exactly three routes: `POST /mcp` (the three read-only tools), `GET /health`, and
`GET /.well-known/openai-apps-challenge` (inert until a real token is configured — see
`SUBMISSION.md` §2). No credentials are held or forwarded by this process — the
underlying `E3D_API_KEY` (used only by `apiRequest`'s `x-api-key` header when set) is not
required for the financial-stress-monitor endpoints and isn't currently set in
`ecosystem.config.cjs`. Confirmed by direct test: `POST` to `/claim`,
`/registry/tokens/0xabc/claim`, `/mailing-list/signup` all return `404` — those routes
don't exist on this server; they're only reachable through the *separate* stdio
`server.js`, which ChatGPT cannot reach at all (it has no stdio transport). Read-only is
enforced by the HTTP server not having those tools registered, not by a runtime
permission check that could be misconfigured.

## Data sanitization (tool response content)

**Audited, no change needed.** Reviewed every field `shapeMacroSnapshot`/
`shapeMacroHistory`/`shapeMacroCausalGraph` emit: no auth secrets, no internal service
identifiers beyond an opaque `event_id`/`run_id`-shaped evaluation ID (not a credential,
not personally identifying), no debug payloads. `newsletter_body_html` (trusted HTML
meant for direct rendering on liquiditywatch.e3d.ai) is deliberately excluded from every
tool's output — was already true before this session, re-verified.

## Data accuracy / field-semantics clarity (found during demo prep, 2026-09-25)

**Fixed.** The owner, preparing the ChatGPT demo recording, noticed
`get_macro_snapshot`'s `headline_score.previous_value` (72) didn't match
`get_macro_history`'s second-newest entry (74) — looked like a bug. Traced to the actual
root cause by reading the upstream pipeline source directly
(`/home/ubuntu/e3d/server/financialStress/repository.js` on the deploy host, not
guessed): `previous_value` comes from `getLatestPublishedEvent()`
(`WHERE reviewStatus = 'published'`), while `/history` returns every stored cycle
regardless of publish status (`getLatestEvent()`, no such filter) — confirmed by the
pipeline's own code comment. Not a bug in `e3d-mcp` or in the upstream pipeline — a real,
intentional distinction that's easy to misread without documentation. Added
`headline_score.previous_value_note` to `get_macro_snapshot`'s output explaining this,
plus a matching note in the tool's own description text, so a ChatGPT user (or a
reviewer) sees the explanation without needing pipeline source access. Also documented
in `docs/API-CONTRACT.md` (§`event` shape and §History) for future readers of the wire
contract itself, not just the MCP layer. Covered by a new test, redeployed, and verified
live.

## Dependency audit

`npm audit` found 22 vulnerabilities before this session's changes. **Not all were
pre-existing** — adding `express-rate-limit` as a direct dependency (§Rate limiting
above) pulled in `ip-address@<=10.3.0`, itself carrying a **high**-severity XSS/SSRF-
adjacent advisory. Caught by re-running `npm audit` after making the change, not assumed
safe just because it's a small, single-purpose package.

Ran `npm audit fix` (no `--force`, no major-version bumps): **22 → 15 vulnerabilities**.
Fixed: `express-rate-limit` → `8.7.0` (resolves the `ip-address` issue introduced this
session), plus pre-existing moderate/high findings in `@hono/node-server`, `hono`,
`fast-uri`, `qs`, and `body-parser` — all transitive dependencies of
`@modelcontextprotocol/sdk` itself, unrelated to any code in this repo. Full test suite
re-run and production re-verified live after this fix (see `TEST_REPORT.md`).

**Remaining 15** (12 low, 2 moderate, 1 high) are all in the `ethers@5.7.2` →
`elliptic`/`ws` chain, used only by the *stdio* server's on-chain token-registry tools
(unrelated to the three financial-stress-monitor tools or to `server-http.js`). Fixing
these requires `npm audit fix --force`, which would pull a breaking `ethers@6` upgrade and
risks breaking the registry-claim flow (`claim_token`/`update_token_claim`) — out of this
mission's scope ("do not rewrite... unless necessary"). Flagged here for the owner's
awareness; worth its own dedicated follow-up with the registry-claim flow's own test
coverage in scope, not folded into this change.
