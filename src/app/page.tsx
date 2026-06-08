import { Header } from "@/components/Header";
import { ProblemBrowser, type ProblemSummary } from "@/components/ProblemBrowser";
import { problems } from "@/lib/problems";

export default function Home() {
  const items: ProblemSummary[] = problems.map((p) => ({
    number: p.number!,
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    category: p.category,
    concepts: p.concepts,
  }));

  return (
    <>
      <Header />
      <main className="min-h-0 flex-1 overflow-auto">
        <ProblemBrowser items={items} />
        <footer className="mx-auto w-full max-w-5xl px-4 pb-10 text-xs text-[var(--muted)]">
          Built with Next.js + sql.js (SQLite/WASM). Queries never leave your
          browser.
        </footer>
      </main>
    </>
  );
}
