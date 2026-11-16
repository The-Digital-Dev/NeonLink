// Neon: a cyberpunk link page over a live night-city canvas, with a boot sequence and glitch effects.
// Static files in ./public are served at /theme/. Text comes from the shared content model (config.mjs).
import { esc, attr, json, EARLY_SCRIPT, linkIcon, accentStyle } from '../../html.mjs';

export const meta = { name: 'neon', title: 'Neon', themeColor: '#07060D', };

const isExternal = (href) => /^https?:/i.test(href);
const targetAttrs = (l) => (isExternal(l.href) ? ` target="${esc(l.target)}" rel="noopener noreferrer"` : '');

function card(link) {
  const raster = link.icon && /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(link.icon) ? ' class="raster"' : '';
  const icon = linkIcon(link, link.icon, raster);
  const style = accentStyle(link);
  return (
    `<a class="channel${link.icon ? '' : ' glyph-link'} ${esc(link.cls)}" href="${esc(link.href)}"${targetAttrs(link)} data-event="${esc(link.name)}-button"${style}>` +
    `<span class="brand-icon">${icon}</span>` +
    `<span class="channel-copy"><strong>${esc(link.label)}</strong>${link.note ? `<small>${esc(link.note)}</small>` : ''}</span>` +
    '<span class="channel-arrow" aria-hidden="true">&gt;&gt;</span></a>'
  );
}

function featuredCard(f) {
  const img = linkIcon({ ...f, alt: '' }, f.image, f.photo ? ' class="photo"' : '');
  return (
    `<a class="channel featured ${esc(f.cls)}" href="${esc(f.href)}"${targetAttrs(f)} data-event="${esc(f.name)}-button"${f.image ? '' : accentStyle(f)}>` +
    `<span class="brand-icon">${img}</span>` +
    `<span class="channel-copy"><strong>${esc(f.label)}</strong>${f.kicker ? `<small>${esc(f.kicker)}</small>` : ''}</span>` +
    '<span class="channel-arrow" aria-hidden="true">&gt;&gt;</span></a>'
  );
}

function corner(side, items) {
  if (!items.length) return '';
  const rows = items.map((i) => `${esc(i.label)} <b>${esc(i.value)}</b>`).join('<br>');
  return `<div class="corner ${side} mono" aria-hidden="true">${rows}</div>`;
}

// h: shared page parts from html.mjs ({ head, scripts }).
export function page(c, h) {
  const { featured, primary, secondary } = c.links;
  const bootData = { lines: c.boot.lines, prompt: c.boot.prompt, command: c.boot.command };
  const boot = c.boot.enabled
    ? `<div class="boot" id="boot" aria-hidden="true"><div class="core"><div class="sigil">${esc(c.sigil)}</div><div class="log" id="log"></div><div class="meter" id="meter"></div><div class="pct mono"><span>${esc(c.boot.hint)}</span><b id="pct">00%</b></div></div><div class="grant">${esc(c.boot.granted)}</div></div>` +
      `<script type="application/json" id="boot-data">${json(bootData)}</script>`
    : '';
  const bio = c.bio.length ? `<p class="bio mono seq">${c.bio.map((b) => `<span>${esc(b)}</span>`).join('')}</p>` : '';
  const lede = c.lede ? `<p class="lede seq">${esc(c.lede)}</p>` : '';
  const badge = c.avatar.badge ? `<span aria-hidden="true">${esc(c.avatar.badge)}</span>` : '';
  const share = c.share
    ? `<button id="share" type="button" data-url="${esc(c.share.url)}" data-title="${esc(c.name)}" data-text="${esc(c.bioPlain)}">${esc(c.share.label)} <span aria-hidden="true">↗</span></button>`
    : '';
  const clock = c.hud.clockZone
    ? ` <span id="clock" data-zone="${esc(c.hud.clockZone)}" data-label="${esc(c.hud.clockLabel)}"></span>`
    : '';
  const section = (title, cls, items, label) =>
    items.length
      ? `<div class="list-heading ${cls}-heading mono seq"><h2>${esc(title)}</h2></div>` +
        `<nav class="channel-list ${cls}-list" aria-label="${esc(label)}">${items.map(card).join('')}</nav>`
      : '';
  const footerTitle = c.footer.title ? `<h2>${esc(c.footer.title)}</h2>` : '';
  const footerText = c.footer.text ? `<p>${esc(c.footer.text)}</p>` : '';
  const empty = !c.links.all.length
    ? '<p class="empty mono seq">No links configured yet. Set link variables in Compose.</p>'
    : '';

  return (
    `<!doctype html><html lang="${esc(c.lang)}"><head>${h.head(['/theme/fonts.css', '/theme/style.css'])}</head>` +
    `<body id="top" data-boot="${esc(c.boot.mode)}"${c.boot.enabled ? '' : ' class="no-boot"'}>` +
    `<script>${EARLY_SCRIPT}</script>` +
    '<a class="skip" href="#links">Skip to links</a>' +
    '<canvas id="city" aria-hidden="true"></canvas><div class="fx" aria-hidden="true"></div>' +
    boot +
    `<header class="hud mono" aria-label="Page controls"><span class="sys"><b>${esc(c.hud.title)}</b>${c.hud.suffix ? `<i> ${esc(c.hud.suffix)}</i>` : ''}${clock}</span><div class="controls">${share}</div></header>` +
    '<main class="col">' +
    `<section class="identity" aria-label="About ${esc(c.name)}"><div class="id seq"><img class="profile-photo" src="${esc(c.avatar.src || '/avatar.svg')}"${attr('srcset', c.avatar.srcset && `${c.avatar.srcset} 2x`)} width="136" height="136" alt="${esc(c.avatar.alt)}" fetchpriority="high"><i aria-hidden="true"></i>${badge}</div>` +
    `<h1 class="seq" data-text="${esc(c.name)}">${esc(c.name)}</h1>${bio}${lede}</section>` +
    '<section class="links-panel" id="links" tabindex="-1">' +
    empty +
    (featured ? featuredCard(featured) : '') +
    section(c.sections.secondaryTitle, 'social', secondary, c.sections.secondaryTitle) +
    section(c.sections.primaryTitle, 'primary', primary, c.sections.linksLabel) +
    `<footer class="seq" aria-label="About this website">${footerTitle}${footerText}<div class="footer-bottom mono"><span>${esc(c.footer.copyright)}</span><a href="#top">${esc(c.footer.backToTop)}</a></div></footer>` +
    '</section></main>' +
    corner('l', c.corners.left) +
    corner('r', c.corners.right) +
    '<div id="toast" role="status" aria-live="polite"></div>' +
    h.scripts(['/theme/ui.js', '/theme/scene.js']) +
    '</body></html>'
  );
}

// Favicon in the theme's colours, carrying the configured sigil (initials by default).
export function favicon(sigil) {
  const s = esc(sigil).slice(0, 18);
  const size = sigil.length > 2 ? 17 : 22;
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#00F0FF"/><stop offset=".55" stop-color="#8A5CFF"/><stop offset="1" stop-color="#FF2A9D"/></linearGradient></defs>' +
    '<path d="M17 2h45v45L47 62H2V17z" fill="url(#g)"/><path d="M18.5 6H58v39.5L45.5 58H6V18.5z" fill="#07060D"/>' +
    `<text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="Orbitron,Verdana,sans-serif" font-weight="900" font-size="${size}" fill="#00F0FF">${s}</text></svg>`
  );
}

// Placeholder portrait: initials on the night-sky gradient, framed by the shard clip in CSS.
export function avatar(initials) {
  const s = esc(initials).slice(0, 18);
  const size = initials.length > 2 ? 40 : 52;
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 136 136"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#160A2A"/><stop offset="1" stop-color="#3A0E4A"/></linearGradient></defs>' +
    '<rect width="136" height="136" fill="url(#a)"/><path d="M0 104h136M0 114h136M0 124h136" stroke="#00F0FF" stroke-opacity=".16"/>' +
    `<text x="68" y="64" text-anchor="middle" dominant-baseline="central" font-family="Orbitron,Verdana,sans-serif" font-weight="900" font-size="${size}" fill="#00F0FF" style="paint-order:stroke" stroke="#FF2A9D" stroke-width="1">${s}</text></svg>`
  );
}
