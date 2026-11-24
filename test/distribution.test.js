'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const render = require('../public/render.js');
const { buildPosts, X_LIMIT, X_URL_COST, SITE } = require('../scripts/daily-post.js');

const pub = (f) => fs.readFileSync(path.join(__dirname, '..', 'public', f), 'utf8');
const xLength = (x) => x.length - SITE.length + X_URL_COST;

const EVENT = {
  final_score: 71,
  final_score_before: 70,
  timestamp: '2026-11-23T09:18:30.293Z',
  dashboard_summary: 'Treasury term premia stay elevated while funding markets are calm.',
  drivers: ['10-year yield holding near multi-year highs', 'Fed balance sheet runoff continues', 'Dollar liquidity tight'],
};

test('daily post: X draft fits 280 with the link counted as 23, includes score, band and delta', () => {
  const { x, linkedin, image } = buildPosts(EVENT);
  assert.ok(xLength(x) <= X_LIMIT, `x is ${xLength(x)}`);
  assert.ok(x.includes('71/100, Restrictive Policy (+1 vs last reading)'));
  assert.ok(x.includes('Nov 23'));
  assert.ok(x.endsWith(SITE));
  assert.ok(linkedin.includes('• Fed balance sheet runoff continues'));
  assert.ok(linkedin.includes('not investment advice'));
  assert.equal(image, `${SITE}/score-card.png`);
});

test('daily post: a very long driver is truncated to keep X within the limit', () => {
  const long = { ...EVENT, drivers: ['word '.repeat(200)] };
  const { x } = buildPosts(long);
  assert.ok(xLength(x) <= X_LIMIT, `x is ${xLength(x)}`);
  assert.ok(x.includes('…'));
});

test('daily post: optional fields can be absent; unusable score drafts nothing', () => {
  const bare = buildPosts({ final_score: 8 });
  assert.ok(bare.x.includes('8/100, Accommodative'));
  assert.ok(!bare.x.includes('vs last reading'));
  for (const bad of [null, undefined, {}, { final_score: null }, { final_score: 'x' }]) assert.equal(buildPosts(bad), null);
});

const HISTORY = [
  { created_at: '2026-10-03T13:00:00Z', final_score: 66 },
  { created_at: '2026-10-02T13:00:00Z', final_score: 60 },
  { created_at: '2026-10-01T13:00:00Z', final_score: 55 },
  { created_at: '2026-09-30T13:00:00Z', final_score: null },
  { created_at: 'not a date', final_score: 99 },
];

test('track record: each event gets the reading in force on its date; bad entries and unsafe links drop out', () => {
  const rows = render.trackRecordRows([
    { date: '2026-10-02', title: 'Treasury auction tails', url: 'https://example.com/a' },
    { date: '2026-10-01', title: 'Bad link', url: 'javascript:alert(1)' },
    { date: '2026-09-01', title: 'Before the series starts' },
    { date: '10/02/2026', title: 'Wrong date format' },
    { date: '2026-10-02', title: '   ' },
    null,
  ], HISTORY);
  assert.deepEqual(rows.map((r) => [r.date, r.score, r.url]), [
    ['2026-10-02', 60, 'https://example.com/a'],
    ['2026-10-01', 55, ''],
    ['2026-09-01', null, ''],
  ]);
  assert.deepEqual(render.trackRecordRows(undefined, HISTORY), []);
  assert.deepEqual(render.trackRecordRows([{ date: '2026-10-02', title: 'x' }], null).map((r) => r.score), [null]);
});

test('track record: table markup escapes text and shows band; empty input renders nothing', () => {
  const html = render.trackRecordEventsHtml([{ date: '2026-10-02', title: '<img src=x>', url: '', score: 60 }, { date: '2026-09-01', title: 'Early', url: '', score: null }]);
  assert.ok(html.includes('&lt;img src=x&gt;'));
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('Restrictive Policy'));
  assert.ok(html.includes('no reading yet'));
  assert.equal(render.trackRecordEventsHtml([]), '');
  assert.equal(render.trackRecordEventsHtml(null), '');
});

test('track record: range summary reports count, first date, high and low; empty history gives ""', () => {
  assert.equal(render.historyRangeSummary(HISTORY), '3 readings since Oct 1, 2026. High 66 (Oct 3, 2026), low 55 (Oct 1, 2026).');
  assert.equal(render.historyRangeSummary([]), '');
  assert.equal(render.historyRangeSummary(null), '');
});

test('track-record-events.json is valid JSON with an events array', () => {
  const data = JSON.parse(pub('track-record-events.json'));
  assert.ok(Array.isArray(data.events));
  for (const ev of data.events) assert.ok(typeof ev.title === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(ev.date), JSON.stringify(ev));
});

test('embed widget: loader targets the live embed page; embed page is noindex and null-safe', () => {
  const loader = pub('widget.js');
  assert.ok(loader.includes("'https://liquiditywatch.e3d.ai'"));
  assert.ok(loader.includes('data-liquiditywatch'));
  const embed = pub('embed.html');
  assert.ok(embed.includes('<meta name="robots" content="noindex">'));
  assert.ok(embed.includes('Score unavailable right now.'));
  assert.ok(embed.includes('target="_blank" rel="noopener"'));
});

for (const f of ['track-record.html', 'widget.html']) {
  test(`${f}: has canonical, OG and twitter tags that agree`, () => {
    const html = pub(f);
    const url = `https://liquiditywatch.e3d.ai/${f}`;
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`));
    const title = html.match(/<title>([^<]*)<\/title>/)[1];
    assert.ok(html.includes(`<meta property="og:title" content="${title}">`));
    assert.ok(html.includes(`<meta property="og:url" content="${url}">`));
    assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image">'));
    assert.match(html, /<meta name="description" content="[^"]{20,}">/);
  });
}
