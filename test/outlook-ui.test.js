'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { outlookHtml, OUTLOOK_DISCLAIMER } = require('../public/render.js');

const full = () => ({
  as_of: '2026-11-07', is_current: true, how_made: 'Several AI models, run through E3D Pilot, debate the data.',
  disagreement: 'The skeptic and the macro desk split on CPI.', fact_check_note: 'The fact-checker confirmed the payroll figure.',
  scorecard: { text: '2 of 3 past scenarios came true, 1 still open' },
  scenarios: [
    { kind: 'falling', role: 'macro-market-analyst', if: 'Nov 10 core CPI at or below 0.2%', then: 'treasury_stress eases', backed_by: 'treasury_stress 0.61', depends_on: 'oil steady', wrong_if: 'the 10-year tops 5.0%', odds: 'medium', odds_reason: 'trend intact' },
    { kind: 'rebound', role: 'skeptic', if: 'hot CPI and 10-year at 5.0%', then: 'treasury_stress rises', odds: 'low' },
    { kind: 'tail', if: 'Brent above $110 by Nov 20', then: 'energy_stress spikes' },
    { kind: 'status_quo', if: 'no Fed facility by Dec 10', then: 'stress stays flat', odds: 'high', odds_reason: 'tools idle' },
  ],
});

test('renders every part of a complete outlook, with the disclaimer and the E3D Pilot credit', () => {
  const out = outlookHtml(full());
  for (const part of ['Keeps falling', 'Rebounds', 'Tail-risk break', 'Nothing changes', 'Macro Desk', 'Skeptic',
    'Backed by:', 'Depends on:', 'Wrong if:', 'Odds:', 'Where the roles split:', 'Fact-Checker:', 'Track record:',
    '2 of 3 past scenarios came true', 'AI roles, not people', 'Powered by E3D Pilot', 'not financial advice', '/lw-header.jpg']) {
    assert.ok(out.includes(part), `missing: ${part}`);
  }
  assert.ok(!out.includes('Latest outlook,'), 'the date line only shows when the outlook is not the current event\'s');
});

test('says when the outlook is from an earlier day', () => {
  const o = { ...full(), is_current: false, as_of: '2026-11-06' };
  assert.ok(outlookHtml(o).includes('Latest outlook, Nov 6'));
  assert.ok(!outlookHtml({ ...o, as_of: 'garbage' }).includes('Latest outlook'));
});

test('every field is optional: a scenario needs only if and then, and nothing usable renders nothing', () => {
  const minimal = outlookHtml({ scenarios: [{ kind: 'tail', if: 'Brent above $110', then: 'energy_stress spikes' }] });
  assert.ok(minimal.includes('Tail-risk break') && minimal.includes('Brent above $110'));
  assert.ok(minimal.includes(OUTLOOK_DISCLAIMER), 'the disclaimer falls back to the built-in one');
  assert.ok(!minimal.includes('Odds:') && !minimal.includes('Backed by:'));
  for (const bad of [null, undefined, 'x', 5, {}, { scenarios: 'x' }, { scenarios: [] }, { scenarios: [null, 5, { kind: 'tail' }, { kind: 'nope', if: 'a', then: 'b' }] }]) {
    assert.equal(outlookHtml(bad), '', JSON.stringify(bad));
  }
});

test('unknown roles and odds are ignored, never echoed as markup', () => {
  const out = outlookHtml({ scenarios: [{ kind: 'falling', role: '<img src=x onerror=alert(1)>', if: 'a', then: 'b', odds: '<script>x</script>' }] });
  assert.ok(!out.includes('<img src=x') && !out.includes('<script>'));
  assert.ok(!out.includes('class="outlook-role"') && !out.includes('Odds:'));
});

test('all text is escaped', () => {
  const hostile = '<script>alert(1)</script> & "quotes"';
  const o = full();
  o.scenarios[0].if = hostile; o.scenarios[0].then = hostile; o.disagreement = hostile; o.fact_check_note = hostile;
  o.scorecard = { text: hostile }; o.disclaimer = hostile; o.how_made = hostile;
  const out = outlookHtml(o);
  assert.ok(!out.includes('<script>'));
  assert.ok(out.includes('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;'));
});

// --- server-side rendering, end to end: a fake API, the real server, a real request ---
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, () => { const { port } = s.address(); s.close(() => resolve(port)); }); });

async function withServer(event, fn) {
  const api = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url.startsWith('/api/financial-stress-monitor/history')) return res.end('[]');
    return res.end(JSON.stringify({ event }));
  });
  await new Promise((r) => api.listen(0, r));
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: { ...process.env, PORT: String(port), API_BASE: `http://127.0.0.1:${api.address().port}` }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('server did not start')), 8000);
      child.stdout.on('data', (d) => { if (String(d).includes('running on port')) { clearTimeout(timer); resolve(); } });
      child.on('exit', () => reject(new Error('server exited early')));
    });
    const body = await (await fetch(`http://127.0.0.1:${port}/`)).text();
    await fn(body);
  } finally {
    child.kill();
    api.close();
  }
}

test('SSR: a page for an event with an outlook carries the visible section; hostile text is escaped', async () => {
  const o = full(); o.scenarios[0].then = '<img src=x onerror=alert(1)>';
  await withServer({ final_score: 64, review_status: 'not_applicable', outlook: o }, (body) => {
    assert.ok(body.includes('<section id="outlook-body">'), 'hidden attribute removed');
    assert.ok(!body.includes('<section id="outlook-body" hidden>'));
    assert.ok(body.includes('Keeps falling') && body.includes('Powered by E3D Pilot'));
    assert.ok(!body.includes('<img src=x onerror=alert(1)>'));
  });
});

test('SSR: an event without an outlook leaves the section hidden and empty', async () => {
  await withServer({ final_score: 64, review_status: 'not_applicable' }, (body) => {
    assert.ok(body.includes('<section id="outlook-body" hidden>'));
    assert.ok(body.includes('<div class="outlook-panel" id="outlook-panel"></div>'));
  });
});
