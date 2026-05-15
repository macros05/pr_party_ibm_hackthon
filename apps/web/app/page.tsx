import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 px-6 py-24">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--fg-soft)]">
          pr · party
        </p>
        <h1 className="mt-2 text-4xl font-medium tracking-tight">
          A council of six reviews your PR.
        </h1>
        <p className="mt-3 text-sm text-[var(--fg-muted)]">
          Frontend in progress. Component previews:
        </p>

        <ul className="mt-6 space-y-2 font-mono text-sm">
          <li>
            <Link
              href="/preview/character"
              className="text-[var(--fg)] underline decoration-[var(--fg-soft)] underline-offset-4 transition-colors hover:decoration-[var(--fg)]"
            >
              /preview/character
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
