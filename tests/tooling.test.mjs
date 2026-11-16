// The leak scanner and the static export are part of the release safety net, so they are tested too.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanText, scanTree, loadTerms, mediaHashes } from '../scripts/leak_scan.mjs';
import { relativize, metaCsp, exportTheme } from '../scripts/export_static.mjs';

const rules = (t, o) => scanText(t, o).map((f) => f.rule);
const scratch = (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'nl-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};

test('leak scan: built-in rules catch addresses, hosts and tokens', () => {
  assert.deepEqual(rules('mail pat@corp-mail.io'), ['e-mail address']); // leak-scan: allow (test case)
  assert.deepEqual(rules('ip 192.168.1.20 and 10.0.0.5'), ['private IPv4 address', 'private IPv4 address']); // leak-scan: allow (test case)
  assert.deepEqual(rules('see nas' + '.lan'), ['internal host name']);
  assert.deepEqual(rules('tok glpat-' + 'abcdefghijklmnopqrstu'), ['GitLab token']);
  assert.deepEqual(rules('-----BEGIN RSA ' + 'PRIVATE KEY-----'), ['private key']);
});

test('leak scan: example data, public addresses and allow markers pass', () => {
  assert.deepEqual(rules('hello@example.com a@b.example avatar@2x.png 127.0.0.1 8.8.8.8 10.546.887.995'), []);
  assert.deepEqual(rules('1234+someone@users.noreply.github.com'), []);
  assert.deepEqual(rules('x 192.168.0.1 // leak-scan: allow'), []);
});

test('leak scan: private terms, file names and media hashes', (t) => {
  const dir = scratch(t);
  writeFileSync(join(dir, 'terms.txt'), '# comment\n\\bjordan\\b\nacme-internal\n');
  const terms = loadTerms(join(dir, 'terms.txt'));
  assert.equal(terms.length, 2);
  assert.deepEqual(rules('Hi Jordan!', { terms }), ['private term /\\bjordan\\b/']);
  const tree = join(dir, 'tree'), media = join(dir, 'media');
  mkdirSync(tree);
  mkdirSync(media);
  writeFileSync(join(media, 'portrait.png'), Buffer.from([0, 1, 2, 3, 0, 9]));
  writeFileSync(join(tree, 'renamed.png'), Buffer.from([0, 1, 2, 3, 0, 9]));
  writeFileSync(join(tree, 'acme-internal.txt'), 'clean');
  const found = scanTree(tree, { terms, hashes: mediaHashes([media]) }).map((f) => f.rule);
  assert.ok(found.includes('private media file'), found.join());
  assert.ok(found.some((r) => r.startsWith('private term in path')), found.join());
});

test('static export: site paths become relative and the CSP fits a meta tag', () => {
  const html = '<link href="/theme/style.css?v=1"><img src="/media/a.png"><a href="https://x.example/assets/">x</a><a href="/">home</a>';
  assert.equal(relativize(html), '<link href="./theme/style.css?v=1"><img src="./media/a.png"><a href="https://x.example/assets/">x</a><a href="/">home</a>');
  assert.equal(metaCsp("default-src 'self'; frame-ancestors 'none'; base-uri 'none'"), "default-src 'self'; base-uri 'none'");
});

test('static export: every theme is written with relative assets', async (t) => {
  const out = scratch(t);
  const env = { NAME: 'Alex Rivera', GITHUB: 'https://github.com/' };
  for (const theme of ['neon', 'neural', 'opening-bell']) {
    await exportTheme(theme, env, join(out, theme));
    const page = readFileSync(join(out, theme, 'index.html'), 'utf8');
    assert.match(page, /http-equiv="Content-Security-Policy"/);
    assert.doesNotMatch(page, /["'(]\/(assets|theme|media)\//, theme);
    for (const f of ['theme/style.css', 'assets/icons/github.svg', 'favicon.svg']) assert.ok(existsSync(join(out, theme, f)), `${theme} ${f}`);
  }
});

test('docs/platforms.md and the compose.yaml catalogue match the platform catalogue', async () => {
  const { platformDocs, composeWithCatalogue } = await import('../scripts/build_platform_docs.mjs');
  const { readFileSync } = await import('node:fs');
  assert.equal(readFileSync(new URL('../docs/platforms.md', import.meta.url), 'utf8'), platformDocs(), 'run node scripts/build_platform_docs.mjs');
  const compose = readFileSync(new URL('../compose.yaml', import.meta.url), 'utf8');
  assert.equal(compose, composeWithCatalogue(compose), 'run node scripts/build_platform_docs.mjs');
});

test('compose.yaml: commented-out settings are not values, trailing comments are not part of a value', async () => {
  const { composeEnvironmentText } = await import('./helpers.mjs');
  const env = composeEnvironmentText([
    'services:', '  web:', '    environment:',
    '      NAME: Alex Rivera        # your name',
    '      # BIO: Not used',
    '      THEME_COLOR: "#07060D"   # quoted, so the # is kept',
    "      SIGIL: 'A#'",
    '      BOOT_PROMPT: me@x:~$$',
    '      SHARE:                   # null in YAML: Compose passes nothing',
    '      AVATAR_BADGE: ""',
    '      # END platform catalogue',
    '  other:',
  ].join('\n'));
  assert.deepEqual(env, { NAME: 'Alex Rivera', THEME_COLOR: '#07060D', SIGIL: 'A#', BOOT_PROMPT: 'me@x:~$', AVATAR_BADGE: '' });
});

test('showcase: every platform is switched on with example data only', async () => {
  const { showcaseEnv } = await import('../scripts/showcase.mjs');
  const { PLATFORMS } = await import('../app/platforms.mjs');
  const { buildConfig } = await import('../app/config.mjs');
  const c = buildConfig(showcaseEnv());
  assert.deepEqual(c.warnings, []);
  assert.equal(c.links.all.filter((l) => !l.custom).length, PLATFORMS.length);
  assert.equal(c.links.all.filter((l) => l.custom).length, 4);
  for (const l of c.links.all) assert.match(l.href, /^(https:\/\/example\.com\/|mailto:[a-z]+@example\.com$|tel:\+15550100$|sms:\+15550100$)/, l.id);
});

test('README states the real platform count', async () => {
  const { readFileSync } = await import('node:fs');
  const { PLATFORMS } = await import('../app/platforms.mjs');
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  for (const n of readme.matchAll(/\b(\d{3}) (?:built-in platforms|names)\b/g)) assert.equal(Number(n[1]), PLATFORMS.length, n[0]);
});

test('generated platform icons are legible on the dark themes', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const { contrast } = await import('../scripts/build_icons.mjs');
  const dir = new URL('../app/public/icons/', import.meta.url);
  for (const f of readdirSync(dir).filter((n) => n.startsWith('brand-'))) {
    const svg = readFileSync(new URL(f, dir), 'utf8');
    if (!/<title>/.test(svg) || /<rect[^>]*fill="#F4F4F6"/.test(svg)) continue; // tiled, or hand-made
    const fill = /<path fill="(#[0-9A-F]{6})"/.exec(svg)?.[1];
    if (fill === '#FFFFFF') continue;
    if (fill) assert.ok(contrast(fill, '#0B0B14') >= 3, `${f} ${fill}`);
  }
});
