import Link from "next/link";
import Image from "next/image";
import { getAllPostsMeta } from "@/lib/posts";

export const dynamic = "force-static";

export default function BlogIndex() {
  const posts = getAllPostsMeta();
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Blog</h1>
        <p className="text-sm text-zinc-400">Technical posts</p>
      </header>
      <ul className="space-y-6">
        {posts.map((post) => (
          <li key={post.slug} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <Link href={`/blog/${post.slug}`} className="block">
              <div className="flex gap-4">
                {post.image ? (
                  <Image
                    src={post.image}
                    alt=""
                    width={120}
                    height={80}
                    className="h-20 w-28 rounded object-cover"
                  />
                ) : null}
                <div className="flex-1">
                  <h2 className="text-lg font-medium">{post.title}</h2>
                  {post.subtitle ? (
                    <p className="text-sm text-zinc-400">{post.subtitle}</p>
                  ) : null}
                  <div className="mt-2 text-xs text-zinc-500">
                    <time dateTime={post.createdAt}>Created: {new Date(post.createdAt).toLocaleDateString()}</time>
                    <span className="mx-2">·</span>
                    <time dateTime={post.updatedAt}>Updated: {new Date(post.updatedAt).toLocaleDateString()}</time>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}


