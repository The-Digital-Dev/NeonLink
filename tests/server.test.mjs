import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../app/server.mjs';
import { buildConfig } from '../app/config.mjs';
import { render, EARLY_SCRIPT, EARLY_SCRIPT_HASH } from '../app/render.mjs';
import { composeEnvironment, hrefs, assertNoPrivateNetworkCopy } from './helpers.mjs';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

async function serve(env) {
  const { handler } = await createApp({ NODE_ENV: 'test', ...env });
  const server = createServer(handler);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, close: () => new Promise((r) => server.close(r)) };
}

test('configured text is escaped everywhere it is rendered', () => {
  const evil = '<img src=x onerror=alert(1)>"\'';
  const html = render(
    buildConfig({
      NAME: evil, BIO: evil, LEDE: evil, FOOTER: evil, FOOTER_TITLE: evil, META_TITLE: evil,
      CUSTOM_BUTTON_NAME: 'A', CUSTOM_BUTTON_URL: 'https://a.example/?q="x"', CUSTOM_BUTTON_TEXT: evil,
      BOOT_LOG: '</script><script>alert(1)</script>', SHARE: 'https://s.example', CORNER_LEFT: `k:${evil}`,
    }),
  );
  assert.ok(!html.includes('<img src=x'), 'no raw HTML from configuration');
  assert.ok(!html.includes('</script><script>alert'), 'boot data cannot close its script element');
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(html.includes('href="https://a.example/?q=&quot;x&quot;"'));
});

test('the inline early script matches the CSP hash', () => {
  const h = `'sha256-${createHash('sha256').update(EARLY_SCRIPT).digest('base64')}'`;
  assert.equal(h, EARLY_SCRIPT_HASH);
});

test('page structure: featured card, grid above primary list, footer, no-JS content present', () => {
  const html = render(
    buildConfig({
      CUSTOM_BUTTON_NAME: 'ABOUT,BLOG', CUSTOM_BUTTON_URL: 'https://a.example,https://b.example', CUSTOM_BUTTON_TEXT: 'About,Blog',
      GITHUB: 'https://github.com/x', FOOTER_TITLE: 'Hi', FOOTER: 'There',
      SECTION_PRIMARY_TITLE: 'Primary', SECTION_SECONDARY_TITLE: 'Secondary',
    }),
  );
  const order = ['channel featured', 'Secondary', 'Primary', '<footer'].map((s) => html.indexOf(s));
  assert.ok(order.every((i) => i > 0), 'all parts render');
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'rendered top to bottom in visual order');
  assert.match(html, /<a class="channel github" href="https:\/\/github.com\/x" target="_blank" rel="noopener noreferrer" data-event="github-button">/);
  assert.match(html, /<noscript>|class="skip"/);
});

test('mailto links do not open a new tab; boot can be disabled', () => {
  const html = render(buildConfig({ EMAIL: 'a@b.example', BOOT_ENABLED: 'false' }));
  assert.match(html, /href="mailto:a@b.example" data-event="default-button"/);
  assert.ok(!html.includes('id="boot"'));
  assert.ok(html.includes('class="no-boot"'));
});

test('HTTP: page, health, robots, favicon, assets, custom assets, 404 and traversal', async (t) => {
  const s = await serve({ NAME: 'Test Person', GITHUB: 'https://github.com/x', ROBOTS_ADDITIONAL_RULES: 'Disallow: /private', MEDIA_DIR: fileURLToPath(new URL('./fixtures/media', import.meta.url)) });
  t.after(s.close);
  let r = await fetch(`${s.base}/`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-security-policy'), /script-src 'self' 'sha256-/);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('x-frame-options'), 'DENY');
  assert.ok(r.headers.get('x-neonlink-release') || [...r.headers.keys()].some((k) => k.endsWith('-release')));
  const html = await r.text();
  assert.match(html, /<h1 class="seq" data-text="Test Person">Test Person<\/h1>/);
  const etag = r.headers.get('etag');
  r = await fetch(`${s.base}/`, { headers: { 'if-none-match': etag } });
  assert.equal(r.status, 304);
  r = await fetch(`${s.base}/healthcheck`);
  assert.deepEqual(await r.json(), { status: 'ok', release: 'development' });
  r = await fetch(`${s.base}/robots.txt`);
  assert.match(await r.text(), /Disallow: \/private/);
  r = await fetch(`${s.base}/favicon.svg`);
  assert.match(await r.text(), />TP<\/text>/);
  for (const a of ['/theme/style.css', '/theme/ui.js', '/theme/scene.js', '/theme/fonts.css', '/theme/fonts/orbitron-900.woff2', '/assets/icons/github.svg', '/assets/analytics.js', '/avatar.svg']) {
    r = await fetch(`${s.base}${a}`);
    assert.equal(r.status, 200, a);
  }
  r = await fetch(`${s.base}/theme/style.css?v=1`);
  assert.match(r.headers.get('cache-control'), /immutable/);
  r = await fetch(`${s.base}/media/pixel.svg`);
  assert.equal(r.status, 200);
  for (const bad of ['/assets/../server.mjs', '/assets/%2e%2e/server.mjs', '/assets/icons/LICENSE-littlelink-server.md', '/media/.hidden', '/nope', '/assets/%E0%A4%A']) {
    r = await fetch(`${s.base}${bad}`);
    assert.ok([400, 404].includes(r.status), `${bad} -> ${r.status}`);
  }
  r = await fetch(`${s.base}/`, { method: 'POST' });
  assert.equal(r.status, 405);
});

test('CSP only opens the configured analytics origins', async () => {
  const { csp } = await createApp({ NODE_ENV: 'test', UMAMI_WEBSITE_ID: 'x', UMAMI_APP_URL: 'https://stats.example' });
  assert.match(csp, /script-src 'self' 'sha256-[^']+' https:\/\/stats.example/);
  const plain = (await createApp({ NODE_ENV: 'test' })).csp;
  assert.ok(!plain.includes('googletagmanager'));
});

test('the generic demo Compose file renders its links', () => {
  const env = composeEnvironment(new URL('../compose.yaml', import.meta.url));
  const html = render(buildConfig(env));
  const h = hrefs(html);
  assert.equal(h.length, 11);
  assert.equal(h[0], 'https://example.com/', 'featured portfolio first');
  assert.ok(h.includes('mailto:hello@example.com'));
  assert.deepEqual(buildConfig(env).warnings, []);
});

const fixture = (name) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

test('media folder: avatar.* and favicon.* are picked up when no variable is set', async (t) => {
  const s = await serve({ NAME: 'Media Person', MEDIA_DIR: fixture('media-auto') });
  t.after(s.close);
  const html = await (await fetch(`${s.base}/`)).text();
  assert.match(html, /class="profile-photo" src="\/media\/avatar.png"/);
  assert.match(html, /<link rel="icon" href="\/media\/favicon.svg">/);
  const r = await fetch(`${s.base}/media/avatar.png`);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'image/png');
  assert.match(r.headers.get('cache-control'), /max-age=300/);
  assert.match(r.headers.get('content-security-policy'), /sandbox/);
});

test('media folder: explicit variables win over dropped-in files', async (t) => {
  const s = await serve({ AVATAR_URL: 'https://img.example/me.jpg', FAVICON_URL: '/media/other.ico', MEDIA_DIR: fixture('media-auto') });
  t.after(s.close);
  const html = await (await fetch(`${s.base}/`)).text();
  assert.match(html, /src="https:\/\/img.example\/me.jpg"/);
  assert.match(html, /href="\/media\/other.ico"/);
});

test('media folder: images only, no traversal, works when the folder is missing', async (t) => {
  let s = await serve({ MEDIA_DIR: fixture('media') });
  t.after(s.close);
  for (const bad of ['/media/notes.txt', '/media/.hidden', '/media/../server.test.mjs', '/media/%2e%2e/helpers.mjs']) {
    assert.equal((await fetch(`${s.base}${bad}`)).status, 404, bad);
  }
  assert.equal((await fetch(`${s.base}/media/pixel.svg`)).status, 200);
  const missing = await serve({ MEDIA_DIR: fixture('does-not-exist') });
  t.after(missing.close);
  assert.equal((await fetch(`${missing.base}/`)).status, 200);
});

test('no picture configured: a generated initials placeholder is used', async (t) => {
  const s = await serve({ NAME: 'Robin Park', MEDIA_DIR: fixture('does-not-exist') });
  t.after(s.close);
  const html = await (await fetch(`${s.base}/`)).text();
  assert.match(html, /class="profile-photo" src="\/avatar.svg"/);
  const svg = await (await fetch(`${s.base}/avatar.svg`)).text();
  assert.match(svg, />RP<\/text>/);
});

test('media folder: symlinks that leave the folder or point at non-images are refused', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'neonlink-media-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const media = join(root, 'media');
  await mkdir(media);
  await writeFile(join(root, 'secret.png'), 'outside');
  await writeFile(join(media, 'notes.txt'), 'not an image');
  await writeFile(join(media, 'real.png'), 'png');
  await symlink(join(root, 'secret.png'), join(media, 'escape.png'));
  await symlink(join(media, 'notes.txt'), join(media, 'text.png'));
  await symlink(join(media, 'real.png'), join(media, 'alias.png'));
  const s = await serve({ MEDIA_DIR: media });
  t.after(s.close);
  assert.equal((await fetch(`${s.base}/media/escape.png`)).status, 404, 'symlink out of the folder');
  assert.equal((await fetch(`${s.base}/media/text.png`)).status, 404, 'symlink to a non-image');
  assert.equal((await fetch(`${s.base}/media/alias.png`)).status, 200, 'symlink to an image inside the folder');
});

test('CSP: Google Analytics loads without inline script; styles only from this origin', async () => {
  const { csp, html } = await createApp({ NODE_ENV: 'test', GA_TRACKING_ID: 'G-ABC123' });
  assert.match(csp, /script-src 'self' 'sha256-[^']+' https:\/\/\*\.googletagmanager\.com(;|$)/);
  assert.match(csp, /connect-src [^;]*https:\/\/\*\.google-analytics\.com/);
  assert.match(csp, /style-src 'self'; style-src-attr 'unsafe-inline'/);
  assert.equal([...html.matchAll(/<script>/g)].length, 1, 'only the hashed early script is inline');
  assert.match(html, /<script type="application\/json" id="analytics-config">\{"ga":"G-ABC123"\}<\/script>/);
});

test('CSP: an analytics URL cannot inject directives', async () => {
  const { csp } = await createApp({ NODE_ENV: 'test', UMAMI_WEBSITE_ID: 'x', UMAMI_APP_URL: 'https://a;sandbox.example' });
  assert.ok(!csp.includes('a;sandbox'), csp);
  assert.equal(csp.split(';').length, 11, 'no extra directives');
});

test('an odd RELEASE value does not break responses', async (t) => {
  const s = await serve({ RELEASE: 'v1\u0001🚀' });
  t.after(s.close);
  const r = await fetch(`${s.base}/healthcheck`);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('x-neonlink-release'), 'v1');
});

test('the rendered demo page exposes no private addresses, internal hostnames or ports', () => {
  assertNoPrivateNetworkCopy(render(buildConfig(composeEnvironment(new URL('../compose.yaml', import.meta.url)))), 'compose.yaml');
  assert.throws(() => assertNoPrivateNetworkCopy('<p>nas.lan</p>', 'probe')); // leak-scan: allow (probe)
  assert.throws(() => assertNoPrivateNetworkCopy('<p>host:8443</p>', 'probe'));
});

test('CLOUDFLARE_WEB_ANALYTICS lets the CSP allow only the Cloudflare beacon', async () => {
  const off = (await createApp({ NODE_ENV: 'test' })).csp;
  assert.ok(!off.includes('cloudflareinsights'));
  const on = (await createApp({ NODE_ENV: 'test', CLOUDFLARE_WEB_ANALYTICS: 'true' })).csp;
  assert.match(on, /script-src [^;]*https:\/\/static\.cloudflareinsights\.com/);
  assert.match(on, /connect-src [^;]*https:\/\/cloudflareinsights\.com/);
  assert.ok(!/script-src [^;]*\*/.test(on.replace('https://*.googletagmanager.com', '')), 'no wildcard added');
});
