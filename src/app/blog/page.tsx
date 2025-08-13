import { getAllPostsMeta } from "@/lib/posts";
import BlogTable from "@/components/BlogTable";

export const dynamic = "force-static";

export default function BlogIndex() {
  const posts = getAllPostsMeta();
  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Technical posts, notes and experiments</p>
      </header>

      <BlogTable posts={posts} />
    </main>
  );
}


