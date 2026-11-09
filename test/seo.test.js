'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pub = (f) => fs.readFileSync(path.join(__dirname, '..', 'public', f), 'utf8');
const meta = (html, attr, key) => {
  const m = html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`));
  return m ? m[1] : null;
};

test('robots.txt allows crawling and points at the sitemap', () => {
  const robots = pub('robots.txt');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.doesNotMatch(robots, /^Disallow:\s*\S/m);
  assert.match(robots, /^Sitemap: https:\/\/liquiditywatch\.e3d\.ai\/sitemap\.xml$/m);
});

for (const [file, url] of [['index.html', 'https://liquiditywatch.e3d.ai/'], ['about.html', 'https://liquiditywatch.e3d.ai/about.html']]) {
  test(`${file}: canonical, Open Graph and Twitter card tags are complete and agree`, () => {
    const html = pub(file);
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`), 'canonical');
    assert.equal(meta(html, 'property', 'og:url'), url);
    assert.equal(meta(html, 'property', 'og:type'), 'website');
    const title = html.match(/<title>([^<]*)<\/title>/)[1];
    assert.equal(meta(html, 'property', 'og:title'), title);
    assert.equal(meta(html, 'name', 'twitter:title'), title);
    const desc = meta(html, 'name', 'description');
    assert.ok(desc && desc.length > 20);
    assert.equal(meta(html, 'property', 'og:description'), desc);
    assert.equal(meta(html, 'name', 'twitter:description'), desc);
    assert.equal(meta(html, 'name', 'twitter:card'), 'summary_large_image');
    const img = meta(html, 'property', 'og:image');
    assert.equal(meta(html, 'name', 'twitter:image'), img);
    assert.match(img, /^https:\/\/liquiditywatch\.e3d\.ai\/[\w.-]+\.jpg$/, 'absolute image URL on the live host');
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', new URL(img).pathname.slice(1))), 'image file exists in public/');
    assert.ok(meta(html, 'property', 'og:image:alt'));
  });
}
