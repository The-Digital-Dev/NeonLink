#!/usr/bin/env node
// Repository guard rails, run locally (`make check`) and in CI:
//  1. No personal or internal content: built-in leak rules (scripts/leak_scan.mjs) on every file,
//     plus a private block list when NEONLINK_LEAK_TERMS names one (kept outside this repository).
//  2. Every environment variable the app reads is documented (README.md or docs/configuration.md).
//  3. No secret-looking files or private keys are committed.
import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTerms, loadSkips, scanTree, THIRD_PARTY } from './leak_scan.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const problems = [];
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    if (['.git', 'node_modules', 'test-results', 'work', 'worktrees', 'dist', 'out'].includes(name)) continue;
    const p = join(dir, name);
    const st = lstatSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (st.isFile()) out.push(p);
  }
  return out;
};
// Tracked and new (not ignored) files when this is a Git checkout, so an ignored local .env is fine.
let files;
try {
  files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split('\0').filter((f) => f && (() => { try { return lstatSync(join(root, f)).isFile(); } catch { return false; } })());
} catch {
  files = walk(root).map((p) => relative(root, p));
}
const text = (f) => readFileSync(join(root, f), 'utf8');
const isText = (f) => /\.(m?js|cjs|css|html|json|ya?ml|md|txt|svg|example)$|(^|\/)(Dockerfile|Makefile|\.gitignore|\.dockerignore|\.nvmrc)$/.test(f);

// 1. Personal content, private addresses and secrets. A private block list (NEONLINK_LEAK_TERMS) can
// add terms, and name files to check for secrets only (lines starting with "!").
const termsFile = process.env.NEONLINK_LEAK_TERMS;
const terms = termsFile ? loadTerms(termsFile) : [];
const secretsOnly = new Set(termsFile ? loadSkips(termsFile) : []);
const notes = [];
if (!termsFile) notes.push('private block list not set (NEONLINK_LEAK_TERMS); built-in leak rules only');
for (const f of scanTree(root, { files, terms, strictFor: (rel) => !secretsOnly.has(rel) && !THIRD_PARTY.test(rel) })) {
  if (secretsOnly.has(f.file) && !/token|key/.test(f.rule)) continue;
  problems.push(`${f.file}:${f.line ?? ''} ${f.rule} "${f.match}"`);
}

// 2. Documented variables.
// The README covers the common ones; docs/configuration.md is the full reference.
const readme = ['README.md', 'docs/configuration.md'].filter((f) => files.includes(f)).map(text).join('\n');
const config = text('app/config.mjs') + text('app/server.mjs');
const used = new Set();
for (const m of config.matchAll(/(?:str|opt|flag)\(env, '([A-Z0-9_]+)'/g)) used.add(m[1]);
for (const m of config.matchAll(/env\.([A-Z][A-Z0-9_]+)/g)) used.add(m[1]);
for (const v of used) if (!new RegExp(`\`${v}\``).test(readme)) problems.push(`docs/configuration.md: environment variable ${v} is not documented`);
for (const suffix of ['_TEXT', '_NOTE', '_ICON']) if (!readme.includes(`\`<PLATFORM>${suffix}\``)) problems.push(`docs/configuration.md: per-platform ${suffix} is not documented`);

// 3. Secrets.
for (const f of files) {
  if (/(^|\/)\.env(\.|$)/.test(f) && !f.endsWith('.env.example')) problems.push(`${f}: environment file must not be committed`);
  if (/\.(pem|key|p12|pfx)$/i.test(f)) problems.push(`${f}: key material must not be committed`);
  if (isText(f) && /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text(f))) problems.push(`${f}: contains a private key`);
}

// 5. Compose values that YAML would misread: an unquoted value starting with an indicator character.
for (const f of files.filter((x) => /(^|\/)compose(\.[a-z]+)?\.ya?ml$/.test(x))) {
  text(f).split('\n').forEach((line, i) => {
    if (/^\s+[A-Z][A-Z0-9_]*:\s+[,\[\]{}&*!|>%@`]/.test(line)) problems.push(`${f}:${i + 1}: quote this value (it starts with a YAML indicator)`);
  });
}

if (problems.length) {
  console.error(`Repository check failed (${problems.length}):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
for (const n of notes) console.log(`note: ${n}`);
console.log(`Repository check passed: ${files.length} files, ${used.size} documented variables, ${terms.length} private terms.`);
