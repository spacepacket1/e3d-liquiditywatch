'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const renderExports = require('../public/render.js');

const html = fs.readFileSync(require.resolve('../public/index.html'), 'utf8');

function pageHarness(storedValue = null) {
  const ids = [
    'exposure-cash-equities', 'exposure-btc', 'exposure-eth', 'exposure-xrp',
    'exposure-leveraged', 'exposure-validation', 'personal-result',
    'score-panel', 'subscore-panel', 'subscore-breakdown', 'classification-panel',
    'classification-body', 'newsletter-panel', 'newsletter-body', 'outlook-panel', 'outlook-body',
    'score-history', 'history-chart-panel', 'causal-graph', 'causal-graph-panel',
    'signup-form', 'signup-email', 'signup-submit', 'verify-form', 'verify-code',
    'verify-submit', 'signup-status', 'exposure-signup-form', 'exposure-signup-email',
    'exposure-signup-submit', 'exposure-verify-form', 'exposure-verify-code',
    'exposure-verify-submit', 'exposure-signup-status',
  ];
  const selectIds = new Set([
    'exposure-cash-equities', 'exposure-btc', 'exposure-eth', 'exposure-xrp',
  ]);
  const elements = Object.fromEntries(ids.map((id) => [id, {
    id,
    value: '',
    checked: false,
    disabled: false,
    hidden: id.includes('verify-form'),
    innerHTML: '',
    textContent: '',
    className: '',
    options: selectIds.has(id)
      ? Array.from({ length: 11 }, (_, index) => ({ value: String(index * 10) }))
      : [],
    listeners: {},
    addEventListener(type, listener) { this.listeners[type] = listener; },
  }]));
  const storage = new Map();
  if (storedValue !== null) storage.set(renderExports.EXPOSURE_MIX_STORAGE_KEY, storedValue);
  const requests = [];
  const context = {
    ...renderExports,
    RENDER_EXPORTS: renderExports,
    document: { getElementById: (id) => elements[id] },
    localStorage: {
      getItem: (key) => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => storage.set(key, value),
    },
    fetch: (...args) => {
      requests.push(args);
      return new Promise(() => {});
    },
  };
  // The page carries a Google Analytics inline script ahead of the app script.
  const inlineScript = [...html.matchAll(/<script>\n([\s\S]*?)<\/script>/g)]
    .map((m) => m[1]).find((code) => code.includes('RENDER_EXPORTS'));
  vm.runInNewContext(inlineScript, context);
  return { context, elements, storage, requests };
}

test('calculator is a sibling between the headline and SSR analytical anchors', () => {
  const scoreClose = html.indexOf('</section>', html.indexOf('<section id="stress-score">'));
  const calculator = html.indexOf('<section id="personal-exposure">');
  const subscores = html.indexOf('<section id="subscore-breakdown" hidden>');
  assert.ok(scoreClose < calculator && calculator < subscores);

  const scorePanelStart = html.indexOf('<div class="score-panel" id="score-panel">');
  const scorePanelEnd = html.indexOf('</div>', scorePanelStart);
  assert.ok(calculator > scorePanelEnd);
});

test('each allocation control contains exactly the 10-point option grid', () => {
  const expected = Array.from({ length: 11 }, (_, index) => String(index * 10));
  for (const id of ['exposure-cash-equities', 'exposure-btc', 'exposure-eth', 'exposure-xrp']) {
    const select = html.match(new RegExp(`<select id="${id}">([\\s\\S]*?)<\\/select>`));
    assert.ok(select, `${id} is present`);
    const values = Array.from(select[1].matchAll(/<option value="(\d+)">/g), (match) => match[1]);
    assert.deepEqual(values, expected);
  }
  assert.match(html, /isOwnOption \? parseInt\(raw, 10\) : NaN/);
});

test('calculator uses shared exports, retained events, and guarded local persistence', () => {
  assert.match(html, /retainedExposureEvent = event;\s+recalculatePersonalExposure\(\);/);
  assert.match(html, /globalThis\.RENDER_EXPORTS\.normalizeExposureMix\(mix\)/);
  assert.match(html, /globalThis\.RENDER_EXPORTS\.computePersonalExposure\(retainedExposureEvent, mix\)/);
  assert.match(html, /globalThis\.RENDER_EXPORTS\.parseStoredExposureMix\(raw\)/);
  assert.match(html, /if \(typeof serialized !== 'string'\) return;/);
  assert.doesNotMatch(html, /localStorage\.removeItem/);
});

test('signup flows retain independent forms and required list attribution', () => {
  assert.match(html, /list: 'financial_stress_alerts'/);
  assert.match(html, /list: globalThis\.RENDER_EXPORTS\.EXPOSURE_ALERT_LIST/);
  // Double opt-in: the signup POST is the only call; no verify-code follow-up.
  assert.match(html, /body: JSON\.stringify\(\{ email, list: 'financial_stress_alerts' \}\)/);
  assert.match(html, /body: JSON\.stringify\(\{ email, list: globalThis\.RENDER_EXPORTS\.EXPOSURE_ALERT_LIST \}\)/);
  assert.doesNotMatch(html, /verifyEmailCode/);
  assert.match(html, /getElementById\('signup-status'\)/);
  assert.match(html, /getElementById\('exposure-signup-status'\)/);
});

test('calculator recomputes from retained and null events without overwriting a valid saved mix', () => {
  const harness = pageHarness();
  const { context, elements, storage } = harness;
  assert.equal(elements['exposure-cash-equities'].value, '70');

  context.renderEventIntoPage({ final_score: 40 });
  assert.match(elements['personal-result'].innerHTML, />40<\/span>/);
  const validStored = storage.get(renderExports.EXPOSURE_MIX_STORAGE_KEY);

  elements['exposure-cash-equities'].value = '60';
  elements['exposure-cash-equities'].listeners.change();
  assert.equal(elements['exposure-validation'].textContent, 'Allocations must total exactly 100%.');
  assert.equal(elements['personal-result'].innerHTML, '');
  assert.equal(storage.get(renderExports.EXPOSURE_MIX_STORAGE_KEY), validStored);

  context.renderEventIntoPage(null);
  assert.match(elements['personal-result'].innerHTML, /Waiting for the current/);
  assert.equal(elements['exposure-validation'].textContent, 'Allocations must total exactly 100%.');
});

test('only valid on-grid stored mixes initialize the allocation controls', () => {
  const saved = renderExports.serializeExposureMix({
    cashEquities: 40, btc: 20, eth: 20, xrp: 20, leveraged: true,
  });
  const restored = pageHarness(saved).elements;
  assert.equal(restored['exposure-cash-equities'].value, '40');
  assert.equal(restored['exposure-leveraged'].checked, true);

  const offGrid = JSON.stringify({
    v: 1, cashEquities: 65, btc: 15, eth: 10, xrp: 10, leveraged: false,
  });
  assert.equal(pageHarness(offGrid).elements['exposure-cash-equities'].value, '70');
  assert.equal(pageHarness('{broken').elements['exposure-cash-equities'].value, '70');
});

test('calculator signup remains available for an invalid mix and sends its own list attribution', async () => {
  const { context, elements, requests } = pageHarness();
  elements['exposure-cash-equities'].value = '60';
  elements['exposure-cash-equities'].listeners.change();
  elements['exposure-signup-email'].value = 'calculator@example.com';

  context.fetch = async (url, options) => {
    requests.push([url, options]);
    return { ok: true, json: async () => ({ success: true, message: 'Check your email' }) };
  };
  await elements['exposure-signup-form'].listeners.submit({ preventDefault() {} });
  // Page-load fetches (score, history) precede it; the signup POST is the last call.
  assert.match(requests.at(-1)[0], /\/api\/mailing-list\/signup$/);
  assert.deepEqual(JSON.parse(requests.at(-1)[1].body), {
    email: 'calculator@example.com',
    list: renderExports.EXPOSURE_ALERT_LIST,
  });
  assert.equal(elements['exposure-signup-status'].textContent, 'Check your email');
  assert.equal(elements['exposure-signup-submit'].textContent, 'Subscribed');
});

test('general signup keeps its attribution and re-enables submission after an API error', async () => {
  const { context, elements, requests } = pageHarness();
  elements['signup-email'].value = 'general@example.com';
  context.fetch = async (url, options) => {
    requests.push([url, options]);
    return { ok: false, json: async () => ({ success: false, message: 'Retry later' }) };
  };

  await elements['signup-form'].listeners.submit({ preventDefault() {} });
  assert.deepEqual(JSON.parse(requests.at(-1)[1].body), {
    email: 'general@example.com', list: 'financial_stress_alerts',
  });
  assert.equal(elements['signup-submit'].disabled, false);
  assert.equal(elements['signup-status'].textContent, 'Retry later');
  assert.equal(elements['exposure-signup-status'].textContent, '');
});

test('asset chips render etf_flow from whatever subset is present', () => {
  const html = renderExports.assetTriggersHtml([
    { asset: 'BTC', note: 'n', utility_score: 0.5, etf_flow: {
      trend: 'rising', net_flow_usd_5d: 850e6, net_flow_usd_30d: -1.2e9, divergence: 'outflow_vs_easing',
    } },
    { asset: 'ETH', note: 'n', utility_score: 0.4, etf_flow: { state: 0.6 } },
    { asset: 'XRP', note: 'n', utility_score: 0.3, etf_flow: 'garbage' },
    { asset: 'SOL', note: 'n', utility_score: 0.3 },
  ], '1.0');
  assert.match(html, /ETF flows \+\$850M \(5d\) · -\$1\.2B \(30d\)/);
  assert.match(html, /Divergence: ETF outflows despite easing/);
  assert.equal((html.match(/asset-chip-etf"/g) || []).length, 1);
  assert.equal(renderExports.etfFlowHtml(null), '');
  assert.equal(renderExports.formatUsdCompact('x'), null);
});

test('causal graph renders any subset, drops dangling/closed edges, and escapes text', () => {
  assert.equal(renderExports.causalGraphHtml(null), '');
  assert.equal(renderExports.causalGraphHtml({ nodes: [] }), '');
  const html = renderExports.causalGraphHtml({
    snapshot: { partial: true },
    nodes: [
      { id: 'fed_response', label: 'Fed <b>Response</b>', domain: 'policy', state: 0.3, trend: 'rising' },
      { id: 'stablecoin_supply', label: 'Stablecoin Supply Growth', domain: 'weird', state: 0.9 },
      { id: 'crypto_etf_flows', label: 'ETF Flows', domain: 'crypto', state: 0.1 },
      { id: 'fed_response', label: 'duplicate' },
    ],
    edges: [
      { origin: 'fed_response', destination: 'stablecoin_supply', polarity: 'amplifies', edge_status: 'strengthening', confidence: 0.7 },
      { origin: 'fed_response', destination: 'missing', polarity: 'amplifies' },
      { origin: 'fed_response', destination: 'crypto_etf_flows', polarity: 'dampens', edge_status: 'closed' },
      { origin: 'fed_response', destination: 'crypto_etf_flows', polarity: 'mystery' },
    ],
  });
  assert.equal((html.match(/<rect /g) || []).length, 3, 'duplicate node id dropped');
  assert.equal((html.match(/marker-end=/g) || []).length, 2, 'dangling + closed edges dropped');
  assert.match(html, /Fed &lt;b&gt;Response&lt;\/b&gt;/);
  assert.doesNotMatch(html, /<b>Response/);
  assert.match(html, /Partial view/);
  assert.match(html, /confidence 70%/);
  // Activation nodes are colored inverted: 0.9 growth is green, 0.1 flows are red.
  assert.match(html, /stroke="#34c77b"[^>]*\/>[^]*?90%/);
  assert.match(html, /stroke="#e0574f"[^>]*\/>[^]*?10%/);
});

test('causal graph layering tolerates cycles', () => {
  const nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const layers = renderExports.graphLayers(nodes, [
    { origin: 'a', destination: 'b' }, { origin: 'b', destination: 'c' }, { origin: 'c', destination: 'b' },
  ]);
  assert.equal(layers.get('a'), 0);
  assert.ok(layers.get('b') >= 1 && layers.get('c') >= 1);
  assert.ok(renderExports.causalGraphHtml({ nodes, edges: [{ origin: 'b', destination: 'c' }, { origin: 'c', destination: 'b' }] }).includes('<svg'));
});

const OUTLOOK = {
  as_of: '2026-11-06', is_current: false, disclaimer: 'Scenario analysis, not financial advice or a prediction.',
  scenarios: [
    { kind: 'falling', role: 'macro-market-analyst', if: 'Nov 10 core CPI at or below 0.2%', then: 'treasury_stress eases', backed_by: 'treasury_stress 0.61', depends_on: 'oil steady', wrong_if: 'the 10-year tops 5.0%', odds: 'medium', odds_reason: 'trend intact' },
    { kind: 'status_quo', if: 'no Fed facility by Dec 10', then: 'stress stays flat', odds: 'high' },
  ],
};

test('the page shows the outlook when the event carries one and hides it again when it does not', () => {
  const { context, elements } = pageHarness();
  elements['outlook-body'].hidden = true;
  context.renderEventIntoPage({ final_score: 64, outlook: OUTLOOK });
  assert.equal(elements['outlook-body'].hidden, false);
  assert.ok(elements['outlook-panel'].innerHTML.includes('Keeps falling'));
  assert.ok(elements['outlook-panel'].innerHTML.includes('Latest outlook, Nov 6'));
  context.renderEventIntoPage({ final_score: 64 });
  assert.equal(elements['outlook-body'].hidden, true);
  assert.equal(elements['outlook-panel'].innerHTML, '');
});

test('a missing outlook node can never break rendering the score', () => {
  const { context, elements } = pageHarness();
  delete elements['outlook-panel'];
  delete elements['outlook-body'];
  assert.doesNotThrow(() => context.renderEventIntoPage({ final_score: 64, outlook: OUTLOOK }));
  assert.ok(elements['score-panel'].innerHTML.length > 0);
});

test('the outlook section sits after the briefing and before the mailing list, hidden by default', () => {
  const briefing = html.indexOf('<section id="newsletter-body" hidden>');
  const outlook = html.indexOf('<section id="outlook-body" hidden>');
  const mailing = html.indexOf('<section id="mailing-list">');
  assert.ok(briefing > 0 && briefing < outlook && outlook < mailing);
  assert.ok(html.includes('<div class="outlook-panel" id="outlook-panel"></div>'));
});
