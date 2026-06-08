# sqlgym — advanced SQL practice, the LeetCode way

A practice site for the **advanced, neglected corners of SQL** that interviews
and real analytics work actually lean on — recursive CTEs, window functions,
ranking, gaps-and-islands, relational division and tricky ordering.

Every query runs **live in your browser** against a real SQLite engine
([sql.js](https://github.com/sql-js/sql.js), SQLite compiled to WebAssembly).
There is no backend and no database to provision — your SQL never leaves the
page. Each problem checks your output against a canonical solution that is
executed on the fly, so the expected answer is always in sync with the seed data.

🌐 **Live:** https://sqlgym.vercel.app

## What you practice

| Category | Sample topics |
| --- | --- |
| **Joins** | inner/left/self/anti/semi joins, non-equi band joins, CROSS-join matrices, FULL OUTER, finding pairs |
| **Aggregation** | `GROUP BY`/`HAVING`, `COUNT(DISTINCT)`, `CASE` vs `FILTER`, weighted average, mode, ordered `group_concat` |
| **Subqueries** | scalar, correlated, derived tables, `IN` vs `EXISTS`, greatest-n-per-group, subquery in `HAVING` |
| **Set Operations** | `UNION`/`UNION ALL`, `INTERSECT`, `EXCEPT`, symmetric difference |
| **CTEs** | multi-step pipelines, filtering then aggregating within a CTE, funnels, `ORDER BY … LIMIT` inside a CTE |
| **Recursive CTEs** | generators, org-chart levels, path accumulation, transitive closure, CSV splitting, Fibonacci |
| **Window Functions** | running totals, moving-average frames, `LAG`/`LEAD`, `CUME_DIST`, `RANGE` vs `ROWS`, the `LAST_VALUE` gotcha |
| **Ranking** | `RANK` vs `DENSE_RANK`, top-N-per-group, gaps & islands, `NTILE`, median, dedupe |
| **Pivoting** | rows→columns via conditional aggregation, unpivot via `UNION ALL`, presence matrices |
| **Dates & Time** | `julianday` diffs, `strftime` extraction, month grouping, age, weekend filters, month boundaries |
| **String Manipulation** | `substr`/`instr`, `replace`, `printf`, the `length` count trick, case-insensitive search |
| **NULL Handling** | `COALESCE`/`NULLIF`, the `NOT IN (… NULL …)` trap, `COUNT(*)` vs `COUNT(col)`, three-valued logic |
| **Advanced Filtering** | relational division, anti-joins, "bought X but not Y", aggregate-of-aggregates |
| **Ordering** | `CASE` in `ORDER BY`, NULLs-last, `COLLATE NOCASE`, computed and multi-key sorts |

**101 problems** and counting, tagged by difficulty and concept — and every one
ships at least one worked solution with a step-by-step explanation (often two or
three different idiomatic approaches).

## Features

- **LeetCode-style workspace** — problem statement with an inline schema preview,
  hints, a gated step-by-step solution, a SQL editor (CodeMirror) and a results
  console side by side.
- **Run** any query against the problem's data; **Submit** to grade it.
  Order-sensitive problems check row order; others compare as a multiset.
- Wrong answers show **expected vs. your output** side by side.
- **Solution** tab reveals the worked code (load it straight into the editor)
  plus a walkthrough — with multiple approaches where they exist.
- Drafts auto-save to `localStorage`. Keyboard: `⌘/Ctrl+↵` runs, `⇧⌘/Ctrl+↵`
  submits.
- Fully static — every problem page is pre-rendered, so it deploys anywhere.

## Tech

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **sql.js** (SQLite/WASM) for in-browser query execution
- **CodeMirror 6** SQL editor, **react-markdown** for problem statements

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build (pre-renders every problem)
npm run verify     # run every problem's canonical solution against SQLite
npm run lint
```

`npm run verify` is the correctness gate: it loads every problem, executes its
solution in SQLite, and asserts the result is non-empty and deterministic.

## Add a problem

Problems are plain data in `src/lib/problems/<category>.ts`. Each one provides
`setupSql` (DDL + seed rows), a `solutionSql`, a markdown `description`, and an
`orderMatters` flag. Add it to the array, wire it into `src/lib/problems/index.ts`,
and run `npm run verify`.

---

MIT licensed.
