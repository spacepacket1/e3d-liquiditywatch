'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const {
  DEFAULT_EXPOSURE_MIX,
  EXPOSURE_MIX_STORAGE_KEY,
  EXPOSURE_ALERT_LIST,
  GAUGE_BANDS,
  gaugeBand,
  normalizeExposureMix,
  serializeExposureMix,
  parseStoredExposureMix,
  computePersonalExposure,
} = require('../public/render.js');

const allCash = { cashEquities: 100, btc: 0, eth: 0, xrp: 0, leveraged: false };
const allBtc = { cashEquities: 0, btc: 100, eth: 0, xrp: 0, leveraged: false };

test('classic-script loading exposes the calculator through globalThis', () => {
  const source = fs.readFileSync(require.resolve('../public/render.js'), 'utf8');
  const context = {};
  vm.runInNewContext(source, context);
  assert.equal(typeof context.RENDER_EXPORTS.computePersonalExposure, 'function');
  assert.equal(
    context.RENDER_EXPORTS.EXPOSURE_MIX_STORAGE_KEY,
    'liquiditywatch.personalExposureMix.v1',
  );
});

test('exports the calculator constants and normalizes a new five-field mix', () => {
  assert.deepEqual(DEFAULT_EXPOSURE_MIX, {
    cashEquities: 70, btc: 10, eth: 10, xrp: 10, leveraged: false,
  });
  assert.equal(EXPOSURE_MIX_STORAGE_KEY, 'liquiditywatch.personalExposureMix.v1');
  assert.equal(EXPOSURE_ALERT_LIST, 'liquiditywatch-exposure-calculator');

  const input = { ...DEFAULT_EXPOSURE_MIX, leveraged: 'yes', ignored: 123 };
  const normalized = normalizeExposureMix(input);
  assert.deepEqual(normalized, { ok: true, mix: DEFAULT_EXPOSURE_MIX });
  assert.notStrictEqual(normalized.mix, input);
  assert.equal(input.ignored, 123);
});

test('rejects invalid allocation shapes, values, and totals without coercion', () => {
  const invalid = [
    null,
    [],
    { ...allCash, cashEquities: '100' },
    { ...allCash, cashEquities: NaN },
    { ...allCash, cashEquities: Infinity },
    { ...allCash, cashEquities: -1, btc: 101 },
    { ...allCash, cashEquities: 99 },
  ];
  for (const mix of invalid) {
    assert.deepEqual(normalizeExposureMix(mix), { ok: false, reason: 'invalid-mix' });
  }
});

test('all-cash exposure clamps the macro score and rounds only the displayed result', () => {
  assert.equal(computePersonalExposure({ final_score: 42.4 }, allCash).current.score, 42);
  assert.equal(computePersonalExposure({ final_score: 120 }, allCash).current.score, 100);
  assert.equal(computePersonalExposure({ final_score: -12 }, allCash).current.score, 0);

  const half = computePersonalExposure({ final_score: 20.5 }, allCash);
  assert.equal(half.components.macroScore, 20.5);
  assert.equal(half.components.preClampScore, 20.5);
  assert.equal(half.current.score, 21);
});

test('crypto-weighted exposure follows the documented formula', () => {
  const event = {
    final_score: 40,
    schema_version: 1,
    asset_triggers: [
      { asset: 'BTC', utility_score: 0.2 },
      { asset: 'ETH', utility_score: 0.4 },
      { asset: 'XRP', utility_score: 0.6 },
    ],
  };
  const mix = { cashEquities: 25, btc: 25, eth: 25, xrp: 25, leveraged: false };
  const result = computePersonalExposure(event, mix);
  const expectedStresses = { cashEquities: 40, btc: 52, eth: 46, xrp: 40 };
  const expectedBase = (25 * 40 + 25 * 52 + 25 * 46 + 25 * 40) / 100;

  assert.deepEqual(result.components.stresses, expectedStresses);
  assert.equal(result.components.baseExposure, expectedBase);
  assert.equal(result.current.score, Math.round(expectedBase));
});

test('leverage is applied before clamp and final rounding', () => {
  const result = computePersonalExposure(
    { final_score: 95 },
    { ...allCash, leveraged: true },
  );
  assert.equal(result.components.baseExposure, 95);
  assert.equal(result.components.leverageFactor, 1.15);
  assert.equal(result.components.preClampScore, 95 * 1.15);
  assert.ok(result.components.preClampScore > 100);
  assert.equal(result.current.score, 100);
});

test('uses existing legacy and v1 utility scaling with schema_version', () => {
  const legacy = computePersonalExposure({
    final_score: 40,
    asset_triggers: [{ asset: 'BTC', utility_score: 20 }],
  }, allBtc);
  const v1 = computePersonalExposure({
    final_score: 40,
    schema_version: 1,
    asset_triggers: [{ asset: 'BTC', utility_score: 0.2 }],
  }, allBtc);
  assert.deepEqual(legacy.components.utilities.btc, { score: 20, fallback: false });
  assert.deepEqual(v1.components.utilities.btc, { score: 20, fallback: false });
  assert.equal(legacy.current.score, 52);
  assert.equal(v1.current.score, 52);
});

test('asset lookup is case-insensitive and the first matching entry wins', () => {
  const result = computePersonalExposure({
    final_score: 50,
    schema_version: 1,
    asset_triggers: [
      { asset: 'btc', utility_score: 0.1 },
      { asset: 'BTC', utility_score: 0.9 },
    ],
  }, allBtc);
  assert.deepEqual(result.components.utilities.btc, { score: 10, fallback: false });
  assert.equal(result.current.score, 62);
});

test('missing and malformed utilities use the neutral fallback without coercion', () => {
  const malformedValues = [undefined, null, '0.2', NaN, Infinity, Number.MAX_VALUE];
  for (const utility_score of malformedValues) {
    const result = computePersonalExposure({
      final_score: 40,
      schema_version: 1,
      asset_triggers: [{ asset: 'BTC', utility_score }],
    }, allBtc);
    assert.deepEqual(result.components.utilities.btc, { score: 60, fallback: true });
    assert.equal(result.components.stresses.btc, 40);
    assert.equal(result.current.score, 40);
  }
});

test('malformed asset_triggers never throw and fall back neutrally', () => {
  const triggerLists = [undefined, {}, [null], [7], [[], null, 'BTC']];
  for (const asset_triggers of triggerLists) {
    let result;
    assert.doesNotThrow(() => {
      result = computePersonalExposure({ final_score: 30, asset_triggers }, allBtc);
    });
    assert.deepEqual(result.components.utilities.btc, { score: 70, fallback: true });
    assert.equal(result.components.stresses.btc, 30);
  }
});

test('personal scores use all six existing bands and retain first-match boundaries', () => {
  const entries = [0, 16, 36, 56, 76, 91];
  assert.deepEqual(
    entries.map((score) => computePersonalExposure({ final_score: score }, allCash).current.band.label),
    GAUGE_BANDS.map((band) => band.label),
  );
  assert.equal(GAUGE_BANDS.at(-1).label, 'Market Dysfunction');

  for (let index = 0; index < GAUGE_BANDS.length - 1; index += 1) {
    const sharedEdge = GAUGE_BANDS[index].max;
    assert.strictEqual(gaugeBand(sharedEdge), GAUGE_BANDS[index]);
  }
});

test('next-regime inputs are derived from the band objects and overlapping boundaries', () => {
  const derivedEntries = GAUGE_BANDS.slice(0, -1).map((band, index) => {
    const nextBand = GAUGE_BANDS[index + 1];
    if (gaugeBand(nextBand.min) === nextBand) return nextBand.min;
    if (gaugeBand(band.max + 1) === nextBand) return band.max + 1;
    return null;
  });
  assert.deepEqual(derivedEntries, [16, 36, 56, 76, 91]);

  const currentBandEntries = [0, ...derivedEntries.slice(0, -1)];
  for (let index = 0; index < derivedEntries.length; index += 1) {
    const macro = currentBandEntries[index];
    const result = computePersonalExposure({ final_score: macro }, allCash);
    assert.equal(result.scenario.macroScore, derivedEntries[index]);
    assert.equal(result.scenario.score, derivedEntries[index]);
    assert.strictEqual(result.scenario.band, gaugeBand(derivedEntries[index]));
    assert.equal(result.scenario.delta, result.scenario.score - result.current.score);
  }
  assert.equal(computePersonalExposure({ final_score: 91 }, allCash).scenario, null);
});

test('scenario reuses current fallback utilities instead of recomputing them', () => {
  const result = computePersonalExposure({ final_score: 10 }, allBtc);
  assert.deepEqual(result.components.utilities.btc, { score: 90, fallback: true });
  assert.equal(result.current.score, 10);
  assert.deepEqual(result.scenario, {
    macroScore: 16,
    score: 14,
    band: GAUGE_BANDS[0],
    delta: 4,
  });
});

test('missing scores fail safely while invalid mix takes precedence', () => {
  for (const event of [null, {}, { final_score: '40' }, { final_score: NaN }, { final_score: Infinity }]) {
    assert.deepEqual(computePersonalExposure(event, allCash), {
      ok: false, reason: 'missing-score', current: null, scenario: null, components: null,
    });
  }
  for (const event of [null, {}, { final_score: NaN }]) {
    assert.deepEqual(computePersonalExposure(event, { ...allCash, cashEquities: 99 }), {
      ok: false, reason: 'invalid-mix', current: null, scenario: null, components: null,
    });
  }
});

test('calculation does not mutate the event or mix', () => {
  const event = {
    final_score: 40,
    schema_version: 1,
    asset_triggers: [{ asset: 'btc', utility_score: 0.2 }],
  };
  const mix = { ...DEFAULT_EXPOSURE_MIX };
  const eventBefore = structuredClone(event);
  const mixBefore = structuredClone(mix);
  computePersonalExposure(event, mix);
  assert.deepEqual(event, eventBefore);
  assert.deepEqual(mix, mixBefore);
});

test('stored mixes round-trip and invalid storage is rejected without throwing', () => {
  const serialized = serializeExposureMix({ ...DEFAULT_EXPOSURE_MIX, extra: true });
  assert.equal(serialized, JSON.stringify({ v: 1, ...DEFAULT_EXPOSURE_MIX }));
  assert.deepEqual(parseStoredExposureMix(serialized), DEFAULT_EXPOSURE_MIX);
  assert.deepEqual(parseStoredExposureMix({
    v: 1, ...DEFAULT_EXPOSURE_MIX, leveraged: 'true', extra: 'ignored',
  }), DEFAULT_EXPOSURE_MIX);

  assert.equal(serializeExposureMix({ ...DEFAULT_EXPOSURE_MIX, btc: 11 }), null);
  const rejected = [
    '{broken',
    'null',
    '[]',
    { ...DEFAULT_EXPOSURE_MIX },
    { v: 2, ...DEFAULT_EXPOSURE_MIX },
    { v: 1, ...DEFAULT_EXPOSURE_MIX, eth: '10' },
  ];
  for (const raw of rejected) {
    assert.doesNotThrow(() => parseStoredExposureMix(raw));
    assert.equal(parseStoredExposureMix(raw), null);
  }
});
