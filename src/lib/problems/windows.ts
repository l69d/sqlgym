import type { Problem } from "../types";

export const windowProblems: Problem[] = [
  {
    slug: "running-total-of-sales",
    title: "Running Total of Sales",
    difficulty: "Easy",
    category: "Window Functions",
    concepts: ["SUM() OVER", "ORDER BY frame"],
    description: `A window function computes across a set of rows *related to the
current row* without collapsing them like \`GROUP BY\` would.

**Task:** for each day return \`day\`, \`amount\`, and a \`running_total\` — the
cumulative sum of \`amount\` up to and including that day. Order by \`day\`.`,
    setupSql: `CREATE TABLE sales (day TEXT, amount INTEGER);
INSERT INTO sales (day, amount) VALUES
  ('2024-03-01', 100),
  ('2024-03-02', 50),
  ('2024-03-03', 80),
  ('2024-03-04', 30),
  ('2024-03-05', 120);`,
    solutionSql: `SELECT day, amount,
       SUM(amount) OVER (ORDER BY day) AS running_total
FROM sales
ORDER BY day;`,
    starterSql: `SELECT day, amount,
       -- cumulative sum ordered by day
       ... AS running_total
FROM sales
ORDER BY day;`,
    orderMatters: true,
    hints: [
      "SUM(amount) OVER (ORDER BY day) accumulates as the rows progress.",
      "With ORDER BY and no explicit frame, the default frame runs from the start up to the current row.",
    ],
  },
  {
    slug: "three-day-moving-average",
    title: "3-Day Moving Average",
    difficulty: "Medium",
    category: "Window Functions",
    concepts: ["AVG() OVER", "ROWS BETWEEN frame"],
    description: `Window **frames** let you average a sliding range of rows.

**Task:** for each day return \`day\` and \`mov_avg\` — the average \`amount\` over
the current day and the two days before it (a 3-day trailing window). Round to
2 decimals. Order by \`day\`. Early days simply average fewer rows.`,
    setupSql: `CREATE TABLE sales (day TEXT, amount INTEGER);
INSERT INTO sales (day, amount) VALUES
  ('2024-03-01', 10),
  ('2024-03-02', 20),
  ('2024-03-03', 30),
  ('2024-03-04', 40),
  ('2024-03-05', 50),
  ('2024-03-06', 60);`,
    solutionSql: `SELECT day,
       ROUND(AVG(amount) OVER (
         ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ), 2) AS mov_avg
FROM sales
ORDER BY day;`,
    starterSql: `SELECT day,
       ROUND(AVG(amount) OVER (
         ORDER BY day ROWS BETWEEN ... AND ...
       ), 2) AS mov_avg
FROM sales
ORDER BY day;`,
    orderMatters: true,
    hints: [
      "Use ROWS BETWEEN 2 PRECEDING AND CURRENT ROW.",
      "ROWS counts physical rows; that is what you want for a fixed-length window.",
    ],
  },
  {
    slug: "month-over-month-change",
    title: "Month-over-Month Change",
    difficulty: "Medium",
    category: "Window Functions",
    concepts: ["LAG()", "previous-row access"],
    description: `\`LAG()\` reaches back to a previous row within the ordered window.

**Task:** for each month return \`month\`, \`revenue\`, and \`delta\` — the change in
revenue versus the previous month (\`revenue - previous revenue\`). The first
month has no predecessor, so its \`delta\` is \`NULL\`. Order by \`month\`.`,
    setupSql: `CREATE TABLE monthly (month TEXT, revenue INTEGER);
INSERT INTO monthly (month, revenue) VALUES
  ('2024-01', 1000),
  ('2024-02', 1200),
  ('2024-03', 900),
  ('2024-04', 1500);`,
    solutionSql: `SELECT month, revenue,
       revenue - LAG(revenue) OVER (ORDER BY month) AS delta
FROM monthly
ORDER BY month;`,
    starterSql: `SELECT month, revenue,
       revenue - LAG(revenue) OVER (ORDER BY month) AS delta
FROM monthly
ORDER BY month;`,
    orderMatters: true,
    hints: [
      "LAG(revenue) OVER (ORDER BY month) returns the prior month's revenue.",
      "Subtracting NULL yields NULL, which is exactly what the first row should be.",
    ],
  },
  {
    slug: "percent-of-category-total",
    title: "Percent of Category Total",
    difficulty: "Medium",
    category: "Window Functions",
    concepts: ["SUM() OVER PARTITION BY", "ratio to group total"],
    description: `A \`PARTITION BY\` window aggregate gives each row a group total
without a \`GROUP BY\` — perfect for "share of total" calculations.

**Task:** for each product return \`product\`, \`category\`, and \`pct\` — its
\`revenue\` as a percentage of its category's total revenue. Round to 1 decimal.
Order by \`category\`, then \`product\`.`,
    setupSql: `CREATE TABLE sales (product TEXT, category TEXT, revenue INTEGER);
INSERT INTO sales (product, category, revenue) VALUES
  ('A1', 'A', 30),
  ('A2', 'A', 70),
  ('B1', 'B', 25),
  ('B2', 'B', 25),
  ('B3', 'B', 50);`,
    solutionSql: `SELECT product, category,
       ROUND(100.0 * revenue / SUM(revenue) OVER (PARTITION BY category), 1) AS pct
FROM sales
ORDER BY category, product;`,
    starterSql: `SELECT product, category,
       ROUND(100.0 * revenue / SUM(revenue) OVER (PARTITION BY ...), 1) AS pct
FROM sales
ORDER BY category, product;`,
    orderMatters: true,
    hints: [
      "SUM(revenue) OVER (PARTITION BY category) is the category total on every row.",
      "Multiply by 100.0 (not 100) so the division stays floating point.",
    ],
  },
  {
    slug: "first-and-last-in-group",
    title: "First and Last Close per Symbol",
    difficulty: "Hard",
    category: "Window Functions",
    concepts: ["FIRST_VALUE", "LAST_VALUE", "explicit frame gotcha", "WINDOW clause"],
    description: `\`LAST_VALUE\` has a famous trap: with an \`ORDER BY\` the default
frame ends at the **current row**, so \`LAST_VALUE\` returns the current row, not
the last one. You must widen the frame to the whole partition.

**Task:** for each price row return \`symbol\`, \`day\`, \`close\`, plus
\`first_close\` and \`last_close\` — the earliest and latest close for that symbol
(by day). Order by \`symbol\`, then \`day\`.`,
    setupSql: `CREATE TABLE prices (symbol TEXT, day TEXT, close INTEGER);
INSERT INTO prices (symbol, day, close) VALUES
  ('AAA', '2024-01-01', 10),
  ('AAA', '2024-01-02', 14),
  ('AAA', '2024-01-03', 12),
  ('BBB', '2024-01-01', 50),
  ('BBB', '2024-01-02', 47),
  ('BBB', '2024-01-03', 55);`,
    solutionSql: `SELECT symbol, day, close,
       FIRST_VALUE(close) OVER w AS first_close,
       LAST_VALUE(close)  OVER w AS last_close
FROM prices
WINDOW w AS (
  PARTITION BY symbol ORDER BY day
  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)
ORDER BY symbol, day;`,
    starterSql: `SELECT symbol, day, close,
       FIRST_VALUE(close) OVER w AS first_close,
       LAST_VALUE(close)  OVER w AS last_close
FROM prices
WINDOW w AS (
  PARTITION BY symbol ORDER BY day
  ROWS BETWEEN ... AND ...
)
ORDER BY symbol, day;`,
    orderMatters: true,
    hints: [
      "Extend the frame to ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING.",
      "A named WINDOW clause lets both functions share the same frame.",
    ],
  },
  {
    slug: "difference-from-subject-average",
    title: "Difference From Subject Average",
    difficulty: "Medium",
    category: "Window Functions",
    concepts: ["AVG() OVER PARTITION BY", "row vs group comparison"],
    description: `Compare each row to the average of its group while keeping every
row visible.

**Task:** for each score return \`student\`, \`subject\`, \`score\`, and \`diff\` —
how far the score is from the average score **in that subject** (\`score - subject
average\`). Round \`diff\` to 2 decimals. Order by \`subject\`, then \`student\`.`,
    setupSql: `CREATE TABLE scores (student TEXT, subject TEXT, score INTEGER);
INSERT INTO scores (student, subject, score) VALUES
  ('Nora', 'Math', 80),
  ('Omar', 'Math', 90),
  ('Pia', 'Math', 70),
  ('Nora', 'Science', 60),
  ('Omar', 'Science', 100),
  ('Pia', 'Science', 80);`,
    solutionSql: `SELECT student, subject, score,
       ROUND(score - AVG(score) OVER (PARTITION BY subject), 2) AS diff
FROM scores
ORDER BY subject, student;`,
    starterSql: `SELECT student, subject, score,
       ROUND(score - AVG(score) OVER (PARTITION BY ...), 2) AS diff
FROM scores
ORDER BY subject, student;`,
    orderMatters: true,
    hints: [
      "PARTITION BY subject computes the average within each subject.",
      "No frame is needed — a partitioned aggregate with no ORDER BY covers the whole group.",
    ],
  },
];
