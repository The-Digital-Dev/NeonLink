// Small helpers shared by tests. Compose parsing covers only the flat "KEY: value" environment block we use.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

export function composeEnvironment(file) {
  const env = {};
  let inEnv = false;
  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    if (/^\s{4}environment:\s*$/.test(raw)) { inEnv = true; continue; }
    if (inEnv && /^\s{0,4}\S/.test(raw) && !/^\s{6}/.test(raw)) inEnv = false;
    if (!inEnv) continue;
    const m = /^\s{6}([A-Z0-9_]+):\s?(.*)$/.exec(raw);
    if (!m) continue;
    let v = m[2].trim();
    if (/^".*"$/.test(v)) v = v.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    else if (/^'.*'$/.test(v)) v = v.slice(1, -1).replace(/''/g, "'");
    // ${VAR:-default} takes its default, as Compose does when VAR is unset.
    env[m[1]] = v.replace(/(?<!\$)\$\{[A-Z0-9_]+:-([^}]*)\}/g, '$1').replace(/\$\$/g, '$');
  }
  return env;
}

export const hrefs = (html) => [...html.matchAll(/<a [^>]*?href="([^"]+)"[^>]*?data-event="/g)].map((m) => m[1].replace(/&amp;/g, '&'));

// Public page copy must not reveal private addresses, internal hostnames or ports.
export function assertNoPrivateNetworkCopy(html, label) {
  const text = html.replace(/<(script|link|meta)[^>]*>/g, '');
  assert.doesNotMatch(text, /\b(10|127|192\.168|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+(\.\d+)?\b/, label);
  assert.doesNotMatch(text, /\b[\w-]+\.(lan|local|internal|home\.arpa|localdomain)\b|localhost/i, label);
  assert.doesNotMatch(text, /[\w.-]+:\d{2,5}\b/, label);
}

