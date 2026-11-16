#!/usr/bin/env node
// Builds the coloured platform icons (app/public/icons/brand-<name>.svg) from a pinned Simple Icons
// release, and points app/platforms.mjs at them. Reproducible: same package version, same output.
//
//   node scripts/build_icons.mjs --simple-icons <unpacked simple-icons package folder> [--check]
//
// Only the package's icons/*.svg and its data JSON are read; none of its code is run.
// Mapping: scripts/icon-sources.json, platform variable -> Simple Icons slug (null: keep the current icon).
// Legibility: every theme has a dark background, so a brand colour with too little contrast against
// it (for example black) is drawn in white instead; inherited icons that are too dark go on a light tile. Hand-made icons listed in KEEP are
// never overwritten. The Simple Icons version is recorded in scripts/icon-sources.json.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const ICONS = join(root, 'app/public/icons');
const SOURCES = join(root, 'scripts/icon-sources.json');
const PLATFORMS_FILE = join(root, 'app/platforms.mjs');
// Curated icons (reviewed by hand) and the generic drawings: never regenerated.
const KEEP = new Set(['brand-amazon', 'brand-cashapp', 'brand-discord', 'brand-email', 'brand-facebook', 'brand-instagram', 'brand-linkedin', 'brand-nextcloud', 'brand-snapchat', 'brand-soundcloud', 'brand-spotify', 'brand-youtube', 'brand-website', 'brand-blog', 'brand-phone', 'brand-sms']);
const DARK_BG = '#0B0B14';
const TILE = '#F4F4F6';

const arg = (n) => (process.argv.includes(`--${n}`) ? process.argv[process.argv.indexOf(`--${n}`) + 1] : null);
const pkg = arg('simple-icons');
const check = process.argv.includes('--check');

const lum = (hex) => {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => {
  const [x, y] = [lum(a.replace('#', '')), lum(b.replace('#', ''))].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
// Simple Icons' own rule for turning a title into a slug.
const TITLE_TO_SLUG = { '+': 'plus', '.': 'dot', '&': 'and', đ: 'd', ħ: 'h', ı: 'i', ĸ: 'k', ŀ: 'l', ł: 'l', ß: 'ss', ŧ: 't' };
export const titleToSlug = (t) =>
  t.toLowerCase().replace(/[+.&đħıĸŀłßŧ]/g, (c) => TITLE_TO_SLUG[c]).normalize('NFD').replace(/[^a-z0-9]/g, '');

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export function brandSvg(title, hex, path) {
  const color = `#${hex.toUpperCase()}`;
  if (contrast(color, DARK_BG) >= 3) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img"><title>${esc(title)}</title><path fill="${color}" d="${path}"/></svg>\n`;
  }
  // Too dark for the themes' backgrounds (black, navy...): the logo in white, the usual dark-mode variant.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img"><title>${esc(title)}</title><path fill="#FFFFFF" d="${path}"/></svg>\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!pkg) {
    console.error('usage: build_icons.mjs --simple-icons <unpacked package folder> [--check]');
    process.exit(2);
  }
  const meta = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8'));
  const dataFile = ['data/simple-icons.json', '_data/simple-icons.json'].map((f) => join(pkg, f)).find(existsSync);
  const data = JSON.parse(readFileSync(dataFile, 'utf8'));
  const icons = Array.isArray(data) ? data : data.icons;
  const bySlug = new Map(icons.map((i) => [i.slug || titleToSlug(i.title), i]));
  const sources = JSON.parse(readFileSync(SOURCES, 'utf8'));
  const { PLATFORMS } = await import('../app/platforms.mjs');
  let platformsSrc = readFileSync(PLATFORMS_FILE, 'utf8');
  const made = [], missing = [], kept = [], tiled = [], stale = [], whiteList = [];
  for (const p of PLATFORMS) {
    const slug = sources.icons[p.key];
    const out = `brand-${p.name === 'default' ? p.key.toLowerCase().replace(/_/g, '') : p.name}`;
    if (KEEP.has(out) || KEEP.has(p.icon.replace(/\.svg$/, ''))) { kept.push(p.key); continue; }
    if (!slug) { kept.push(p.key); continue; }
    const info = bySlug.get(slug);
    const file = join(pkg, 'icons', `${slug}.svg`);
    if (!info || !existsSync(file)) { missing.push(`${p.key} (${slug})`); continue; }
    const path = /\sd="([^"]+)"/.exec(readFileSync(file, 'utf8'))?.[1];
    if (!path) { missing.push(`${p.key} (${slug}: no path)`); continue; }
    const svg = brandSvg(info.title, info.hex, path);
    if (svg.includes('fill="#FFFFFF"')) whiteList.push(p.key);
    const target = join(ICONS, `${out}.svg`);
    if (check) {
      if (!existsSync(target) || readFileSync(target, 'utf8') !== svg) stale.push(out);
    } else writeFileSync(target, svg);
    const entry = new RegExp(`("key": "${p.key}", "name": "[^"]+", "label": "[^"]+", "icon": )"[^"]+"`);
    platformsSrc = platformsSrc.replace(entry, `$1"${out}.svg"`);
    made.push(p.key);
  }
  // Icons kept from littlelink-server that are too dark for the themes: the same drawing on a light tile.
  for (const key of sources.tile || []) {
    const p = PLATFORMS.find((x) => x.key === key);
    if (!p) continue;
    const srcName = p.icon.startsWith('brand-') ? sources.tileSource?.[key] : p.icon;
    const original = readFileSync(join(ICONS, srcName || p.icon), 'utf8');
    const inner = original.replace(/<\?xml[^>]*>|<!DOCTYPE[^>]*>|<metadata>[\s\S]*?<\/metadata>/gi, '').trim()
      .replace(/^<svg\b([^>]*)>/i, (m, attrs) => `<svg${attrs.replace(/\s(width|height|x|y|id)="[^"]*"/gi, '')} x="4" y="4" width="16" height="16">`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img"><title>${esc(p.label)}</title><rect width="24" height="24" rx="5.5" fill="${TILE}"/>${inner}</svg>\n`;
    const out = `brand-${p.name}`;
    const target = join(ICONS, `${out}.svg`);
    if (check) {
      if (!existsSync(target) || readFileSync(target, 'utf8') !== svg) stale.push(out);
    } else writeFileSync(target, svg);
    platformsSrc = platformsSrc.replace(new RegExp(`("key": "${key}", "name": "[^"]+", "label": "[^"]+", "icon": )"[^"]+"`), `$1"${out}.svg"`);
    if (!sources.tileSource?.[key] && !check) (sources.tileSource ||= {})[key] = srcName || p.icon;
    tiled.push(`${key} (littlelink-server icon)`);
  }
  if (check && sources.simpleIcons && sources.simpleIcons !== meta.version) {
    console.error(`icons were built from Simple Icons ${sources.simpleIcons}, not ${meta.version}`);
    process.exit(1);
  }
  if (check) {
    if (stale.length || readFileSync(PLATFORMS_FILE, 'utf8') !== platformsSrc) {
      console.error(`icons out of date: ${stale.join(', ') || 'app/platforms.mjs'}`);
      process.exit(1);
    }
  } else {
    writeFileSync(PLATFORMS_FILE, platformsSrc);
    writeFileSync(SOURCES, JSON.stringify({ ...sources, simpleIcons: meta.version }, null, 2) + '\n');
  }
  console.log(`Simple Icons ${meta.version}: ${made.length} generated (${whiteList.length} drawn in white for contrast), ${tiled.length} inherited icons on a light tile (${tiled.join(', ')}), ${kept.length} kept.`);
  if (missing.length) console.log(`Not in this Simple Icons release (current icon kept): ${missing.join(', ')}`);
}
