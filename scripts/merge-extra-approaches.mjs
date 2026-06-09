/**
 * Merge workflow-authored extra approaches into extra-approaches.json.
 *
 *   node scripts/merge-extra-approaches.mjs
 *
 * For each .wf-tmp/appr-cand/<slug>.json it RE-RUNS the harness (so every
 * approach is re-checked against the oracle on all 5 datasets), then keeps the
 * approaches that are NOT already in the problem's existing set (diffed by
 * normalized SQL against .wf-tmp/appr-ctx/<slug>.json). Only genuinely-new,
 * verified approaches land in extra-approaches.json.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candDir = resolve(root, ".wf-tmp/appr-cand");
const ctxDir = resolve(root, ".wf-tmp/appr-ctx");
const harness = resolve(root, "scripts/testcase-runner.mjs");
const outFile = resolve(root, "src/lib/problems/data/extra-approaches.json");

const norm = (s) => String(s).replace(/\s+/g, " ").trim().toLowerCase();
const isApproach = (a) =>
  a && typeof a.name === "string" && a.name.trim() &&
  typeof a.sql === "string" && a.sql.trim() &&
  typeof a.explanation === "string" && a.explanation.trim();

const out = {};
let added = 0;
const failed = [];
const skipped = [];

const files = existsSync(candDir)
  ? readdirSync(candDir).filter((f) => f.endsWith(".json")).sort()
  : [];

for (const f of files) {
  const slug = f.replace(/\.json$/, "");
  const candPath = resolve(candDir, f);
  let cand;
  try {
    cand = JSON.parse(readFileSync(candPath, "utf8"));
  } catch {
    skipped.push(slug + " (bad json)");
    continue;
  }
  // re-verify the full approach set against the oracle on all 5 datasets
  try {
    execFileSync("node", [harness, candPath], { stdio: "pipe" });
  } catch {
    failed.push(slug);
    continue;
  }
  // diff against the existing approaches
  const ctx = JSON.parse(readFileSync(resolve(ctxDir, f), "utf8"));
  const existing = new Set((ctx.approaches ?? []).map((a) => norm(a.sql)));
  const fresh = (cand.approaches ?? [])
    .filter((a) => isApproach(a) && !existing.has(norm(a.sql)))
    .map((a) => ({ name: a.name, sql: a.sql, explanation: a.explanation }));
  // de-dupe within the fresh set too
  const seen = new Set();
  const deduped = [];
  for (const a of fresh) {
    const k = norm(a.sql);
    if (!seen.has(k)) { seen.add(k); deduped.push(a); }
  }
  if (deduped.length) {
    out[slug] = deduped;
    added += deduped.length;
  }
}

const sorted = {};
for (const k of Object.keys(out).sort()) sorted[k] = out[k];
writeFileSync(outFile, JSON.stringify(sorted, null, 2) + "\n");

console.log(`merged ${added} new approaches across ${Object.keys(sorted).length} problems`);
if (failed.length) console.log(`harness-FAILED (skipped): ${failed.join(", ")}`);
if (skipped.length) console.log(`skipped: ${skipped.join(", ")}`);
