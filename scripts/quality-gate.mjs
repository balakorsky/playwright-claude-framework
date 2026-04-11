/**
 * Quality gate: parses Playwright's JSON report and fails the build
 * if the pass rate drops below PASS_THRESHOLD.
 *
 * Usage:
 *   node scripts/quality-gate.mjs [results-file] [threshold]
 *   node scripts/quality-gate.mjs results.json 0.8
 *
 * Defaults: results.json, threshold = 0.8 (80%)
 */

import { readFileSync } from 'fs';

const resultsFile = process.argv[2] ?? 'results.json';
const threshold = parseFloat(process.argv[3] ?? '0.8');

let results;
try {
  results = JSON.parse(readFileSync(resultsFile, 'utf-8'));
} catch {
  console.error(`Cannot read results file: ${resultsFile}`);
  process.exit(2);
}

const { expected = 0, unexpected = 0, skipped = 0 } = results.stats;
const total = expected + unexpected;
const rate = total === 0 ? 1 : expected / total;

console.log('─────────────────────────────');
console.log('  Quality Gate Report');
console.log('─────────────────────────────');
console.log(`  Passed:    ${expected}`);
console.log(`  Failed:    ${unexpected}`);
console.log(`  Skipped:   ${skipped}`);
console.log(`  Pass rate: ${(rate * 100).toFixed(1)}%`);
console.log(`  Threshold: ${(threshold * 100).toFixed(0)}%`);
console.log('─────────────────────────────');

if (rate < threshold) {
  console.error(`\n✖ QUALITY GATE FAILED: ${(rate * 100).toFixed(1)}% < ${(threshold * 100).toFixed(0)}% required\n`);
  process.exit(1);
}

console.log(`\n✔ Quality gate passed (${(rate * 100).toFixed(1)}% ≥ ${(threshold * 100).toFixed(0)}%)\n`);
