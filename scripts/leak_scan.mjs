#!/usr/bin/env node
// Leak scanner: finds personal or internal content in a folder or a container image.
//
//   node scripts/leak_scan.mjs [--terms FILE] [--media DIR]... [--allow-email DOMAIN]... TARGET...
//
// TARGET is a folder, or image:<name> for a local Docker image (its files, environment, labels and
// history are scanned). Built-in rules always apply: e-mail addresses outside example domains,
// private IPv4 addresses, .lan/.local/.internal host names, and token or private-key patterns.
// --terms adds a private block list (one case-insensitive regular expression per line, # comments).
// --media adds files whose exact content must not appear anywhere (for example a portrait), matched
// by hash so a renamed copy is still caught. Exit code 1 when anything is found.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, lstatSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ALLOWED_EMAIL = /@(?:[\w.-]+\.)?(?:example\.(?:com|org|net)|example|test|invalid|users\.noreply\.github\.com)$|\.(?:png|jpe?g|webp|gif|svg|avif)$/i;
const OCTET = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
// A line containing this marker is skipped (for test fixtures that must contain a pattern).
const ALLOW_MARK = 'leak-scan: allow';
// Built-in rules. `strict` rules only run on first-party files (not on the base image's own files,
// whose licences and binaries contain unrelated addresses).
export const RULES = [
  { name: 'e-mail address', strict: true, re: /[A-Z0-9._%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.[A-Z]{2,}/gi, allow: (m) => ALLOWED_EMAIL.test(m) },
  { name: 'private IPv4 address', strict: true, re: new RegExp(`\\b(?:10\\.${OCTET}\\.${OCTET}|192\\.168\\.${OCTET}|172\\.(?:1[6-9]|2\\d|3[01])\\.${OCTET}|100\\.(?:6[4-9]|[7-9]\\d|1[01]\\d|12[0-7])\\.${OCTET})\\.${OCTET}\\b(?!\\.\\d)`, 'g') },
  { name: 'internal host name', strict: true, re: /\b[a-z0-9][\w-]*\.(?:lan|local|internal|home\.arpa|localdomain|corp)\b(?![.\w-])/gi },
  { name: 'GitLab token', re: /\bglpat-[\w-]{20,}/g },
  { name: 'GitHub token', re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_\w{22,})/g },
  { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'Slack token', re: /\bxox[abposr]-[\w-]{10,}/g },
  { name: 'Anthropic or OpenAI key', re: /\bsk-(?:ant-)?[A-Za-z0-9_-]{32,}/g },
  { name: 'private key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
];

const termLines = (file) => readFileSync(file, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
export function loadTerms(file) {
  if (!file) return [];
  return termLines(file)
    .filter((l) => !l.startsWith('!'))
    .map((src) => {
      try {
        return { name: 'private term', term: src, re: new RegExp(src, 'gi') };
      } catch (e) {
        throw new Error(`invalid pattern in ${file}: ${src} (${e.message})`);
      }
    });
}
// Lines starting with "!" name repository files that are checked for secrets only.
export const loadSkips = (file) => (file ? termLines(file).filter((l) => l.startsWith('!')).map((l) => l.slice(1).trim()) : []);

const sha = (buf) => createHash('sha256').update(buf).digest('hex');
export function mediaHashes(dirs = []) {
  const out = new Map();
  for (const d of dirs) for (const f of walk(d)) out.set(sha(readFileSync(f)), relative(resolve(d, '..'), f));
  return out;
}

function walk(dir, skip = new Set(['.git', 'node_modules'])) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const p = join(dir, name);
    const st = lstatSync(p);
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) out.push(...walk(p, skip));
    else if (st.isFile()) out.push(p);
  }
  return out;
}

const isBinary = (buf) => buf.subarray(0, 8000).includes(0);

// Scans one text. `strict` false skips the first-party-only rules. Returns [{rule, match, line}].
export function scanText(text, { terms = [], strict = true } = {}) {
  const found = [];
  for (const r of [...RULES.filter((x) => strict || !x.strict), ...terms]) {
    r.re.lastIndex = 0;
    for (const m of text.matchAll(r.re)) {
      if (r.allow?.(m[0])) continue;
      const ls = text.lastIndexOf('\n', m.index) + 1, le = text.indexOf('\n', m.index);
      if (text.slice(ls, le < 0 ? undefined : le).includes(ALLOW_MARK)) continue;
      const line = text.slice(0, m.index).split('\n').length;
      found.push({ rule: r.term ? `${r.name} /${r.term}/` : r.name, match: m[0].slice(0, 80), line });
    }
  }
  return found;
}

// Third-party licence texts carry their authors' contact addresses; they get every rule but the
// first-party ones (private terms, media and secrets still apply).
export const THIRD_PARTY = /(^|\/)(OFL[-\w]*\.txt|FONTS-LICENSE\.md|LICENSE-[\w.-]+\.md)$/;

// Scans files under root. `strictFor(rel)` decides whether built-in first-party rules apply.
export function scanTree(root, { terms = [], hashes = new Map(), strictFor = (rel) => !THIRD_PARTY.test(rel), files } = {}) {
  const findings = [];
  const list = files ? files.map((f) => join(root, f)) : walk(root);
  for (const full of list) {
    const rel = relative(root, full);
    for (const t of terms) {
      t.re.lastIndex = 0;
      if (t.re.test(rel)) findings.push({ file: rel, rule: `private term in path /${t.term}/`, match: rel });
    }
    let buf;
    try {
      buf = readFileSync(full);
    } catch {
      continue;
    }
    const h = hashes.get(sha(buf));
    if (h) findings.push({ file: rel, rule: 'private media file', match: h });
    // Large binaries (node itself) are scanned for private terms only.
    if (isBinary(buf)) {
      if (!terms.length) continue;
      const s = buf.toString('latin1');
      for (const f of scanText(s, { terms, strict: false }).filter((x) => x.rule.startsWith('private'))) findings.push({ file: rel, ...f });
      continue;
    }
    for (const f of scanText(buf.toString('utf8'), { terms, strict: strictFor(rel) })) findings.push({ file: rel, ...f });
  }
  return findings;
}

// Exports a local image's filesystem to a temporary folder and scans it, plus its configuration.
export function scanImage(image, opts = {}) {
  const tmp = mkdtempSync(join(tmpdir(), 'neonlink-leak-'));
  const findings = [];
  try {
    const inspect = execFileSync('docker', ['image', 'inspect', image], { encoding: 'utf8' });
    const history = execFileSync('docker', ['history', '--no-trunc', '--format', '{{.CreatedBy}}', image], { encoding: 'utf8' });
    for (const f of scanText(inspect + '\n' + history, { terms: opts.terms, strict: true })) findings.push({ file: `${image} (config/history)`, ...f });
    const id = execFileSync('docker', ['create', image], { encoding: 'utf8' }).trim();
    try {
      execFileSync('sh', ['-c', `docker export "${id}" | tar -x -C "${tmp}" 2>/dev/null || true`]);
    } finally {
      execFileSync('docker', ['rm', id], { stdio: 'ignore' });
    }
    // First-party rules apply to the application folder; the base image gets terms, media and secrets.
    const strictFor = (rel) => rel.startsWith('app/') && !THIRD_PARTY.test(rel);
    for (const f of scanTree(tmp, { ...opts, strictFor })) findings.push({ ...f, file: `${image}:/${f.file}` });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  return findings;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const termsFiles = [], media = [], targets = [], allowEmail = [];
  const value = (i) => {
    if (!args[i + 1] || args[i + 1].startsWith('--')) {
      console.error(`${args[i]} needs a value`);
      process.exit(2);
    }
    return args[i + 1];
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--terms') termsFiles.push(value(i++));
    else if (args[i] === '--media') media.push(value(i++));
    else if (args[i] === '--allow-email') allowEmail.push(value(i++).toLowerCase());
    else targets.push(args[i]);
  }
  if (!targets.length) {
    console.error('usage: leak_scan.mjs [--terms FILE] [--media DIR]... [--allow-email DOMAIN]... <folder | image:NAME>...');
    process.exit(2);
  }
  if (allowEmail.length) {
    const rule = RULES[0], base = rule.allow;
    rule.allow = (m) => base(m) || allowEmail.some((d) => m.toLowerCase().endsWith('@' + d));
  }
  let terms;
  try {
    terms = termsFiles.flatMap((f) => loadTerms(f));
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
  const hashes = mediaHashes(media);
  let total = 0;
  for (const t of targets) {
    const findings = t.startsWith('image:') ? scanImage(t.slice(6), { terms, hashes }) : existsSync(t) ? scanTree(t, { terms, hashes }) : null;
    if (!findings) {
      console.error(`not found: ${t}`);
      process.exit(2);
    }
    total += findings.length;
    for (const f of findings) console.log(`LEAK ${f.file}${f.line ? ':' + f.line : ''}  ${f.rule}  "${f.match}"`);
    console.log(`${findings.length ? 'FAIL' : 'CLEAN'} ${t}: ${findings.length} finding(s); ${terms.length} private terms, ${hashes.size} media hashes, ${RULES.length} built-in rules`);
  }
  process.exit(total ? 1 : 0);
}
