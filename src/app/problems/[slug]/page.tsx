import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ProblemView } from "@/components/ProblemView";
import { problems, getProblem } from "@/lib/problems";

export function generateStaticParams() {
  return problems.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const problem = getProblem(slug);
  if (!problem) return { title: "Not found — sqlgym" };
  return {
    title: `${problem.number}. ${problem.title} — sqlgym`,
    description: `${problem.difficulty} · ${problem.category}. ${problem.concepts.join(", ")}.`,
  };
}

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const problem = getProblem(slug);
  if (!problem) notFound();

  const idx = problems.findIndex((p) => p.slug === slug);
  const prevSlug = idx > 0 ? problems[idx - 1].slug : undefined;
  const nextSlug = idx < problems.length - 1 ? problems[idx + 1].slug : undefined;

  return (
    <>
      <Header />
      <main className="min-h-0 flex-1 overflow-hidden">
        <ProblemView problem={problem} prevSlug={prevSlug} nextSlug={nextSlug} />
      </main>
    </>
  );
}
