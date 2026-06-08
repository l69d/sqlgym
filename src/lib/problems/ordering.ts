import type { Problem } from "../types";

export const orderingProblems: Problem[] = [
  {
    slug: "custom-priority-sort",
    title: "Custom Priority Sort",
    difficulty: "Medium",
    category: "Ordering",
    concepts: ["CASE in ORDER BY", "custom collation order"],
    description: `Sometimes the sort order isn't alphabetical or numeric. A
\`CASE\` expression inside \`ORDER BY\` maps values to a custom rank.

**Task:** return \`title\` and \`priority\` from \`tasks\`, ordered so that
\`high\` priority comes first, then \`medium\`, then \`low\`. Within the same
priority, order by \`created\` ascending.`,
    setupSql: `CREATE TABLE tasks (title TEXT, priority TEXT, created TEXT);
INSERT INTO tasks (title, priority, created) VALUES
  ('Ship release', 'high',   '2024-06-01'),
  ('Write docs',   'low',    '2024-06-02'),
  ('Fix bug',      'high',   '2024-06-03'),
  ('Plan sprint',  'medium', '2024-06-01'),
  ('Refactor',     'medium', '2024-06-04'),
  ('Clean inbox',  'low',    '2024-06-01');`,
    solutionSql: `SELECT title, priority
FROM tasks
ORDER BY CASE priority
           WHEN 'high'   THEN 1
           WHEN 'medium' THEN 2
           ELSE 3
         END,
         created;`,
    starterSql: `-- List tasks ordered high -> medium -> low, then by created time
SELECT title, priority
FROM tasks
-- ORDER BY a CASE that maps 'high'/'medium'/'low' to 1/2/3, then created`,
    orderMatters: true,
    hints: [
      "Map each priority to a number with CASE.",
      "Add `created` as a second sort key for ties.",
    ],
  },
  {
    slug: "nulls-last",
    title: "Sort With NULLs Last",
    difficulty: "Medium",
    category: "Ordering",
    concepts: ["NULL ordering", "expression sort key"],
    description: `In SQLite \`NULL\`s sort *first* by default. To push them to the
bottom you sort on a boolean expression that is \`0\` for real values and \`1\` for
\`NULL\` before the real sort key.

**Task:** return \`name\` and \`last_seen\` from \`contacts\`, ordered by
\`last_seen\` **descending**, but with contacts who have never been seen
(\`last_seen IS NULL\`) at the very bottom.`,
    setupSql: `CREATE TABLE contacts (name TEXT, last_seen TEXT);
INSERT INTO contacts (name, last_seen) VALUES
  ('Leo', '2024-06-05'),
  ('Max', NULL),
  ('Nia', '2024-06-08'),
  ('Owen', '2024-06-01'),
  ('Pam', NULL);`,
    solutionSql: `SELECT name, last_seen
FROM contacts
ORDER BY last_seen IS NULL, last_seen DESC;`,
    starterSql: `-- Most-recent contacts first, with un-seen contacts (NULL last_seen) sorted last
SELECT name, last_seen
FROM contacts
-- ORDER BY ...`,
    orderMatters: true,
    hints: [
      "`last_seen IS NULL` evaluates to 0 for real dates and 1 for NULLs.",
      "Putting that expression first forces the NULLs to the end regardless of the DESC.",
    ],
  },
  {
    slug: "order-by-computed-value",
    title: "Order by Best Value",
    difficulty: "Easy",
    category: "Ordering",
    concepts: ["computed sort key", "CAST", "alias in ORDER BY"],
    description: `You can order by an expression — even one you've aliased in the
\`SELECT\`.

**Task:** for each book compute \`value = pages / price\` (pages per rupee) and
return \`title\` and the rounded \`value\` (2 decimals). Order by \`value\`
descending so the best-value books come first; break ties by \`title\`.`,
    setupSql: `CREATE TABLE books (title TEXT, price REAL, pages INTEGER);
INSERT INTO books (title, price, pages) VALUES
  ('Alpha', 200, 300),
  ('Bravo', 150, 450),
  ('Cosmo', 100, 150),
  ('Delta', 250, 500);`,
    solutionSql: `SELECT title,
       ROUND(CAST(pages AS REAL) / price, 2) AS value
FROM books
ORDER BY value DESC, title;`,
    starterSql: `-- Order books by value = pages per rupee (pages / price), highest first
SELECT title,
       -- pages divided by price, rounded to 2 decimals
       ... AS value
FROM books
-- ORDER BY value DESC, title`,
    orderMatters: true,
    hints: [
      "CAST pages to REAL so the division isn't integer division.",
      "ORDER BY can reference the `value` alias directly.",
    ],
  },
  {
    slug: "multi-key-ordering",
    title: "Multi-Key Ordering",
    difficulty: "Easy",
    category: "Ordering",
    concepts: ["multiple sort keys", "mixed ASC/DESC"],
    description: `\`ORDER BY\` accepts several keys, each with its own direction,
applied left to right.

**Task:** return \`dept\`, \`name\`, \`salary\` from \`employees\`, ordered by
\`dept\` ascending, then \`salary\` descending, then \`name\` ascending.`,
    setupSql: `CREATE TABLE employees (name TEXT, dept TEXT, salary INTEGER);
INSERT INTO employees (name, dept, salary) VALUES
  ('Rae', 'Eng', 120),
  ('Sid', 'Eng', 120),
  ('Tom', 'Eng', 95),
  ('Uli', 'Ops', 80),
  ('Val', 'Ops', 110),
  ('Win', 'Sales', 100);`,
    solutionSql: `SELECT dept, name, salary
FROM employees
ORDER BY dept ASC, salary DESC, name ASC;`,
    starterSql: `-- Sort by department A->Z, then salary high->low, then name A->Z
SELECT dept, name, salary
FROM employees
-- ORDER BY ...`,
    orderMatters: true,
    hints: [
      "List the keys in priority order: dept, then salary, then name.",
      "Rae and Sid tie on dept and salary, so the name key decides their order.",
    ],
  },
];
