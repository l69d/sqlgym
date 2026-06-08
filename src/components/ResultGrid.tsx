import type { QueryResult } from "@/lib/types";

function fmt(v: string | number | null | Uint8Array): string {
  if (v === null || v === undefined) return "NULL";
  if (v instanceof Uint8Array) return "‹blob›";
  return String(v);
}

export function ResultGrid({
  result,
  emptyLabel = "No rows.",
  highlight = false,
}: {
  result: QueryResult;
  emptyLabel?: string;
  highlight?: boolean;
}) {
  if (result.columns.length === 0) {
    return <div className="px-3 py-4 text-sm text-[var(--muted)]">{emptyLabel}</div>;
  }
  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {result.columns.map((c, i) => (
              <th
                key={i}
                className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-left font-semibold whitespace-nowrap"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, ri) => (
            <tr
              key={ri}
              className={
                highlight
                  ? "odd:bg-emerald-500/5"
                  : "odd:bg-white/[0.02] hover:bg-white/[0.04]"
              }
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`border-b border-[var(--border)]/60 px-3 py-1.5 whitespace-nowrap ${
                    cell === null ? "text-[var(--muted)] italic" : ""
                  }`}
                >
                  {fmt(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 text-xs text-[var(--muted)]">
        {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}
