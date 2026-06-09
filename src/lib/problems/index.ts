import type { Problem, SolutionApproach } from "../types";
import { recursiveProblems } from "./recursive";
import { cteProblems } from "./ctes";
import { windowProblems } from "./windows";
import { rankingProblems } from "./ranking";
import { filteringProblems } from "./filtering";
import { orderingProblems } from "./ordering";
import { extendedProblems } from "./extended.generated";
import { existingSolutions } from "./solutions.generated";
import { problemEdgeCases } from "./edgecases.generated";
import { extraApproaches } from "./extra-approaches.generated";

const normSql = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

// The original 29 problems, kept exactly as authored, interleaved so the list
// doesn't read as six blocks.
const original: Problem[] = [
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

function withApproaches(p: Problem): Problem {
  const base: SolutionApproach[] =
    p.approaches ??
    existingSolutions[p.slug] ??
    [{ name: "Solution", sql: p.solutionSql, explanation: "" }];
  // append any extra approaches, skipping ones that duplicate an existing query
  const seen = new Set(base.map((a) => normSql(a.sql)));
  const merged = [...base];
  for (const a of extraApproaches[p.slug] ?? []) {
    const k = normSql(a.sql);
    if (!seen.has(k)) {
      merged.push(a);
      seen.add(k);
    }
  }
  return { ...p, approaches: merged };
}

// Backfill the hidden edge cases + trap from the central edgecases map, unless
// the problem already defines them inline.
function withEdgeCases(p: Problem): Problem {
  const ec = problemEdgeCases[p.slug];
  if (!ec) return p;
  return {
    ...p,
    tests: p.tests ?? ec.tests,
    trap: p.trap ?? ec.trap,
  };
}

// Original problems first (so their numbers stay 1..29), then the new ones.
export const problems: Problem[] = [...original, ...extendedProblems]
  .filter(Boolean)
  .map(withApproaches)
  .map(withEdgeCases)
  .map((p, i) => ({ ...p, number: i + 1 }));

export const problemBySlug: Record<string, Problem> = Object.fromEntries(
  problems.map((p) => [p.slug, p]),
);

export function getProblem(slug: string): Problem | undefined {
  return problemBySlug[slug];
}
