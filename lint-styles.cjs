#!/usr/bin/env node
/*
 * WRFrontiersDB shared style linter.
 *
 * Flags raw "chrome" hex color literals in a consumer's component styles so that
 * colors resolve through the shared `--wrf-*` design tokens instead. It lives in
 * WRFrontiersDB-Design (this submodule) as the single source of truth for the
 * rule; each consumer invokes it with a small repo-specific config that lists the
 * DOMAIN colors (rarity / faction / talent / savings / etc.) which are meaningful
 * data and intentionally stay raw.
 *
 * Usage (from the consumer's repo root):
 *   node <path-to-submodule>/lint-styles.cjs --config .wrf-lint.json
 *
 * Zero dependencies (Node >= 16). Scans:
 *   - `.css` files in full,
 *   - `<style>` blocks inside `.astro` files.
 * CSS/HTML comments are stripped before scanning. A hex on a line that contains
 * the marker `wrf-allow-hex` is ignored (the inline escape hatch for a genuine
 * one-off). Exits non-zero and prints `file:line` for every violation.
 *
 * Config shape (JSON):
 *   {
 *     "roots":       ["src"],                 // dirs to scan, relative to root
 *     "extensions":  [".astro", ".css"],      // optional; this is the default
 *     "excludeDirs": ["vendor", "dist"],      // optional; merged with defaults
 *     "allow":       ["#5865f2", "#fff176"]   // DOMAIN hex allowed to stay raw
 *   }
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_EXTENSIONS = ['.astro', '.css'];
const DEFAULT_EXCLUDE_DIRS = ['node_modules', 'dist', '.astro', '.git', 'vendor'];
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const ALLOW_MARKER = 'wrf-allow-hex';

function fail(msg) {
  console.error(`lint-styles: ${msg}`);
  process.exit(2);
}

function parseArgs(argv) {
  const args = { config: null, root: process.cwd() };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--config') args.config = argv[++i];
    else if (a === '--root') args.root = argv[++i];
    else fail(`unknown argument: ${a}`);
  }
  if (!args.config) fail('missing --config <file>');
  return args;
}

// Expand #rgb / #rgba shorthand to its 6/8-digit form, lowercased, so the allow
// list matches regardless of which form the source uses.
function normalizeHex(hex) {
  let h = hex.slice(1).toLowerCase();
  if (h.length === 3 || h.length === 4) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return '#' + h;
}

function buildAllowSet(allow) {
  const set = new Set();
  for (const h of allow || []) {
    if (!/^#[0-9a-fA-F]{3,8}$/.test(h)) fail(`invalid allow entry: ${h}`);
    set.add(normalizeHex(h));
  }
  return set;
}

// Replace CSS/HTML comments with equal-length whitespace (newlines preserved) so
// line/column offsets are unchanged for accurate reporting.
function blankComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
}

// Return the scannable text of a file with everything else blanked out (so line
// numbers stay true): whole file for .css, only <style> block bodies for .astro.
function scannableText(file, raw) {
  if (file.endsWith('.css')) return blankComments(raw);
  // .astro: keep only <style> ... </style> bodies.
  let out = raw.replace(/[^\n]/g, ' ');
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = styleRe.exec(raw)) !== null) {
    const body = m[1];
    const start = m.index + m[0].indexOf(body);
    out = out.slice(0, start) + body + out.slice(start + body.length);
  }
  return blankComments(out);
}

function walk(dir, extensions, excludeDirs, acc) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!excludeDirs.includes(e.name)) walk(full, extensions, excludeDirs, acc);
    } else if (extensions.some((ext) => e.name.endsWith(ext))) {
      acc.push(full);
    }
  }
  return acc;
}

function main() {
  const { config, root } = parseArgs(process.argv);
  const cfgPath = path.resolve(root, config);
  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  } catch (e) {
    fail(`cannot read config ${cfgPath}: ${e.message}`);
  }

  const roots = cfg.roots && cfg.roots.length ? cfg.roots : ['.'];
  const extensions = cfg.extensions && cfg.extensions.length ? cfg.extensions : DEFAULT_EXTENSIONS;
  const excludeDirs = Array.from(new Set([...DEFAULT_EXCLUDE_DIRS, ...(cfg.excludeDirs || [])]));
  const allow = buildAllowSet(cfg.allow);

  const files = [];
  for (const r of roots) walk(path.resolve(root, r), extensions, excludeDirs, files);

  const violations = [];
  for (const file of files.sort()) {
    const raw = fs.readFileSync(file, 'utf8');
    const rawLines = raw.split('\n');
    const text = scannableText(file, raw);
    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      // The escape marker is checked on the ORIGINAL line - it lives in a
      // comment, which `text` has already blanked out.
      if (rawLines[idx] && rawLines[idx].includes(ALLOW_MARKER)) return;
      let m;
      HEX_RE.lastIndex = 0;
      while ((m = HEX_RE.exec(line)) !== null) {
        const norm = normalizeHex(m[0]);
        if (allow.has(norm)) continue;
        violations.push({
          file: path.relative(root, file),
          line: idx + 1,
          hex: m[0],
        });
      }
    });
  }

  if (violations.length === 0) {
    console.log(`lint-styles: OK - no raw chrome hex in ${files.length} file(s).`);
    process.exit(0);
  }

  console.error(`lint-styles: ${violations.length} raw hex color(s) found (use a --wrf-* token, or add to "allow" if it is a domain color):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.hex}`);
  }
  console.error(`\nInline escape for a genuine one-off: put "${ALLOW_MARKER}" in a comment on the line.`);
  process.exit(1);
}

main();
