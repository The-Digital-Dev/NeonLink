// Turns environment variables into the page model. Pure: no I/O, so it is easy to test.
// Variable names follow littlelink-server so an existing Compose file keeps working.
// Every default here is generic: personal content belongs in configuration only.
import { PLATFORMS } from './platforms.mjs';
import { PRODUCT } from './product.mjs';
import { THEMES, DEFAULT_THEME, LEGACY_THEME_VALUES } from './themes/index.mjs';

const str = (env, key, fallback = '') => {
  const v = env[key];
  return v === undefined ? fallback : String(v);
};
// Returns undefined when the variable is unset, so "set but empty" can hide an element.
const opt = (env, key) => (env[key] === undefined ? undefined : String(env[key]));
// Splits a list variable. A backslash before the separator ("\," or "\|") keeps it as text,
// so labels can contain commas. Plain values behave exactly as in littlelink-server.
const list = (value, sep = ',') => {
  const out = [];
  let cur = '';
  const s = String(value ?? '');
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && s[i + 1] === sep) {
      cur += sep;
      i++;
    } else if (s[i] === sep) {
      out.push(cur.trim());
      cur = '';
    } else cur += s[i];
  }
  out.push(cur.trim());
  return out;
};
const flag = (env, key, fallback) => {
  const v = env[key];
  if (v === undefined || v === '') return fallback;
  return !/^(0|false|no|off)$/i.test(String(v).trim());
};
// Compose values cannot hold real newlines easily, so "\n" written literally means a newline.
const unescape = (v) => String(v).replace(/\\n/g, '\n');

// Only schemes that are safe in an href. Anything else becomes "#" and is reported in warnings.
// Browsers drop tabs and newlines inside URLs and read "\\" as "/", so "/\\host" or "/<tab>/host"
// would leave the site. Control characters are refused and a same-origin path cannot start "//" or "/\\".
const CONTROL = /[\u0000-\u001f\u007f]/;
const SAME_ORIGIN = /^\/(?![/\\])/;
export function safeUrl(value) {
  const v = String(value ?? '').trim();
  if (CONTROL.test(v)) return null;
  if (/^(https?:|mailto:|tel:|sms:)/i.test(v)) return v;
  if (SAME_ORIGIN.test(v) || v.startsWith('#')) return v;
  return null;
}
// Images may be absolute http(s) or a same-origin path.
export function safeImage(value) {
  const v = String(value ?? '').trim();
  if (CONTROL.test(v)) return null;
  if (/^https?:\/\//i.test(v) || SAME_ORIGIN.test(v)) return v;
  return null;
}
// LANG is also the POSIX locale variable (for example "en_US.UTF-8"); turn that into a language tag.
export function langTag(value) {
  const v = String(value ?? '').trim().replace(/[.@].*$/, '').replace(/_/g, '-');
  return /^[a-z]{2,8}(-[a-z0-9]{1,8})*$/i.test(v) && !/^(c|posix)$/i.test(v) ? v : 'en';
}
const slug = (v) =>
  String(v)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'link';

export function initials(name) {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'LX';
  return words
    .slice(0, 3)
    .map((w) => [...w][0]) // whole code points, so an emoji is not split in half
    .join('')
    .toUpperCase();
}

function bootLine(text) {
  const ok = /^\[\s*OK\s*\]\s*/i.exec(text);
  return ok ? { ok: true, text: text.slice(ok[0].length) } : { ok: false, text };
}

function corner(value) {
  return list(value, '|')
    .filter(Boolean)
    .map((pair) => {
      const i = pair.indexOf(':');
      return i < 0 ? { label: '', value: pair } : { label: pair.slice(0, i).trim(), value: pair.slice(i + 1).trim() };
    });
}

// First letter or digit of a label, for links without a picture (styled per theme).
export function monogram(text) {
  const ch = [...String(text).normalize('NFC')].find((c) => /[\p{L}\p{N}]/u.test(c));
  return ch ? ch.toLocaleUpperCase() : '↗';
}

// Emoji only: pictographs with their modifiers, joiners, variation selectors and keycaps (no letters or bidi controls).
const EMOJI = /^(?:[\p{Extended_Pictographic}\p{Emoji_Component}\u200d\ufe0f\u20e3])+$/u;
// A custom link icon: an image URL or /media/ path, the name of any built-in platform (for example
// "github" or "brand-etsy"), or an emoji. Anything else falls back to the monogram, with a warning.
export function resolveIcon(value, warnings = [], where = 'link') {
  const v = String(value ?? '').trim();
  if (!v) return { icon: null };
  const img = safeImage(v);
  if (img) return { icon: img };
  const key = v.toLowerCase().replace(/^brand[-:]/, '').replace(/[\s_-]/g, '');
  const p = PLATFORMS.find((x) => x.name.replace(/[\s_-]/g, '') === key || x.key.toLowerCase().replace(/_/g, '') === key);
  if (p) return { icon: `/assets/icons/${p.icon}` };
  if (EMOJI.test(v) && /\p{Extended_Pictographic}|\u20e3/u.test(v) && [...v].length <= 8) return { icon: null, emoji: v };
  warnings.push(`${where}: icon "${v.slice(0, 40)}" is not an image, platform name or emoji; using a monogram.`);
  return { icon: null };
}

// An accent colour (#rgb or #rrggbb; alpha in #rrggbbaa is ignored) plus a readable text colour on it.
export function accentColor(value, warnings = [], where = 'link') {
  const v = String(value ?? '').trim();
  if (!v) return null;
  const m = /^#(?:([0-9a-f]{3})[0-9a-f]?|([0-9a-f]{6})(?:[0-9a-f]{2})?)$/i.exec(v);
  if (!m) {
    warnings.push(`${where}: colour "${v.slice(0, 20)}" is not #rgb or #rrggbb; ignored.`);
    return null;
  }
  const hex = (m[1] ? m[1].replace(/./g, (c) => c + c) : m[2]).toLowerCase();
  const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const lum = (c) => c.map((x) => x / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)).reduce((t, x, i) => t + x * [0.2126, 0.7152, 0.0722][i], 0);
  // Text and borders sit on dark backgrounds (about #0B0B14): lighten the colour until it reads (contrast 3:1).
  const bg = lum([11, 11, 20]);
  let fg = rgb, step = 0;
  while ((lum(fg) + 0.05) / (bg + 0.05) < 3 && step < 10) fg = rgb.map((x) => Math.round(x + (255 - x) * (++step / 10)));
  const toHex = (c) => '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('');
  return { color: `#${hex}`, ink: lum(rgb) > 0.179 ? '#000000' : '#FFFFFF', fg: toHex(fg) };
}

// Builds the ordered list of links from built-in platform variables and CUSTOM_BUTTON_* lists.
export function buildLinks(env, warnings = []) {
  const target = str(env, 'BUTTON_TARGET', '_blank') || '_blank';
  const links = [];

  // Custom buttons come first in source order, as in littlelink-server.
  // One custom link from either form (comma lists or LINK_<n>_*). URL and label are required.
  const addCustom = ({ name, url, text, note = '', icon = '', color = '', alt = '' }, where) => {
    if (!name || !url || !text) {
      warnings.push(`${where} skipped: a name, URL and label all need a value.`);
      return;
    }
    const href = safeUrl(url);
    if (!href) {
      warnings.push(`${where} ("${name}") skipped: unsupported URL scheme.`);
      return;
    }
    const pic = resolveIcon(icon, warnings, where);
    const accent = accentColor(color, warnings, where);
    links.push({
      id: name.toUpperCase(),
      name: name.toLowerCase(),
      cls: slug(name),
      href,
      label: text,
      note,
      icon: pic.icon,
      glyph: pic.emoji ? { emoji: pic.emoji } : { mono: monogram(text) },
      alt: alt || '',
      color: accent?.color || null,
      ink: accent?.ink || null,
      fg: accent?.fg || null,
      custom: true,
      target,
    });
  };

  // Legacy littlelink-server form: comma lists, items in the same position belong together.
  const names = list(env.CUSTOM_BUTTON_NAME);
  const urls = list(env.CUSTOM_BUTTON_URL);
  const notes = list(env.CUSTOM_BUTTON_NOTE);
  const colors = list(env.CUSTOM_BUTTON_COLOR);
  const icons = list(env.CUSTOM_BUTTON_ICON);
  const alts = list(env.CUSTOM_BUTTON_ALT_TEXT);
  if (env.CUSTOM_BUTTON_TEXT) {
    list(env.CUSTOM_BUTTON_TEXT).forEach((text, i) =>
      addCustom({ name: names[i], url: urls[i], text, note: notes[i], icon: icons[i], color: colors[i], alt: alts[i] }, `Custom button ${i + 1}`),
    );
  }
  // Indexed form, one variable per field: LINK_1_URL, LINK_1_TEXT, LINK_1_NAME, LINK_1_NOTE, LINK_1_ICON,
  // LINK_1_COLOR, LINK_1_ALT. Numbers need not be continuous; links follow the numbers.
  const FIELDS = new Set(['URL', 'TEXT', 'NAME', 'NOTE', 'ICON', 'COLOR', 'ALT', 'ALT_TEXT']);
  const indexes = new Set();
  for (const k of Object.keys(env)) {
    const m = /^LINK_(\d+)_([A-Z_]+)$/.exec(k);
    if (!m) continue;
    if (!/^[1-9]\d{0,2}$/.test(m[1])) warnings.push(`${k} ignored: link numbers are 1 to 999 without leading zeros.`);
    else if (!FIELDS.has(m[2])) warnings.push(`${k} ignored: LINK_<n>_ takes URL, TEXT, NAME, NOTE, ICON, COLOR or ALT.`);
    else indexes.add(Number(m[1]));
  }
  for (const n of [...indexes].sort((a, b) => a - b)) {
    const v = (f) => str(env, `LINK_${n}_${f}`).trim();
    if (!v('URL') && !v('TEXT')) continue;
    addCustom({ name: v('NAME') || `LINK${n}`, url: v('URL'), text: v('TEXT'), note: v('NOTE'), icon: v('ICON'), color: v('COLOR'), alt: v('ALT') || v('ALT_TEXT') }, `LINK_${n}`);
  }

  for (const p of PLATFORMS) {
    const raw = env[p.key];
    if (!raw) continue;
    // EMAIL takes a plain address, PHONE and SMS a plain number; the scheme is added here.
    const plain = (scheme) => String(raw).replace(new RegExp(`^${scheme}:`, 'i'), '').trim();
    const href =
      p.scheme === 'mailto' ? `mailto:${plain('mailto')}`
      : p.scheme === 'tel' || p.scheme === 'sms' ? (/^\+?(?=(?:\D*\d){3})[0-9 ().-]+$/.test(plain(p.scheme)) ? `${p.scheme}:${plain(p.scheme).replace(/[ ().-]/g, '')}` : null)
      : safeUrl(raw);
    if (!href) {
      warnings.push(p.scheme === 'tel' || p.scheme === 'sms' ? `${p.key} skipped: not a phone number.` : `${p.key} skipped: unsupported URL scheme.`);
      continue;
    }
    links.push({
      id: p.key,
      name: p.name,
      cls: slug(p.name),
      href,
      label: str(env, `${p.key}_TEXT`) || p.label,
      note: str(env, `${p.key}_NOTE`),
      icon: safeImage(env[`${p.key}_ICON`]) || `/assets/icons/${p.icon}`,
      glyph: { mono: monogram(p.label) },
      alt: '',
      color: null,
      ink: null,
      custom: false,
      target,
    });
  }

  // BUTTON_ORDER: listed names first, in the listed order; the rest keep their source order.
  if (env.BUTTON_ORDER) {
    const order = list(env.BUTTON_ORDER)
      .filter(Boolean)
      .map((x) => x.toUpperCase());
    const rank = (l) => {
      const i = order.indexOf(l.id);
      return i < 0 ? order.length : i;
    };
    links.sort((a, b) => rank(a) - rank(b)); // Array.prototype.sort is stable.
  }
  const ids = new Set();
  for (const l of links) {
    if (ids.has(l.id)) warnings.push(`Two links are named ${l.id}; BUTTON_ORDER, PRIMARY_BUTTONS and FEATURED_BUTTON use the first. Give one a different name.`);
    ids.add(l.id);
  }
  return links;
}

// Splits links into the primary list ("Uplinks") and the compact grid ("Around the web").
export function splitSections(env, links) {
  if (env.PRIMARY_BUTTONS !== undefined) {
    const wanted = new Set(
      list(env.PRIMARY_BUTTONS)
        .filter(Boolean)
        .map((x) => x.toUpperCase()),
    );
    return {
      primary: links.filter((l) => wanted.has(l.id)),
      secondary: links.filter((l) => !wanted.has(l.id)),
    };
  }
  // Default, matching the earlier presentation: the leading run of work links
  // (custom buttons, LinkedIn and email) is primary; everything after is the grid.
  const work = (l) => l.custom || ['LINKED_IN', 'EMAIL', 'EMAIL_ALT'].includes(l.id);
  let boundary = links.findIndex((l) => !work(l));
  if (boundary < 0) boundary = links.length;
  return { primary: links.slice(0, boundary), secondary: links.slice(boundary) };
}

// Default wording. A theme can replace any of these in its meta.defaults.
export const BASE_DEFAULTS = Object.freeze({
  primaryTitle: 'Uplinks',
  secondaryTitle: 'Around the web',
  featuredLabel: 'Featured // start here',
  bootLog: ['{handle}.sys booting', '[OK] Mounted /home/guest', '[OK] Reached target network.online', '[OK] Loaded {platforms}', '[OK] Linked {count} destinations'].join('|'),
  bootPrompt: 'guest@{handle}:~$',
  bootCommand: './welcome.sh',
  bootHint: 'booting · tap to skip',
  bootGranted: 'Access granted',
  bootQuestion: 'who is {name}?',
  bootStages: 'Thinking…|Reading {count} links…|Writing answer…',
  introLabel: '',
  disclaimer: '',
  backgroundWords: 'build|explore|signal|prompt|curiosity|create|connect|links',
});

export function buildConfig(env = process.env, now = new Date()) {
  const warnings = [];
  // THEME picks the design. Unknown values fall back to the default with a warning.
  const themeRaw = str(env, 'THEME').trim().toLowerCase();
  let theme = DEFAULT_THEME;
  if (themeRaw && Object.hasOwn(THEMES, themeRaw)) theme = themeRaw;
  else if (themeRaw && !LEGACY_THEME_VALUES.includes(themeRaw)) {
    warnings.push(`THEME "${env.THEME}" is not installed; using "${DEFAULT_THEME}". Installed: ${Object.keys(THEMES).join(', ')}.`);
  }

  // Wording a theme may change: these defaults apply only when the variable is unset.
  const d = { ...BASE_DEFAULTS, ...(THEMES[theme].meta.defaults || {}) };
  const name = str(env, 'NAME', PRODUCT) || PRODUCT;
  const bioRaw = str(env, 'BIO', 'Links | Projects | Contact');
  const bio = list(bioRaw, '|').filter(Boolean);
  const bioPlain = bio.join(' | ');

  const links = buildLinks(env, warnings);
  const { primary, secondary } = splitSections(env, links);

  // Featured card: FEATURED_BUTTON names a link; default is the first primary link; "none" turns it off.
  let featured = null;
  const fb = opt(env, 'FEATURED_BUTTON');
  if (fb === undefined || fb === '') featured = primary[0] || null;
  else if (!/^none$/i.test(fb)) {
    featured = links.find((l) => l.id === fb.trim().toUpperCase()) || null;
    if (!featured) warnings.push(`FEATURED_BUTTON "${fb}" does not match any configured link.`);
  }
  if (featured) {
    // The featured card always sits on top, so take it out of whichever list held it.
    const drop = (arr) => arr.filter((l) => l !== featured);
    primary.splice(0, primary.length, ...drop(primary));
    secondary.splice(0, secondary.length, ...drop(secondary));
    featured = {
      ...featured,
      label: str(env, 'FEATURED_TEXT') || featured.label,
      kicker: str(env, 'FEATURED_LABEL', d.featuredLabel),
      image: safeImage(env.FEATURED_IMAGE) || featured.icon,
      photo: Boolean(safeImage(env.FEATURED_IMAGE)),
    };
  }

  const avatar = safeImage(env.AVATAR_URL); // null: the theme's default avatar
  const year = String(now.getFullYear());
  const fill = (v) => String(v).replace(/\{year\}/g, year).replace(/\{name\}/g, name);
  const count = links.length;
  const handle = str(env, 'HUD_TITLE') || name.toLowerCase().replace(/\s+/g, '_');
  // Loader tokens: {name}, {first}, {handle}, {count}, {platforms} (up to four link labels), {year}.
  const platforms = links.filter((l) => !l.custom && /^https?:/i.test(l.href)).slice(0, 4).map((l) => l.label).join(' · ') || 'links';
  const fillAll = (v) =>
    fill(v)
      .replace(/\{count\}/g, String(count))
      .replace(/\{first\}/g, name.split(/\s+/)[0] || name)
      .replace(/\{handle\}/g, handle)
      .replace(/\{platforms\}/g, platforms);
  // BOOT_MODE: full (default), short (about twice as fast), once (first visit in a browser session), off.
  const modeRaw = str(env, 'BOOT_MODE').trim().toLowerCase();
  let bootMode = ['full', 'short', 'once', 'off'].includes(modeRaw) ? modeRaw : 'full';
  if (modeRaw && !['full', 'short', 'once', 'off'].includes(modeRaw)) warnings.push(`BOOT_MODE "${modeRaw}" is not full, short, once or off; using full.`);
  if (!flag(env, 'BOOT_ENABLED', true)) bootMode = 'off';

  const share = env.SHARE ? safeUrl(env.SHARE) : null;
  if (env.SHARE && !share) warnings.push('SHARE ignored: unsupported URL scheme.');

  const ogUrl = env.OG_URL ? safeUrl(env.OG_URL) : null;
  const metaTitle = str(env, 'META_TITLE') || `${name} — Links`;
  const description = str(env, 'META_DESCRIPTION') || bioPlain;
  const ogImage = safeImage(env.OG_IMAGE) || (avatar && avatar.startsWith('http') ? avatar : null);

  return {
    warnings,
    theme,
    lang: langTag(str(env, 'LANG', 'en')),
    name,
    bio,
    bioPlain,
    lede: str(env, 'LEDE'),
    location: str(env, 'LOCATION'),
    introLabel: str(env, 'INTRO_LABEL', d.introLabel),
    disclaimer: str(env, 'DISCLAIMER', d.disclaimer),
    backgroundWords: list(str(env, 'BACKGROUND_WORDS') || d.backgroundWords, '|').filter(Boolean).slice(0, 24),
    avatar: {
      src: avatar,
      srcset: safeImage(env.AVATAR_2X_URL),
      alt: str(env, 'AVATAR_ALT') || `Portrait of ${name}`,
      badge: str(env, 'AVATAR_BADGE', 'ONLINE'),
    },
    hud: {
      title: handle,
      suffix: str(env, 'HUD_SUFFIX', '// link.sys'),
      clockZone: str(env, 'CLOCK_TIMEZONE'),
      clockLabel: str(env, 'CLOCK_LABEL'),
    },
    share: share ? { url: share, label: str(env, 'SHARE_TEXT', 'Share') || 'Share' } : null,
    sigil: [...(str(env, 'SIGIL') || initials(name))].slice(0, 3).join(''),
    boot: {
      enabled: bootMode !== 'off',
      mode: bootMode,
      lines: list(str(env, 'BOOT_LOG') || d.bootLog, '|')
        .filter(Boolean)
        .map((l) => bootLine(fillAll(l))),
      prompt: fillAll(str(env, 'BOOT_PROMPT', d.bootPrompt)),
      command: fillAll(str(env, 'BOOT_COMMAND', d.bootCommand)),
      hint: fillAll(str(env, 'BOOT_HINT', d.bootHint)),
      granted: fillAll(str(env, 'BOOT_GRANTED', d.bootGranted)),
      question: fillAll(str(env, 'BOOT_QUESTION', d.bootQuestion)),
      stages: list(str(env, 'BOOT_STAGES') || d.bootStages, '|').filter(Boolean).map(fillAll),
    },
    sections: {
      primaryTitle: str(env, 'SECTION_PRIMARY_TITLE', d.primaryTitle),
      secondaryTitle: str(env, 'SECTION_SECONDARY_TITLE', d.secondaryTitle),
      linksLabel: str(env, 'LINKS_LABEL') || `${name} links`,
    },
    links: { all: links, featured, primary, secondary },
    footer: {
      title: str(env, 'FOOTER_TITLE'),
      text: str(env, 'FOOTER'),
      copyright: fill(str(env, 'COPYRIGHT', '© {year} {name}')),
      backToTop: str(env, 'BACK_TO_TOP_TEXT', 'Back to top ↑'),
    },
    corners: { left: corner(str(env, 'CORNER_LEFT', 'sys:online')), right: corner(str(env, 'CORNER_RIGHT')) },
    meta: {
      title: metaTitle,
      description,
      author: str(env, 'META_AUTHOR'),
      keywords: str(env, 'META_KEYWORDS'),
      robots: str(env, 'META_INDEX_STATUS', 'index,follow') || 'index,follow',
      themeColor: /^#[0-9a-f]{3,8}$/i.test(env.THEME_COLOR || '') ? env.THEME_COLOR : null,
      canonical: ogUrl,
      og: {
        title: str(env, 'OG_TITLE') || name,
        description: str(env, 'OG_DESCRIPTION') || description,
        siteName: str(env, 'OG_SITE_NAME'),
        url: ogUrl,
        image: ogImage,
        imageWidth: str(env, 'OG_IMAGE_WIDTH'),
        imageHeight: str(env, 'OG_IMAGE_HEIGHT'),
      },
      twitter: {
        card: str(env, 'TWITTER_CARD', 'summary') || 'summary',
        site: str(env, 'TWITTER_SITE'),
        creator: str(env, 'TWITTER_CREATOR'),
        title: str(env, 'TWITTER_TITLE') || name,
        description: str(env, 'TWITTER_DESCRIPTION') || description,
        image: safeImage(env.TWITTER_IMAGE) || ogImage,
      },
      favicon: safeImage(env.FAVICON_URL),
      appleTouchIcon: safeImage(env.APPLE_TOUCH_ICON_URL),
    },
    analytics: {
      // Cloudflare injects its Web Analytics beacon at the edge; this only lets the CSP allow it.
      cloudflare: flag(env, 'CLOUDFLARE_WEB_ANALYTICS', false),
      ga: /^[A-Z0-9-]{4,30}$/i.test(env.GA_TRACKING_ID || '') ? env.GA_TRACKING_ID : '',
      umami:
        env.UMAMI_WEBSITE_ID && safeImage(env.UMAMI_APP_URL)
          ? {
              id: env.UMAMI_WEBSITE_ID,
              src: `${String(env.UMAMI_APP_URL).replace(/\/$/, '')}/${str(env, 'UMAMI_SCRIPT_NAME', 'script.js').replace(/^\//, '')}`,
            }
          : null,
      matomo:
        env.MATOMO_SITE_ID && safeImage(env.MATOMO_URL)
          ? { url: String(env.MATOMO_URL).replace(/\/?$/, '/'), site: String(env.MATOMO_SITE_ID) }
          : null,
      plausible:
        env.PLAUSIBLE_DATA_DOMAIN && safeImage(env.PLAUSIBLE_URL)
          ? { src: env.PLAUSIBLE_URL, domain: env.PLAUSIBLE_DATA_DOMAIN, api: safeImage(env.PLAUSIBLE_DATA_API) }
          : null,
    },
    robots: env.ROBOTS_TXT
      ? unescape(env.ROBOTS_TXT)
      : `User-agent: *\nAllow: /\n${env.ROBOTS_ADDITIONAL_RULES ? unescape(env.ROBOTS_ADDITIONAL_RULES) + '\n' : ''}`,
    // Sent as a response header, where control or non-ASCII characters would make every response fail.
    release: str(env, 'RELEASE').replace(/[^\x20-\x7e]/g, '').trim() || 'development',
    quietHealth: flag(env, 'SKIP_HEALTH_CHECK_LOGS', false),
  };
}
