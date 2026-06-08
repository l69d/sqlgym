"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Category, Difficulty } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { difficultyColor, difficultyDot, categoryClasses } from "@/lib/ui";

export interface ProblemSummary {
  number: number;
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: Category;
  concepts: string[];
}

export function ProblemBrowser({ items }: { items: ProblemSummary[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | "All">("All");
  const [diff, setDiff] = useState<Difficulty | "All">("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((p) => {
      if (cat !== "All" && p.category !== cat) return false;
      if (diff !== "All" && p.difficulty !== diff) return false;
      if (
        q &&
        !p.title.toLowerCase().includes(q) &&
        !p.concepts.some((c) => c.toLowerCase().includes(q)) &&
        !p.category.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [items, query, cat, diff]);

  const counts = useMemo(() => {
    const byCat: Record<string, number> = {};
    for (const p of items) byCat[p.category] = (byCat[p.category] ?? 0) + 1;
    return byCat;
  }, [items]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* hero */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Master the SQL that interviews actually test
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          A LeetCode-style gym of {items.length}+ problems spanning every corner
          of SQL — joins, aggregation, subqueries, set ops, CTEs &amp; recursion,
          window functions, ranking, pivoting, dates, strings and NULL logic.
          Every query runs live in your browser on a real SQLite engine, and each
          ships a worked solution with a step-by-step explanation.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(cat === c ? "All" : c)}
              className={`rounded-full border px-2.5 py-1 transition-colors ${categoryClasses(
                c,
              )} ${cat === c ? "ring-1 ring-current" : "opacity-80 hover:opacity-100"}`}
            >
              {c} · {counts[c] ?? 0}
            </button>
          ))}
        </div>
      </div>

      {/* controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, concept, category…"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none sm:max-w-xs"
        />
        <div className="flex items-center gap-2">
          <Select
            value={cat}
            onChange={(v) => setCat(v as Category | "All")}
            options={["All", ...CATEGORIES]}
          />
          <Select
            value={diff}
            onChange={(v) => setDiff(v as Difficulty | "All")}
            options={["All", "Easy", "Medium", "Hard"]}
          />
        </div>
        <div className="text-sm text-[var(--muted)] sm:ml-auto">
          {filtered.length} problem{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* list */}
      <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--panel)] text-left text-xs tracking-wide text-[var(--muted)] uppercase">
              <th className="w-12 px-4 py-2.5 font-medium">#</th>
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="hidden px-4 py-2.5 font-medium md:table-cell">
                Category
              </th>
              <th className="px-4 py-2.5 font-medium">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.slug}
                className="border-t border-[var(--border)] transition-colors hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3 font-mono text-[var(--muted)]">
                  {p.number}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/problems/${p.slug}`}
                    className="font-medium text-white hover:text-[var(--accent)]"
                  >
                    {p.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {p.concepts.slice(0, 3).map((c) => (
                      <span
                        key={c}
                        className="rounded border border-[var(--border)] bg-[var(--panel-2)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)]"
                      >
                        {c}
                      </span>
                    ))}
                    <span className="md:hidden">
                      <span
                        className={`rounded-full border px-1.5 py-0.5 text-[10px] ${categoryClasses(
                          p.category,
                        )}`}
                      >
                        {p.category}
                      </span>
                    </span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${categoryClasses(
                      p.category,
                    )}`}
                  >
                    {p.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 ${difficultyColor(
                      p.difficulty,
                    )}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${difficultyDot(p.difficulty)}`}
                    />
                    {p.difficulty}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-[var(--muted)]"
                >
                  No problems match those filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2.5 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-[var(--panel)]">
          {o}
        </option>
      ))}
    </select>
  );
}
