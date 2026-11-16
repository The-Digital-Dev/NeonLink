// Link page HTTP server. No framework and no runtime dependencies.
// The page is rendered once at startup from environment variables; restart the container to apply changes.
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfig } from './config.mjs';
import { PRODUCT } from './product.mjs';
import { render, favicon, placeholder, EARLY_SCRIPT_HASH } from './render.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = join(here, 'public');
const THEMES_DIR = join(here, 'themes');

const TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};
// The media folder is user-supplied, so it serves images only.
const MEDIA_TYPES = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.ico']);
// Files a user drops into the media folder that are picked up without any variable.
const AUTO_MEDIA = { AVATAR_URL: 'avatar', FAVICON_URL: 'favicon' };

// Fills AVATAR_URL / FAVICON_URL from media/avatar.* and media/favicon.* when they are not set.
export async function withMedia(env, dir) {
  const out = { ...env };
  let names = [];
  try {
    names = await readdir(dir);
  } catch {
    return out;
  }
  for (const [key, base] of Object.entries(AUTO_MEDIA)) {
    if (out[key]) continue;
    const exts = key === 'FAVICON_URL' ? ['.svg', '.png', '.ico'] : ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
    const hit = exts.map((e) => base + e).find((n) => names.includes(n));
    if (hit) out[key] = `/media/${hit}`;
  }
  return out;
}

// Only plain scheme://host[:port] origins go into the policy: URL() accepts ";" and quotes in a host,
// which would otherwise end a directive early.
const originOf = (u) => {
  try {
    const o = new URL(u).origin;
    return /^https?:\/\/[a-z0-9.\-[\]:]+$/i.test(o) ? o : null;
  } catch {
    return null;
  }
};

// The Content-Security-Policy allows only this origin plus whichever analytics providers are configured.
export function contentSecurityPolicy(c) {
  const script = ["'self'", EARLY_SCRIPT_HASH];
  const connect = ["'self'"];
  const img = ["'self'", 'data:', 'https:'];
  const a = c.analytics;
  if (a.ga) {
    // Google's published CSP for Google Analytics 4. analytics.js sets up gtag, so no inline script is needed.
    script.push('https://*.googletagmanager.com');
    connect.push('https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com');
  }
  if (a.cloudflare) {
    // Cloudflare's published sources for its Web Analytics beacon.
    script.push('https://static.cloudflareinsights.com');
    connect.push('https://cloudflareinsights.com');
  }
  for (const u of [a.umami?.src, a.matomo?.url, a.plausible?.src, a.plausible?.api]) {
    const o = u && originOf(u);
    if (o) {
      script.push(o);
      connect.push(o);
    }
  }
  return [
    "default-src 'self'",
    `script-src ${[...new Set(script)].join(' ')}`,
    // Stylesheets come only from this origin; inline style attributes carry per-link accent colours.
    "style-src 'self'",
    "style-src-attr 'unsafe-inline'",
    `img-src ${img.join(' ')}`,
    "font-src 'self'",
    `connect-src ${[...new Set(connect)].join(' ')}`,
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join('; ');
}

async function hashTree(dir) {
  const h = createHash('sha256');
  const walk = async (d) => {
    for (const e of (await readdir(d, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else h.update(e.name).update(await readFile(p));
    }
  };
  await walk(dir);
  return h.digest('hex').slice(0, 10);
}

// Resolves a request path inside root, refusing anything that escapes it or names a dotfile.
function within(root, rel) {
  const clean = normalize(decodeURIComponent(rel)).replace(/^([/\\])+/, '');
  if (clean.split(/[/\\]/).some((part) => part.startsWith('.'))) return null;
  const full = resolve(root, clean);
  return full.startsWith(resolve(root) + sep) ? full : null;
}

export async function createApp(rawEnv = process.env) {
  const mediaDir = rawEnv.MEDIA_DIR || '/app/media';
  const env = await withMedia(rawEnv, mediaDir);
  const config = buildConfig(env);
  const themeDir = join(THEMES_DIR, config.theme, 'public');
  const version = (await hashTree(PUBLIC_DIR)).slice(0, 5) + (await hashTree(themeDir)).slice(0, 5);
  const html = render(config, version);
  const csp = contentSecurityPolicy(config);
  const icon = favicon(config);
  const avatarSvg = placeholder(config);
  const etag = `"${createHash('sha256').update(html).digest('hex').slice(0, 16)}"`;

  const base = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    [`X-${PRODUCT}-Release`]: config.release,
  };

  // Serves file from root. A symlink must not lead outside root, and when types is given the real
  // file's extension must be one of them.
  async function sendFile(res, req, root, file, versioned, extra = {}, types = null) {
    try {
      const [realRoot, real] = await Promise.all([realpath(root), realpath(file)]);
      if (!real.startsWith(realRoot + sep)) return false;
      const ext = extname(real).toLowerCase();
      if (types && !types.has(ext)) return false;
      const info = await stat(real);
      if (!info.isFile()) return false;
      const body = await readFile(real);
      res.writeHead(200, {
        ...base,
        'Content-Type': TYPES[ext] || 'application/octet-stream',
        'Content-Length': body.length,
        'Cache-Control': versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
        ...extra,
      });
      res.end(req.method === 'HEAD' ? undefined : body);
      return true;
    } catch {
      return false;
    }
  }

  function send(res, req, status, type, body, headers = {}) {
    res.writeHead(status, { ...base, 'Content-Type': type, 'Content-Length': Buffer.byteLength(body), ...headers });
    res.end(req.method === 'HEAD' ? undefined : body);
  }

  const notFound = (res, req) =>
    send(res, req, 404, 'text/plain; charset=utf-8', 'Not found\n', { 'Cache-Control': 'no-cache' });

  const handler = async (req, res) => {
    try {
      if (!['GET', 'HEAD'].includes(req.method)) {
        return send(res, req, 405, 'text/plain; charset=utf-8', 'Method not allowed\n', { Allow: 'GET, HEAD' });
      }
      const url = new URL(req.url, 'http://localhost');
      const path = url.pathname;
      const versioned = url.searchParams.has('v');

      if (path === '/healthcheck' || path === '/api/health') {
        if (!config.quietHealth && env.NODE_ENV !== 'test') console.log(`${new Date().toISOString()} health ok`);
        return send(res, req, 200, 'application/json', JSON.stringify({ status: 'ok', release: config.release }), {
          'Cache-Control': 'no-store',
        });
      }
      if (path === '/' || path === '/index.html') {
        if (req.headers['if-none-match'] === etag) {
          res.writeHead(304, { ...base, ETag: etag });
          return res.end();
        }
        return send(res, req, 200, 'text/html; charset=utf-8', html, {
          'Content-Security-Policy': csp,
          'Cache-Control': 'no-cache',
          ETag: etag,
        });
      }
      if (path === '/robots.txt') return send(res, req, 200, 'text/plain; charset=utf-8', config.robots);
      if (path === '/favicon.svg') {
        return send(res, req, 200, 'image/svg+xml', icon, { 'Cache-Control': 'public, max-age=3600' });
      }
      if (path.startsWith('/assets/')) {
        const file = within(PUBLIC_DIR, path.slice('/assets/'.length));
        if (file && /\.(map|md)$/i.test(file) === false && (await sendFile(res, req, PUBLIC_DIR, file, versioned))) return;
        return notFound(res, req);
      }
      if (path.startsWith('/theme/')) {
        const file = within(themeDir, path.slice('/theme/'.length));
        if (file && (await sendFile(res, req, themeDir, file, versioned))) return;
        return notFound(res, req);
      }
      if (path.startsWith('/media/')) {
        const file = within(mediaDir, path.slice('/media/'.length));
        // User files: images only, short cache so a swapped picture shows up soon, and a sandbox
        // policy so an SVG opened directly cannot run script on this origin.
        if (file && MEDIA_TYPES.has(extname(file).toLowerCase())) {
          const headers = { 'Cache-Control': 'public, max-age=300', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox" };
          if (await sendFile(res, req, mediaDir, file, false, headers, MEDIA_TYPES)) return;
        }
        return notFound(res, req);
      }
      if (path === '/avatar.svg') {
        return send(res, req, 200, 'image/svg+xml', avatarSvg, { 'Cache-Control': 'public, max-age=3600' });
      }
      return notFound(res, req);
    } catch (err) {
      console.error('request failed:', err?.message || err);
      if (!res.headersSent) send(res, req, 400, 'text/plain; charset=utf-8', 'Bad request\n');
      else res.end();
    }
  };
  return { handler, config, html, csp };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { handler, config } = await createApp(process.env);
  for (const w of config.warnings) console.warn(`config warning: ${w}`);
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  const server = createServer(handler);
  server.listen(port, host, () =>
    console.log(`${PRODUCT} ${config.release} ready on ${host}:${port} with ${config.links.all.length} links`),
  );
  let stopping = false;
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => {
      if (stopping) return;
      stopping = true;
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10000).unref();
    });
  }
}
