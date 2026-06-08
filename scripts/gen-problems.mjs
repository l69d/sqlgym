/**
 * Generate typed problem data from JSON source files.
 *
 *   node scripts/gen-problems.mjs
 *
 * Reads:
 *   src/lib/problems/data/*.problems.json   -> arrays of NEW Problem objects
 *   src/lib/problems/data/*.solutions.json  -> { slug: SolutionApproach[] } for
 *                                              the existing (untouched) problems
 *
 * Emits:
 *   src/lib/problems/extended.generated.ts
 *   src/lib/problems/solutions.generated.ts
 *
 * This step only validates shape + uniqueness. SQL correctness (every approach
 * matching the grading oracle) is enforced separately by scripts/verify.mts.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = resolve(root, "src/lib/problems/data");
const outDir = resolve(root, "src/lib/problems");

const CATEGORIES = [
  "Joins",
  "Aggregation",
  "Subqueries",
  "Set Operations",
  "CTEs",
  "Recursive CTEs",
  "Window Functions",
  "Ranking",
  "Pivoting",
  "Dates & Time",
  "String Manipulation",
  "NULL Handling",
  "Advanced Filtering",
  "Ordering",
];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

// slugs of the 29 existing problems that must NOT be redefined as new
const EXISTING_SLUGS = new Set([
  "generate-number-sequence",
  "employee-hierarchy-levels",
  "build-org-path",
  "fill-date-gaps",
  "fibonacci-sequence",
  "above-average-spenders",
  "filter-within-cte",
  "category-revenue-leaders",
  "highest-and-lowest-earner",
  "running-total-of-sales",
  "three-day-moving-average",
  "month-over-month-change",
  "percent-of-category-total",
  "first-and-last-in-group",
  "difference-from-subject-average",
  "nth-highest-salary",
  "top-2-per-category",
  "rank-vs-dense-rank",
  "consecutive-login-streaks",
  "score-quartiles",
  "bought-every-product",
  "find-duplicate-emails",
  "second-highest-no-limit",
  "customers-with-no-orders",
  "above-average-headcount",
  "custom-priority-sort",
  "nulls-last",
  "order-by-computed-value",
  "multi-key-ordering",
]);

const errors = [];
const newProblems = [];
const solutionsBySlug = {};

if (!existsSync(dataDir)) {
  console.error(`No data dir at ${dataDir}`);
  process.exit(1);
}

const files = readdirSync(dataDir).filter((f) => f.endsWith(".json")).sort();

function isApproach(a) {
  return (
    a &&
    typeof a.name === "string" &&
    typeof a.sql === "string" &&
    a.sql.trim() &&
    typeof a.explanation === "string" &&
    a.explanation.trim()
  );
}

for (const file of files) {
  const full = resolve(dataDir, file);
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(full, "utf8"));
  } catch (e) {
    errors.push(`${file}: invalid JSON — ${e.message}`);
    continue;
  }

  if (file.endsWith(".solutions.json")) {
    for (const [slug, approaches] of Object.entries(parsed)) {
      if (!EXISTING_SLUGS.has(slug))
        errors.push(`${file}: '${slug}' is not an existing problem slug`);
      if (!Array.isArray(approaches) || approaches.length === 0)
        errors.push(`${file}: '${slug}' has no approaches`);
      else if (!approaches.every(isApproach))
        errors.push(`${file}: '${slug}' has a malformed approach`);
      else solutionsBySlug[slug] = approaches;
    }
    continue;
  }

  // *.problems.json
  if (!Array.isArray(parsed)) {
    errors.push(`${file}: expected a JSON array of problems`);
    continue;
  }
  for (const p of parsed) {
    const id = p?.slug ?? "(no slug)";
    if (!p.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug))
      errors.push(`${file}/${id}: bad slug`);
    if (!p.title) errors.push(`${file}/${id}: missing title`);
    if (!CATEGORIES.includes(p.category))
      errors.push(`${file}/${id}: bad category '${p.category}'`);
    if (!DIFFICULTIES.includes(p.difficulty))
      errors.push(`${file}/${id}: bad difficulty '${p.difficulty}'`);
    if (!p.setupSql) errors.push(`${file}/${id}: missing setupSql`);
    if (!Array.isArray(p.concepts) || p.concepts.length === 0)
      errors.push(`${file}/${id}: missing concepts`);
    if (!p.description) errors.push(`${file}/${id}: missing description`);
    if (typeof p.orderMatters !== "boolean")
      errors.push(`${file}/${id}: orderMatters must be boolean`);
    if (!Array.isArray(p.approaches) || !p.approaches.every(isApproach) || p.approaches.length === 0)
      errors.push(`${file}/${id}: missing/malformed approaches`);
    newProblems.push(p);
  }
}

// uniqueness across new + existing
const seen = new Set(EXISTING_SLUGS);
for (const p of newProblems) {
  if (seen.has(p.slug)) errors.push(`duplicate slug: ${p.slug}`);
  seen.add(p.slug);
}

if (errors.length) {
  console.error("VALIDATION FAILED:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}

// normalize: solutionSql := first approach; starterSql default; sort deterministically
for (const p of newProblems) {
  p.solutionSql = p.approaches[0].sql;
  if (!p.starterSql) p.starterSql = "-- write your query here\n";
  if (!p.hints) p.hints = [];
}
newProblems.sort((a, b) => {
  const c = CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category);
  if (c) return c;
  const d = DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty);
  if (d) return d;
  return a.title.localeCompare(b.title);
});

const header = "// AUTO-GENERATED by scripts/gen-problems.mjs — do not edit by hand.\n// Edit the JSON in src/lib/problems/data/ and re-run `node scripts/gen-problems.mjs`.\n";

writeFileSync(
  resolve(outDir, "extended.generated.ts"),
  header +
    'import type { Problem } from "../types";\n\n' +
    "export const extendedProblems: Problem[] = " +
    JSON.stringify(newProblems, null, 2) +
    ";\n",
);

writeFileSync(
  resolve(outDir, "solutions.generated.ts"),
  header +
    'import type { SolutionApproach } from "../types";\n\n' +
    "export const existingSolutions: Record<string, SolutionApproach[]> = " +
    JSON.stringify(solutionsBySlug, null, 2) +
    ";\n",
);

console.log(
  `generated ${newProblems.length} new problems + solutions for ${Object.keys(solutionsBySlug).length} existing problems`,
);
