export type Difficulty = "Easy" | "Medium" | "Hard";

export type Category =
  | "Recursive CTEs"
  | "CTEs"
  | "Window Functions"
  | "Ranking"
  | "Advanced Filtering"
  | "Ordering";

export const CATEGORIES: Category[] = [
  "Recursive CTEs",
  "CTEs",
  "Window Functions",
  "Ranking",
  "Advanced Filtering",
  "Ordering",
];

export const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

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
  /** canonical correct query — also used to compute the expected result set */
  solutionSql: string;
  /** prefilled into the editor */
  starterSql: string;
  /**
   * Whether the row ORDER of the result is checked. Set true whenever the
   * prompt asks the rows to come back in a specific order.
   */
  orderMatters: boolean;
  hints?: string[];
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
