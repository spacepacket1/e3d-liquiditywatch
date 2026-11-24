#!/usr/bin/env node
'use strict';

// Drafts the daily social post (X + LinkedIn) from the published reading.
// It only formats fields the API already publishes (score, band, delta, summary,
// drivers); it computes and generates nothing, and it never posts anywhere.
// A human reviews the text, attaches the card image and posts it.
//
//   node scripts/daily-post.js            # fetch the live reading and print drafts
//   API_BASE=http://localhost:4999 node scripts/daily-post.js

const { gaugeBand, formatHistoryDateLabel } = require('../public/render.js');

const SITE = 'https://liquiditywatch.e3d.ai';
const X_LIMIT = 280;
const X_URL_COST = 23; // X counts every link as 23 characters

function usableScore(event) {
  const s = event && event.final_score;
  return typeof s === 'number' && Number.isFinite(s) ? Math.round(Math.min(100, Math.max(0, s))) : null;
}

function headline(event) {
  const score = usableScore(event);
  if (score == null) return '';
  const parts = [];
  const d = new Date(event.timestamp || event.created_at);
  const date = Number.isNaN(d.getTime()) ? '' : formatHistoryDateLabel(d.toISOString());
  let line = `LiquidityWatch${date ? ` ${date}` : ''}: ${score}/100, ${gaugeBand(score).label}`;
  const before = event.final_score_before;
  if (typeof before === 'number' && Number.isFinite(before)) {
    const diff = score - Math.round(before);
    line += diff === 0 ? ' (unchanged)' : ` (${diff > 0 ? '+' : ''}${diff} vs last reading)`;
  }
  parts.push(line);
  return parts.join('');
}

function truncate(text, max) {
  const t = String(text).replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, Math.max(0, max - 1));
  return `${cut.replace(/\s+\S*$/, '') || cut}…`;
}

function drivers(event) {
  return (Array.isArray(event && event.drivers) ? event.drivers : []).filter((d) => typeof d === 'string' && d.trim());
}

// Returns { x, linkedin, image } or null when there is no usable score.
function buildPosts(event) {
  const head = headline(event);
  if (!head) return null;
  const lead = drivers(event)[0] || (typeof event.dashboard_summary === 'string' ? event.dashboard_summary : '');

  // X: headline + one driver + link, within 280 with the link counted as 23.
  const fixed = head.length + 2 + 2 + X_URL_COST; // two blank-line separators
  const room = X_LIMIT - fixed;
  const hook = lead && room > 20 ? truncate(lead, room) : '';
  const x = `${head}${hook ? `\n\n${hook}` : ''}\n\n${SITE}`;

  const bullets = drivers(event).slice(0, 3).map((d) => `• ${truncate(d, 220)}`).join('\n');
  const summary = typeof event.dashboard_summary === 'string' ? truncate(event.dashboard_summary, 500) : '';
  const linkedin = [head, summary, bullets ? `What is driving it:\n${bullets}` : '', `Full briefing: ${SITE}`, 'Informational only, not investment advice.']
    .filter(Boolean).join('\n\n');

  return { x, linkedin, image: `${SITE}/score-card.png` };
}

async function main() {
  const base = process.env.API_BASE || 'https://e3d.ai';
  const res = await fetch(`${base}/api/financial-stress-monitor`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`upstream responded ${res.status}`);
  const data = await res.json();
  const posts = buildPosts(data && data.event);
  if (!posts) throw new Error('no usable final_score in the current event; nothing to draft');
  console.log(`--- X (${posts.x.length - SITE.length + X_URL_COST}/${X_LIMIT}) ---\n${posts.x}\n`);
  console.log(`--- LinkedIn ---\n${posts.linkedin}\n`);
  console.log(`--- Image to attach ---\n${posts.image}`);
}

if (require.main === module) {
  main().catch((err) => { console.error(`daily-post: ${err.message}`); process.exit(1); });
}

module.exports = { buildPosts, headline, truncate, X_LIMIT, X_URL_COST, SITE };
