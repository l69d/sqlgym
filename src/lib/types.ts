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
}

export interface QueryResult {
  columns: string[];
  rows: (string | number | null | Uint8Array)[][];
}

export interface CheckResult {
  passed: boolean;
  message: string;
  expected?: QueryResult;
  got?: QueryResult;
  /** runtime/SQL error surfaced to the user, if any */
  error?: string;
}
