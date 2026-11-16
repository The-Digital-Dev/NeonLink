// Shared HTML helpers for every theme: escaping, the <head> metadata and the script tags.
import { createHash } from 'node:crypto';

export const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// A link's picture: its image, else its emoji, else a monogram (the theme styles .glyph).
export function linkIcon(l, src = l.icon, extra = '') {
  if (src) return `<img src="${esc(src)}" alt="${esc(l.alt || '')}"${extra} loading="lazy">`;
  if (l.glyph?.emoji) return `<span class="glyph emoji" aria-hidden="true">${esc(l.glyph.emoji)}</span>`;
  return `<span class="glyph mono" aria-hidden="true">${esc(l.glyph?.mono || '↗')}</span>`;
}
// Accent colour custom properties for a link (validated in config.mjs): --accent and its readable ink.
// --accent is the colour as given (fills), --accent-fg a version readable on the dark themes (text, borders).
export const accentStyle = (l) =>
  l.color ? ` style="--accent:${esc(l.color)};--accent-ink:${esc(l.ink || '#000000')};--accent-fg:${esc(l.fg || l.color)};--channel-accent:${esc(l.color)}"` : '';
export const attr = (name, value) => (value ? ` ${name}="${esc(value)}"` : '');
// JSON inside <script type="application/json"> must not be able to close the element.
export const json = (v) =>
  JSON.stringify(v).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

// Runs before first paint so entrance animations only apply when scripts run. The timeout is a
// safety net: content always appears even if the theme script fails to load. Allowed by CSP hash.
// With BOOT_MODE=once it also marks a repeat visit, so the loader never flashes before the theme script runs.
export const EARLY_SCRIPT =
  "document.documentElement.classList.add('js');try{if(document.body.dataset.boot==='once'&&sessionStorage.getItem('neonlink-boot-seen')==='1')document.documentElement.classList.add('boot-seen')}catch(e){}setTimeout(function(){document.body.classList.add('ready')},6000);";
export const EARLY_SCRIPT_HASH = `'sha256-${createHash('sha256').update(EARLY_SCRIPT).digest('base64')}'`;

function analyticsTags(a, v) {
  const data = {};
  if (a.ga) data.ga = a.ga;
  if (a.umami) data.umami = a.umami;
  if (a.matomo) data.matomo = a.matomo;
  if (a.plausible) data.plausible = a.plausible;
  if (!Object.keys(data).length) return '';
  return `<script type="application/json" id="analytics-config">${json(data)}</script><script src="/assets/analytics.js?v=${v}" defer></script>`;
}

// Builds the helpers handed to a theme's page(): head(stylesheets) and scripts(sources).
// v is a content hash of the static files, used to bust caches between releases.
export function parts(c, v, themeColor) {
  const m = c.meta;
  return {
    head(styles = []) {
      const tags = [
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
        `<meta name="robots" content="${esc(m.robots)}">`,
        `<meta name="theme-color" content="${esc(m.themeColor || themeColor)}">`,
        `<title>${esc(m.title)}</title>`,
        m.description && `<meta name="description" content="${esc(m.description)}">`,
        m.author && `<meta name="author" content="${esc(m.author)}">`,
        m.keywords && `<meta name="keywords" content="${esc(m.keywords)}">`,
        m.canonical && `<link rel="canonical" href="${esc(m.canonical)}">`,
        '<meta property="og:type" content="website">',
        `<meta property="og:title" content="${esc(m.og.title)}">`,
        m.og.description && `<meta property="og:description" content="${esc(m.og.description)}">`,
        m.og.siteName && `<meta property="og:site_name" content="${esc(m.og.siteName)}">`,
        m.og.url && `<meta property="og:url" content="${esc(m.og.url)}">`,
        m.og.image && `<meta property="og:image" content="${esc(m.og.image)}">`,
        m.og.image && m.og.imageWidth && `<meta property="og:image:width" content="${esc(m.og.imageWidth)}">`,
        m.og.image && m.og.imageHeight && `<meta property="og:image:height" content="${esc(m.og.imageHeight)}">`,
        `<meta name="twitter:card" content="${esc(m.twitter.card)}">`,
        m.twitter.site && `<meta name="twitter:site" content="${esc(m.twitter.site)}">`,
        m.twitter.creator && `<meta name="twitter:creator" content="${esc(m.twitter.creator)}">`,
        `<meta name="twitter:title" content="${esc(m.twitter.title)}">`,
        m.twitter.description && `<meta name="twitter:description" content="${esc(m.twitter.description)}">`,
        m.twitter.image && `<meta name="twitter:image" content="${esc(m.twitter.image)}">`,
        m.favicon
          ? `<link rel="icon" href="${esc(m.favicon)}">`
          : `<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=${v}">`,
        m.appleTouchIcon && `<link rel="apple-touch-icon" href="${esc(m.appleTouchIcon)}">`,
        ...styles.map((s) => `<link rel="stylesheet" href="${esc(s)}?v=${v}">`),
      ];
      return tags.filter(Boolean).join('');
    },
    scripts(sources = []) {
      return sources.map((s) => `<script src="${esc(s)}?v=${v}" defer></script>`).join('') + analyticsTags(c.analytics, v);
    },
  };
}
