/**
 * Offline correctness gate: load every problem, run its solution against a
 * fresh SQLite db, and assert it executes and returns rows. Run with:
 *   npx tsx scripts/verify.mts
 */
import initSqlJs from "sql.js";
import { problems } from "../src/lib/problems/index";

const SQL = await initSqlJs();

let failures = 0;
const slugs = new Set<string>();

for (const p of problems) {
  if (slugs.has(p.slug)) {
    console.error(`DUPLICATE SLUG: ${p.slug}`);
    failures++;
  }
  slugs.add(p.slug);

  // run twice to confirm determinism
  let res1: ReturnType<typeof db1.exec>;
  let res2;
  let db1: import("sql.js").Database;
  try {
    db1 = new SQL.Database();
    db1.run(p.setupSql);
    res1 = db1.exec(p.solutionSql);
    db1.close();
    const db2 = new SQL.Database();
    db2.run(p.setupSql);
    res2 = db2.exec(p.solutionSql);
    db2.close();
  } catch (e) {
    console.error(`\n✗ [${p.number}] ${p.slug}\n   ERROR: ${(e as Error).message}`);
    failures++;
    continue;
  }

  const r1 = res1[res1.length - 1];
  if (!r1 || r1.values.length === 0) {
    console.error(`\n✗ [${p.number}] ${p.slug}\n   solution returned 0 rows`);
    failures++;
    continue;
  }

  // determinism check
  const s1 = JSON.stringify(res1[res1.length - 1].values);
  const s2 = JSON.stringify(res2[res2.length - 1].values);
  if (s1 !== s2) {
    console.error(`\n✗ [${p.number}] ${p.slug}\n   NON-DETERMINISTIC output`);
    failures++;
    continue;
  }

  // distinct-rows check for order-sensitive problems (cheap ambiguity guard)
  if (p.orderMatters) {
    const seen = new Set(r1.values.map((row) => JSON.stringify(row)));
    const ambiguousNote =
      seen.size !== r1.values.length ? "  ⚠ duplicate full rows" : "";
    console.log(
      `✓ [${String(p.number).padStart(2)}] ${p.slug.padEnd(34)} ${r1.columns.join(",").padEnd(40)} ${r1.values.length} rows${ambiguousNote}`,
    );
  } else {
    console.log(
      `✓ [${String(p.number).padStart(2)}] ${p.slug.padEnd(34)} ${r1.columns.join(",").padEnd(40)} ${r1.values.length} rows  (unordered)`,
    );
  }
}

console.log(
  `\n${problems.length} problems, ${slugs.size} unique slugs, ${failures} failures`,
);
process.exit(failures > 0 ? 1 : 0);
