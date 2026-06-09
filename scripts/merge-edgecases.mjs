/**
 * Merge workflow-authored candidates into edgecases.json.
 *
 *   node scripts/merge-edgecases.mjs
 *
 * For every .wf-tmp/cand/<slug>.json it RE-RUNS the harness (so nothing is
 * trusted blindly); only candidates that print RESULT: PASS are merged. The
 * existing edgecases.json entries are preserved. Reports what was skipped.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candDir = resolve(root, ".wf-tmp/cand");
const harness = resolve(root, "scripts/testcase-runner.mjs");
const outFile = resolve(root, "src/lib/problems/data/edgecases.json");

const existing = existsSync(outFile) ? JSON.parse(readFileSync(outFile, "utf8")) : {};
const merged = { ...existing };

const files = existsSync(candDir)
  ? readdirSync(candDir).filter((f) => f.endsWith(".json")).sort()
  : [];

let added = 0;
const failed = [];
const malformed = [];

for (const f of files) {
  const full = resolve(candDir, f);
  let cand;
  try {
    cand = JSON.parse(readFileSync(full, "utf8"));
  } catch {
    malformed.push(f);
    continue;
  }
  if (!cand.slug || !Array.isArray(cand.tests) || cand.tests.length !== 4 || !cand.trap) {
    malformed.push(cand.slug ?? f);
    continue;
  }
  // re-verify through the harness — exit 0 == RESULT: PASS
  try {
    execFileSync("node", [harness, full], { stdio: "pipe" });
  } catch {
    failed.push(cand.slug);
    continue;
  }
  merged[cand.slug] = { tests: cand.tests, trap: cand.trap };
  added++;
}

// write with sorted keys for a stable diff
const sorted = {};
for (const k of Object.keys(merged).sort()) sorted[k] = merged[k];
writeFileSync(outFile, JSON.stringify(sorted, null, 2) + "\n");

console.log(`merged ${added} candidate(s); edgecases.json now covers ${Object.keys(sorted).length} problems`);
if (failed.length) console.log(`harness-FAILED (skipped): ${failed.join(", ")}`);
if (malformed.length) console.log(`malformed (skipped): ${malformed.join(", ")}`);
