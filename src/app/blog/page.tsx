import { getAllPostsMeta } from "@/lib/posts";
import BlogTable from "@/components/BlogTable";

export const dynamic = "force-static";

export const metadata = {
  title: "Writing",
};

export default function BlogIndex() {
  const posts = getAllPostsMeta();
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Index · {String(posts.length).padStart(2, "0")} posts
        </p>
        <h1 className="mt-4 font-serif text-5xl tracking-tight text-ink">
          Writing
        </h1>
        <p className="mt-5 max-w-xl leading-relaxed text-muted">
          Essays and field notes on AI engineering — agents, retrieval,
          fine-tuning, and the unglamorous plumbing in between.
        </p>
      </header>

      <div className="mt-12">
        <BlogTable posts={posts} />
      </div>
    </main>
  );
}
