import type { Database, SqlJsStatic } from "sql.js";
import type { CheckResult, Problem, QueryResult } from "./types";

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

/**
 * Run the user's query against a fresh copy of the problem's data and compare
 * it to the canonical solution. The solution result is computed live so it is
 * always in sync with the seed data.
 */
export async function checkAnswer(
  problem: Problem,
  userSql: string,
): Promise<CheckResult> {
  if (!userSql.trim()) {
    return { passed: false, message: "Write a query first." };
  }

  let expected: QueryResult;
  let got: QueryResult;

  // expected — run the canonical solution on its own clean db
  try {
    const db = await createDb(problem.setupSql);
    expected = runQuery(db, problem.solutionSql);
    db.close();
  } catch (e) {
    return {
      passed: false,
      message: "Internal error computing the expected answer.",
      error: e instanceof Error ? e.message : String(e),
    };
  }

  // got — run the user's query on a separate clean db
  try {
    const db = await createDb(problem.setupSql);
    got = runQuery(db, userSql);
    db.close();
  } catch (e) {
    return {
      passed: false,
      message: "Your query raised an error.",
      error: e instanceof Error ? e.message : String(e),
    };
  }

  if (got.columns.length !== expected.columns.length) {
    return {
      passed: false,
      message: `Wrong number of columns — expected ${expected.columns.length}, got ${got.columns.length}.`,
      expected,
      got,
    };
  }

  const passed = sameRows(expected.rows, got.rows, problem.orderMatters);
  return {
    passed,
    message: passed
      ? "Accepted — your result matches the expected output."
      : problem.orderMatters
        ? "Wrong answer — the rows or their order don't match."
        : "Wrong answer — the rows don't match.",
    expected,
    got,
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
