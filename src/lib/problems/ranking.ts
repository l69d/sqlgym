import type { Problem } from "../types";

export const rankingProblems: Problem[] = [
  {
    slug: "nth-highest-salary",
    title: "Second Highest Salary (DENSE_RANK)",
    difficulty: "Medium",
    category: "Ranking",
    concepts: ["DENSE_RANK", "filter on rank"],
    description: `\`DENSE_RANK\` assigns 1 to the highest value, 2 to the next
**distinct** value, and so on — no gaps. That makes "the Nth highest distinct
value" a one-liner.

**Task:** return the employees who earn the **second highest distinct salary**.
Several people can tie for it. Return \`name\` and \`salary\`, ordered by \`name\`.`,
    setupSql: `CREATE TABLE employees (name TEXT, salary INTEGER);
INSERT INTO employees (name, salary) VALUES
  ('Quinn', 200),
  ('Ravi', 180),
  ('Sara', 180),
  ('Theo', 150),
  ('Uma', 120);`,
    solutionSql: `WITH ranked AS (
  SELECT name, salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rk
  FROM employees
)
SELECT name, salary FROM ranked WHERE rk = 2 ORDER BY name;`,
    starterSql: `WITH ranked AS (
  SELECT name, salary,
         DENSE_RANK() OVER (ORDER BY salary DESC) AS rk
  FROM employees
)
SELECT name, salary FROM ranked WHERE rk = ... ORDER BY name;`,
    orderMatters: true,
    hints: [
      "DENSE_RANK groups equal salaries under the same rank with no gaps.",
      "Filter WHERE rk = 2 — both employees on 180 should appear.",
    ],
  },
  {
    slug: "top-2-per-category",
    title: "Top 2 Products per Category",
    difficulty: "Medium",
    category: "Ranking",
    concepts: ["ROW_NUMBER", "PARTITION BY", "top-N-per-group"],
    description: `The "top N per group" pattern: rank rows **within** each group,
then keep the ones at or below N.

**Task:** return the two highest-revenue products in each category. Columns:
\`category\`, \`product\`, \`revenue\`. Order by \`category\`, then \`revenue\`
descending.`,
    setupSql: `CREATE TABLE sales (category TEXT, product TEXT, revenue INTEGER);
INSERT INTO sales (category, product, revenue) VALUES
  ('Tech', 'Phone', 900),
  ('Tech', 'Laptop', 1200),
  ('Tech', 'Watch', 400),
  ('Home', 'Sofa', 700),
  ('Home', 'Lamp', 150),
  ('Home', 'Rug', 300);`,
    solutionSql: `WITH ranked AS (
  SELECT category, product, revenue,
         ROW_NUMBER() OVER (PARTITION BY category ORDER BY revenue DESC) AS rk
  FROM sales
)
SELECT category, product, revenue
FROM ranked
WHERE rk <= 2
ORDER BY category, revenue DESC;`,
    starterSql: `WITH ranked AS (
  SELECT category, product, revenue,
         ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...) AS rk
  FROM sales
)
SELECT category, product, revenue
FROM ranked
WHERE rk <= 2
ORDER BY category, revenue DESC;`,
    orderMatters: true,
    hints: [
      "PARTITION BY category restarts the numbering for each category.",
      "Keep rows where rk <= 2.",
    ],
  },
  {
    slug: "rank-vs-dense-rank",
    title: "RANK vs DENSE_RANK",
    difficulty: "Easy",
    category: "Ranking",
    concepts: ["RANK", "DENSE_RANK", "tie handling"],
    description: `\`RANK\` leaves gaps after ties (1, 2, 2, 4) while \`DENSE_RANK\`
does not (1, 2, 2, 3). Seeing them side by side makes the difference obvious.

**Task:** return \`player\`, \`score\`, \`rnk\` (\`RANK\`) and \`drnk\`
(\`DENSE_RANK\`), both ordered by \`score\` descending. Order the output by \`score\`
descending, then \`player\`.`,
    setupSql: `CREATE TABLE scores (player TEXT, score INTEGER);
INSERT INTO scores (player, score) VALUES
  ('Vee', 100),
  ('Wes', 90),
  ('Xan', 90),
  ('Yas', 80),
  ('Zed', 70);`,
    solutionSql: `SELECT player, score,
       RANK()       OVER (ORDER BY score DESC) AS rnk,
       DENSE_RANK() OVER (ORDER BY score DESC) AS drnk
FROM scores
ORDER BY score DESC, player;`,
    starterSql: `-- Show RANK() and DENSE_RANK() side by side to see how they treat ties
SELECT player, score,
       ... AS rnk,    -- ranking that leaves gaps after ties
       ... AS drnk    -- ranking with no gaps
FROM scores
ORDER BY score DESC, player;`,
    orderMatters: true,
    hints: [
      "Both functions share the same ORDER BY score DESC.",
      "After the tie at 90, RANK jumps to 4 while DENSE_RANK continues at 3.",
    ],
  },
  {
    slug: "consecutive-login-streaks",
    title: "Consecutive Login Streaks (Gaps & Islands)",
    difficulty: "Hard",
    category: "Ranking",
    concepts: ["ROW_NUMBER", "gaps and islands", "grouping trick"],
    description: `The classic *gaps-and-islands* problem. Subtracting a row number
from a sequential date yields a constant for every run of consecutive dates — a
ready-made grouping key.

**Task:** each row in \`logins\` is one date a user was active. Collapse runs of
consecutive days into streaks. Return \`start_date\`, \`end_date\`, and \`days\`
(length of the streak), ordered by \`start_date\`.`,
    setupSql: `CREATE TABLE logins (login_date TEXT);
INSERT INTO logins (login_date) VALUES
  ('2024-05-01'),
  ('2024-05-02'),
  ('2024-05-03'),
  ('2024-05-06'),
  ('2024-05-07'),
  ('2024-05-10');`,
    solutionSql: `WITH numbered AS (
  SELECT login_date,
         ROW_NUMBER() OVER (ORDER BY login_date) AS rn
  FROM logins
),
grouped AS (
  SELECT login_date,
         date(login_date, '-' || rn || ' days') AS grp
  FROM numbered
)
SELECT MIN(login_date) AS start_date,
       MAX(login_date) AS end_date,
       COUNT(*)        AS days
FROM grouped
GROUP BY grp
ORDER BY start_date;`,
    starterSql: `-- Collapse consecutive login days into streaks (gaps & islands).
-- Hint: subtract a ROW_NUMBER() (in date order) from each date so that
-- consecutive days share a constant key, then aggregate per key.
WITH numbered AS (
  SELECT login_date
  FROM logins
)
-- return start_date, end_date and the day count for each streak
SELECT login_date AS start_date
FROM numbered
ORDER BY start_date;`,
    orderMatters: true,
    hints: [
      "Number the dates, then compute date(login_date, '-' || rn || ' days').",
      "Consecutive dates share the same shifted date; GROUP BY it.",
    ],
  },
  {
    slug: "score-quartiles",
    title: "Score Quartiles with NTILE",
    difficulty: "Medium",
    category: "Ranking",
    concepts: ["NTILE", "bucketing"],
    description: `\`NTILE(n)\` splits ordered rows into \`n\` roughly equal buckets —
handy for quartiles, deciles, and percentiles.

**Task:** divide students into 4 quartiles by \`score\` (lowest scores in quartile
1). Return \`name\`, \`score\`, and \`quartile\`, ordered by \`score\`, then \`name\`.`,
    setupSql: `CREATE TABLE students (name TEXT, score INTEGER);
INSERT INTO students (name, score) VALUES
  ('Amy', 55),
  ('Bo', 62),
  ('Cal', 70),
  ('Dee', 74),
  ('Eli', 81),
  ('Fay', 88),
  ('Gus', 92),
  ('Hal', 97);`,
    solutionSql: `SELECT name, score,
       NTILE(4) OVER (ORDER BY score) AS quartile
FROM students
ORDER BY score, name;`,
    starterSql: `SELECT name, score,
       NTILE(...) OVER (ORDER BY score) AS quartile
FROM students
ORDER BY score, name;`,
    orderMatters: true,
    hints: [
      "NTILE(4) over 8 rows puts 2 rows in each bucket.",
      "Order ascending so the lowest scores land in quartile 1.",
    ],
  },
];
