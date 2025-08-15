import Image from "next/image";
import { notFound } from "next/navigation";
import TOC from "@/components/TOC";
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
    <main className="mx-auto max-w-6xl p-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
        <TOC contentSelector="#post-content" />
        <article className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">{meta.title}</h1>
          {meta.subtitle ? (
            <p className="text-zinc-400">{meta.subtitle}</p>
          ) : null}
          <div className="text-xs text-zinc-500">
            <time dateTime={meta.createdAt}>Created: {new Date(meta.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: '2-digit' })}</time>
            <span className="mx-2">·</span>
            <time dateTime={meta.updatedAt}>Updated: {new Date(meta.updatedAt).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: '2-digit' })}</time>
            {meta.readingTime && (
              <>
                <span className="mx-2">·</span>
                <span>{meta.readingTime} min read</span>
              </>
            )}
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
        <div id="post-content" className="prose dark:prose-invert max-w-none scroll-smooth">
          {content}
        </div>
        </article>
      </div>
    </main>
  );
}


