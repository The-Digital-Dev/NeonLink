import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildConfig, buildLinks, safeUrl, safeImage, initials, langTag } from '../app/config.mjs';
import { PRODUCT } from '../app/product.mjs';

const ids = (links) => links.map((l) => l.id);

test('generic defaults contain no personal content and no links', () => {
  const c = buildConfig({});
  assert.equal(c.name, PRODUCT);
  assert.equal(c.links.all.length, 0);
  assert.equal(c.links.featured, null);
  assert.equal(c.sections.primaryTitle, 'Uplinks');
  assert.equal(c.sections.secondaryTitle, 'Around the web');
  assert.equal(c.share, null, 'share is hidden unless SHARE is set');
  assert.equal(c.hud.clockZone, '', 'clock is hidden unless CLOCK_TIMEZONE is set');
  assert.deepEqual(c.corners.right, []);
});

test('existing littlelink-server variables keep working', () => {
  const c = buildConfig({
    NAME: 'Sam Lee',
    BIO: 'One | Two',
    FOOTER: 'Footer text',
    AVATAR_URL: 'https://img.example/a.jpg',
    AVATAR_2X_URL: 'https://img.example/a@2x.jpg',
    AVATAR_ALT: 'Sam',
    GITHUB: 'https://github.com/sam',
    LINKED_IN: 'https://linkedin.com/in/sam',
    SOUND_CLOUD: 'https://soundcloud.com/sam',
    EMAIL: 'sam@example.com',
    EMAIL_TEXT: 'Write to me',
    LANG: 'es',
    OG_URL: 'https://sam.example/',
    SHARE: 'https://sam.example/',
    META_TITLE: 'Sam',
  });
  assert.equal(c.name, 'Sam Lee');
  assert.deepEqual(c.bio, ['One', 'Two']);
  assert.equal(c.footer.text, 'Footer text');
  assert.equal(c.avatar.src, 'https://img.example/a.jpg');
  assert.equal(c.avatar.srcset, 'https://img.example/a@2x.jpg');
  assert.equal(c.lang, 'es');
  assert.equal(c.meta.canonical, 'https://sam.example/');
  assert.equal(c.meta.title, 'Sam');
  assert.equal(c.share.url, 'https://sam.example/');
  const email = c.links.all.find((l) => l.id === 'EMAIL');
  assert.equal(email.href, 'mailto:sam@example.com');
  assert.equal(email.label, 'Write to me');
  assert.ok(c.links.all.find((l) => l.id === 'SOUND_CLOUD'));
});

test('custom buttons come first and BUTTON_ORDER reorders listed names', () => {
  const env = {
    CUSTOM_BUTTON_NAME: 'BLOG,SHOP',
    CUSTOM_BUTTON_URL: 'https://b.example,https://s.example',
    CUSTOM_BUTTON_TEXT: 'Blog,Shop',
    GITHUB: 'https://github.com/x',
    YOUTUBE: 'https://youtube.com/x',
  };
  assert.deepEqual(ids(buildLinks(env)), ['BLOG', 'SHOP', 'YOUTUBE', 'GITHUB']);
  assert.deepEqual(ids(buildLinks({ ...env, BUTTON_ORDER: 'GITHUB,SHOP' })), ['GITHUB', 'SHOP', 'BLOG', 'YOUTUBE']);
  assert.deepEqual(ids(buildLinks({ ...env, BUTTON_ORDER: 'github, blog' })), ['GITHUB', 'BLOG', 'SHOP', 'YOUTUBE']);
});

test('incomplete or unsafe custom buttons are skipped with a warning', () => {
  const warnings = [];
  const links = buildLinks(
    {
      CUSTOM_BUTTON_NAME: 'OK,BAD,MISSING',
      CUSTOM_BUTTON_URL: 'https://ok.example,javascript:alert(1)',
      CUSTOM_BUTTON_TEXT: 'Ok,Bad,Missing',
    },
    warnings,
  );
  assert.deepEqual(ids(links), ['OK']);
  assert.equal(warnings.length, 2);
});

test('escaped commas stay inside list values', () => {
  const [l] = buildLinks({
    CUSTOM_BUTTON_NAME: 'A',
    CUSTOM_BUTTON_URL: 'https://a.example',
    CUSTOM_BUTTON_TEXT: 'Hello\\, world',
    CUSTOM_BUTTON_NOTE: 'One\\, two',
  });
  assert.equal(l.label, 'Hello, world');
  assert.equal(l.note, 'One, two');
});

test('new Neon variables: per-link text and notes, custom icon and colour', () => {
  const [a, b] = buildLinks({
    CUSTOM_BUTTON_NAME: 'APP',
    CUSTOM_BUTTON_URL: 'https://app.example',
    CUSTOM_BUTTON_TEXT: 'My app',
    CUSTOM_BUTTON_ICON: '/media/app.png',
    CUSTOM_BUTTON_COLOR: '#ff0000',
    GITHUB: 'https://github.com/x',
    GITHUB_TEXT: 'Code',
    GITHUB_NOTE: 'What I build',
    GITHUB_ICON: 'javascript:bad',
  });
  assert.equal(a.icon, '/media/app.png');
  assert.equal(a.color, '#ff0000');
  assert.equal(b.label, 'Code');
  assert.equal(b.note, 'What I build');
  assert.equal(b.icon, '/assets/icons/brand-github.svg', 'unsafe icon override falls back to the bundled icon');
});

test('sections: default split keeps the leading run of work links primary', () => {
  const c = buildConfig({
    CUSTOM_BUTTON_NAME: 'ABOUT',
    CUSTOM_BUTTON_URL: 'https://about.example',
    CUSTOM_BUTTON_TEXT: 'About',
    LINKED_IN: 'https://linkedin.com/in/x',
    EMAIL: 'x@example.com',
    INSTAGRAM: 'https://instagram.com/x',
    BUTTON_ORDER: 'ABOUT,LINKED_IN,EMAIL,INSTAGRAM',
    FEATURED_BUTTON: 'none',
  });
  assert.deepEqual(ids(c.links.primary), ['ABOUT', 'LINKED_IN', 'EMAIL']);
  assert.deepEqual(ids(c.links.secondary), ['INSTAGRAM']);
});

test('sections: PRIMARY_BUTTONS chooses the primary list explicitly', () => {
  const c = buildConfig({
    GITHUB: 'https://github.com/x',
    INSTAGRAM: 'https://instagram.com/x',
    YOUTUBE: 'https://youtube.com/x',
    PRIMARY_BUTTONS: 'GITHUB',
    FEATURED_BUTTON: 'none',
  });
  assert.deepEqual(ids(c.links.primary), ['GITHUB']);
  assert.deepEqual(ids(c.links.secondary), ['YOUTUBE', 'INSTAGRAM']);
});

test('featured card: defaults to first primary link, can be chosen, relabelled or turned off', () => {
  const env = {
    CUSTOM_BUTTON_NAME: 'ABOUT,BLOG',
    CUSTOM_BUTTON_URL: 'https://about.example,https://blog.example',
    CUSTOM_BUTTON_TEXT: 'About,Blog',
  };
  let c = buildConfig(env);
  assert.equal(c.links.featured.id, 'ABOUT');
  assert.deepEqual(ids(c.links.primary), ['BLOG'], 'featured link is not repeated');
  c = buildConfig({ ...env, FEATURED_BUTTON: 'blog', FEATURED_TEXT: 'Read this', FEATURED_LABEL: 'New', FEATURED_IMAGE: '/media/me.png' });
  assert.equal(c.links.featured.id, 'BLOG');
  assert.equal(c.links.featured.label, 'Read this');
  assert.equal(c.links.featured.kicker, 'New');
  assert.equal(c.links.featured.image, '/media/me.png');
  assert.equal(c.links.featured.photo, true);
  c = buildConfig({ ...env, FEATURED_BUTTON: 'none' });
  assert.equal(c.links.featured, null);
  c = buildConfig({ ...env, FEATURED_BUTTON: 'nope' });
  assert.equal(c.links.featured, null);
  assert.match(c.warnings.join(), /FEATURED_BUTTON/);
});

test('boot log lines, prompt, {count} and OK badges come from variables', () => {
  const c = buildConfig({
    GITHUB: 'https://github.com/x',
    BOOT_LOG: 'hello|[OK] Linked {count} destinations',
    BOOT_PROMPT: 'me@box:~$',
    BOOT_COMMAND: './go',
  });
  assert.deepEqual(c.boot.lines, [
    { ok: false, text: 'hello' },
    { ok: true, text: 'Linked 1 destinations' },
  ]);
  assert.equal(c.boot.prompt, 'me@box:~$');
  assert.equal(c.boot.command, './go');
  assert.equal(buildConfig({ BOOT_ENABLED: 'false' }).boot.enabled, false);
});

test('text variables for headings, footer, HUD, corners and copyright', () => {
  const c = buildConfig(
    {
      NAME: 'Kim Park',
      LEDE: 'Lede',
      SECTION_PRIMARY_TITLE: 'Work',
      SECTION_SECONDARY_TITLE: 'Social',
      FOOTER_TITLE: 'Thanks',
      HUD_TITLE: 'kim',
      HUD_SUFFIX: '',
      CORNER_LEFT: 'a:1|b:2',
      CORNER_RIGHT: 'host:example.com',
      COPYRIGHT: '© {year} {name}',
      AVATAR_BADGE: '',
    },
    new Date('2030-05-01T00:00:00Z'),
  );
  assert.equal(c.lede, 'Lede');
  assert.equal(c.sections.primaryTitle, 'Work');
  assert.equal(c.sections.secondaryTitle, 'Social');
  assert.equal(c.footer.title, 'Thanks');
  assert.equal(c.hud.title, 'kim');
  assert.equal(c.hud.suffix, '');
  assert.deepEqual(c.corners.left, [{ label: 'a', value: '1' }, { label: 'b', value: '2' }]);
  assert.equal(c.footer.copyright, '© 2030 Kim Park');
  assert.equal(c.avatar.badge, '');
  assert.equal(c.sigil, 'KP');
});

test('safeUrl allows web, mail, phone and same-origin links only', () => {
  for (const ok of ['https://a.example', 'http://a', 'mailto:a@b', 'tel:+1', 'sms:+1', '/x', '#top']) assert.ok(safeUrl(ok), ok);
  for (const bad of ['javascript:alert(1)', 'data:text/html,x', '//evil.example', 'ftp://x', '']) assert.equal(safeUrl(bad), null, bad);
  assert.equal(initials('ada  lovelace byron king'), 'ALB');
});

test('analytics are configured only when complete', () => {
  assert.equal(buildConfig({ UMAMI_WEBSITE_ID: 'x' }).analytics.umami, null);
  const c = buildConfig({ GA_TRACKING_ID: 'G-ABC123', UMAMI_WEBSITE_ID: 'id', UMAMI_APP_URL: 'https://u.example/' });
  assert.equal(c.analytics.ga, 'G-ABC123');
  assert.equal(c.analytics.umami.src, 'https://u.example/script.js');
  assert.equal(buildConfig({ GA_TRACKING_ID: '"><script>' }).analytics.ga, '');
});

test('same-origin paths cannot be turned into another host with a backslash or control characters', () => {
  for (const bad of ['/\\evil.example', '/\t/evil.example', '/\n/evil.example', 'https://a.example/\nx', 'java\tscript:alert(1)']) {
    assert.equal(safeUrl(bad), null, JSON.stringify(bad));
    assert.equal(safeImage(bad), null, JSON.stringify(bad));
  }
  assert.equal(safeImage('/media/a.png'), '/media/a.png');
});

test('LANG given as a POSIX locale becomes a language tag', () => {
  assert.equal(langTag('en_US.UTF-8'), 'en-US');
  assert.equal(langTag('de_DE@euro'), 'de-DE');
  assert.equal(langTag('pt-BR'), 'pt-BR');
  for (const odd of ['C.UTF-8', 'POSIX', '"><x', '']) assert.equal(langTag(odd), 'en', odd);
  assert.equal(buildConfig({ LANG: 'es_MX.UTF-8' }).lang, 'es-MX');
});

test('RELEASE with characters that are invalid in a header is cleaned', () => {
  assert.equal(buildConfig({ RELEASE: 'v1.2\nX-Evil: 1' }).release, 'v1.2X-Evil: 1');
  assert.equal(buildConfig({ RELEASE: '🚀' }).release, 'development');
});

test('initials and SIGIL keep whole characters', () => {
  assert.equal(initials('🦊 Fox'), '🦊F');
  assert.equal(buildConfig({ SIGIL: '🦊🦊🦊🦊' }).sigil, '🦊🦊🦊');
});
