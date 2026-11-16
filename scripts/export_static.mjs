#!/usr/bin/env node
// Renders each theme with a configuration to plain files, for static hosting such as GitHub Pages.
//
//   node scripts/export_static.mjs [--out dist/demo] [--compose compose.yaml] [--media examples/media]
//
// Writes <out>/index.html (a small theme picker), <out>/<theme>/ for every theme (index.html,
// assets/, theme/, media/, favicon.svg, avatar.svg) and <out>/<theme>/all-platforms/, the same design
// with every built-in platform switched on. All links inside are relative, so the folder
// works from any sub-path (for example https://<user>.github.io/neonlink/neon/).
// Static hosts cannot send headers, so the Content-Security-Policy goes in a <meta> tag instead
// (frame-ancestors cannot be set that way). Environment variables override the Compose values.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../app/server.mjs';
import { THEMES } from '../app/themes/index.mjs';
import { favicon, placeholder } from '../app/render.mjs';
import { esc } from '../app/html.mjs';
import { composeEnvironment } from '../tests/helpers.mjs';
import { showcaseEnv } from './showcase.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const out = resolve(arg('out', join(root, 'dist/demo')));
const composeFile = resolve(arg('compose', join(root, 'compose.yaml')));
const mediaDir = resolve(arg('media', join(root, 'examples/media')));

// Absolute site paths become relative ones.
export const relativize = (html) => html.replace(/(["'(])\/(assets\/|theme\/|media\/|favicon\.svg|avatar\.svg)/g, '$1./$2');
export const metaCsp = (csp) =>
  csp
    .split(';')
    .map((d) => d.trim())
    .filter((d) => d && !/^(frame-ancestors|sandbox|report-uri)/.test(d))
    .join('; ');

export async function exportTheme(theme, env, dir) {
  const { html, csp, config } = await createApp({ ...env, THEME: theme, MEDIA_DIR: mediaDir, NODE_ENV: 'test' });
  mkdirSync(dir, { recursive: true });
  const page = relativize(html).replace('<meta charset="utf-8">', `<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${esc(metaCsp(csp))}">`);
  writeFileSync(join(dir, 'index.html'), page);
  cpSync(join(root, 'app/public'), join(dir, 'assets'), { recursive: true, filter: (s) => !/\.md$/.test(s) });
  cpSync(join(root, 'app/themes', theme, 'public'), join(dir, 'theme'), { recursive: true });
  if (existsSync(mediaDir)) cpSync(mediaDir, join(dir, 'media'), { recursive: true, filter: (s) => !/(^|\/)\.[^/]+$/.test(s) });
  writeFileSync(join(dir, 'favicon.svg'), favicon(config));
  writeFileSync(join(dir, 'avatar.svg'), placeholder(config));
  return config;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const env = { ...composeEnvironment(composeFile), ...Object.fromEntries(Object.entries(process.env).filter(([k]) => /^[A-Z][A-Z0-9_]*$/.test(k) && k in composeEnvironment(composeFile))) };
  rmSync(out, { recursive: true, force: true });
  const made = [];
  for (const [name, t] of Object.entries(THEMES)) {
    const c = await exportTheme(name, env, join(out, name));
    const all = await exportTheme(name, showcaseEnv(env), join(out, name, 'all-platforms'));
    made.push({ name, label: t.meta.title || name, links: c.links.all.length, all: all.links.all.length });
  }
  const items = made.map((m) => `<li><a href="./${m.name}/">${esc(m.label)}</a> · <a href="./${m.name}/all-platforms/">all ${m.all} links</a> <span>THEME=${esc(m.name)}</span></li>`).join('');
  writeFileSync(
    join(out, 'index.html'),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NeonLink demos</title>` +
      `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><style>body{font:16px/1.5 system-ui,sans-serif;background:#07060d;color:#e8e6f0;max-width:40rem;margin:4rem auto;padding:0 1rem}a{color:#00f0ff}span{color:#9a98a8;font:13px ui-monospace,monospace;margin-left:.5rem}</style></head>` +
      `<body><h1>NeonLink demos</h1><p>The same sample profile in every theme, and the same design with every supported platform switched on. Each page is a static export of the real app.</p><ul>${items}</ul></body></html>`,
  );
  console.log(`Static demo written to ${out}: ${made.map((m) => `${m.name} (${m.links} links)`).join(', ')}; ${readdirSync(out).length} entries.`);
}
