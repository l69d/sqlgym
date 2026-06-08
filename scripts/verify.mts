/**
 * Correctness gate. For every problem:
 *   - run its grading oracle (solutionSql) on a fresh SQLite db -> expected
 *   - assert expected is non-empty and deterministic
 *   - run EVERY solution approach and assert it matches `expected`
 *     (row order checked when orderMatters, else compared as a multiset)
 *
 * Run with:  npx tsx scripts/verify.mts
 */
import initSqlJs from "sql.js";
import { problems } from "../src/lib/problems/index";

const SQL = await initSqlJs();

function run(setup: string, sql: string) {
  const db = new SQL.Database();
  db.run(setup);
  const res = db.exec(sql);
  db.close();
  const last = res[res.length - 1];
  return last ? { columns: last.columns, values: last.values } : { columns: [], values: [] };
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return "␀";
  if (typeof v === "number")
    return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6);
  return String(v);
}
const serialize = (row: unknown[]) => row.map(cell).join("");

function sameRows(a: unknown[][], b: unknown[][], ordered: boolean): boolean {
  if (a.length !== b.length) return false;
  const sa = a.map(serialize);
  const sb = b.map(serialize);
  if (ordered) return sa.every((r, i) => r === sb[i]);
  const counts = new Map<string, number>();
  for (const r of sa) counts.set(r, (counts.get(r) ?? 0) + 1);
  for (const r of sb) {
    const c = counts.get(r);
    if (!c) return false;
    counts.set(r, c - 1);
  }
  return true;
}

let failures = 0;
let approachCount = 0;
const slugs = new Set<string>();

for (const p of problems) {
  if (slugs.has(p.slug)) {
    console.error(`DUPLICATE SLUG: ${p.slug}`);
    failures++;
  }
  slugs.add(p.slug);

  let expected;
  try {
    expected = run(p.setupSql, p.solutionSql);
    const again = run(p.setupSql, p.solutionSql);
    if (JSON.stringify(expected.values) !== JSON.stringify(again.values))
      throw new Error("non-deterministic oracle");
  } catch (e) {
    console.error(`✗ [${p.number}] ${p.slug} — oracle error: ${(e as Error).message}`);
    failures++;
    continue;
  }

  if (expected.values.length === 0) {
    console.error(`✗ [${p.number}] ${p.slug} — oracle returned 0 rows`);
    failures++;
    continue;
  }

  // Guard: the editor's starter must NOT be a complete, submittable solution.
  // A starter that errors / returns the wrong rows is a fine skeleton; one that
  // reproduces the oracle's result is the answer pre-filled — reject it.
  try {
    const fromStarter = run(p.setupSql, p.starterSql);
    if (
      fromStarter.values.length > 0 &&
      sameRows(expected.values, fromStarter.values, p.orderMatters)
    ) {
      console.error(
        `✗ [${p.number}] ${p.slug} — starterSql grades as Accepted (it gives away the solution)`,
      );
      failures++;
    }
  } catch {
    /* skeleton starter that doesn't run — exactly what we want */
  }

  const approaches = p.approaches ?? [];
  if (approaches.length === 0) {
    console.error(`✗ [${p.number}] ${p.slug} — no approaches`);
    failures++;
    continue;
  }

  let ok = true;
  for (const a of approaches) {
    approachCount++;
    try {
      const got = run(p.setupSql, a.sql);
      if (!sameRows(expected.values, got.values, p.orderMatters)) {
        console.error(
          `✗ [${p.number}] ${p.slug} — approach "${a.name}" does not match the oracle`,
        );
        ok = false;
        failures++;
      }
    } catch (e) {
      console.error(
        `✗ [${p.number}] ${p.slug} — approach "${a.name}" raised: ${(e as Error).message}`,
      );
      ok = false;
      failures++;
    }
  }

  if (ok) {
    console.log(
      `✓ [${String(p.number).padStart(3)}] ${p.slug.padEnd(38)} ${p.category.padEnd(20)} ${approaches.length} appr  ${expected.values.length} rows`,
    );
  }
}

console.log(
  `\n${problems.length} problems · ${approachCount} approaches · ${slugs.size} unique slugs · ${failures} failures`,
);
process.exit(failures > 0 ? 1 : 0);
