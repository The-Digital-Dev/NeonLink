// Custom links (both forms), icons, accents, the loader switch and tokens, and the platform catalogue.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { buildConfig, resolveIcon, accentColor, monogram } from '../app/config.mjs';
import { PLATFORMS } from '../app/platforms.mjs';
import { THEMES } from '../app/themes/index.mjs';
import { render } from '../app/render.mjs';

const themes = Object.keys(THEMES);

test('indexed LINK_<n>_* links follow the numbers, after the comma-list form', () => {
  const c = buildConfig({
    CUSTOM_BUTTON_NAME: 'SHOP', CUSTOM_BUTTON_URL: 'https://example.com/shop', CUSTOM_BUTTON_TEXT: 'Shop',
    LINK_10_URL: 'https://example.com/ten', LINK_10_TEXT: 'Ten',
    LINK_2_URL: 'https://example.com/two', LINK_2_TEXT: 'Two', LINK_2_NAME: 'talks', LINK_2_NOTE: 'Slides and video',
  });
  assert.deepEqual(c.links.all.map((l) => l.id), ['SHOP', 'TALKS', 'LINK10']);
  assert.equal(c.links.all[1].note, 'Slides and video');
  assert.deepEqual(c.warnings, []);
});

test('custom and built-in links share BUTTON_ORDER, and a custom link can be featured', () => {
  const c = buildConfig({
    GITHUB: 'https://github.com/', LINK_1_NAME: 'BLOGPOST', LINK_1_URL: 'https://example.com/post', LINK_1_TEXT: 'Latest post',
    BUTTON_ORDER: 'GITHUB,BLOGPOST', FEATURED_BUTTON: 'BLOGPOST',
  });
  assert.equal(c.links.featured.id, 'BLOGPOST');
  assert.equal(c.links.featured.label, 'Latest post');
});

test('incomplete or unsafe custom links are skipped with a warning', () => {
  const c = buildConfig({ LINK_1_URL: 'javascript:alert(1)', LINK_1_TEXT: 'Bad', LINK_2_TEXT: 'No URL' });
  assert.equal(c.links.all.length, 0);
  assert.equal(c.warnings.length, 2);
});

test('icons: image paths, any platform name, emoji, else a monogram', () => {
  assert.deepEqual(resolveIcon('/media/shop.png'), { icon: '/media/shop.png' });
  assert.equal(resolveIcon('github').icon, `/assets/icons/${PLATFORMS.find((p) => p.key === 'GITHUB').icon}`);
  assert.equal(resolveIcon('brand-kofi').icon, `/assets/icons/${PLATFORMS.find((p) => p.key === 'KOFI').icon}`);
  assert.equal(resolveIcon('LINKED_IN').icon, `/assets/icons/${PLATFORMS.find((p) => p.key === 'LINKED_IN').icon}`);
  assert.deepEqual(resolveIcon('🛍️'), { icon: null, emoji: '🛍️' });
  const w = [];
  assert.deepEqual(resolveIcon('<b>x</b>', w), { icon: null });
  assert.equal(w.length, 1);
  assert.equal(monogram('  élan studio'), 'É');
  assert.equal(monogram('2024 recap'), '2');
});

test('accent colours are validated and carry a readable ink', () => {
  assert.deepEqual(accentColor('#0af'), { color: '#00aaff', ink: '#000000', fg: '#00aaff' });
  assert.equal(accentColor('#1A1A2E').ink, '#FFFFFF');
  assert.equal(accentColor('#11223380').color, '#112233');
  const w = [];
  assert.equal(accentColor('red;background:url(x)', w), null);
  assert.equal(w.length, 1);
});

test('every theme renders emoji, monogram and accent safely', () => {
  const env = {
    LINK_1_URL: 'https://example.com/a', LINK_1_TEXT: 'Alpha "<b>"', LINK_1_ICON: '✨', LINK_1_COLOR: '#ff2bd6',
    LINK_2_URL: 'https://example.com/b', LINK_2_TEXT: 'beta', LINK_2_COLOR: '#123',
    GITHUB: 'https://github.com/', FEATURED_BUTTON: 'none',
  };
  for (const theme of themes) {
    const html = render(buildConfig({ ...env, THEME: theme }));
    assert.match(html, /class="glyph emoji" aria-hidden="true">✨</, theme);
    assert.match(html, /class="glyph mono" aria-hidden="true">B</, theme);
    assert.match(html, /--accent:#ff2bd6;--accent-ink:#000000/, theme);
    assert.ok(!html.includes('<b>"'), `${theme} escapes the label`);
  }
});

test('loader: BOOT_MODE values, BOOT_ENABLED compatibility and data-boot', () => {
  for (const [env, mode] of [[{}, 'full'], [{ BOOT_MODE: 'short' }, 'short'], [{ BOOT_MODE: 'ONCE' }, 'once'], [{ BOOT_MODE: 'off' }, 'off'], [{ BOOT_ENABLED: 'false' }, 'off']]) {
    const c = buildConfig(env);
    assert.equal(c.boot.mode, mode);
    assert.equal(c.boot.enabled, mode !== 'off');
  }
  const bad = buildConfig({ BOOT_MODE: 'sometimes' });
  assert.equal(bad.boot.mode, 'full');
  assert.equal(bad.warnings.length, 1);
  for (const theme of themes) {
    assert.match(render(buildConfig({ THEME: theme, BOOT_MODE: 'once' })), /<body id="top" data-boot="once">/, theme);
    assert.match(render(buildConfig({ THEME: theme, BOOT_MODE: 'off' })), /data-boot="off" class="no-boot"/, theme);
  }
});

test('loader text fills {name}, {first}, {handle}, {count} and {platforms} everywhere', () => {
  const c = buildConfig({
    NAME: 'Alex Rivera', GITHUB: 'https://github.com/', YOUTUBE: 'https://youtube.com/',
    BOOT_LOG: '[OK] Hello {first}|{platforms}', BOOT_PROMPT: '{handle}$', BOOT_COMMAND: 'open {count}', BOOT_GRANTED: 'Hi {name}', BOOT_HINT: '{count} links',
  });
  assert.deepEqual(c.boot.lines, [{ ok: true, text: 'Hello Alex' }, { ok: false, text: 'YouTube · GitHub' }]);
  assert.equal(c.boot.prompt, 'alex_rivera$');
  assert.equal(c.boot.command, 'open 2');
  assert.equal(c.boot.granted, 'Hi Alex Rivera');
  assert.equal(c.boot.hint, '2 links');
  const d = buildConfig({ NAME: 'Alex Rivera' });
  assert.equal(d.boot.prompt, 'guest@alex_rivera:~$');
  assert.ok(d.boot.lines.some((l) => l.text === 'Loaded links'));
});

test('PHONE and SMS take a plain number', () => {
  const c = buildConfig({ PHONE: '+1 (555) 010-0123', SMS: '555 0100' });
  assert.deepEqual(c.links.all.map((l) => l.href), ['tel:+15550100123', 'sms:5550100']);
  assert.equal(buildConfig({ SMS: 'https://example.com' }).warnings.length, 1);
});

test('platform catalogue: unique variables, labels and an icon file for each', () => {
  assert.ok(PLATFORMS.length >= 160, `${PLATFORMS.length} platforms`);
  assert.equal(new Set(PLATFORMS.map((p) => p.key)).size, PLATFORMS.length);
  for (const p of PLATFORMS) {
    assert.match(p.key, /^[A-Z][A-Z0-9_]*$/, p.key);
    assert.ok(p.label, p.key);
    assert.ok(existsSync(new URL(`../app/public/icons/${p.icon}`, import.meta.url)), `${p.key} icon ${p.icon}`);
  }
});

test('review fixes: strict emoji, colour forms, readable accents, numbering, duplicates, phone', () => {
  assert.deepEqual(resolveIcon('Shop 😀'), { icon: null });
  assert.equal(resolveIcon('‮😀abc').emoji, undefined);
  assert.equal(resolveIcon('1️⃣').emoji, '1️⃣');
  assert.equal(resolveIcon('👩🏽‍💻').emoji, '👩🏽‍💻');
  assert.equal(accentColor('#12345'), null);
  assert.equal(accentColor('#abcd').color, '#aabbcc');
  const dark = accentColor('#1a1a2e');
  assert.notEqual(dark.fg, '#1a1a2e');
  assert.equal(accentColor('#00f0ff').fg, '#00f0ff');
  const c = buildConfig({ LINK_01_URL: 'https://example.com', LINK_01_TEXT: 'x', LINK_1_ALT_TEXT: 'alt', LINK_1_URL: 'https://example.com/1', LINK_1_TEXT: 'One', LINK_1_ICON: '/media/a.png', LINK_2_COLOUR: '#fff', LINK_3_NAME: 'GITHUB', LINK_3_URL: 'https://example.com/3', LINK_3_TEXT: 'Three', GITHUB: 'https://github.com/' });
  assert.equal(c.links.all.find((l) => l.label === 'One').alt, 'alt');
  assert.ok(c.warnings.some((w) => /LINK_01_URL ignored/.test(w)));
  assert.ok(c.warnings.some((w) => /LINK_2_COLOUR ignored/.test(w)));
  assert.ok(c.warnings.some((w) => /Two links are named GITHUB/.test(w)));
  const p = buildConfig({ PHONE: '+1', EMAIL: 'a@example.com', GITHUB: 'https://github.com/', BOOT_LOG: '{platforms}' });
  assert.ok(p.warnings.includes('PHONE skipped: not a phone number.'));
  assert.equal(p.boot.lines[0].text, 'GitHub');
});

test('BOOT_MODE=once marks repeat visits before first paint', async () => {
  const { EARLY_SCRIPT } = await import('../app/html.mjs');
  assert.match(EARLY_SCRIPT, /dataset\.boot==='once'&&sessionStorage\.getItem\('neonlink-boot-seen'\)==='1'/);
  for (const t of ['neon', 'neural', 'opening-bell']) {
    const { readFileSync } = await import('node:fs');
    assert.match(readFileSync(new URL(`../app/themes/${t}/public/style.css`, import.meta.url), 'utf8'), /\.boot-seen \.boot,\.boot-seen \.loader,\.boot-seen \.bell\{display:none!important\}/, t);
  }
});
