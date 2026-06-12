import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function PostList({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) {
    return (
      <p className="border-b border-line py-12 text-center font-mono text-xs uppercase tracking-[0.2em] text-faint">
        Nothing here yet
      </p>
    );
  }

  return (
    <ol className="divide-y divide-line border-b border-line">
      {posts.map((p, i) => (
        <li key={p.slug}>
          <Link
            href={`/blog/${p.slug}`}
            className="group grid grid-cols-[2.25rem_1fr] gap-x-4 py-8 sm:grid-cols-[3.25rem_1fr_auto] sm:gap-x-6"
          >
            <span className="pt-2 font-mono text-xs tabular-nums text-faint">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h3 className="font-serif text-2xl leading-snug tracking-tight text-ink transition-colors group-hover:text-accent">
                {p.title}
              </h3>
              {p.subtitle ? (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                  {p.subtitle}
                </p>
              ) : null}
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.15em] text-faint">
                <time dateTime={p.createdAt}>{formatDate(p.createdAt)}</time>
                {typeof p.readingTime === "number" ? (
                  <> · {p.readingTime} min</>
                ) : null}
                {p.tags && p.tags.length > 0 ? <> · {p.tags.join(", ")}</> : null}
              </p>
            </div>
            <span
              aria-hidden
              className="hidden pt-2 font-serif text-xl text-faint transition-all group-hover:translate-x-1 group-hover:text-accent sm:block"
            >
              →
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
