import type { Problem } from "../types";

export const recursiveProblems: Problem[] = [
  {
    slug: "generate-number-sequence",
    title: "Generate a Number Sequence",
    difficulty: "Easy",
    category: "Recursive CTEs",
    concepts: ["WITH RECURSIVE", "anchor + recursive member"],
    description: `A recursive CTE has two parts joined by \`UNION ALL\`: an **anchor**
member (the seed row) and a **recursive** member that references the CTE itself,
running until it produces no more rows.

The table \`params\` holds a single value \`n\`.

**Task:** return a single column \`num\` containing every integer from \`1\` to \`n\`
(inclusive), ordered ascending.`,
    setupSql: `CREATE TABLE params (n INTEGER);
INSERT INTO params (n) VALUES (10);`,
    solutionSql: `WITH RECURSIVE seq(num) AS (
  SELECT 1
  UNION ALL
  SELECT num + 1 FROM seq
  WHERE num < (SELECT n FROM params)
)
SELECT num FROM seq ORDER BY num;`,
    starterSql: `WITH RECURSIVE seq(num) AS (
  -- anchor member

  -- recursive member

)
SELECT num FROM seq ORDER BY num;`,
    orderMatters: true,
    hints: [
      "Seed with SELECT 1, then add 1 each step.",
      "Stop the recursion with WHERE num < (SELECT n FROM params).",
    ],
  },
  {
    slug: "employee-hierarchy-levels",
    title: "Employee Hierarchy Levels",
    difficulty: "Medium",
    category: "Recursive CTEs",
    concepts: ["WITH RECURSIVE", "hierarchy", "level counter"],
    description: `\`employees\` is an org chart: each row points at its manager via
\`manager_id\`. The CEO has \`manager_id = NULL\`.

**Task:** return every employee's \`name\` and their \`level\` in the hierarchy,
where the CEO is level \`1\`, their direct reports are level \`2\`, and so on.
Order by \`level\`, then \`name\`.`,
    setupSql: `CREATE TABLE employees (id INTEGER, name TEXT, manager_id INTEGER);
INSERT INTO employees (id, name, manager_id) VALUES
  (1, 'Alice', NULL),
  (2, 'Bob', 1),
  (3, 'Carol', 1),
  (4, 'Dan', 2),
  (5, 'Eve', 2),
  (6, 'Frank', 4),
  (7, 'Grace', 3);`,
    solutionSql: `WITH RECURSIVE org(id, name, level) AS (
  SELECT id, name, 1 FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, o.level + 1
  FROM employees e
  JOIN org o ON e.manager_id = o.id
)
SELECT name, level FROM org ORDER BY level, name;`,
    starterSql: `WITH RECURSIVE org(id, name, level) AS (
  -- anchor: the CEO at level 1

  -- recursive: join children onto their parent

)
SELECT name, level FROM org ORDER BY level, name;`,
    orderMatters: true,
    hints: [
      "Anchor on the row where manager_id IS NULL with level 1.",
      "In the recursive member, join employees.manager_id = org.id and add 1 to the level.",
    ],
  },
  {
    slug: "build-org-path",
    title: "Build the Org Path",
    difficulty: "Medium",
    category: "Recursive CTEs",
    concepts: ["WITH RECURSIVE", "string accumulation", "path"],
    description: `Using the same \`employees\` org chart, build a breadcrumb path
from the CEO down to each employee.

**Task:** return each employee's \`name\` and a \`path\` string of names from the
CEO to that employee, joined with \` > \`. For example Frank reports to Dan who
reports to Bob who reports to Alice, so his path is \`Alice > Bob > Dan > Frank\`.
Order by \`path\`.`,
    setupSql: `CREATE TABLE employees (id INTEGER, name TEXT, manager_id INTEGER);
INSERT INTO employees (id, name, manager_id) VALUES
  (1, 'Alice', NULL),
  (2, 'Bob', 1),
  (3, 'Carol', 1),
  (4, 'Dan', 2),
  (5, 'Eve', 2),
  (6, 'Frank', 4),
  (7, 'Grace', 3);`,
    solutionSql: `WITH RECURSIVE chain(id, name, path) AS (
  SELECT id, name, name FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, c.path || ' > ' || e.name
  FROM employees e
  JOIN chain c ON e.manager_id = c.id
)
SELECT name, path FROM chain ORDER BY path;`,
    starterSql: `WITH RECURSIVE chain(id, name, path) AS (

)
SELECT name, path FROM chain ORDER BY path;`,
    orderMatters: true,
    hints: [
      "Seed the path with just the CEO's name.",
      "Accumulate with c.path || ' > ' || e.name in the recursive member.",
    ],
  },
  {
    slug: "fill-date-gaps",
    title: "Fill the Date Gaps",
    difficulty: "Hard",
    category: "Recursive CTEs",
    concepts: ["WITH RECURSIVE", "calendar generation", "LEFT JOIN", "COALESCE"],
    description: `\`events\` records a count for some — but not all — days. Missing
days should be treated as zero.

**Task:** produce one row for **every** day from the earliest to the latest
\`event_date\` (inclusive). Return \`day\` and \`cnt\`, using \`0\` for days that have
no event. Order by \`day\`.

Hint: SQLite's \`date(d, '+1 day')\` advances a date string by one day.`,
    setupSql: `CREATE TABLE events (event_date TEXT, cnt INTEGER);
INSERT INTO events (event_date, cnt) VALUES
  ('2024-01-01', 5),
  ('2024-01-03', 2),
  ('2024-01-04', 9),
  ('2024-01-07', 7);`,
    solutionSql: `WITH RECURSIVE cal(d) AS (
  SELECT MIN(event_date) FROM events
  UNION ALL
  SELECT date(d, '+1 day') FROM cal
  WHERE d < (SELECT MAX(event_date) FROM events)
)
SELECT cal.d AS day, COALESCE(e.cnt, 0) AS cnt
FROM cal
LEFT JOIN events e ON e.event_date = cal.d
ORDER BY day;`,
    starterSql: `WITH RECURSIVE cal(d) AS (
  -- seed with the first event date

  -- walk forward one day at a time until the last event date

)
SELECT cal.d AS day, COALESCE(e.cnt, 0) AS cnt
FROM cal
LEFT JOIN events e ON e.event_date = cal.d
ORDER BY day;`,
    orderMatters: true,
    hints: [
      "Build a calendar CTE from MIN(event_date) to MAX(event_date).",
      "LEFT JOIN the calendar to events and COALESCE the count to 0.",
    ],
  },
  {
    slug: "fibonacci-sequence",
    title: "Fibonacci Sequence",
    difficulty: "Medium",
    category: "Recursive CTEs",
    concepts: ["WITH RECURSIVE", "carried state", "multiple accumulators"],
    description: `A recursive CTE can carry several columns of state forward. The
Fibonacci sequence starts \`0, 1\` and each term is the sum of the previous two.

The table \`params\` holds how many terms to produce, \`n\`.

**Task:** return a single column \`fib\` with the first \`n\` Fibonacci numbers,
in order: \`0, 1, 1, 2, 3, ...\`.`,
    setupSql: `CREATE TABLE params (n INTEGER);
INSERT INTO params (n) VALUES (10);`,
    solutionSql: `WITH RECURSIVE fib(i, a, b) AS (
  SELECT 1, 0, 1
  UNION ALL
  SELECT i + 1, b, a + b FROM fib
  WHERE i < (SELECT n FROM params)
)
SELECT a AS fib FROM fib ORDER BY i;`,
    starterSql: `WITH RECURSIVE fib(i, a, b) AS (
  -- carry an index i plus the two running values a and b

)
SELECT a AS fib FROM fib ORDER BY i;`,
    orderMatters: true,
    hints: [
      "Seed with (1, 0, 1): index 1, current value 0, next value 1.",
      "Each step emits (i+1, b, a+b) — shift the pair forward.",
    ],
  },
];
