'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const xml = fs.readFileSync(path.join(__dirname, '..', 'public', 'sitemap.xml'), 'utf8');
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

test('sitemap is well formed and lists the home page', () => {
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.ok(locs.includes('https://liquiditywatch.e3d.ai/'));
});

test('every sitemap URL is on the live host and maps to a real file in public/', () => {
  assert.equal(new Set(locs).size, locs.length, 'no duplicate URLs');
  for (const loc of locs) {
    const u = new URL(loc);
    assert.equal(u.origin, 'https://liquiditywatch.e3d.ai');
    const rel = u.pathname === '/' ? 'index.html' : u.pathname.slice(1);
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', rel)), `${loc} has no file public/${rel}`);
  }
});
