import type { Problem } from "../types";
import { recursiveProblems } from "./recursive";
import { cteProblems } from "./ctes";
import { windowProblems } from "./windows";
import { rankingProblems } from "./ranking";
import { filteringProblems } from "./filtering";
import { orderingProblems } from "./ordering";

// Interleave categories a little so the list doesn't feel like six blocks,
// while keeping a stable, deterministic order.
const raw: Problem[] = [
  recursiveProblems[0],
  windowProblems[0],
  cteProblems[0],
  rankingProblems[0],
  filteringProblems[0],
  orderingProblems[0],
  recursiveProblems[1],
  windowProblems[1],
  cteProblems[1],
  rankingProblems[1],
  filteringProblems[1],
  orderingProblems[1],
  recursiveProblems[2],
  windowProblems[2],
  cteProblems[2],
  rankingProblems[2],
  filteringProblems[2],
  orderingProblems[2],
  recursiveProblems[3],
  windowProblems[3],
  cteProblems[3],
  rankingProblems[3],
  filteringProblems[3],
  orderingProblems[3],
  recursiveProblems[4],
  windowProblems[4],
  rankingProblems[4],
  filteringProblems[4],
  windowProblems[5],
];

export const problems: Problem[] = raw
  .filter(Boolean)
  .map((p, i) => ({ ...p, number: i + 1 }));

export const problemBySlug: Record<string, Problem> = Object.fromEntries(
  problems.map((p) => [p.slug, p]),
);

export function getProblem(slug: string): Problem | undefined {
  return problemBySlug[slug];
}
