/**
 * Self-check harness for a SINGLE problem's candidate edge cases + trap.
 *
 *   node scripts/testcase-runner.mjs <path-to-candidate.json>
 *
 * The JSON must contain:
 *   {
 *     "slug": "...",                       // optional, for messages
 *     "setupSql": "...",                   // the example dataset
 *     "solutionSql": "...",                // grading oracle
 *     "orderMatters": true|false,
 *     "approaches": [{ "name": "...", "sql": "..." }, ...],
 *     "tests": [{ "name": "...", "setupSql": "..." }, ...],   // EXACTLY 4
 *     "trap":  { "sql": "...", "note": "..." }
 *   }
 *
 * It applies the EXACT rules scripts/verify.mts enforces, in isolation, so an
 * author can iterate until a problem is green without touching the registry.
 * Prints per-check results and a final `RESULT: PASS` / `RESULT: FAIL` line.
 */
import initSqlJs from "sql.js";
import { readFileSync } from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error("usage: node scripts/testcase-runner.mjs <candidate.json>");
  process.exit(2);
}

const SQL = await initSqlJs();

function run(setup, sql) {
  const db = new SQL.Database();
  db.run(setup);
  const res = db.exec(sql);
  db.close();
  const last = res[res.length - 1];
  return last ? { columns: last.columns, values: last.values } : { columns: [], values: [] };
}
function tryValues(setup, sql) {
  try {
    return { values: run(setup, sql).values, error: null };
  } catch (e) {
    return { values: null, error: e.message };
  }
}
function cell(v) {
  if (v === null || v === undefined) return "␀";
  if (typeof v === "number")
    return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6);
  return String(v);
}
const serialize = (row) => row.map(cell).join("");
function sameRows(a, b, ordered) {
  if (a.length !== b.length) return false;
  const sa = a.map(serialize);
  const sb = b.map(serialize);
  if (ordered) return sa.every((r, i) => r === sb[i]);
  const counts = new Map();
  for (const r of sa) counts.set(r, (counts.get(r) ?? 0) + 1);
  for (const r of sb) {
    const c = counts.get(r);
    if (!c) return false;
    counts.set(r, c - 1);
  }
  return true;
}

const p = JSON.parse(readFileSync(path, "utf8"));
const slug = p.slug ?? "(candidate)";
const om = !!p.orderMatters;
const problems_failures = [];
const ok = (m) => console.log(`  ✓ ${m}`);
const no = (m) => {
  console.log(`  ✗ ${m}`);
  problems_failures.push(m);
};

console.log(`# ${slug}`);

// shape
if (!Array.isArray(p.tests) || p.tests.length !== 4)
  no(`tests must be exactly 4 (got ${p.tests?.length ?? 0})`);
if (!p.trap || !p.trap.sql) no(`trap.sql is required`);
if (!Array.isArray(p.approaches) || p.approaches.length === 0)
  no(`approaches must be a non-empty array`);

const cases = [
  { name: "Example", setupSql: p.setupSql, isExample: true },
  ...(p.tests ?? []).map((t) => ({ name: t.name, setupSql: t.setupSql, isExample: false })),
];

// oracle on every case
const oracle = [];
let oracleOk = true;
for (const c of cases) {
  const r1 = tryValues(c.setupSql, p.solutionSql);
  if (r1.error) {
    no(`oracle errored on "${c.name}": ${r1.error}`);
    oracleOk = false;
    oracle.push(null);
    continue;
  }
  const r2 = tryValues(c.setupSql, p.solutionSql);
  if (JSON.stringify(r1.values) !== JSON.stringify(r2.values)) {
    no(`oracle non-deterministic on "${c.name}" (add a tie-breaker to ORDER BY)`);
    oracleOk = false;
  }
  if (c.isExample && r1.values.length === 0) {
    no(`example oracle returned 0 rows`);
    oracleOk = false;
  }
  oracle.push(r1.values);
  ok(`oracle ran on "${c.name}" → ${r1.values.length} row(s)`);
}

// approaches match oracle on every case
if (oracleOk) {
  for (const a of p.approaches ?? []) {
    for (let i = 0; i < cases.length; i++) {
      if (!oracle[i]) continue;
      const got = tryValues(cases[i].setupSql, a.sql);
      if (got.error) no(`approach "${a.name}" raised on "${cases[i].name}": ${got.error}`);
      else if (!sameRows(oracle[i], got.values, om))
        no(`approach "${a.name}" mismatches oracle on "${cases[i].name}"`);
    }
  }
  if (problems_failures.length === 0) ok(`all approaches match the oracle on all ${cases.length} cases`);
}

// trap: passes example, fails >=1 edge
if (oracleOk && p.trap?.sql) {
  const trapEx = tryValues(p.setupSql, p.trap.sql);
  const passesExample = trapEx.error === null && oracle[0] && sameRows(oracle[0], trapEx.values, om);
  let failsSomeEdge = false;
  const edgeOutcomes = [];
  for (let i = 1; i < cases.length; i++) {
    if (!oracle[i]) continue;
    const tv = tryValues(cases[i].setupSql, p.trap.sql);
    const passes = tv.error === null && sameRows(oracle[i], tv.values, om);
    if (!passes) failsSomeEdge = true;
    edgeOutcomes.push(`${cases[i].name}: ${passes ? "passes" : "FAILS"}`);
  }
  if (passesExample) ok(`trap passes the example`);
  else no(`trap must PASS the example but doesn't (note: ${p.trap.note})`);
  if (failsSomeEdge) ok(`trap is caught by an edge case [${edgeOutcomes.join(" · ")}]`);
  else no(`trap passes every edge case — edge cases lack discriminating power [${edgeOutcomes.join(" · ")}]`);
}

const passed = problems_failures.length === 0;
console.log(passed ? `RESULT: PASS` : `RESULT: FAIL (${problems_failures.length} issue(s))`);
process.exit(passed ? 0 : 1);
