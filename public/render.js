'use strict';

// Pure rendering helpers shared between the server (server.js, for
// server-side rendering the initial page so non-JS-executing fetchers see
// real content, not "Loading...") and the browser (public/index.html, for
// live client-side refresh). No DOM/window/document APIs here - every
// function takes plain data and returns an HTML string, so it runs
// identically in Node and in a `<script>` tag. No build step, no bundler:
// this file is `require()`d directly by server.js and loaded directly via
// `<script src="/render.js">` in index.html.

function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Matches the bands described on /about.html (0-15 accommodative through
// 91-100 dysfunction/intervention) - kept as one source of truth here since
// the gauge needs concrete colors, not just band boundaries.
const GAUGE_BANDS = [
  { min: 0,  max: 15,  color: '#2ecc71', label: 'Accommodative' },
  { min: 15, max: 35,  color: '#a3d977', label: 'Mild Watchfulness' },
  { min: 35, max: 55,  color: '#e8b84b', label: 'Contained Tension' },
  { min: 55, max: 75,  color: '#f0954a', label: 'Restrictive Policy' },
  { min: 75, max: 90,  color: '#e8743a', label: 'Policy-Forcing Danger Zone' },
  { min: 90, max: 100, color: '#e0574f', label: 'Market Dysfunction' },
];

function gaugeBand(score) {
  return GAUGE_BANDS.find((b) => score >= b.min && score <= b.max) || GAUGE_BANDS[GAUGE_BANDS.length - 1];
}

function gaugeBandColor(score) {
  return gaugeBand(score).color;
}

function gaugeAngleForValue(v) {
  // 180deg (left, v=0) -> 0deg (right, v=100); standard math angle, y-up.
  return 180 - (v / 100) * 180;
}

function gaugePolarPoint(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function gaugeArcPath(cx, cy, r, v1, v2) {
  const p1 = gaugePolarPoint(cx, cy, r, gaugeAngleForValue(v1));
  const p2 = gaugePolarPoint(cx, cy, r, gaugeAngleForValue(v2));
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
}

function buildGaugeSvg(score) {
  const cx = 160;
  const cy = 155;
  const r = 118;
  const strokeW = 22;
  const clamped = Math.max(0, Math.min(100, typeof score === 'number' ? score : 0));
  const needleLen = r - strokeW / 2 - 6;
  const needleTip = gaugePolarPoint(cx, cy, needleLen, gaugeAngleForValue(clamped));
  const pivotR = 9;

  const bands = GAUGE_BANDS.map((b) => `<path d="${gaugeArcPath(cx, cy, r, b.min, b.max)}" stroke="${b.color}" stroke-width="${strokeW}" fill="none"/>`).join('');
  const ticks = [0, 25, 50, 75, 100].map((v) => {
    const p = gaugePolarPoint(cx, cy, r + strokeW / 2 + 14, gaugeAngleForValue(v));
    return `<text class="gauge-tick" x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${v}</text>`;
  }).join('');

  return `
    <svg class="gauge-svg" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
      ${bands}
      ${ticks}
      <line x1="${cx}" y1="${cy}" x2="${needleTip.x.toFixed(2)}" y2="${needleTip.y.toFixed(2)}" stroke="#e9edf5" stroke-width="4" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="${pivotR}" fill="#e9edf5"/>
      <circle cx="${cx}" cy="${cy}" r="${pivotR - 3}" fill="${gaugeBandColor(clamped)}"/>
    </svg>
  `;
}

function gaugeDeltaHtml(after, before) {
  if (typeof after !== 'number' || typeof before !== 'number') return '';
  const diff = Math.round(after) - Math.round(before);
  if (diff === 0) return `<div class="gauge-delta" style="color:var(--text-dim)">No change vs last reading</div>`;
  const color = diff > 0 ? 'var(--red)' : 'var(--green)';
  const symbol = diff > 0 ? '↑' : '↓';
  return `<div class="gauge-delta" style="color:${color}">${symbol} ${diff > 0 ? '+' : ''}${diff} vs last reading (${Math.round(before)})</div>`;
}

const PHASE_LABELS = {
  1: 'Tightening / policy-threat phase',
  2: 'Liquidity response beginning',
  3: 'Full backstop underway',
};

function phaseBadgeHtml(phase) {
  if (!phase || typeof phase.value !== 'number') return '';
  const desc = PHASE_LABELS[phase.value] || '';
  return `<div class="phase-badge" title="${escapeHtml(desc)}">Phase ${phase.value} of 3</div>`;
}

// v1 (schema_version present) ships trigger-metric/asset-score values as
// 0.0-1.0; a pre-v1 event (no schema_version) still has them as 0-100 -
// see docs/API-CONTRACT.md's migration note. Every reader of a raw value
// from `event.pipeline`-derived data must go through this so the two
// scales are never displayed as if they were the same number.
function scaledUnitPercent(rawValue, schemaVersion) {
  if (typeof rawValue !== 'number') return null;
  const unit = schemaVersion ? rawValue : rawValue / 100;
  return Math.round(unit * 100);
}

// velocity/acceleration are already in the same unit as the value they
// describe (see docs/API-CONTRACT.md); render them as a short trend note
// rather than raw numbers, which are meaningless without the scale.
function trendNoteHtml(velocity, acceleration) {
  if (typeof velocity !== 'number' || velocity === 0) return '';
  const dir = velocity > 0 ? 'rising' : 'falling';
  const sameSign = typeof acceleration === 'number' && acceleration !== 0
    && Math.sign(acceleration) === Math.sign(velocity);
  const oppositeSign = typeof acceleration === 'number' && acceleration !== 0 && !sameSign;
  const pace = sameSign ? ', accelerating' : oppositeSign ? ', slowing' : '';
  return ` <span class="trend-note">(${dir}${pace})</span>`;
}

function metricDeltaHtml(metric, schemaVersion) {
  if (!metric || typeof metric.value !== 'number') return '';
  const pct = scaledUnitPercent(metric.value, schemaVersion);
  const hasPrevious = typeof metric.previous_value === 'number';
  const prevPct = hasPrevious ? scaledUnitPercent(metric.previous_value, schemaVersion) : null;
  const delta = hasPrevious ? pct - prevPct : 0;
  const arrow = !hasPrevious ? '' : delta > 0 ? ' ↑' : delta < 0 ? ' ↓' : '';
  const from = hasPrevious ? `, was ${prevPct}%` : '';
  return `<div class="trigger-chip"><div class="trigger-chip-label">${escapeHtml(metric.label)}</div><div class="trigger-chip-value">${pct}%${arrow}${trendNoteHtml(metric.velocity, metric.acceleration)}</div><div class="trigger-chip-note">${metric.change_reason ? escapeHtml(metric.change_reason) : ''}${from}</div></div>`;
}

function triggerMetricsHtml(event) {
  const chips = [
    event.controlled_break_risk ? metricDeltaHtml({ ...event.controlled_break_risk, label: 'Controlled Break Risk' }, event.schema_version) : '',
    event.liquidity_response_probability ? metricDeltaHtml({ ...event.liquidity_response_probability, label: 'Liquidity Response Probability' }, event.schema_version) : '',
  ].filter(Boolean);
  return chips.length ? `<div class="trigger-metrics">${chips.join('')}</div>` : '';
}

const POLICY_CLASSIFIER_LABELS = {
  normal: 'Normal',
  stress_building: 'Stress Building',
  controlled_stabilization: 'Controlled Stabilization',
  systemic_backstop: 'Systemic Backstop',
  monetary_regime_change: 'Monetary Regime Change',
};

function policyClassifierBadgeHtml(classifier) {
  if (!classifier) return '';
  const label = POLICY_CLASSIFIER_LABELS[classifier] || String(classifier).replace(/[_-]/g, ' ');
  return `<div class="classifier-badge">${escapeHtml(label)}</div>`;
}

const BRIDGE_ROLE_LABELS = {
  adjacent_asset: 'Adjacent asset',
  optional_bridge: 'Optional bridge',
  growing_liquidity_layer: 'Growing liquidity layer',
  core_routing_asset: 'Core routing asset',
};

const FLOW_COMPOSITION_LABELS = {
  stablecoin_to_stablecoin: 'Stablecoin → stablecoin (bypasses XRP)',
  stablecoin_via_xrp: 'Stablecoin → XRP → stablecoin',
  mixed: 'Mixed flow composition',
};

// score_kind/bridge_role are v1 fields; fall back to the pre-v1 asset-name
// heuristic when they're absent so an older event still renders sensibly.
function assetScoreLabel(asset, scoreKind) {
  if (scoreKind === 'utility') return 'Utility';
  if (scoreKind === 'market_confirmation') return 'Market Confirmation';
  return String(asset || '').toUpperCase() === 'XRP' ? 'Utility' : 'Market Confirmation';
}

function assetTriggersHtml(assetTriggers, schemaVersion) {
  const list = Array.isArray(assetTriggers) ? assetTriggers : [];
  if (!list.length) return '';
  return `<div class="asset-triggers">${list.map((a) => {
    const pct = scaledUnitPercent(Number(a.utility_score), schemaVersion) ?? 0;
    const bridgeRole = a.bridge_role && BRIDGE_ROLE_LABELS[a.bridge_role]
      ? `<div class="asset-chip-bridge">${escapeHtml(BRIDGE_ROLE_LABELS[a.bridge_role])}</div>` : '';
    const flowComposition = a.flow_composition && FLOW_COMPOSITION_LABELS[a.flow_composition]
      ? `<div class="asset-chip-flow">${escapeHtml(FLOW_COMPOSITION_LABELS[a.flow_composition])}</div>` : '';
    return `
    <div class="asset-chip">
      <div class="asset-chip-top"><span class="asset-chip-name">${escapeHtml(a.asset || '')}</span><span class="asset-chip-role">${escapeHtml(a.role || '')}</span></div>
      <div class="asset-chip-note">${escapeHtml(a.note || '')}</div>
      <div class="asset-chip-utility">${escapeHtml(assetScoreLabel(a.asset, a.score_kind))} ${pct}%</div>
      ${bridgeRole}
      ${flowComposition}
    </div>
  `;
  }).join('')}</div>`;
}

const FALSIFIABLE_RESPONSE_LABELS = {
  srf_expansion: 'an SRF expansion',
  discount_window_spike: 'a discount-window usage spike',
  swap_line_activation: 'a swap-line activation',
  qe_restart: 'a restart of QE',
  emergency_facility: 'a new emergency facility',
  coordinated_messaging: 'coordinated policymaker messaging',
  none_expected: 'no policy response',
};

function falsifiableClaimHtml(claim) {
  if (!claim || typeof claim !== 'object') return '';
  const responseLabel = FALSIFIABLE_RESPONSE_LABELS[claim.response_type]
    || String(claim.response_type || '').replace(/_/g, ' ');
  const authority = claim.responsible_authority
    ? escapeHtml(claim.responsible_authority).replace(/^\w/, (c) => c.toUpperCase())
    : '';
  const window = typeof claim.observation_window_days === 'number'
    ? `${claim.observation_window_days}-day` : '';
  return `<div class="falsifiable-claim">
    <div class="falsifiable-claim-label">This call is falsifiable</div>
    <div>Expecting ${escapeHtml(responseLabel)}${authority ? ` from ${authority}` : ''}${window ? ` within a ${window} window` : ''}.</div>
    ${claim.qualifying_action ? `<div class="falsifiable-claim-action">${escapeHtml(claim.qualifying_action)}</div>` : ''}
  </div>`;
}

const SUBSCORE_LABELS = {
  treasury_stress: 'Treasury Market Stress',
  funding_stress: 'Funding Market Stress',
  fed_response: 'Fed / Treasury Response',
  ai_economic_impulse: 'AI Economic Impulse',
  energy_stress: 'Energy System Stress',
  global_liquidity: 'Global Liquidity',
};

function subscoresHtml(subscores) {
  if (!subscores || typeof subscores !== 'object') return '';
  const keys = Object.keys(SUBSCORE_LABELS).filter((k) => subscores[k] && typeof subscores[k].value === 'number');
  if (!keys.length) return '';
  return `<div class="subscore-grid">${keys.map((k) => {
    const s = subscores[k];
    const pct = Math.round(s.value * 100);
    const classification = k === 'ai_economic_impulse' && s.classification
      ? `<div class="subscore-classification">${escapeHtml(s.classification)}</div>` : '';
    return `<div class="subscore-chip">
      <div class="subscore-label">${escapeHtml(SUBSCORE_LABELS[k])}</div>
      <div class="subscore-value">${pct}%</div>
      ${classification}
      ${s.change_reason ? `<div class="subscore-reason">${escapeHtml(s.change_reason)}</div>` : ''}
    </div>`;
  }).join('')}</div>`;
}

function classificationBlocksHtml(blocks) {
  if (!blocks || typeof blocks !== 'object') return '';
  const facts = Array.isArray(blocks.observed_facts) ? blocks.observed_facts : [];
  const interpretation = Array.isArray(blocks.interpretation) ? blocks.interpretation : [];
  const speculation = Array.isArray(blocks.speculation) ? blocks.speculation : [];
  if (!facts.length && !interpretation.length && !speculation.length) return '';

  function itemsHtml(items, withConfidence) {
    return items.map((item) => `<li>${escapeHtml(item && item.text || '')}${
      withConfidence && typeof item.confidence === 'number'
        ? ` <span class="confidence-tag">${Math.round(item.confidence * 100)}% confidence</span>` : ''
    }</li>`).join('');
  }

  return [
    facts.length ? `<div class="classification-block classification-facts"><div class="classification-heading">Observed Facts</div><ul>${itemsHtml(facts, false)}</ul></div>` : '',
    interpretation.length ? `<div class="classification-block classification-interpretation"><div class="classification-heading">Interpretation</div><ul>${itemsHtml(interpretation, true)}</ul></div>` : '',
    // Speculation always renders as the lowest-confidence tier regardless
    // of its own confidence number - see docs/MODEL.md SS7.
    speculation.length ? `<div class="classification-block classification-speculation"><div class="classification-heading">Speculation</div><ul>${itemsHtml(speculation, true)}</ul></div>` : '',
  ].join('');
}

const EMPTY_STATE_HTML = '<div class="empty-state">No stress evaluation has been published yet. The monitoring pipeline runs on a schedule &mdash; check back soon.</div>';
const ERROR_STATE_HTML = '<div class="empty-state">Unable to load the current score right now.</div>';

// The full score-panel body for one event - shared so the server (initial
// page load, no JS required to see it) and the browser (live refresh) never
// drift apart. Mirrors the resilience contract: every sub-piece null-checks
// and the panel renders from whatever subset of `event` is present.
function buildScorePanelHtml(event) {
  if (!event) return EMPTY_STATE_HTML;
  const score = typeof event.final_score === 'number' ? Math.round(event.final_score) : null;
  const scoreColor = score == null ? 'var(--text-dim)' : gaugeBandColor(score);
  const bandLabel = score == null ? '' : gaugeBand(score).label;
  const drivers = Array.isArray(event.drivers) ? event.drivers.slice(0, 5) : [];
  const nextTrigger = Array.isArray(event.next_triggers) && event.next_triggers.length ? event.next_triggers[0] : '';
  const hasTriggerMetrics = event.controlled_break_risk || event.liquidity_response_probability;
  return `
      <div class="gauge-section">
        <div class="gauge-wrap">${buildGaugeSvg(score)}</div>
        <div class="gauge-score-wrap">
          <span class="gauge-score-number" style="color:${scoreColor}">${score == null ? '—' : score}</span><span class="gauge-score-suffix">/100</span>${trendNoteHtml(event.final_score_velocity, event.final_score_acceleration)}
          ${bandLabel ? `<div class="gauge-band-label" style="color:${scoreColor}">${escapeHtml(bandLabel)}</div>` : ''}
          ${gaugeDeltaHtml(event.final_score, event.final_score_before)}
        </div>
        <div class="regime-badge">${event.final_regime ? escapeHtml(String(event.final_regime).replace(/[_-]/g, ' ')) : 'Unknown regime'}</div>
        ${phaseBadgeHtml(event.phase)}
        ${policyClassifierBadgeHtml(event.policy_classifier)}
      </div>
      <div class="score-meta">
        <div>${event.dashboard_summary ? escapeHtml(event.dashboard_summary) : ''}</div>
        ${drivers.length ? `<ul class="drivers">${drivers.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>` : ''}
        ${hasTriggerMetrics ? '<div class="trigger-metrics-note">The score measures pressure. Controlled Break Risk measures odds of dysfunction. Liquidity Response Probability measures odds of policy intervention &mdash; these can move independently.</div>' : ''}
        ${triggerMetricsHtml(event)}
        ${assetTriggersHtml(event.asset_triggers, event.schema_version)}
        ${falsifiableClaimHtml(event.falsifiable_claim)}
        ${nextTrigger ? `<div class="next-trigger"><strong>What would move the score next:</strong> ${escapeHtml(nextTrigger)}</div>` : ''}
      </div>
  `;
}

const RENDER_EXPORTS = {
  escapeHtml,
  GAUGE_BANDS,
  gaugeBand,
  gaugeBandColor,
  buildGaugeSvg,
  gaugeDeltaHtml,
  PHASE_LABELS,
  phaseBadgeHtml,
  scaledUnitPercent,
  trendNoteHtml,
  metricDeltaHtml,
  triggerMetricsHtml,
  POLICY_CLASSIFIER_LABELS,
  policyClassifierBadgeHtml,
  BRIDGE_ROLE_LABELS,
  FLOW_COMPOSITION_LABELS,
  assetScoreLabel,
  assetTriggersHtml,
  FALSIFIABLE_RESPONSE_LABELS,
  falsifiableClaimHtml,
  SUBSCORE_LABELS,
  subscoresHtml,
  classificationBlocksHtml,
  buildScorePanelHtml,
  EMPTY_STATE_HTML,
  ERROR_STATE_HTML,
};

// UMD-lite: no build step, no bundler. `require('./render.js')` in Node
// (server.js), plain global functions/consts when loaded via
// `<script src="/render.js">` in the browser (index.html) - same file,
// same logic, zero duplication either way.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RENDER_EXPORTS;
}
