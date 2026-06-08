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
| **Recursive CTEs** | number/date generators, org-chart levels, path accumulation, Fibonacci, filling date gaps |
| **CTEs** | multi-step pipelines, filtering then aggregating within a CTE, `ORDER BY … LIMIT` inside a CTE |
| **Window Functions** | running totals, moving-average frames, `LAG`, percent-of-total, the `LAST_VALUE` frame gotcha |
| **Ranking** | `RANK` vs `DENSE_RANK`, top-N-per-group, gaps & islands, `NTILE` quartiles |
| **Advanced Filtering** | relational division ("bought every product"), anti-joins, aggregate-of-aggregates |
| **Ordering** | `CASE` in `ORDER BY`, NULLs-last, computed sort keys, multi-key sorts |

29 problems and counting, tagged by difficulty and concept.

## Features

- **LeetCode-style workspace** — problem statement, live schema preview, hints,
  a SQL editor (CodeMirror) and a results console side by side.
- **Run** any query against the problem's data; **Submit** to grade it.
  Order-sensitive problems check row order; others compare as a multiset.
- Wrong answers show **expected vs. your output** side by side.
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
