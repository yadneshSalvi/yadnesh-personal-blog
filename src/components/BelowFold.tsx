import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export default function BelowFold({ posts }: { posts: PostMeta[] }) {
  const topPost = posts[0];

  return (
    <div id="blog" className="mx-auto w-full max-w-3xl space-y-12 px-6 py-20">
      {/* "// the blog" lockup — terminal flavour */}
      <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70 [background:linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:28px_28px] dark:[background:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]"
        />
        <div className="relative">
          <p className="font-[var(--font-geist-mono)] text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            {"// the blog"}
          </p>
          <h2 className="mt-3 font-[var(--font-geist-mono)] text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              An opinionated blog on
              <br />
              AI Engineering
            </span>
          </h2>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400">
            Notes &amp; experiments on AI Agents, RAG, Fine-tuning, and more.
          </p>
          <Link
            href="/blog"
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-700 transition hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.20)] dark:text-cyan-300 dark:hover:text-cyan-200"
          >
            Read blogs <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      {/* Latest posts — terminal flavour */}
      <section id="latest">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-[var(--font-geist-mono)] text-sm uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            {"// latest"}
          </h2>
          <Link
            href="/blog"
            className="text-xs text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            All posts →
          </Link>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 font-[var(--font-geist-mono)] text-[15px] dark:border-zinc-800 dark:bg-zinc-950">
          <p className="mb-4 text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            $ ls ./posts
          </p>
          <ul className="space-y-3">
            {posts.map((p, i) => (
              <li key={p.slug} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="w-6 shrink-0 text-zinc-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-500">
                  {formatDate(p.createdAt)}
                </span>
                <span aria-hidden className="text-zinc-300 dark:text-zinc-700">
                  ·
                </span>
                <Link
                  href={`/blog/${p.slug}`}
                  className="min-w-0 flex-1 truncate font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
                  style={{ textDecorationColor: "#06b6d4" }}
                >
                  {p.title}
                </Link>
                {typeof p.readingTime === "number" && (
                  <span className="ml-auto whitespace-nowrap text-xs text-zinc-400">
                    {p.readingTime} min
                  </span>
                )}
              </li>
            ))}
          </ul>
          {topPost && (
            <p className="mt-5 text-xs text-zinc-400">
              <span className="select-none">$</span>{" "}
              <span className="text-zinc-500">
                cat ./posts/
                <Link
                  href={`/blog/${topPost.slug}`}
                  className="underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  {topPost.slug}.mdx
                </Link>
              </span>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
