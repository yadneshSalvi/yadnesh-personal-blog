import Link from "next/link";
import { getAllPostsMeta } from "@/lib/posts";
import Hero from "@/components/Hero";

export default function Home() {
  const posts = getAllPostsMeta();
  return (
    <>
      <Hero />
      <main className="mx-auto max-w-3xl space-y-6 p-6">
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
    </>
  );
}
