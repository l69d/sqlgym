export type Difficulty = "Easy" | "Medium" | "Hard";

export type Category =
  | "Joins"
  | "Aggregation"
  | "Subqueries"
  | "Set Operations"
  | "CTEs"
  | "Recursive CTEs"
  | "Window Functions"
  | "Ranking"
  | "Pivoting"
  | "Dates & Time"
  | "String Manipulation"
  | "NULL Handling"
  | "Advanced Filtering"
  | "Ordering";

export const CATEGORIES: Category[] = [
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

export const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

/** A worked solution: code plus a step-by-step explanation (markdown). */
export interface SolutionApproach {
  /** short label, e.g. "Window function (DENSE_RANK)" */
  name: string;
  /** runnable SQL — must return the same result set as the grading oracle */
  sql: string;
  /** markdown walkthrough of how/why this query works */
  explanation: string;
}

/**
 * A hidden edge-case dataset graded in addition to the visible example.
 * Same schema (tables/columns) as the problem's `setupSql`; the canonical
 * `solutionSql` is re-run on it to compute that case's expected rows.
 */
export interface ProblemTest {
  /** short label shown in the submission checklist, e.g. "Ties at the top" */
  name: string;
  /** DDL + seed data — must use the same tables/columns as `setupSql` */
  setupSql: string;
}

/**
 * A plausible-but-wrong "sloppy" query. The grading gate asserts it passes the
 * visible example yet FAILS at least one edge case — which is what proves the
 * edge cases actually have the teeth to reject a careless solution.
 */
export interface TrapQuery {
  sql: string;
  /** one line on what's wrong with it, e.g. "uses COUNT(col), drops NULLs" */
  note: string;
}

export interface Problem {
  /** url-safe unique id */
  slug: string;
  /** sequential display number, assigned in the index */
  number?: number;
  title: string;
  difficulty: Difficulty;
  category: Category;
  /** short concept tags, e.g. ["RANK", "PARTITION BY"] */
  concepts: string[];
  /** markdown problem statement */
  description: string;
  /** DDL + seed data executed into a fresh in-memory db before the user query */
  setupSql: string;
  /** canonical correct query — used to compute the expected result set */
  solutionSql: string;
  /** prefilled into the editor */
  starterSql: string;
  /**
   * Whether the row ORDER of the result is checked. Set true whenever the
   * prompt asks the rows to come back in a specific order.
   */
  orderMatters: boolean;
  hints?: string[];
  /**
   * One or more worked solutions shown under the Solution tab. Always present
   * at runtime (the index backfills it from `solutionSql` if a problem omits
   * it). The first approach should match `solutionSql`.
   */
  approaches?: SolutionApproach[];
  /**
   * Hidden edge-case datasets. A submission must match the oracle on the
   * visible example (`setupSql`) AND on every one of these to be Accepted.
   * Each is engineered so a careless solution slips on at least one.
   */
  tests?: ProblemTest[];
  /** A sloppy query the gate proves the edge cases reject (verify-only). */
  trap?: TrapQuery;
}

/** One graded dataset: the visible example, then the hidden edge cases. */
export interface GradedCase {
  name: string;
  setupSql: string;
  isExample: boolean;
}

/**
 * The full ordered list of datasets a submission is graded against: the
 * visible example (`setupSql`) first, then every hidden edge case.
 */
export function gradedCases(p: Problem): GradedCase[] {
  return [
    { name: "Example", setupSql: p.setupSql, isExample: true },
    ...(p.tests ?? []).map((t) => ({
      name: t.name,
      setupSql: t.setupSql,
      isExample: false,
    })),
  ];
}

export interface QueryResult {
  columns: string[];
  rows: (string | number | null | Uint8Array)[][];
}

/** Outcome of grading a single dataset. */
export interface CaseResult {
  index: number;
  name: string;
  isExample: boolean;
  passed: boolean;
  /** populated only for the case we surface (the first failure) */
  expected?: QueryResult;
  got?: QueryResult;
  /** the failing dataset's tables, dumped so the UI can show the input */
  inputTables?: { name: string; result: QueryResult }[];
  /** SQL/runtime error the user's query raised on this dataset */
  error?: string;
  /** non-error explanation, e.g. wrong column count */
  message?: string;
}

export interface CheckResult {
  /** true only when every graded case passed */
  passed: boolean;
  message: string;
  /** per-case pass/fail, in order (example first) */
  cases: CaseResult[];
  passedCount: number;
  totalCount: number;
  /** the first failing case, carrying the input + expected/got to display */
  firstFailure?: CaseResult;
  /** set when grading itself broke (e.g. the user left the editor empty) */
  error?: string;
}
