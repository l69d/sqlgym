/**
 * Validate a *.problems.json file: every approach of every problem must run in
 * SQLite and return the same result set as approaches[0] (the oracle).
 *
 *   node scripts/check-problems.mjs <path-to.problems.json>
 */
import initSqlJs from "sql.js";
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/check-problems.mjs <file.problems.json>");
  process.exit(2);
}
const problems = JSON.parse(readFileSync(file, "utf8"));
const SQL = await initSqlJs();

function run(setup, sql) {
  const db = new SQL.Database();
  db.run(setup);
  const r = db.exec(sql);
  db.close();
  const l = r[r.length - 1];
  return l ? l.values : [];
}
function cell(v) {
  if (v === null || v === undefined) return "␀";
  if (typeof v === "number")
    return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6);
  return String(v);
}
const ser = (row) => row.map(cell).join("|");
function same(a, b, ordered) {
  if (a.length !== b.length) return false;
  const sa = a.map(ser),
    sb = b.map(ser);
  if (ordered) return sa.every((r, i) => r === sb[i]);
  const m = new Map();
  for (const r of sa) m.set(r, (m.get(r) ?? 0) + 1);
  for (const r of sb) {
    const c = m.get(r);
    if (!c) return false;
    m.set(r, c - 1);
  }
  return true;
}

let fail = 0;
for (const p of problems) {
  try {
    if (!Array.isArray(p.approaches) || p.approaches.length === 0)
      throw new Error("no approaches");
    const oracle = run(p.setupSql, p.approaches[0].sql);
    const again = run(p.setupSql, p.approaches[0].sql);
    if (JSON.stringify(oracle) !== JSON.stringify(again))
      throw new Error("non-deterministic oracle");
    if (oracle.length === 0) throw new Error("oracle returns 0 rows");
    for (const a of p.approaches) {
      const got = run(p.setupSql, a.sql);
      if (!same(oracle, got, p.orderMatters))
        throw new Error(`approach "${a.name}" != oracle (orderMatters=${p.orderMatters})`);
    }
    console.log(`✓ ${p.slug.padEnd(40)} ${p.approaches.length} appr  ${oracle.length} rows`);
  } catch (e) {
    console.error(`✗ ${p.slug ?? "(no slug)"} — ${e.message}`);
    fail++;
  }
}
console.log(`\n${problems.length} problems, ${fail} failures`);
process.exit(fail ? 1 : 0);
