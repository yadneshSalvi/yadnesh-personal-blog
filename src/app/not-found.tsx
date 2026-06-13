import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-32 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
        404
      </p>
      <h1 className="mt-4 font-serif text-5xl italic tracking-tight text-ink">
        Lost in the weights.
      </h1>
      <p className="mt-5 text-muted">
        This page doesn&apos;t exist. Maybe it was pruned during training.
      </p>
      <Link
        href="/"
        className="mt-10 inline-block font-mono text-xs uppercase tracking-[0.18em] text-accent"
      >
        ← Back home
      </Link>
    </main>
  );
}
