import type { Problem } from "../types";

export const cteProblems: Problem[] = [
  {
    slug: "above-average-spenders",
    title: "Above-Average Spenders",
    difficulty: "Medium",
    category: "CTEs",
    concepts: ["multiple CTEs", "aggregate then compare"],
    description: `Common Table Expressions let you name intermediate results and
chain them. Here you need two: one for the global picture, one per customer.

**Task:** find customers whose **average order amount** is greater than the
**global average order amount** across all orders. Return \`customer\` and their
rounded average \`cust_avg\` (2 decimals), ordered by \`cust_avg\` descending.`,
    setupSql: `CREATE TABLE orders (id INTEGER, customer TEXT, amount REAL);
INSERT INTO orders (id, customer, amount) VALUES
  (1, 'Ava', 120),
  (2, 'Ava', 80),
  (3, 'Ben', 300),
  (4, 'Ben', 260),
  (5, 'Cyd', 40),
  (6, 'Cyd', 60),
  (7, 'Dan', 500);`,
    solutionSql: `WITH global AS (
  SELECT AVG(amount) AS g FROM orders
),
per_cust AS (
  SELECT customer, AVG(amount) AS cust_avg FROM orders GROUP BY customer
)
SELECT customer, ROUND(cust_avg, 2) AS cust_avg
FROM per_cust, global
WHERE cust_avg > g
ORDER BY cust_avg DESC;`,
    starterSql: `WITH global AS (
  -- the average across every order
),
per_cust AS (
  -- the average per customer
)
SELECT customer, ROUND(cust_avg, 2) AS cust_avg
FROM per_cust, global
WHERE cust_avg > g
ORDER BY cust_avg DESC;`,
    orderMatters: true,
    hints: [
      "First CTE: SELECT AVG(amount) over the whole table.",
      "Second CTE: GROUP BY customer. Cross join the two and filter.",
    ],
  },
  {
    slug: "filter-within-cte",
    title: "Filter, Then Compare Within a CTE",
    difficulty: "Medium",
    category: "CTEs",
    concepts: ["CTE filtering", "self-reference for aggregate"],
    description: `A CTE can be filtered, then the **outer** query can reference an
aggregate computed over that same filtered set — a clean two-step that avoids
repeating the filter.

**Task:** from \`products\`, consider only items that are in stock
(\`stock > 0\`). Among those, return the ones whose \`price\` is **above the average
price of the in-stock items**. Return \`name\` and \`price\`, ordered by \`price\`
descending.`,
    setupSql: `CREATE TABLE products (name TEXT, category TEXT, price REAL, stock INTEGER);
INSERT INTO products (name, category, price, stock) VALUES
  ('Keyboard', 'tech', 45, 12),
  ('Mouse', 'tech', 25, 0),
  ('Monitor', 'tech', 220, 4),
  ('Desk', 'home', 180, 3),
  ('Lamp', 'home', 30, 0),
  ('Chair', 'home', 140, 7),
  ('Cable', 'tech', 8, 50);`,
    solutionSql: `WITH in_stock AS (
  SELECT * FROM products WHERE stock > 0
)
SELECT name, price
FROM in_stock
WHERE price > (SELECT AVG(price) FROM in_stock)
ORDER BY price DESC;`,
    starterSql: `WITH in_stock AS (
  -- only items with stock > 0
)
SELECT name, price
FROM in_stock
WHERE price > (SELECT AVG(price) FROM in_stock)
ORDER BY price DESC;`,
    orderMatters: true,
    hints: [
      "The average must be over the in-stock items only — reference the CTE inside the subquery.",
      "Out-of-stock rows should never enter the average.",
    ],
  },
  {
    slug: "category-revenue-leaders",
    title: "Category Revenue Leaders",
    difficulty: "Hard",
    category: "CTEs",
    concepts: ["chained CTEs", "join CTE to CTE", "ratio threshold"],
    description: `Chain two CTEs and join them together.

**Task:** a product is a *category leader* if its total revenue is at least
**50%** of its category's total revenue. Return \`product\` and its \`rev\`
(total revenue), ordered by \`product\`.`,
    setupSql: `CREATE TABLE sales (product TEXT, category TEXT, revenue REAL);
INSERT INTO sales (product, category, revenue) VALUES
  ('Alpha', 'A', 600),
  ('Beta', 'A', 200),
  ('Gamma', 'A', 100),
  ('Delta', 'B', 90),
  ('Epsilon', 'B', 110),
  ('Zeta', 'C', 500);`,
    solutionSql: `WITH cat AS (
  SELECT category, SUM(revenue) AS tot FROM sales GROUP BY category
),
prod AS (
  SELECT product, category, SUM(revenue) AS rev FROM sales GROUP BY product, category
)
SELECT p.product, p.rev
FROM prod p
JOIN cat c ON p.category = c.category
WHERE p.rev >= 0.5 * c.tot
ORDER BY p.product;`,
    starterSql: `WITH cat AS (
  -- total revenue per category
),
prod AS (
  -- total revenue per product
)
SELECT p.product, p.rev
FROM prod p
JOIN cat c ON p.category = c.category
WHERE p.rev >= 0.5 * c.tot
ORDER BY p.product;`,
    orderMatters: true,
    hints: [
      "One CTE aggregates by category, the other by product.",
      "Join them on category and keep products with rev >= 0.5 * category total.",
    ],
  },
  {
    slug: "highest-and-lowest-earner",
    title: "Highest and Lowest Earner",
    difficulty: "Medium",
    category: "CTEs",
    concepts: ["ORDER BY + LIMIT inside a CTE", "UNION ALL", "final ordering"],
    description: `\`ORDER BY ... LIMIT\` **is** meaningful inside a CTE — it picks
*which* row survives. But the order of the final output is only guaranteed by the
**outer** query's \`ORDER BY\`. This problem makes both ideas concrete.

**Task:** return two rows — the highest earner and the lowest earner — each
labelled. Columns: \`kind\` (\`'highest'\` or \`'lowest'\`), \`name\`, \`salary\`.
Order the final result by \`salary\` descending.`,
    setupSql: `CREATE TABLE employees (name TEXT, dept TEXT, salary INTEGER);
INSERT INTO employees (name, dept, salary) VALUES
  ('Ivy', 'eng', 130),
  ('Jack', 'eng', 90),
  ('Kara', 'sales', 110),
  ('Liam', 'sales', 70),
  ('Mia', 'eng', 150);`,
    solutionSql: `WITH top AS (
  SELECT 'highest' AS kind, name, salary FROM employees ORDER BY salary DESC LIMIT 1
),
bottom AS (
  SELECT 'lowest' AS kind, name, salary FROM employees ORDER BY salary ASC LIMIT 1
)
SELECT kind, name, salary FROM top
UNION ALL
SELECT kind, name, salary FROM bottom
ORDER BY salary DESC;`,
    starterSql: `WITH top AS (
  -- one row: the highest salary
),
bottom AS (
  -- one row: the lowest salary
)
SELECT kind, name, salary FROM top
UNION ALL
SELECT kind, name, salary FROM bottom
ORDER BY salary DESC;`,
    orderMatters: true,
    hints: [
      "Use ORDER BY salary DESC LIMIT 1 in one CTE and ASC LIMIT 1 in the other.",
      "UNION ALL the two single-row CTEs, then ORDER BY salary DESC at the end.",
    ],
  },
];
