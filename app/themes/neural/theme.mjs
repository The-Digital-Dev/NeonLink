// Neural: the page reads like an AI answering "who is <name>?". A question types itself, a status line
// thinks, the bio streams in and the links arrive as suggested next steps over a drifting neural network.
// Static files in ./public are served at /theme/. Text comes from the shared content model (config.mjs).
import { esc, attr, json, EARLY_SCRIPT, linkIcon, accentStyle } from '../../html.mjs';

export const meta = {
  name: 'neural',
  title: 'Neural',
  themeColor: '#080B12',
  defaults: {
    primaryTitle: 'Suggested next steps',
    secondaryTitle: 'Profiles',
    featuredLabel: 'Start here',
    bootHint: 'tap to skip',
    bootGranted: '',
    bootQuestion: 'who is {name}?',
    bootStages: 'Thinking…|Reading {count} links…|Writing answer…',
    backgroundWords: 'AI|agents|build|explore|prompt|signal|tokens|curiosity|create|connect',
  },
};

const ext = (href) => /^https?:/i.test(href);
const targetAttrs = (l) => (ext(l.href) ? ` target="${esc(l.target)}" rel="noopener noreferrer"` : '');
const icon = (l, cls = '') => linkIcon(l, l.icon, cls);

function button(l, i) {
  return (
    `<li class="gen" style="--i:${i}"><a class="btn ${esc(l.cls)}" href="${esc(l.href)}"${targetAttrs(l)} data-event="${esc(l.name)}-button"${accentStyle(l)}>` +
    `<span class="ic">${icon(l)}</span><span class="tx"><b>${esc(l.label)}</b>${l.note ? `<small>${esc(l.note)}</small>` : ''}</span>` +
    '<span class="key" aria-hidden="true">↗</span></a></li>'
  );
}

function featured(f, i) {
  const ph = linkIcon({ ...f, alt: '' }, f.image, f.photo ? ' class="photo"' : '');
  return (
    `<li class="gen" style="--i:${i}"><a class="btn feat featured ${esc(f.cls)}" href="${esc(f.href)}"${targetAttrs(f)} data-event="${esc(f.name)}-button"${accentStyle(f)}>` +
    `<span class="ph">${ph}</span><span class="tx">${f.kicker ? `<span class="tag">${esc(f.kicker)}</span>` : ''}<b>${esc(f.label)}</b>${f.note ? `<small>${esc(f.note)}</small>` : ''}</span>` +
    '<span class="key" aria-hidden="true">↵</span></a></li>'
  );
}

export function page(c, h) {
  const { featured: f } = c.links;
  // The first email link becomes the "prompt bar" at the end, as in the concept.
  const mail = [...c.links.primary, ...c.links.secondary].find((l) => l.href.startsWith('mailto:'));
  const stack = c.links.primary.filter((l) => l !== mail);
  const secondary = c.links.secondary.filter((l) => l !== mail);
  let i = 2;
  const items = (f ? featured(f, i++) : '') + stack.map((l) => button(l, i++)).join('');
  const status = [c.hud.title, c.avatar.badge && c.avatar.badge.toLowerCase(), c.location].filter(Boolean).join(' · ');
  const words = c.name.split(/\s+/).filter(Boolean);
  const bold = c.bio.length ? c.bio.map((b) => (/[.!?…]$/.test(b) ? b : `${b}.`)).join(' ') : '';
  const bioText = [bold, c.lede].filter(Boolean).join(' ');
  const boot = c.boot.enabled
    ? `<div class="loader" id="loader" aria-hidden="true"><div class="box"><div class="lmark">${esc(c.sigil)}</div><div class="q"><span id="q"></span><span class="caret"></span></div><div class="think" id="think"><i class="orb"></i><span id="tk"></span></div></div><div class="skiptxt mono">${esc(c.boot.hint)}</div></div>` +
      `<script type="application/json" id="boot-data">${json({ question: c.boot.question, stages: c.boot.stages })}</script>`
    : '';
  const socials = secondary.length
    ? `<nav class="socials gen" style="--i:0" aria-label="${esc(c.sections.secondaryTitle)}">` +
      secondary
        .map((s) => `<a class="${esc(s.cls)}" href="${esc(s.href)}"${targetAttrs(s)} data-event="${esc(s.name)}-button"${accentStyle(s)} aria-label="${esc(s.label)}" title="${esc(s.label)}">${icon(s)}</a>`)
        .join('') +
      '</nav>'
    : '';
  const prompt = mail
    ? `<a class="prompt gen" style="--i:${i++}" href="${esc(mail.href)}" data-event="${esc(mail.name)}-button"><span>${esc(mail.label)}: <b>${esc(mail.href.replace(/^mailto:/i, ''))}</b></span><i aria-hidden="true">↑</i></a>`
    : '';
  const foot = [c.footer.title && `<b>${esc(c.footer.title)}</b>`, c.footer.text && esc(c.footer.text), esc(c.footer.copyright)].filter(Boolean).join('<br>');
  const empty = !c.links.all.length ? '<p class="empty mono">No links configured yet. Set link variables in Compose.</p>' : '';

  return (
    `<!doctype html><html lang="${esc(c.lang)}"><head>${h.head(['/theme/fonts.css', '/theme/style.css'])}</head>` +
    `<body id="top" data-boot="${esc(c.boot.mode)}"${c.boot.enabled ? '' : ' class="no-boot"'}>` +
    `<script>${EARLY_SCRIPT}</script>` +
    '<a class="skip" href="#links">Skip to links</a>' +
    `<canvas id="net" aria-hidden="true"></canvas><div class="glow" aria-hidden="true"></div>` +
    `<script type="application/json" id="scene-data">${json({ words: c.backgroundWords })}</script>` +
    boot +
    '<main class="col">' +
    (status ? `<span class="status mono"><i></i>${esc(status)}</span>` : '') +
    `<div class="avatar"><span class="ring"><i></i></span><span class="ring b"><i></i></span><img src="${esc(c.avatar.src || '/avatar.svg')}"${attr('srcset', c.avatar.srcset && `${c.avatar.srcset} 2x`)} alt="${esc(c.avatar.alt)}" width="100" height="100" fetchpriority="high"></div>` +
    `<h1 aria-label="${esc(c.name)}">${words.map((w) => `<span class="w" aria-hidden="true">${esc(w)}</span>`).join(' ')}</h1>` +
    (bioText ? `<p class="bio" id="bio" data-bold="${esc(bold)}" data-rest="${esc(c.lede)}">${bold ? `<b>${esc(bold)}</b>` : ''}${c.lede ? ` ${esc(c.lede)}` : ''}</p>` : '') +
    socials +
    (items ? `<span class="label mono gen" style="--i:1">${esc(c.sections.primaryTitle)}</span>` : '') +
    `<ul class="links" id="links" tabindex="-1" aria-label="${esc(c.sections.linksLabel)}">${items}</ul>` +
    empty +
    prompt +
    `<footer class="foot mono gen" style="--i:${i}">${foot}</footer>` +
    '</main>' +
    h.scripts(['/theme/ui.js', '/theme/scene.js']) +
    '</body></html>'
  );
}

const GRAD =
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7CF5C4"/><stop offset=".5" stop-color="#8FA8FF"/><stop offset="1" stop-color="#FF9BD2"/></linearGradient></defs>';

export function favicon(sigil) {
  const s = esc(sigil).slice(0, 18);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${GRAD}<circle cx="32" cy="32" r="30" fill="#080B12"/>` +
    '<circle cx="32" cy="32" r="27" fill="none" stroke="url(#g)" stroke-width="4"/>' +
    `<text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="Sora,Verdana,sans-serif" font-weight="800" font-size="${sigil.length > 2 ? 17 : 22}" fill="#EEF1F8">${s}</text></svg>`
  );
}

export function avatar(initials) {
  const s = esc(initials).slice(0, 18);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${GRAD}<rect width="100" height="100" fill="#10141F"/>` +
    '<circle cx="50" cy="50" r="40" fill="none" stroke="url(#g)" stroke-opacity=".35" stroke-width="1.5"/>' +
    `<text x="50" y="51" text-anchor="middle" dominant-baseline="central" font-family="Sora,Verdana,sans-serif" font-weight="800" font-size="${initials.length > 2 ? 26 : 34}" fill="url(#g)">${s}</text></svg>`
  );
}
