#!/usr/bin/env node
// Regenerates every README picture from the sample profile in compose.yaml (an invented person):
// theme screenshots (desktop 1440 px and phone 390 px), the social preview card and the hero
// animation (the Neon boot sequence into the page) as MP4, GIF and animated WebP.
//
//   PLAYWRIGHT_PATH=/path/to/node_modules/playwright node scripts/capture_media.mjs [--only shots|hero|platforms|loaders]
// Also: docs/images/platforms.png (every built-in platform icon and name) and a short loader clip per
// theme (docs/images/loader-<theme>.webp).
//
// Needs Playwright with Chromium, ffmpeg (libx264 and gif) and img2webp (libwebp tools).
// The page is served in-process on 127.0.0.1 from app/; nothing is published.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../app/server.mjs';
import { composeEnvironment } from '../tests/helpers.mjs';
import { PLATFORMS } from '../app/platforms.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'docs/images');
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : 'all';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const THEMES = ['neon', 'neural', 'opening-bell'];
const sample = composeEnvironment(new URL('../compose.yaml', import.meta.url));

async function serve(theme, extra = {}) {
  const env = { ...sample, THEME: theme, NODE_ENV: 'test', MEDIA_DIR: join(root, 'examples/media'), RELEASE: 'sample', ...extra };
  const { handler } = await createApp(env);
  const server = createServer(handler);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${server.address().port}/`, close: () => new Promise((r) => server.close(r)) };
}

// Waits until every link has finished its entrance animation (same rule as browser_check.mjs).
const settled = (page) =>
  page.waitForFunction(() => {
    const l = [...document.querySelectorAll('[data-event]')];
    return l.length && l.every((a) => getComputedStyle(a.closest('li,.gen,.rise') || a).opacity === '1' && getComputedStyle(a).opacity === '1');
  }, null, { timeout: 20000 });

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'ignore', 'inherit'] });
const kb = (f) => `${Math.round(statSync(f).size / 1024)} KB`;

const browser = await chromium.launch();
try {
  mkdirSync(out, { recursive: true });
  if (only === 'all' || only === 'shots') {
    for (const theme of THEMES) {
      const s = await serve(theme);
      for (const v of [
        { name: 'desktop', width: 1440, height: 900, scale: 1 },
        { name: 'phone', width: 390, height: 844, scale: 2 },
      ]) {
        const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.scale, reducedMotion: 'no-preference' });
        const page = await ctx.newPage();
        await page.goto(s.url, { waitUntil: 'networkidle' });
        await settled(page);
        await page.waitForTimeout(1200);
        const file = join(out, `${theme}-${v.name}.png`);
        await page.screenshot({ path: file });
        console.log(`${file} ${kb(file)}`);
        await ctx.close();
      }
      await s.close();
    }
    // Social preview card (GitHub recommends 1280x640).
    const s = await serve('neon');
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(s.url, { waitUntil: 'networkidle' });
    await settled(page);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: join(out, 'social-preview.png') });
    console.log(`${join(out, 'social-preview.png')} ${kb(join(out, 'social-preview.png'))}`);
    await ctx.close();
    await s.close();
  }

  const want = (k) => only === 'all' || only === k;
  if (only === 'all' || only === 'hero') {
    // Hero: record the real Neon boot sequence into the settled page, then encode a loop.
    const W = 1200, H = 750, SECONDS = 8;
    const tmp = mkdtempSync(join(tmpdir(), 'neonlink-hero-'));
    try {
      const s = await serve('neon');
      const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: W, height: H } } });
      const page = await ctx.newPage();
      const t0 = Date.now();
      await page.goto(s.url, { waitUntil: 'domcontentloaded' });
      const lead = (Date.now() - t0) / 1000;
      await page.waitForTimeout(SECONDS * 1000 + 600);
      await ctx.close();
      await s.close();
      const webm = join(tmp, readdirSync(tmp).find((f) => f.endsWith('.webm')));
      const start = Math.max(0, lead - 0.05).toFixed(2);
      const mp4 = join(out, 'hero.mp4');
      run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', start, '-t', String(SECONDS), '-i', webm, '-vf', 'fps=30,scale=960:-2:flags=lanczos', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'slow', '-movflags', '+faststart', '-an', mp4]);
      const pal = join(tmp, 'pal.png');
      const gifFilter = 'fps=12,scale=720:-1:flags=lanczos';
      run('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-vf', `${gifFilter},palettegen=max_colors=128:stats_mode=diff`, pal]);
      const gif = join(out, 'hero.gif');
      run('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-i', pal, '-lavfi', `${gifFilter} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`, '-loop', '0', gif]);
      const frames = join(tmp, 'frames');
      mkdirSync(frames);
      run('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-vf', 'fps=15,scale=960:-1:flags=lanczos', join(frames, 'f%04d.png')]);
      const list = readdirSync(frames).sort().map((f) => join(frames, f));
      const webp = join(out, 'hero.webp');
      run('img2webp', ['-loop', '0', '-lossy', '-q', '55', '-m', '6', '-d', '67', ...list, '-o', webp]);
      // A still of the boot screen for places that cannot animate.
      run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '1.6', '-i', mp4, '-frames:v', '1', join(tmp, 'boot.png')]);
      copyFileSync(join(tmp, 'boot.png'), join(out, 'neon-boot.png'));
      for (const f of [mp4, gif, webp, join(out, 'neon-boot.png')]) console.log(`${f} ${kb(f)}`);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }

  if (want('platforms')) {
    // Every platform icon with its name, like a button wall, served by the real app so icons load as in production.
    const s = await serve('neon');
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(new URL('/healthcheck', s.url).href);
    const items = [...PLATFORMS].sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }))
      .map((p) => ({ label: p.label, icon: new URL(`/assets/icons/${p.icon}`, s.url).href }));
    await page.setContent(`<!doctype html><html><head><style>
      body{margin:0;background:#0B0B14;color:#E8E6F0;font:500 13px/1.2 system-ui,-apple-system,Segoe UI,sans-serif;padding:28px 32px}
      h1{font:700 20px system-ui;margin:0 0 4px}p{margin:0 0 18px;color:#9A98A8}
      ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(7,1fr);gap:8px}
      li{display:flex;align-items:center;gap:9px;padding:8px 10px;border:1px solid #23233a;border-radius:10px;background:#12121f;min-width:0}
      img{width:22px;height:22px;flex:none;object-fit:contain}span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    </style></head><body><h1>${items.length} built-in platforms</h1><p>Set the variable, get the button. Plus unlimited custom links with any of these icons, an emoji or a monogram.</p>
    <ul>${items.map((i) => `<li><img src="${i.icon}" alt=""><span>${i.label.replace(/[<&]/g, '')}</span></li>`).join('')}</ul></body></html>`, { waitUntil: 'networkidle' });
    const file = join(out, 'platforms.png');
    await page.screenshot({ path: file, fullPage: true });
    console.log(`${file} ${kb(file)}`);
    await ctx.close();
    await s.close();
  }

  if (want('loaders')) {
    // A short clip of each theme's loader, for the themes guide.
    for (const theme of THEMES) {
      const tmp = mkdtempSync(join(tmpdir(), 'neonlink-loader-'));
      try {
        const s = await serve(theme);
        const ctx = await browser.newContext({ viewport: { width: 720, height: 540 }, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: { width: 720, height: 540 } } });
        const page = await ctx.newPage();
        const t0 = Date.now();
        await page.goto(s.url, { waitUntil: 'domcontentloaded' });
        const lead = (Date.now() - t0) / 1000;
        await page.waitForTimeout(5200);
        await ctx.close();
        await s.close();
        const webm = join(tmp, readdirSync(tmp).find((f) => f.endsWith('.webm')));
        const frames = join(tmp, 'frames');
        mkdirSync(frames);
        run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', Math.max(0, lead - 0.05).toFixed(2), '-t', '4.8', '-i', webm, '-vf', 'fps=12,scale=480:-1:flags=lanczos', join(frames, 'f%04d.png')]);
        const list = readdirSync(frames).sort().map((f) => join(frames, f));
        const webp = join(out, `loader-${theme}.webp`);
        run('img2webp', ['-loop', '0', '-lossy', '-q', '50', '-m', '6', '-d', '83', ...list, '-o', webp]);
        console.log(`${webp} ${kb(webp)}`);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    }
  }
} finally {
  await browser.close();
}
