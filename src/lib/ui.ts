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
  "Recursive CTEs": "text-fuchsia-300 border-fuchsia-500/30 bg-fuchsia-500/10",
  CTEs: "text-sky-300 border-sky-500/30 bg-sky-500/10",
  "Window Functions": "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
  Ranking: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  "Advanced Filtering": "text-rose-300 border-rose-500/30 bg-rose-500/10",
  Ordering: "text-indigo-300 border-indigo-500/30 bg-indigo-500/10",
};

export function categoryClasses(c: Category): string {
  return CATEGORY_HUE[c];
}
