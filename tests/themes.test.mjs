// Theme switch and the contract every theme must meet. New themes are picked up automatically.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildConfig } from '../app/config.mjs';
import { render } from '../app/render.mjs';
import { THEMES, DEFAULT_THEME } from '../app/themes/index.mjs';
import { hrefs } from './helpers.mjs';

test('THEME selects an installed theme, case-insensitively', () => {
  for (const name of Object.keys(THEMES)) {
    const c = buildConfig({ THEME: name.toUpperCase() });
    assert.equal(c.theme, name);
    assert.deepEqual(c.warnings, []);
  }
});

test('unset THEME and littlelink-server light/dark values use the default quietly', () => {
  for (const v of [undefined, '', 'dark', 'Light', 'auto']) {
    const c = buildConfig(v === undefined ? {} : { THEME: v });
    assert.equal(c.theme, DEFAULT_THEME, String(v));
    assert.deepEqual(c.warnings, [], String(v));
  }
});

test('an unknown THEME falls back to the default with a warning', () => {
  const c = buildConfig({ THEME: 'vaporwave' });
  assert.equal(c.theme, DEFAULT_THEME);
  assert.match(c.warnings.join(), /THEME "vaporwave" is not installed/);
});

const env = {
  NAME: 'Theme Tester', BIO: 'One | Two', LEDE: 'A lede', FOOTER_TITLE: 'Foot title', FOOTER: 'Foot text',
  SECTION_PRIMARY_TITLE: 'Primary here', SECTION_SECONDARY_TITLE: 'Secondary here',
  CUSTOM_BUTTON_NAME: 'ABOUT,BLOG', CUSTOM_BUTTON_URL: 'https://about.example/,https://blog.example/', CUSTOM_BUTTON_TEXT: 'About me,Blog',
  GITHUB: 'https://github.com/t', EMAIL: 't@example.com', INSTAGRAM: 'https://instagram.com/t',
  PRIMARY_BUTTONS: 'ABOUT,BLOG,EMAIL',
};

for (const [name, theme] of Object.entries(THEMES)) {
  test(`theme "${name}" meets the contract`, () => {
    assert.equal(theme.meta.name, name);
    assert.equal(typeof theme.page, 'function');
    assert.equal(typeof theme.favicon, 'function');
    assert.ok(existsSync(fileURLToPath(new URL(`../app/themes/${name}/public`, import.meta.url))), 'has a public folder');
    const c = buildConfig({ ...env, THEME: name });
    const html = render(c);
    assert.match(html, /^<!doctype html>/i);
    for (const text of ['Theme Tester', 'One', 'Two', 'A lede', 'Foot title', 'Foot text', 'Primary here', 'Secondary here', 'About me', 'Blog', 'class="skip"']) {
      assert.ok(html.includes(text), `${name} renders ${text}`);
    }
    assert.deepEqual(
      [...hrefs(html)].sort(),
      ['https://about.example/', 'https://blog.example/', 'https://github.com/t', 'https://instagram.com/t', 'mailto:t@example.com'].sort(),
      `${name} renders every link exactly once`,
    );
    assert.ok(!/<script>(?!document\.documentElement\.classList\.add\('js'\))/.test(html), 'no inline scripts besides the hashed early script');
    assert.match(theme.favicon('AB'), /^<svg/);
  });
}

test('themes supply their own default wording; variables still win', () => {
  assert.equal(buildConfig({ THEME: 'neon' }).sections.primaryTitle, 'Uplinks');
  assert.equal(buildConfig({ THEME: 'neural' }).sections.primaryTitle, 'Suggested next steps');
  assert.equal(buildConfig({ THEME: 'opening-bell' }).sections.primaryTitle, 'The portfolio');
  assert.equal(buildConfig({ THEME: 'opening-bell', SECTION_PRIMARY_TITLE: 'Mine' }).sections.primaryTitle, 'Mine');
  assert.equal(buildConfig({ THEME: 'opening-bell' }).boot.granted, 'Market open');
  assert.match(buildConfig({ THEME: 'opening-bell' }).disclaimer, /decoration/);
  assert.equal(buildConfig({ THEME: 'opening-bell', DISCLAIMER: '' }).disclaimer, '');
  const n = buildConfig({ THEME: 'neural', NAME: 'Ada Lee', GITHUB: 'https://github.com/a' });
  assert.equal(n.boot.question, 'who is Ada Lee?');
  assert.deepEqual(n.boot.stages, ['Thinking…', 'Reading 1 links…', 'Writing answer…']);
  assert.deepEqual(buildConfig({ BACKGROUND_WORDS: 'a|b' }).backgroundWords, ['a', 'b']);
});

test('opening-bell tickers are three characters and stable', async () => {
  const { ticker, sparkline } = await import('../app/themes/opening-bell/theme.mjs');
  assert.equal(ticker('LINKED_IN'), 'LNK');
  assert.equal(ticker('X'), 'XXX');
  assert.equal(ticker('GITHUB'), 'GTH');
  assert.equal(sparkline('A'), sparkline('A'));
});

test('neural turns the first email link into the prompt bar', () => {
  const html = render(buildConfig({ THEME: 'neural', EMAIL: 'me@example.com', EMAIL_TEXT: 'Ask me', GITHUB: 'https://github.com/x' }));
  assert.match(html, /<a class="prompt gen"[^>]*href="mailto:me@example.com"/);
  assert.match(html, /Ask me: <b>me@example.com<\/b>/);
});

test('neural and opening-bell wrap long unbroken words instead of clipping them', async () => {
  const { readFile } = await import('node:fs/promises');
  for (const name of ['neural', 'opening-bell']) {
    const css = await readFile(new URL(`../app/themes/${name}/public/style.css`, import.meta.url), 'utf8');
    assert.match(css, /^body\{[^}]*overflow-wrap:anywhere/m, `${name} body wraps long words`);
  }
});

test('the configuration reference marks the variables only Neon renders', async () => {
  const { readFile } = await import('node:fs/promises');
  const readme = await readFile(new URL('../docs/configuration.md', import.meta.url), 'utf8');
  const neonOnly = { SHARE: 'https://share.example/zz', SHARE_TEXT: 'Zzshare', CORNER_LEFT: 'zz:corner', CORNER_RIGHT: 'zz:right', CLOCK_LABEL: 'Zzclock', HUD_SUFFIX: 'Zzsuffix', BOOT_LOG: 'Zzlog', BOOT_PROMPT: 'Zzprompt', BOOT_COMMAND: 'Zzcommand' };
  for (const name of Object.keys(THEMES).filter((n) => n !== 'neon')) {
    const html = render(buildConfig({ ...neonOnly, THEME: name, GITHUB: 'https://github.com/x' }));
    for (const [key, value] of Object.entries(neonOnly)) {
      assert.ok(!html.includes(value), `${name} ignores ${key}`);
      assert.match(readme, new RegExp(`^\\| \`${key}\` \\|[^\\n]*\\| Neon: `, 'm'), `docs/configuration.md marks ${key} as Neon only`);
    }
  }
});
