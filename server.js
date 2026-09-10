'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const {
  buildScorePanelHtml,
  subscoresHtml,
  classificationBlocksHtml,
} = require('./public/render.js');

const app = express();
const PORT = process.env.PORT || 3008;
const API_BASE = process.env.API_BASE || 'https://e3d.ai';
const CACHE_TTL_MS = 60 * 1000;

// Server-side render the current event into index.html before serving it,
// so a fetcher that doesn't execute JavaScript (crawlers, link previews,
// AI browsing tools) sees the real score/briefing instead of the
// "Loading..." placeholder the client-side-only version always showed.
// Client-side JS (public/render.js + index.html's own script) still runs
// on top of this for live refresh - this is progressive enhancement, not
// a replacement for it. Cached briefly so we're not hitting the live API
// on every page load.
let cachedEvent = null;
let cachedAt = 0;

async function getEvent() {
  const now = Date.now();
  if (now - cachedAt < CACHE_TTL_MS) {
    return cachedEvent;
  }
  try {
    const res = await fetch(`${API_BASE}/api/financial-stress-monitor`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`upstream responded ${res.status}`);
    const data = await res.json();
    cachedEvent = (data && data.event) || null;
    cachedAt = now;
  } catch (err) {
    console.error('[ssr] failed to fetch financial-stress-monitor:', err.message);
    // Serve whatever was last cached (possibly still null) rather than
    // failing the page; leave `cachedAt` alone so the next request retries
    // the fetch instead of being stuck on a stale "success" timestamp.
  }
  return cachedEvent;
}

function renderIndexHtml(event) {
  const template = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  if (!event) return template; // nothing to inject - client-side fetch takes over exactly as before

  let html = template.replace(
    '<div class="score-panel" id="score-panel">\n      <div class="empty-state">Loading&hellip;</div>\n    </div>',
    `<div class="score-panel" id="score-panel">${buildScorePanelHtml(event)}</div>`,
  );

  const subHtml = subscoresHtml(event.subscores);
  if (subHtml) {
    html = html
      .replace('<section id="subscore-breakdown" hidden>', '<section id="subscore-breakdown">')
      .replace('<div class="subscore-panel" id="subscore-panel"></div>', `<div class="subscore-panel" id="subscore-panel">${subHtml}</div>`);
  }

  const blocksHtml = classificationBlocksHtml(event.classification_blocks);
  if (blocksHtml) {
    html = html
      .replace('<section id="classification-body" hidden>', '<section id="classification-body">')
      .replace('<div class="classification-panel" id="classification-panel"></div>', `<div class="classification-panel" id="classification-panel">${blocksHtml}</div>`);
  }

  // newsletter_body_html is contract-documented trusted HTML, rendered
  // as-is - matches the client's existing `.innerHTML = ...` handling.
  if (event.newsletter_body_html) {
    html = html
      .replace('<section id="newsletter-body" hidden>', '<section id="newsletter-body">')
      .replace('<div class="newsletter-panel" id="newsletter-panel"></div>', `<div class="newsletter-panel" id="newsletter-panel">${event.newsletter_body_html}</div>`);
  }

  return html;
}

app.get(['/', '/index.html'], async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const event = await getEvent();
    res.type('html').send(renderIndexHtml(event));
  } catch (err) {
    // renderIndexHtml only throws on a disk read failure - getEvent already
    // swallows its own errors. Fall back to the plain static file so a bug
    // here can never take the page down.
    console.error('[ssr] render failed, falling back to static file:', err.message);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.listen(PORT, () => {
  console.log(`liquiditywatch server running on port ${PORT} (SSR + static)`);
});
