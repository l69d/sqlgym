import type { Category, Difficulty } from "./types";

export function difficultyColor(d: Difficulty): string {
  switch (d) {
    case "Easy":
      return "text-emerald-400";
    case "Medium":
      return "text-amber-400";
    case "Hard":
      return "text-rose-400";
  }
}

export function difficultyDot(d: Difficulty): string {
  switch (d) {
    case "Easy":
      return "bg-emerald-400";
    case "Medium":
      return "bg-amber-400";
    case "Hard":
      return "bg-rose-400";
  }
}

const CATEGORY_HUE: Record<Category, string> = {
  Joins: "text-teal-300 border-teal-500/30 bg-teal-500/10",
  Aggregation: "text-orange-300 border-orange-500/30 bg-orange-500/10",
  Subqueries: "text-cyan-300 border-cyan-500/30 bg-cyan-500/10",
  "Set Operations": "text-lime-300 border-lime-500/30 bg-lime-500/10",
  CTEs: "text-sky-300 border-sky-500/30 bg-sky-500/10",
  "Recursive CTEs": "text-fuchsia-300 border-fuchsia-500/30 bg-fuchsia-500/10",
  "Window Functions": "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
  Ranking: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  Pivoting: "text-violet-300 border-violet-500/30 bg-violet-500/10",
  "Dates & Time": "text-blue-300 border-blue-500/30 bg-blue-500/10",
  "String Manipulation": "text-pink-300 border-pink-500/30 bg-pink-500/10",
  "NULL Handling": "text-slate-300 border-slate-500/30 bg-slate-500/10",
  "Advanced Filtering": "text-rose-300 border-rose-500/30 bg-rose-500/10",
  Ordering: "text-indigo-300 border-indigo-500/30 bg-indigo-500/10",
};

export function categoryClasses(c: Category): string {
  return CATEGORY_HUE[c];
}
