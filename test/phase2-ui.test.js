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
    'classification-body', 'newsletter-panel', 'newsletter-body',
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
  const inlineScript = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
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
  assert.match(html, /body: JSON\.stringify\(\{ email, list: config\.list \}\)/);
  assert.match(html, /body: JSON\.stringify\(\{ username: pendingEmail, code \}\)/);
  assert.match(html, /statusId: 'signup-status'/);
  assert.match(html, /statusId: 'exposure-signup-status'/);
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

test('calculator signup remains available for an invalid mix and verifies its own pending email', async () => {
  const { context, elements, requests } = pageHarness();
  elements['exposure-cash-equities'].value = '60';
  elements['exposure-cash-equities'].listeners.change();
  elements['exposure-signup-email'].value = 'calculator@example.com';

  context.fetch = async (url, options) => {
    requests.push([url, options]);
    return { ok: true, json: async () => ({ success: true, needsVerification: true }) };
  };
  await elements['exposure-signup-form'].listeners.submit({ preventDefault() {} });
  const signup = JSON.parse(requests.at(-1)[1].body);
  assert.deepEqual(signup, {
    email: 'calculator@example.com',
    list: renderExports.EXPOSURE_ALERT_LIST,
  });
  assert.equal(elements['exposure-verify-form'].hidden, false);

  elements['exposure-verify-code'].value = '123456';
  await elements['exposure-verify-form'].listeners.submit({ preventDefault() {} });
  assert.deepEqual(JSON.parse(requests.at(-1)[1].body), {
    username: 'calculator@example.com', code: '123456',
  });
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
