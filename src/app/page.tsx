import Link from "next/link";
import { getListedPostsMeta } from "@/lib/posts";
import { getListedItems } from "@/lib/series";
import Hero from "@/components/Hero";
import PostList from "@/components/PostList";

export default function Home() {
  const posts = getListedItems(getListedPostsMeta());
  return (
    <>
      <Hero />
      <section id="blog" className="px-6 pb-28">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-baseline justify-between border-b border-line pb-4">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
              Writing
            </h2>
            <Link
              href="/blog"
              className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted transition-colors hover:text-accent"
            >
              All posts →
            </Link>
          </div>
          <PostList posts={posts.slice(0, 5)} />
        </div>
      </section>
    </>
  );
}
