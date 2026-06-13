import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import MDXComponents from "@/components/mdx/MDXComponents";

/**
 * Calculates reading time based on word count
 */
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export type PostMeta = {
  slug: string;
  title: string;
  subtitle?: string;
  image?: string;
  imageDark?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  readingTime?: number;
  series?: string;
  seriesPart?: number;
  kind?: string;
};

/**
 * A row in a post listing. Defaults to linking at /blog/<slug>; series
 * entries override href (and optionally the mono meta line).
 */
export type PostListItem = PostMeta & {
  href?: string;
  metaLine?: string;
};

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export function getAllPostSlugs(): string[] {
  ensurePostsDir();
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/i, ""));
}

export function getAllPostsMeta(): PostMeta[] {
  ensurePostsDir();
  const slugs = getAllPostSlugs();
  const metas = slugs
    .map((slug) => {
      const fullPath = path.join(POSTS_DIR, `${slug}.mdx`);
      const source = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(source);
      const title = String(data.title || slug);
      const subtitle = data.subtitle ? String(data.subtitle) : undefined;
      const image = data.image ? String(data.image) : undefined;
      const imageDark = data.imageDark ? String(data.imageDark) : undefined;
      const createdAt = String(data.createdAt || new Date().toISOString());
      const updatedAt = String(data.updatedAt || createdAt);
      const tags = Array.isArray(data.tags)
        ? data.tags.map((t: unknown) => String(t)).filter(Boolean)
        : undefined;
      const readingTime = data.readingTime
        ? Number(data.readingTime)
        : calculateReadingTime(content);
      const series = data.series ? String(data.series) : undefined;
      const seriesPart = data.seriesPart ? Number(data.seriesPart) : undefined;
      const kind = data.kind ? String(data.kind) : undefined;
      const meta: PostMeta = { slug, title, subtitle, image, imageDark, createdAt, updatedAt, tags, readingTime, series, seriesPart, kind };
      return meta;
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return metas;
}

/**
 * Posts that should appear in listings (homepage, /blog index).
 * Series parts are listed via their series entry instead, and
 * kind:reference pages (glossaries) are served but never listed.
 */
export function getListedPostsMeta(): PostMeta[] {
  return getAllPostsMeta().filter((m) => !m.series && m.kind !== "reference");
}

export async function getPostBySlug(slug: string): Promise<{ content: React.ReactNode; meta: PostMeta } | null> {
  ensurePostsDir();
  const mdxPath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(mdxPath)) return null;
  const source = fs.readFileSync(mdxPath, "utf8");
  const { content, frontmatter } = await compileMDX<{
    title: string;
    subtitle?: string;
    image?: string;
    imageDark?: string;
    createdAt: string;
    updatedAt?: string;
    tags?: string[];
    readingTime?: number;
    series?: string;
    seriesPart?: number;
    kind?: string;
  }>({
    source,
    options: {
      parseFrontmatter: true,
      // next-mdx-remote v6 defaults to blockJS: true, which strips ALL {…}
      // expressions in MDX — including JSX prop expressions like
      // `<YouTube start={1146} />`. We author our own MDX in content/posts so
      // the content is trusted; opt out of the strip. `blockDangerousJS` keeps
      // its default of true, so eval/Function/process/require are still blocked
      // as defense-in-depth.
      blockJS: false,
      // GFM enables pipe tables, strikethrough, task lists, and autolinks.
      mdxOptions: { remarkPlugins: [remarkGfm] },
    },
    components: MDXComponents,
  });

  // Calculate reading time from content if not manually specified
  const contentForReadingTime = source.split('---').slice(2).join('---'); // Remove frontmatter
  const readingTime = frontmatter.readingTime 
    ? Number(frontmatter.readingTime) 
    : calculateReadingTime(contentForReadingTime);

  const meta: PostMeta = {
    slug,
    title: String(frontmatter.title || slug),
    subtitle: frontmatter.subtitle ? String(frontmatter.subtitle) : undefined,
    image: frontmatter.image ? String(frontmatter.image) : undefined,
    imageDark: frontmatter.imageDark ? String(frontmatter.imageDark) : undefined,
    createdAt: String(frontmatter.createdAt || new Date().toISOString()),
    updatedAt: String(frontmatter.updatedAt || frontmatter.createdAt || new Date().toISOString()),
    tags: Array.isArray(frontmatter.tags)
      ? frontmatter.tags.map((t) => String(t)).filter(Boolean)
      : undefined,
    readingTime,
    series: frontmatter.series ? String(frontmatter.series) : undefined,
    seriesPart: frontmatter.seriesPart ? Number(frontmatter.seriesPart) : undefined,
    kind: frontmatter.kind ? String(frontmatter.kind) : undefined,
  };

  return { content, meta };
}

function ensurePostsDir() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }
}


