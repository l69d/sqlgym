"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Problem, CheckResult, QueryResult } from "@/lib/types";
import {
  checkAnswer,
  createDb,
  describeSchema,
  runQuery,
  type TableSchema,
} from "@/lib/sqlEngine";
import { SqlEditor } from "./SqlEditor";
import { ResultGrid } from "./ResultGrid";
import { Markdown } from "./Markdown";
import { difficultyColor, categoryClasses } from "@/lib/ui";

type LeftTab = "description" | "schema" | "hints";
type BottomTab = "result" | "verdict";

export function ProblemView({
  problem,
  prevSlug,
  nextSlug,
}: {
  problem: Problem;
  prevSlug?: string;
  nextSlug?: string;
}) {
  const storageKey = `sqlp:${problem.slug}`;
  const [sqlText, setSqlText] = useState(problem.starterSql);
  const [leftTab, setLeftTab] = useState<LeftTab>("description");
  const [bottomTab, setBottomTab] = useState<BottomTab>("result");

  const [schema, setSchema] = useState<TableSchema[] | null>(null);
  const [runResult, setRunResult] = useState<QueryResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<CheckResult | null>(null);
  const [busy, setBusy] = useState<"run" | "submit" | null>(null);
  const [revealedHints, setRevealedHints] = useState(0);

  // restore any saved draft
  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (saved) setSqlText(saved);
  }, [storageKey]);

  // persist drafts
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, sqlText);
      } catch {}
    }, 300);
    return () => clearTimeout(id);
  }, [sqlText, storageKey]);

  // introspect the schema once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const db = await createDb(problem.setupSql);
        const s = describeSchema(db);
        db.close();
        if (alive) setSchema(s);
      } catch {
        if (alive) setSchema([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [problem.setupSql]);

  const onRun = useCallback(async () => {
    setBusy("run");
    setRunError(null);
    setBottomTab("result");
    try {
      const db = await createDb(problem.setupSql);
      const res = runQuery(db, sqlText);
      db.close();
      setRunResult(res);
    } catch (e) {
      setRunResult(null);
      setRunError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [problem.setupSql, sqlText]);

  const onSubmit = useCallback(async () => {
    setBusy("submit");
    setBottomTab("verdict");
    try {
      const res = await checkAnswer(problem, sqlText);
      setVerdict(res);
    } finally {
      setBusy(null);
    }
  }, [problem, sqlText]);

  const onReset = useCallback(() => {
    setSqlText(problem.starterSql);
    setRunResult(null);
    setRunError(null);
    setVerdict(null);
  }, [problem.starterSql]);

  // keyboard: Ctrl/Cmd+Enter runs, Ctrl/Cmd+Shift+Enter submits
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) onSubmit();
        else onRun();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onRun, onSubmit]);

  const accepted = verdict?.passed === true;

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      {/* ---------------- Left: prompt / schema / hints ---------------- */}
      <section className="flex min-h-0 flex-col border-b border-[var(--border)] lg:w-[42%] lg:max-w-[620px] lg:border-r lg:border-b-0">
        <div className="flex items-center gap-1 border-b border-[var(--border)] bg-[var(--panel)] px-3">
          {(["description", "schema", "hints"] as LeftTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setLeftTab(t)}
              className={`px-3 py-2.5 text-sm capitalize transition-colors ${
                leftTab === t
                  ? "border-b-2 border-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
          {leftTab === "description" && (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold text-white">
                  {problem.number}. {problem.title}
                </h1>
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span
                  className={`text-sm font-medium ${difficultyColor(problem.difficulty)}`}
                >
                  {problem.difficulty}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs ${categoryClasses(problem.category)}`}
                >
                  {problem.category}
                </span>
                {problem.concepts.map((c) => (
                  <span
                    key={c}
                    className="rounded border border-[var(--border)] bg-[var(--panel-2)] px-2 py-0.5 font-mono text-[11px] text-[var(--muted)]"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <Markdown>{problem.description}</Markdown>
            </div>
          )}

          {leftTab === "schema" && (
            <div className="space-y-5">
              {schema === null && (
                <div className="text-sm text-[var(--muted)]">Loading schema…</div>
              )}
              {schema?.map((t) => (
                <div key={t.name}>
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="font-mono text-sm font-semibold text-[var(--accent)]">
                      {t.name}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      ({t.columns.map((c) => `${c.name} ${c.type}`).join(", ")})
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-[var(--border)]">
                    <ResultGrid result={t.sample} emptyLabel="empty table" />
                  </div>
                </div>
              ))}
              <p className="text-xs text-[var(--muted)]">
                Showing up to 5 sample rows per table.
              </p>
            </div>
          )}

          {leftTab === "hints" && (
            <div className="space-y-3">
              {!problem.hints?.length && (
                <div className="text-sm text-[var(--muted)]">
                  No hints for this one — you&apos;ve got it.
                </div>
              )}
              {problem.hints?.slice(0, revealedHints).map((h, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 text-sm"
                >
                  <span className="mr-2 font-semibold text-[var(--accent)]">
                    Hint {i + 1}
                  </span>
                  {h}
                </div>
              ))}
              {problem.hints && revealedHints < problem.hints.length && (
                <button
                  onClick={() => setRevealedHints((n) => n + 1)}
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:border-[var(--accent)] hover:text-white"
                >
                  Reveal hint {revealedHints + 1} of {problem.hints.length}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ---------------- Right: editor + console ---------------- */}
      <section className="flex min-h-0 flex-1 flex-col">
        {/* action bar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--panel)] px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span className="font-mono">SQL</span>
            <span className="hidden sm:inline">· SQLite · runs in your browser</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="rounded-md px-2.5 py-1.5 text-sm text-[var(--muted)] hover:text-white"
            >
              Reset
            </button>
            <button
              onClick={onRun}
              disabled={busy !== null}
              className="rounded-md border border-[var(--border)] bg-[var(--panel-2)] px-3 py-1.5 text-sm text-white hover:border-[var(--muted)] disabled:opacity-50"
            >
              {busy === "run" ? "Running…" : "Run"}
            </button>
            <button
              onClick={onSubmit}
              disabled={busy !== null}
              className="rounded-md bg-[var(--accent)] px-3.5 py-1.5 text-sm font-semibold text-[#06281d] hover:bg-emerald-300 disabled:opacity-50"
            >
              {busy === "submit" ? "Checking…" : "Submit"}
            </button>
          </div>
        </div>

        {/* editor */}
        <div className="min-h-[180px] flex-1 overflow-hidden bg-[var(--panel)]">
          <SqlEditor value={sqlText} onChange={setSqlText} />
        </div>

        {/* console */}
        <div className="flex h-[42%] min-h-[180px] flex-col border-t border-[var(--border)] bg-[var(--panel)]">
          <div className="flex items-center gap-1 border-b border-[var(--border)] px-3">
            {(["result", "verdict"] as BottomTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setBottomTab(t)}
                className={`px-3 py-2 text-sm capitalize transition-colors ${
                  bottomTab === t
                    ? "border-b-2 border-[var(--accent)] text-white"
                    : "text-[var(--muted)] hover:text-white"
                }`}
              >
                {t === "result" ? "Result" : "Submission"}
              </button>
            ))}
            <div className="ml-auto pr-1 text-[11px] text-[var(--muted)]">
              ⌘/Ctrl+↵ run · ⇧⌘/Ctrl+↵ submit
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {bottomTab === "result" && (
              <>
                {runError && (
                  <pre className="m-3 whitespace-pre-wrap rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                    {runError}
                  </pre>
                )}
                {!runError && runResult && <ResultGrid result={runResult} />}
                {!runError && !runResult && (
                  <div className="px-3 py-4 text-sm text-[var(--muted)]">
                    Run a query to see its output here.
                  </div>
                )}
              </>
            )}

            {bottomTab === "verdict" && (
              <VerdictPanel
                verdict={verdict}
                orderMatters={problem.orderMatters}
                nextSlug={nextSlug}
              />
            )}
          </div>
        </div>
      </section>

      {/* floating prev/next */}
      <div className="pointer-events-none fixed bottom-3 left-1/2 z-20 -translate-x-1/2">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--panel-2)]/90 px-1 py-1 shadow-lg backdrop-blur">
          {prevSlug ? (
            <Link
              href={`/problems/${prevSlug}`}
              className="rounded-full px-3 py-1 text-sm text-[var(--muted)] hover:text-white"
            >
              ← Prev
            </Link>
          ) : (
            <span className="px-3 py-1 text-sm text-[var(--border)]">← Prev</span>
          )}
          <Link
            href="/"
            className="rounded-full px-3 py-1 text-sm text-[var(--muted)] hover:text-white"
          >
            List
          </Link>
          {nextSlug ? (
            <Link
              href={`/problems/${nextSlug}`}
              className={`rounded-full px-3 py-1 text-sm ${accepted ? "text-[var(--accent)]" : "text-[var(--muted)]"} hover:text-white`}
            >
              Next →
            </Link>
          ) : (
            <span className="px-3 py-1 text-sm text-[var(--border)]">Next →</span>
          )}
        </div>
      </div>
    </div>
  );
}

function VerdictPanel({
  verdict,
  orderMatters,
  nextSlug,
}: {
  verdict: CheckResult | null;
  orderMatters: boolean;
  nextSlug?: string;
}) {
  if (!verdict) {
    return (
      <div className="px-3 py-4 text-sm text-[var(--muted)]">
        Press <span className="text-white">Submit</span> to check your answer
        against the expected result.
      </div>
    );
  }

  return (
    <div className="p-3">
      <div
        className={`mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
          verdict.passed
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            : "border-rose-500/40 bg-rose-500/10 text-rose-300"
        }`}
      >
        <span>{verdict.passed ? "✓ Accepted" : "✗ Wrong Answer"}</span>
        <span className="font-normal opacity-80">{verdict.message}</span>
      </div>

      {verdict.error && (
        <pre className="mb-3 whitespace-pre-wrap rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {verdict.error}
        </pre>
      )}

      {verdict.passed && nextSlug && (
        <Link
          href={`/problems/${nextSlug}`}
          className="mb-3 inline-block rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-[#06281d] hover:bg-emerald-300"
        >
          Next problem →
        </Link>
      )}

      {!verdict.passed && verdict.expected && verdict.got && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold tracking-wide text-emerald-300 uppercase">
              Expected{orderMatters ? " (order matters)" : ""}
            </div>
            <div className="overflow-hidden rounded-lg border border-[var(--border)]">
              <ResultGrid result={verdict.expected} highlight />
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold tracking-wide text-rose-300 uppercase">
              Your output
            </div>
            <div className="overflow-hidden rounded-lg border border-[var(--border)]">
              <ResultGrid result={verdict.got} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
