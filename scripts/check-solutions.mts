/**
 * Validate a *.solutions.json file: { slug: SolutionApproach[] }. Each approach
 * must run and match that EXISTING problem's grading oracle.
 *
 *   npx tsx scripts/check-solutions.mts <path-to.solutions.json>
 */
import initSqlJs from "sql.js";
import { readFileSync } from "node:fs";
import { problemBySlug } from "../src/lib/problems/index";

const file = process.argv[2];
if (!file) {
  console.error("usage: npx tsx scripts/check-solutions.mts <file.solutions.json>");
  process.exit(2);
}
const map = JSON.parse(readFileSync(file, "utf8")) as Record<
  string,
  { name: string; sql: string; explanation: string }[]
>;
const SQL = await initSqlJs();

function run(setup: string, sql: string) {
  const db = new SQL.Database();
  db.run(setup);
  const r = db.exec(sql);
  db.close();
  const l = r[r.length - 1];
  return l ? l.values : [];
}
function cell(v: unknown): string {
  if (v === null || v === undefined) return "␀";
  if (typeof v === "number")
    return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6);
  return String(v);
}
const ser = (row: unknown[]) => row.map(cell).join("|");
function same(a: unknown[][], b: unknown[][], ordered: boolean): boolean {
  if (a.length !== b.length) return false;
  const sa = a.map(ser),
    sb = b.map(ser);
  if (ordered) return sa.every((r, i) => r === sb[i]);
  const m = new Map<string, number>();
  for (const r of sa) m.set(r, (m.get(r) ?? 0) + 1);
  for (const r of sb) {
    const c = m.get(r);
    if (!c) return false;
    m.set(r, c - 1);
  }
  return true;
}

let fail = 0;
for (const [slug, approaches] of Object.entries(map)) {
  const p = problemBySlug[slug];
  if (!p) {
    console.error(`✗ ${slug} — not an existing problem`);
    fail++;
    continue;
  }
  try {
    const oracle = run(p.setupSql, p.solutionSql);
    for (const a of approaches) {
      const got = run(p.setupSql, a.sql);
      if (!same(oracle, got, p.orderMatters))
        throw new Error(`approach "${a.name}" != oracle (orderMatters=${p.orderMatters})`);
      if (!a.explanation || !a.explanation.trim())
        throw new Error(`approach "${a.name}" missing explanation`);
    }
    console.log(`✓ ${slug.padEnd(38)} ${approaches.length} appr`);
  } catch (e) {
    console.error(`✗ ${slug} — ${(e as Error).message}`);
    fail++;
  }
}
console.log(`\n${Object.keys(map).length} solution sets, ${fail} failures`);
process.exit(fail ? 1 : 0);
