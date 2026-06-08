import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "sqlgym — advanced SQL practice",
  description:
    "A LeetCode-style gym for advanced SQL: recursive CTEs, window functions, ranking, gaps & islands, relational division and tricky ordering. Runs live in your browser on a real SQLite engine.",
  keywords: [
    "SQL practice",
    "advanced SQL",
    "recursive CTE",
    "window functions",
    "SQL interview",
    "LeetCode SQL",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex h-full flex-col">{children}</body>
    </html>
  );
}
