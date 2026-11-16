#!/usr/bin/env node
// Browser acceptance for a running page. Not part of `npm test` because it needs Chromium.
//   BASE_URL=http://127.0.0.1:4191/ EXPECT_LINKS=path/to/expected-links.json \
//   SCREENSHOTS=docs/images PLAYWRIGHT_PATH=/path/to/node_modules/playwright node scripts/browser_check.mjs
// Checks at 390, 900 and 1440 px: no horizontal overflow, visible keyboard focus, clean console,
// no failed requests, every link rendered (and matching EXPECT_LINKS when given); then reduced motion and no-JS.
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:4191/';
const shots = process.env.SCREENSHOTS || '';
const stamp = process.env.SHOT_DATE || new Date().toISOString().slice(0, 10).replace(/-/g, '');
const expected = process.env.EXPECT_LINKS ? JSON.parse(readFileSync(process.env.EXPECT_LINKS, 'utf8')).map((r) => r.href) : null;
const sizes = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 900, height: 1180 },
  { name: 'desktop', width: 1440, height: 900 },
];
// Hosts this machine's own network blocks (for example a DNS filter). Connection failures to them are
// noted, not failed. A Content-Security-Policy violation always fails, whatever the host.
const pageHost = new URL(process.env.BASE_URL || 'http://127.0.0.1:4191/').hostname;
// The page's own host (or a parent of it) can never be ignored.
const ignoreHosts = (process.env.IGNORE_BLOCKED_HOSTS || '').split(',').map((h) => h.trim()).filter((h) => h && h !== pageHost && !pageHost.endsWith('.' + h));
const ignorable = (url) => { try { const h = new URL(url).hostname; return ignoreHosts.some((x) => h === x || h.endsWith('.' + x)); } catch { return false; } };
const results = [];
let failed = 0;
const check = (ok, what) => {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${what}`);
  if (!ok) failed++;
};

const browser = await chromium.launch();
try {
  for (const s of sizes) {
    const ctx = await browser.newContext({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: shots ? 2 : 1 });
    const page = await ctx.newPage();
    const errors = [];
    const badRequests = [];
    page.on('console', (m) => { if (m.type() !== 'error') return; const t = m.text(); if (/Content Security Policy/i.test(t) || !/ERR_(CONNECTION_REFUSED|NAME_NOT_RESOLVED|CONNECTION_RESET|BLOCKED_BY_CLIENT)/.test(t) || !ignoreHosts.length) errors.push(t); });
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('requestfailed', (r) => { if (ignorable(r.url()) && !/csp/i.test(r.failure()?.errorText || '')) results.push(`NOTE ${s.width}px blocked by local network: ${new URL(r.url()).hostname}`); else badRequests.push(r.url() + ' ' + (r.failure()?.errorText || '')); });
    page.on('response', (r) => r.status() >= 400 && badRequests.push(`${r.status()} ${r.url()}`));
    await page.goto(base, { waitUntil: 'networkidle' });
    if (shots && s.name === 'desktop') {
      await page.waitForTimeout(900);
      mkdirSync(shots, { recursive: true });
      await page.screenshot({ path: join(shots, `${process.env.SHOT_PREFIX || 'neon'}-boot-${stamp}.png`) });
    }
    // Settled when every link (any theme marks links with data-event) has finished its entrance.
    await page.waitForFunction(() => { const l = [...document.querySelectorAll('[data-event]')]; return l.length && l.every((a) => { const cs = getComputedStyle(a.closest('li,.gen,.rise') || a); return cs.opacity === '1' && getComputedStyle(a).opacity === '1'; }); }, null, { timeout: 15000 });
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      links: [...document.querySelectorAll('a[data-event]')].map((a) => a.getAttribute('href')),
      hidden: [...document.querySelectorAll('a[data-event]')].filter((a) => getComputedStyle(a).opacity !== '1' || !a.offsetHeight).length,
      featuredFirst: Boolean(document.querySelector('a[data-event].featured')),
    }));
    check(m.overflow <= 0, `${s.width}px no horizontal overflow (${m.overflow})`);
    check(m.links.length > 0 && m.links.every(Boolean), `${s.width}px ${m.links.length} links rendered`);
    check(m.hidden === 0, `${s.width}px all links visible after boot (${m.hidden} hidden)`);
    check(m.featuredFirst, `${s.width}px featured card is shown`);
    if (expected) check(JSON.stringify([...m.links].sort()) === JSON.stringify([...expected].sort()), `${s.width}px the same destinations as ${process.env.EXPECT_LINKS}`);
    // Keyboard: skip link first, then links in visual order, each with a visible outline.
    await page.keyboard.press('Tab');
    const skip = await page.evaluate(() => document.activeElement?.className);
    check(skip === 'skip', `${s.width}px first Tab reaches the skip link`);
    let focusOk = true;
    const look = () => page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return [cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0, cs.boxShadow, cs.backgroundColor, cs.backgroundImage].join('|'); });
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(350);
      const focused = await look();
      const el = await page.evaluateHandle(() => document.activeElement);
      await page.evaluate((e) => { e.dataset.probe = '1'; e.blur(); }, el);
      await page.mouse.move(1, 1);
      await page.waitForTimeout(400); // let transitions finish
      const plain = await page.evaluate(() => { const e = document.querySelector('[data-probe]'); const cs = getComputedStyle(e); e.removeAttribute('data-probe'); return ['false', cs.boxShadow, cs.backgroundColor, cs.backgroundImage].join('|'); });
      if (!focused.startsWith('true') && focused === plain) focusOk = false;
      await page.evaluate((e) => e.focus({ focusVisible: true }), el);
    }
    check(focusOk, `${s.width}px keyboard focus is visible`);
    if (shots) {
      await page.evaluate(() => document.activeElement?.blur());
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      await page.screenshot({ path: join(shots, `${process.env.SHOT_PREFIX || 'neon'}-${s.name}-${stamp}.png`), fullPage: s.name !== 'desktop' });
    }
    check(errors.length === 0, `${s.width}px console clean${errors.length ? ': ' + errors.join(' | ') : ''}`);
    check(badRequests.length === 0, `${s.width}px no failed requests${badRequests.length ? ': ' + badRequests.join(' | ') : ''}`);
    await ctx.close();
  }

  // Reduced motion: no boot screen, content immediately visible.
  let ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  let page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  const rm = await page.evaluate(() => ({
    boot: (() => { const b = document.querySelector('#boot,#loader,#bell'); return b ? getComputedStyle(b).display : 'none'; })(),
    visible: [...document.querySelectorAll('a[data-event]')].every((a) => getComputedStyle(a).opacity === '1' && getComputedStyle(a.closest('li,.gen,.rise') || a).opacity === '1'),
  }));
  check(rm.boot === 'none' && rm.visible, 'reduced motion: no boot screen, links visible at once');
  await ctx.close();

  // No JavaScript: plain links, no boot screen.
  ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  const nj = await page.evaluate(() => ({
    links: document.querySelectorAll('a[data-event]').length,
    visible: [...document.querySelectorAll('a[data-event]')].every((a) => getComputedStyle(a).opacity === '1' && getComputedStyle(a.closest('li,.gen,.rise') || a).opacity === '1'),
  }));
  check(nj.links > 0 && nj.visible, `no JavaScript: ${nj.links} links visible`);
  await ctx.close();
} finally {
  await browser.close();
}
const report = results.join('\n');
console.log(report);
if (process.env.REPORT) writeFileSync(process.env.REPORT, report + '\n');
process.exit(failed ? 1 : 0);
