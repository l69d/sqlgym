/**
 * Correctness gate. For every problem:
 *   - require exactly 4 hidden edge cases (5 graded datasets incl. the example)
 *   - run the grading oracle (solutionSql) on EVERY dataset; assert it is
 *     deterministic, and non-empty on the visible example
 *   - run EVERY solution approach on EVERY dataset and assert it matches the
 *     oracle (row order checked when orderMatters, else compared as a multiset)
 *   - assert the editor's starter does NOT reproduce the example's answer
 *   - assert the `trap` (a deliberately sloppy query) PASSES the example yet
 *     FAILS at least one edge case — i.e. the edge cases really do reject a
 *     careless solution
 *
 * Run with:  npx tsx scripts/verify.mts
 */
import initSqlJs from "sql.js";
import { problems } from "../src/lib/problems/index";
import { gradedCases } from "../src/lib/types";

const SQL = await initSqlJs();

function run(setup: string, sql: string) {
  const db = new SQL.Database();
  db.run(setup);
  const res = db.exec(sql);
  db.close();
  const last = res[res.length - 1];
  return last ? { columns: last.columns, values: last.values } : { columns: [], values: [] };
}

/** run() but never throws — returns the error message instead. */
function tryValues(setup: string, sql: string): { values: unknown[][] | null; error: string | null } {
  try {
    return { values: run(setup, sql).values, error: null };
  } catch (e) {
    return { values: null, error: (e as Error).message };
  }
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
let caseRuns = 0;
let trapCount = 0;
const slugs = new Set<string>();

for (const p of problems) {
  if (slugs.has(p.slug)) {
    console.error(`DUPLICATE SLUG: ${p.slug}`);
    failures++;
  }
  slugs.add(p.slug);

  const tag = `[${p.number}] ${p.slug}`;
  const cases = gradedCases(p); // example first, then the edge cases
  const edgeCount = p.tests?.length ?? 0;

  // 1. exactly 4 edge cases (5 graded datasets total)
  if (edgeCount !== 4) {
    console.error(`✗ ${tag} — has ${edgeCount} edge case(s); needs exactly 4 (5 test cases total)`);
    failures++;
    continue;
  }

  // 2. oracle on every dataset: deterministic, and non-empty on the example
  const oracle: unknown[][][] = [];
  let bad = false;
  for (const c of cases) {
    const r1 = tryValues(c.setupSql, p.solutionSql);
    if (r1.error) {
      console.error(`✗ ${tag} — oracle errored on "${c.name}": ${r1.error}`);
      failures++;
      bad = true;
      break;
    }
    const r2 = tryValues(c.setupSql, p.solutionSql);
    if (JSON.stringify(r1.values) !== JSON.stringify(r2.values)) {
      console.error(`✗ ${tag} — oracle is non-deterministic on "${c.name}"`);
      failures++;
      bad = true;
      break;
    }
    if (c.isExample && r1.values!.length === 0) {
      console.error(`✗ ${tag} — example oracle returned 0 rows`);
      failures++;
      bad = true;
      break;
    }
    oracle.push(r1.values!);
  }
  if (bad) continue;

  const approaches = p.approaches ?? [];
  if (approaches.length === 0) {
    console.error(`✗ ${tag} — no approaches`);
    failures++;
    continue;
  }

  let ok = true;

  // 3. every approach matches the oracle on every dataset
  for (const a of approaches) {
    approachCount++;
    for (let i = 0; i < cases.length; i++) {
      caseRuns++;
      const got = tryValues(cases[i].setupSql, a.sql);
      if (got.error) {
        console.error(`✗ ${tag} — approach "${a.name}" raised on "${cases[i].name}": ${got.error}`);
        ok = false;
        failures++;
      } else if (!sameRows(oracle[i], got.values!, p.orderMatters)) {
        console.error(`✗ ${tag} — approach "${a.name}" mismatches the oracle on "${cases[i].name}"`);
        ok = false;
        failures++;
      }
    }
  }

  // 4. the starter must not already be the answer (checked on the example)
  const starter = tryValues(p.setupSql, p.starterSql);
  if (starter.error === null && starter.values!.length > 0 && sameRows(oracle[0], starter.values!, p.orderMatters)) {
    console.error(`✗ ${tag} — starterSql grades as Accepted (it gives away the solution)`);
    ok = false;
    failures++;
  }

  // 5. the trap proves the edge cases have teeth: passes the example, fails >=1 edge
  if (!p.trap || !p.trap.sql?.trim()) {
    console.error(`✗ ${tag} — missing trap query (a sloppy solution the edge cases should reject)`);
    ok = false;
    failures++;
  } else {
    trapCount++;
    const trapEx = tryValues(p.setupSql, p.trap.sql);
    const trapPassesExample =
      trapEx.error === null && sameRows(oracle[0], trapEx.values!, p.orderMatters);
    let trapFailsSomeEdge = false;
    for (let i = 1; i < cases.length; i++) {
      const tv = tryValues(cases[i].setupSql, p.trap.sql);
      const passes = tv.error === null && sameRows(oracle[i], tv.values!, p.orderMatters);
      if (!passes) trapFailsSomeEdge = true;
    }
    if (!trapPassesExample) {
      console.error(`✗ ${tag} — trap should pass the example (a realistic sloppy query looks right there)`);
      ok = false;
      failures++;
    }
    if (!trapFailsSomeEdge) {
      console.error(`✗ ${tag} — trap passes every edge case (the edge cases don't catch sloppiness)`);
      ok = false;
      failures++;
    }
  }

  if (ok) {
    console.log(
      `✓ [${String(p.number).padStart(3)}] ${p.slug.padEnd(38)} ${p.category.padEnd(20)} ${approaches.length} appr · ${cases.length} cases · ${oracle[0].length} rows`,
    );
  }
}

console.log(
  `\n${problems.length} problems · ${approachCount} approaches · ${caseRuns} case-runs · ${trapCount} traps · ${slugs.size} unique slugs · ${failures} failures`,
);
process.exit(failures > 0 ? 1 : 0);
