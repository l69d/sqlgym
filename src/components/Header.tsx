import Link from "next/link";

export function Header() {
  return (
    <header className="flex h-13 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--panel)] px-4 py-2.5">
      <Link href="/" className="group flex items-center gap-2.5">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--accent)] font-mono text-sm font-bold text-[#06281d]">
          ▸_
        </span>
        <span className="font-semibold tracking-tight text-white">
          sqlgym
        </span>
        <span className="hidden text-xs text-[var(--muted)] sm:inline">
          advanced SQL, the LeetCode way
        </span>
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link
          href="/"
          className="text-[var(--muted)] transition-colors hover:text-white"
        >
          Problems
        </Link>
        <a
          href="https://www.sqlite.org/lang.html"
          target="_blank"
          rel="noreferrer"
          className="text-[var(--muted)] transition-colors hover:text-white"
        >
          SQL Ref ↗
        </a>
        <a
          href="https://github.com/l69d/sqlgym"
          target="_blank"
          rel="noreferrer"
          className="text-[var(--muted)] transition-colors hover:text-white"
        >
          GitHub ↗
        </a>
      </nav>
    </header>
  );
}
