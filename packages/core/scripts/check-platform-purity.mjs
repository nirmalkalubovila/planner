#!/usr/bin/env node
// Guards @llb/core's core promise: no DOM globals, no import.meta, no
// Tailwind class-string literals. The tsconfig's missing "DOM" lib already
// makes DOM-global *references* (window, document, localStorage, ...) a
// hard compile error via `npm run typecheck` — this script covers the two
// things a type-check can't catch: import.meta (a parse-time construct,
// not a type error) and Tailwind class strings (valid, well-typed string
// literals that just don't belong here).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

// Reusable across packages: run from the target package's directory (as an
// npm script always does) and it checks that package's own `src/`, or pass
// an explicit path as the first argument.
const SRC = resolve(process.cwd(), process.argv[2] ?? 'src');

// A conservative match for Tailwind utility tokens: a known prefix followed
// by a dash and a value. The value must START with an alphanumeric or `[`
// (never `]`, `.`, `(`, `-`) so this doesn't false-positive on things like
// a `[\w-]` regex character class. Deliberately narrow to avoid false
// positives on ordinary prose/identifiers.
const TAILWIND_PATTERN =
  /\b(?:bg|text|border|from|to|via|ring|shadow|rounded|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|h|gap|flex|grid|z|opacity|backdrop)-[a-z0-9[][a-z0-9/[\]().%#-]*/;

const IMPORT_META_PATTERN = /\bimport\.meta\b/;

let violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === '__tests__' || entry === '__snapshots__') continue;
      walk(full);
    } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.test.ts')) {
      const content = readFileSync(full, 'utf8');
      const relPath = relative(SRC, full);
      content.split('\n').forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
        if (IMPORT_META_PATTERN.test(line)) {
          violations.push(`${relPath}:${idx + 1}: uses import.meta`);
        }
        const match = line.match(TAILWIND_PATTERN);
        if (match) {
          violations.push(`${relPath}:${idx + 1}: looks like a Tailwind class string ("${match[0]}")`);
        }
      });
    }
  }
}

walk(SRC);

if (violations.length > 0) {
  console.error('Platform-purity check failed — @llb/core must stay framework/DOM/styling-agnostic:\n');
  for (const v of violations) console.error('  ' + v);
  console.error(`\n${violations.length} violation(s). See packages/core/src/index.ts for the ground rules.`);
  process.exit(1);
}

console.log('Platform-purity check passed.');
