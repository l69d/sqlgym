import type { Problem } from "../types";

export const filteringProblems: Problem[] = [
  {
    slug: "bought-every-product",
    title: "Customers Who Bought Every Product",
    difficulty: "Hard",
    category: "Advanced Filtering",
    concepts: ["relational division", "COUNT(DISTINCT)", "HAVING"],
    description: `*Relational division* answers "find rows related to **all** of a
set". The trick: count the distinct matches per group and compare to the size of
the full set.

**Task:** return the \`customer\`s who have purchased **every** product in the
\`products\` table. Order by \`customer\`.`,
    setupSql: `CREATE TABLE products (id INTEGER, name TEXT);
INSERT INTO products (id, name) VALUES (1, 'Pen'), (2, 'Pad'), (3, 'Ink');

CREATE TABLE purchases (customer TEXT, product_id INTEGER);
INSERT INTO purchases (customer, product_id) VALUES
  ('Ada', 1), ('Ada', 2), ('Ada', 3),
  ('Bea', 1), ('Bea', 1), ('Bea', 2),
  ('Cleo', 1), ('Cleo', 2), ('Cleo', 3),
  ('Dot', 3);`,
    solutionSql: `SELECT customer
FROM purchases
GROUP BY customer
HAVING COUNT(DISTINCT product_id) = (SELECT COUNT(*) FROM products)
ORDER BY customer;`,
    starterSql: `SELECT customer
FROM purchases
GROUP BY customer
HAVING COUNT(DISTINCT product_id) = (SELECT COUNT(*) FROM products)
ORDER BY customer;`,
    orderMatters: true,
    hints: [
      "Count DISTINCT product_id so Bea's duplicate of product 1 doesn't inflate her tally.",
      "Compare that count to the total number of products.",
    ],
  },
  {
    slug: "find-duplicate-emails",
    title: "Find Duplicate Emails",
    difficulty: "Easy",
    category: "Advanced Filtering",
    concepts: ["GROUP BY", "HAVING COUNT"],
    description: `\`HAVING\` filters **after** aggregation, which is how you keep
only groups that meet a count condition.

**Task:** return every \`email\` that appears more than once in the table. Order
by \`email\`.`,
    setupSql: `CREATE TABLE signups (id INTEGER, email TEXT);
INSERT INTO signups (id, email) VALUES
  (1, 'a@x.com'),
  (2, 'b@x.com'),
  (3, 'a@x.com'),
  (4, 'c@x.com'),
  (5, 'b@x.com'),
  (6, 'a@x.com');`,
    solutionSql: `SELECT email
FROM signups
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY email;`,
    starterSql: `SELECT email
FROM signups
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY email;`,
    orderMatters: true,
    hints: [
      "GROUP BY email collapses duplicates into one row per address.",
      "HAVING COUNT(*) > 1 keeps only the addresses that repeat.",
    ],
  },
  {
    slug: "second-highest-no-limit",
    title: "Second Highest, No LIMIT",
    difficulty: "Medium",
    category: "Advanced Filtering",
    concepts: ["correlated subquery", "MAX of a filtered set"],
    description: `Sometimes you can't reach for \`LIMIT\`/\`OFFSET\` (some dialects
won't allow it in a subquery, and interviewers like to forbid it). A nested
\`MAX\` does the job.

**Task:** return a single value \`second_highest\` — the second largest distinct
salary — **without** using \`LIMIT\`, \`OFFSET\`, or a window function.`,
    setupSql: `CREATE TABLE salaries (employee TEXT, amount INTEGER);
INSERT INTO salaries (employee, amount) VALUES
  ('p', 300),
  ('q', 300),
  ('r', 250),
  ('s', 200);`,
    solutionSql: `SELECT MAX(amount) AS second_highest
FROM salaries
WHERE amount < (SELECT MAX(amount) FROM salaries);`,
    starterSql: `SELECT MAX(amount) AS second_highest
FROM salaries
WHERE amount < (SELECT MAX(amount) FROM salaries);`,
    orderMatters: false,
    hints: [
      "The inner query finds the overall maximum.",
      "The outer query takes the max of everything strictly below it.",
    ],
  },
  {
    slug: "customers-with-no-orders",
    title: "Customers With No Orders",
    difficulty: "Easy",
    category: "Advanced Filtering",
    concepts: ["anti-join", "NOT EXISTS"],
    description: `An *anti-join* returns rows from one table that have **no** match
in another — the cleanest expression is \`NOT EXISTS\`.

**Task:** return the \`name\` of every customer who has never placed an order.
Order by \`name\`.`,
    setupSql: `CREATE TABLE customers (id INTEGER, name TEXT);
INSERT INTO customers (id, name) VALUES
  (1, 'Hana'), (2, 'Ian'), (3, 'Jo'), (4, 'Kim');

CREATE TABLE orders (id INTEGER, customer_id INTEGER);
INSERT INTO orders (id, customer_id) VALUES
  (1, 1), (2, 1), (3, 3);`,
    solutionSql: `SELECT name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
)
ORDER BY name;`,
    starterSql: `SELECT name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
)
ORDER BY name;`,
    orderMatters: true,
    hints: [
      "Correlate the subquery on o.customer_id = c.id.",
      "NOT EXISTS is true exactly when the customer has zero matching orders.",
    ],
  },
  {
    slug: "above-average-headcount",
    title: "Departments Above Average Headcount",
    difficulty: "Medium",
    category: "Advanced Filtering",
    concepts: ["aggregate of aggregates", "subquery in WHERE"],
    description: `To compare a group's size against the **average group size**, you
aggregate once to get per-group counts, then aggregate again over those counts.

**Task:** return the departments whose headcount is **strictly greater** than the
average headcount across all departments. Columns: \`dept\`, \`cnt\`. Order by
\`cnt\` descending, then \`dept\`.`,
    setupSql: `CREATE TABLE employees (name TEXT, dept TEXT);
INSERT INTO employees (name, dept) VALUES
  ('e1', 'Eng'), ('e2', 'Eng'), ('e3', 'Eng'), ('e4', 'Eng'),
  ('e5', 'Sales'), ('e6', 'Sales'),
  ('e7', 'HR'),
  ('e8', 'Ops'), ('e9', 'Ops'), ('e10', 'Ops');`,
    solutionSql: `WITH counts AS (
  SELECT dept, COUNT(*) AS cnt FROM employees GROUP BY dept
)
SELECT dept, cnt
FROM counts
WHERE cnt > (SELECT AVG(cnt) FROM counts)
ORDER BY cnt DESC, dept;`,
    starterSql: `WITH counts AS (
  SELECT dept, COUNT(*) AS cnt FROM employees GROUP BY dept
)
SELECT dept, cnt
FROM counts
WHERE cnt > (SELECT AVG(cnt) FROM counts)
ORDER BY cnt DESC, dept;`,
    orderMatters: true,
    hints: [
      "First build per-department counts in a CTE.",
      "Then keep the departments whose count beats AVG(cnt) over that CTE.",
    ],
  },
];
