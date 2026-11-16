// Small helpers shared by tests. Compose parsing covers only the flat "KEY: value" environment block we use.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

// Commented-out lines ("# KEY: value") are not values, so the settings catalogue in compose.yaml is skipped.
export const composeEnvironment = (file) => composeEnvironmentText(readFileSync(file, 'utf8'));

export function composeEnvironmentText(text) {
  const env = {};
  let inEnv = false;
  for (const raw of text.split('\n')) {
    if (/^\s{4}environment:\s*$/.test(raw)) { inEnv = true; continue; }
    if (inEnv && /^\s{0,4}\S/.test(raw) && !/^\s{6}/.test(raw)) inEnv = false;
    if (!inEnv) continue;
    const m = /^\s{6}([A-Z0-9_]+):\s?(.*)$/.exec(raw);
    if (!m) continue;
    // "KEY:" with nothing after it is null in YAML: Compose passes the shell's value or nothing at all.
    if (m[2].replace(/(^|\s)#.*$/, '').trim() === '') continue;
    // A trailing " # comment" is not part of the value (YAML), unless the value is quoted.
    let v = /^["']/.test(m[2].trim()) ? m[2].trim().replace(/^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*')\s+#.*$/, '$1') : m[2].replace(/\s+#.*$/, '').trim();
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

