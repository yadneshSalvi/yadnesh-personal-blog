import Image from "next/image";
import { notFound } from "next/navigation";
import { getAllPostSlugs, getPostBySlug } from "@/lib/posts";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return notFound();
  const { meta, content } = post;
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <article className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">{meta.title}</h1>
          {meta.subtitle ? (
            <p className="text-zinc-400">{meta.subtitle}</p>
          ) : null}
          <div className="text-xs text-zinc-500">
            <time dateTime={meta.createdAt}>Created: {new Date(meta.createdAt).toLocaleDateString()}</time>
            <span className="mx-2">·</span>
            <time dateTime={meta.updatedAt}>Updated: {new Date(meta.updatedAt).toLocaleDateString()}</time>
          </div>
        </header>
        {meta.image ? (
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <Image
              src={meta.image}
              alt=""
              width={1280}
              height={720}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        ) : null}
        <div className="prose prose-invert max-w-none">
          {content}
        </div>
      </article>
    </main>
  );
}


