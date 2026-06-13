import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import MDXComponents from "@/components/mdx/MDXComponents";
import { getAllPostsMeta, type PostMeta, type PostListItem } from "@/lib/posts";

const SERIES_DIR = path.join(process.cwd(), "content", "series");

export type SeriesMeta = {
  slug: string;
  name: string;
  /** Word inside `name` rendered in accent italic on display surfaces */
  accentWord?: string;
  tagline?: string;
  image?: string;
  imageDark?: string;
  /** Total parts the series will have when complete */
  plannedParts?: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
};

export type Series = {
  meta: SeriesMeta;
  parts: PostMeta[];
  intro: React.ReactNode;
};

export function getAllSeriesSlugs(): string[] {
  if (!fs.existsSync(SERIES_DIR)) return [];
  return fs
    .readdirSync(SERIES_DIR, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        fs.existsSync(path.join(SERIES_DIR, entry.name, "index.mdx"))
    )
    .map((entry) => entry.name);
}

function parseSeriesMeta(slug: string, data: Record<string, unknown>): SeriesMeta {
  return {
    slug,
    name: String(data.name || slug),
    accentWord: data.accentWord ? String(data.accentWord) : undefined,
    tagline: data.tagline ? String(data.tagline) : undefined,
    image: data.image ? String(data.image) : undefined,
    imageDark: data.imageDark ? String(data.imageDark) : undefined,
    plannedParts: data.plannedParts ? Number(data.plannedParts) : undefined,
    createdAt: String(data.createdAt || new Date().toISOString()),
    updatedAt: String(data.updatedAt || data.createdAt || new Date().toISOString()),
    tags: Array.isArray(data.tags)
      ? data.tags.map((t: unknown) => String(t)).filter(Boolean)
      : undefined,
  };
}

export function getSeriesMeta(slug: string): SeriesMeta | null {
  const mdxPath = path.join(SERIES_DIR, slug, "index.mdx");
  if (!fs.existsSync(mdxPath)) return null;
  const { data } = matter(fs.readFileSync(mdxPath, "utf8"));
  return parseSeriesMeta(slug, data);
}

export function getAllSeriesMeta(): SeriesMeta[] {
  return getAllSeriesSlugs()
    .map((slug) => getSeriesMeta(slug))
    .filter((meta): meta is SeriesMeta => meta !== null)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Published parts of a series, sorted by seriesPart */
export function getSeriesParts(slug: string): PostMeta[] {
  return getAllPostsMeta()
    .filter((post) => post.series === slug)
    .sort((a, b) => (a.seriesPart ?? 0) - (b.seriesPart ?? 0));
}

export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  const mdxPath = path.join(SERIES_DIR, slug, "index.mdx");
  if (!fs.existsSync(mdxPath)) return null;
  const source = fs.readFileSync(mdxPath, "utf8");
  const { content, frontmatter } = await compileMDX<Record<string, unknown>>({
    source,
    options: {
      parseFrontmatter: true,
      blockJS: false,
      mdxOptions: { remarkPlugins: [remarkGfm] },
    },
    components: MDXComponents,
  });
  return {
    meta: parseSeriesMeta(slug, frontmatter),
    parts: getSeriesParts(slug),
    intro: content,
  };
}

/** Series context for an individual part page (badge above the title) */
export function getSeriesContextForPost(post: PostMeta): {
  series: SeriesMeta;
  part: number;
  totalParts: number;
} | null {
  if (!post.series) return null;
  const series = getSeriesMeta(post.series);
  if (!series) return null;
  const parts = getSeriesParts(post.series);
  return {
    series,
    part: post.seriesPart ?? 1,
    totalParts: series.plannedParts ?? parts.length,
  };
}

/** A series rendered as one row in post listings (homepage, /blog) */
export function seriesToListItem(meta: SeriesMeta): PostListItem {
  const parts = getSeriesParts(meta.slug);
  const totalMinutes = parts.reduce((sum, p) => sum + (p.readingTime ?? 0), 0);
  const published = parts.length;
  const planned = meta.plannedParts ?? published;
  return {
    slug: `series-${meta.slug}`,
    href: `/series/${meta.slug}`,
    title: meta.name,
    subtitle: meta.tagline,
    image: meta.image,
    imageDark: meta.imageDark,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    tags: meta.tags,
    readingTime: totalMinutes,
    metaLine: `Series · ${published} of ${planned} parts · ${totalMinutes} min so far`,
  };
}

/** Listed posts and series entries merged into one dated list */
export function getListedItems(posts: PostMeta[]): PostListItem[] {
  const seriesItems = getAllSeriesMeta().map(seriesToListItem);
  return [...posts, ...seriesItems].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1
  );
}
