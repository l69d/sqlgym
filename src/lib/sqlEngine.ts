import type { Database, SqlJsStatic } from "sql.js";
import type { CaseResult, CheckResult, Problem, QueryResult } from "./types";
import { gradedCases } from "./types";

let sqlPromise: Promise<SqlJsStatic> | null = null;

/** Load (and cache) the sql.js WASM runtime. Browser-only. */
export async function getSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    // dynamic import so the heavy module never lands in the server bundle
    const initSqlJs = (await import("sql.js")).default;
    sqlPromise = initSqlJs({
      // sql-wasm.wasm is copied into /public during build
      locateFile: (file: string) => `/${file}`,
    });
  }
  return sqlPromise;
}

/** Spin up a fresh in-memory database seeded with a problem's setup SQL. */
export async function createDb(setupSql: string): Promise<Database> {
  const SQL = await getSql();
  const db = new SQL.Database();
  db.run(setupSql);
  return db;
}

/**
 * Execute arbitrary SQL and return the LAST result set that produced rows.
 * Throws with the raw SQLite error message on failure.
 */
export function runQuery(db: Database, sql: string): QueryResult {
  const results = db.exec(sql);
  if (results.length === 0) {
    return { columns: [], rows: [] };
  }
  const last = results[results.length - 1];
  return {
    columns: last.columns,
    rows: last.values as QueryResult["rows"],
  };
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return "␀"; // explicit NULL marker
  if (typeof v === "number") {
    // collapse 3 and 3.0, tame float noise so 0.1+0.2 style answers match
    return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6);
  }
  return String(v);
}

function serializeRow(row: unknown[]): string {
  return row.map(cell).join("");
}

/** Order-insensitive multiset comparison of two row arrays. */
function sameRows(a: unknown[][], b: unknown[][], ordered: boolean): boolean {
  if (a.length !== b.length) return false;
  const sa = a.map(serializeRow);
  const sb = b.map(serializeRow);
  if (ordered) {
    return sa.every((r, i) => r === sb[i]);
  }
  const counts = new Map<string, number>();
  for (const r of sa) counts.set(r, (counts.get(r) ?? 0) + 1);
  for (const r of sb) {
    const c = counts.get(r);
    if (!c) return false;
    counts.set(r, c - 1);
  }
  return true;
}

/** Dump every user table of a db (all rows — datasets are tiny). */
function dumpTables(db: Database): { name: string; result: QueryResult }[] {
  const tablesRes = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  if (tablesRes.length === 0) return [];
  return tablesRes[0].values
    .map((r) => String(r[0]))
    .map((name) => ({ name, result: runQuery(db, `SELECT * FROM ${name}`) }));
}

/** The oracle's result on the visible example — what the question advertises. */
export async function exampleExpected(problem: Problem): Promise<QueryResult> {
  const db = await createDb(problem.setupSql);
  try {
    return runQuery(db, problem.solutionSql);
  } finally {
    db.close();
  }
}

/**
 * Grade the user's query against EVERY dataset: the visible example plus every
 * hidden edge case. For each one the canonical solution is recomputed live (so
 * the oracle is always in sync with the seed data) and compared to the user's
 * output. The submission is Accepted only if all of them match — the edge cases
 * are engineered so a careless query slips on at least one.
 */
export async function checkAnswer(
  problem: Problem,
  userSql: string,
): Promise<CheckResult> {
  const cases = gradedCases(problem);
  if (!userSql.trim()) {
    return {
      passed: false,
      message: "Write a query first.",
      cases: [],
      passedCount: 0,
      totalCount: cases.length,
    };
  }

  const results: CaseResult[] = [];

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    let expected: QueryResult;
    let got: QueryResult;

    // oracle on this dataset (recomputed live)
    try {
      const db = await createDb(c.setupSql);
      expected = runQuery(db, problem.solutionSql);
      db.close();
    } catch (e) {
      results.push({
        index: i,
        name: c.name,
        isExample: c.isExample,
        passed: false,
        message: "Internal error computing the expected answer.",
        error: e instanceof Error ? e.message : String(e),
      });
      continue;
    }

    // user query on the same dataset
    try {
      const db = await createDb(c.setupSql);
      got = runQuery(db, userSql);
      db.close();
    } catch (e) {
      results.push({
        index: i,
        name: c.name,
        isExample: c.isExample,
        passed: false,
        error: e instanceof Error ? e.message : String(e),
        message: "Your query raised an error.",
      });
      continue;
    }

    let passed = got.columns.length === expected.columns.length;
    let message: string | undefined;
    if (!passed) {
      message = `Wrong number of columns — expected ${expected.columns.length}, got ${got.columns.length}.`;
    } else {
      passed = sameRows(expected.rows, got.rows, problem.orderMatters);
      if (!passed)
        message = problem.orderMatters
          ? "Rows or their order don't match."
          : "Rows don't match.";
    }

    results.push({
      index: i,
      name: c.name,
      isExample: c.isExample,
      passed,
      expected,
      got,
      message,
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = cases.length;
  const allPassed = passedCount === totalCount && totalCount > 0;

  // surface the first failing case, with its input tables, for debugging
  let firstFailure: CaseResult | undefined;
  const fail = results.find((r) => !r.passed);
  if (fail) {
    let inputTables: { name: string; result: QueryResult }[] | undefined;
    try {
      const db = await createDb(cases[fail.index].setupSql);
      inputTables = dumpTables(db);
      db.close();
    } catch {
      /* leave inputTables undefined */
    }
    firstFailure = { ...fail, inputTables };
  }

  return {
    passed: allPassed,
    message: allPassed
      ? `Accepted — passed all ${totalCount} test cases.`
      : `Wrong Answer — passed ${passedCount} of ${totalCount} test cases.`,
    cases: results,
    passedCount,
    totalCount,
    firstFailure,
  };
}

/** Introspect a live db to render its schema + a few sample rows. */
export interface TableSchema {
  name: string;
  columns: { name: string; type: string }[];
  sample: QueryResult;
}

export function describeSchema(db: Database): TableSchema[] {
  const tablesRes = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  if (tablesRes.length === 0) return [];
  const names = tablesRes[0].values.map((r) => String(r[0]));
  return names.map((name) => {
    const info = db.exec(`PRAGMA table_info(${name})`);
    const columns =
      info.length === 0
        ? []
        : info[0].values.map((r) => ({
            name: String(r[1]),
            type: String(r[2] || ""),
          }));
    const sample = runQuery(db, `SELECT * FROM ${name} LIMIT 5`);
    return { name, columns, sample };
  });
}
