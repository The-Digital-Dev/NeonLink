// Opening Bell: a calm investing-app look with an AI analyst. A chart draws, a ring fills, the bell rings and
// the screen lifts like a curtain. Links are "positions" with a ticker and a decorative sparkline.
// Charts, tickers and sparklines are decoration only; no market data is shown.
// Static files in ./public are served at /theme/. Text comes from the shared content model (config.mjs).
import { esc, attr, json, EARLY_SCRIPT, linkIcon, accentStyle } from '../../html.mjs';

export const meta = {
  name: 'opening-bell',
  title: 'Opening Bell',
  themeColor: '#081A13',
  defaults: {
    primaryTitle: 'The portfolio',
    secondaryTitle: 'Profiles',
    featuredLabel: 'Top pick · start here',
    bootHint: 'tap to skip',
    bootGranted: 'Market open',
    bootStages: 'Pre-market|Reading the tape|Sizing {count} links',
    introLabel: 'AI brief · the thesis',
    disclaimer: 'Charts and sparklines are decoration, not market data or advice.',
  },
};

const ext = (href) => /^https?:/i.test(href);
const targetAttrs = (l) => (ext(l.href) ? ` target="${esc(l.target)}" rel="noopener noreferrer"` : '');
const icon = (l) => linkIcon(l);

// A three-letter ticker from the link's name, e.g. LINKED_IN -> LNK, GITHUB -> GTH.
export function ticker(id) {
  const letters = String(id).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (letters.length <= 3) return letters.padEnd(3, 'X');
  const consonants = letters[0] + letters.slice(1).replace(/[AEIOU]/g, '');
  return (consonants.length >= 3 ? consonants : letters).slice(0, 3);
}

// A stable decorative sparkline seeded by the link's name.
export function sparkline(seed) {
  let s = 0;
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  let y = 20, d = '';
  for (let i = 0; i < 9; i++) {
    y = Math.max(4, Math.min(23, y + (rnd() - 0.62) * 9));
    d += (i ? 'L' : 'M') + ((i / 8) * 58).toFixed(1) + ' ' + y.toFixed(1);
  }
  return `<svg viewBox="0 0 58 26" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="${d}"/></svg>`;
}

function position(l, i) {
  return (
    `<li class="rise" style="--i:${i}"><a class="pos${l.color ? ' accent' : ''} ${esc(l.cls)}" href="${esc(l.href)}"${targetAttrs(l)} data-event="${esc(l.name)}-button"${accentStyle(l)}>` +
    `<span class="tk" aria-hidden="true">${esc(ticker(l.id))}</span>` +
    `<span class="txt"><b>${esc(l.label)}</b>${l.note ? `<small>${esc(l.note)}</small>` : ''}</span>` +
    `<span class="ic">${icon(l)}</span>${sparkline(l.id)}<span class="ar" aria-hidden="true">↗</span></a></li>`
  );
}

function topPick(f, i) {
  const ph = linkIcon({ ...f, alt: '' }, f.image, f.photo ? ' class="photo"' : '');
  return (
    `<li class="rise" style="--i:${i}"><a class="pos top featured${f.color ? ' accent' : ''} ${esc(f.cls)}" href="${esc(f.href)}"${targetAttrs(f)} data-event="${esc(f.name)}-button"${accentStyle(f)}>` +
    `<span class="ph">${ph}</span><span class="txt">${f.kicker ? `<span class="lab mono">${esc(f.kicker)}</span>` : ''}<b>${esc(f.label)}</b>${f.note ? `<small>${esc(f.note)}</small>` : ''}</span>` +
    '<span class="ar" aria-hidden="true">↗</span></a></li>'
  );
}

export function page(c, h) {
  const { featured: f, primary, secondary } = c.links;
  const words = c.name.split(/\s+/).filter(Boolean);
  const last = words.length > 1 ? words.pop() : '';
  const open = [c.avatar.badge, c.location].filter(Boolean).join(' · ');
  let i = 7;
  const items = (f ? topPick(f, i++) : '') + primary.map((l) => position(l, i++)).join('');
  const tapeItems = [f, ...primary].filter(Boolean).map((l) => `<span><b>${esc(ticker(l.id))}</b>${esc(l.label)}<i>↗</i></span>`).join('');
  const boot = c.boot.enabled
    ? '<div class="bell" id="bell" aria-hidden="true"><svg class="line" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#62E6A4" stop-opacity=".22"/><stop offset="1" stop-color="#62E6A4" stop-opacity="0"/></linearGradient></defs>' +
      '<path class="a" d="M0 78 L8 74 L15 79 L23 66 L30 70 L38 55 L46 60 L54 46 L61 52 L69 36 L77 41 L85 26 L92 30 L100 14 L100 100 L0 100Z"/><path class="l" d="M0 78 L8 74 L15 79 L23 66 L30 70 L38 55 L46 60 L54 46 L61 52 L69 36 L77 41 L85 26 L92 30 L100 14"/></svg>' +
      `<div class="seal"><div class="mark" id="mark">${esc(c.sigil)}</div><div class="st mono" id="st"></div></div><div class="skiptxt mono">${esc(c.boot.hint)}</div></div>` +
      `<script type="application/json" id="boot-data">${json({ stages: c.boot.stages, granted: c.boot.granted })}</script>`
    : '';
  const socials = secondary.length
    ? `<nav class="socials rise" style="--i:5" aria-label="${esc(c.sections.secondaryTitle)}">` +
      secondary
        .map((s) => `<a class="${esc(s.cls)}" href="${esc(s.href)}"${targetAttrs(s)} data-event="${esc(s.name)}-button"${accentStyle(s)} aria-label="${esc(s.label)}" title="${esc(s.label)}">${icon(s)}</a>`)
        .join('') +
      '</nav>'
    : '';
  const count = (f ? 1 : 0) + primary.length;
  const brief = c.lede
    ? `<section class="brief rise" style="--i:4" aria-label="${esc(c.introLabel || 'Summary')}">${c.introLabel ? `<span class="k mono">${esc(c.introLabel)}</span>` : ''}<p id="thesis" data-text="${esc(c.lede)}">${esc(c.lede)}</p></section>`
    : '';
  const foot = [c.footer.title && `<b>${esc(c.footer.title)}</b>`, c.footer.text && esc(c.footer.text), esc(c.footer.copyright)].filter(Boolean).join('<br>');

  return (
    `<!doctype html><html lang="${esc(c.lang)}"><head>${h.head(['/theme/fonts.css', '/theme/style.css'])}</head>` +
    `<body id="top" data-boot="${esc(c.boot.mode)}"${c.boot.enabled ? '' : ' class="no-boot"'}>` +
    `<script>${EARLY_SCRIPT}</script>` +
    '<a class="skip" href="#links">Skip to links</a>' +
    '<canvas id="mkt" aria-hidden="true"></canvas><div class="veil" aria-hidden="true"></div>' +
    boot +
    (tapeItems ? `<div class="tape mono" aria-hidden="true"><div>${tapeItems}${tapeItems}</div></div>` : '') +
    '<main class="col"><header class="head">' +
    `<div class="av rise" style="--i:0"><img src="${esc(c.avatar.src || '/avatar.svg')}"${attr('srcset', c.avatar.srcset && `${c.avatar.srcset} 2x`)} alt="${esc(c.avatar.alt)}" width="120" height="120" fetchpriority="high"></div>` +
    (open ? `<span class="open mono rise" style="--i:1"><i></i>${esc(open)}</span>` : '') +
    `<h1 class="rise" style="--i:2">${esc(words.join(' '))}${last ? ` <em>${esc(last)}</em>` : ''}</h1>` +
    (c.bio.length ? `<p class="sub mono rise" style="--i:3">${c.bio.map(esc).join(' · ')}</p>` : '') +
    '</header>' +
    brief +
    socials +
    (count ? `<div class="hdr mono rise" style="--i:6"><b>${esc(c.sections.primaryTitle)}</b><span>${count} ${count === 1 ? 'link' : 'links'}</span></div>` : '') +
    `<ul class="links" id="links" tabindex="-1" aria-label="${esc(c.sections.linksLabel)}">${items}</ul>` +
    (!c.links.all.length ? '<p class="empty mono">No links configured yet. Set link variables in Compose.</p>' : '') +
    `<footer class="foot rise" style="--i:${i}">${foot}${c.disclaimer ? `<span>${esc(c.disclaimer)}</span>` : ''}</footer>` +
    '</main>' +
    h.scripts(['/theme/ui.js', '/theme/scene.js']) +
    '</body></html>'
  );
}

export function favicon(sigil) {
  const s = esc(sigil).slice(0, 18);
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#081A13"/>' +
    '<circle cx="32" cy="32" r="27" fill="none" stroke="#E0B95B" stroke-width="3.5"/>' +
    `<text x="32" y="34" text-anchor="middle" dominant-baseline="central" font-family="Fraunces,Georgia,serif" font-weight="600" font-size="${sigil.length > 2 ? 18 : 24}" fill="#E0B95B">${s}</text></svg>`
  );
}

export function avatar(initials) {
  const s = esc(initials).slice(0, 18);
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#0E261C"/>' +
    '<path d="M0 92 L20 86 L36 90 L54 74 L70 79 L88 60 L104 64 L120 48" fill="none" stroke="#62E6A4" stroke-opacity=".35" stroke-width="2"/>' +
    `<text x="60" y="58" text-anchor="middle" dominant-baseline="central" font-family="Fraunces,Georgia,serif" font-weight="600" font-size="${initials.length > 2 ? 32 : 42}" fill="#E0B95B">${s}</text></svg>`
  );
}
