import Link from "next/link";
import { getAllPostsMeta } from "@/lib/posts";

export default function Home() {
  const posts = getAllPostsMeta();
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">My Technical Blog</h1>
        <p className="text-sm text-zinc-500">Code-focused posts with great DX</p>
      </header>
      <section>
        <h2 className="mb-3 text-lg font-medium">Latest posts</h2>
        <ul className="space-y-2">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link className="text-blue-400 hover:underline" href={`/blog/${p.slug}`}>
                {p.title}
              </Link>
              {p.subtitle ? <span className="text-zinc-500"> — {p.subtitle}</span> : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
