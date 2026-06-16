import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import Slugger from "github-slugger";
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
  /** Explicit meta description (tuned SERP snippet). Falls back to subtitle. */
  description?: string;
  image?: string;
  imageDark?: string;
  /** Descriptive alt text for the cover image. Falls back to a generated string. */
  imageAlt?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  readingTime?: number;
  series?: string;
  seriesPart?: number;
  kind?: string;
};

export type PostHeading = {
  id: string;
  text: string;
  level: number;
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
      const description = data.description ? String(data.description) : undefined;
      const image = data.image ? String(data.image) : undefined;
      const imageDark = data.imageDark ? String(data.imageDark) : undefined;
      const imageAlt = data.imageAlt ? String(data.imageAlt) : undefined;
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
      const meta: PostMeta = { slug, title, subtitle, description, image, imageDark, imageAlt, createdAt, updatedAt, tags, readingTime, series, seriesPart, kind };
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

export async function getPostBySlug(slug: string): Promise<{
  content: React.ReactNode;
  meta: PostMeta;
  headings: PostHeading[];
} | null> {
  ensurePostsDir();
  const mdxPath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(mdxPath)) return null;
  const source = fs.readFileSync(mdxPath, "utf8");
  const { content: rawContent } = matter(source);
  const { content, frontmatter } = await compileMDX<{
    title: string;
    subtitle?: string;
    description?: string;
    image?: string;
    imageDark?: string;
    imageAlt?: string;
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
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlugHeadings],
      },
    },
    components: MDXComponents,
  });

  // Calculate reading time from content if not manually specified
  const readingTime = frontmatter.readingTime 
    ? Number(frontmatter.readingTime) 
    : calculateReadingTime(rawContent);

  const meta: PostMeta = {
    slug,
    title: String(frontmatter.title || slug),
    subtitle: frontmatter.subtitle ? String(frontmatter.subtitle) : undefined,
    description: frontmatter.description ? String(frontmatter.description) : undefined,
    image: frontmatter.image ? String(frontmatter.image) : undefined,
    imageDark: frontmatter.imageDark ? String(frontmatter.imageDark) : undefined,
    imageAlt: frontmatter.imageAlt ? String(frontmatter.imageAlt) : undefined,
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

  return { content, meta, headings: extractHeadings(rawContent) };
}

/**
 * Frontmatter-only reader for a single post. Does NOT compile MDX — use this in
 * generateMetadata so the page render isn't forced to compile the post twice.
 */
export function getPostMetaBySlug(slug: string): PostMeta | null {
  ensurePostsDir();
  const mdxPath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(mdxPath)) return null;
  const { data, content } = matter(fs.readFileSync(mdxPath, "utf8"));
  const title = String(data.title || slug);
  const subtitle = data.subtitle ? String(data.subtitle) : undefined;
  const description = data.description ? String(data.description) : undefined;
  const image = data.image ? String(data.image) : undefined;
  const imageDark = data.imageDark ? String(data.imageDark) : undefined;
  const imageAlt = data.imageAlt ? String(data.imageAlt) : undefined;
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
  return { slug, title, subtitle, description, image, imageDark, imageAlt, createdAt, updatedAt, tags, readingTime, series, seriesPart, kind };
}

function ensurePostsDir() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }
}

function extractHeadings(content: string): PostHeading[] {
  const slugger = new Slugger();
  const headings: PostHeading[] = [];
  const lines = content.split(/\r?\n/);
  let inFence = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const componentHeading = extractComponentHeading(lines, i);
    if (componentHeading) {
      headings.push({
        id: slugger.slug(componentHeading.text),
        text: componentHeading.text,
        level: componentHeading.level,
      });
      i = componentHeading.endIndex;
      continue;
    }

    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;

    const level = match[1].length;
    const text = markdownHeadingText(match[2]);
    if (!text) continue;

    headings.push({
      id: slugger.slug(text),
      text,
      level,
    });
  }

  return headings;
}

function extractComponentHeading(
  lines: string[],
  startIndex: number
): { text: string; level: number; endIndex: number } | null {
  const line = lines[startIndex].trim();
  const match = /^<(Recap|Quiz)\b/.exec(line);
  if (!match) return null;

  let endIndex = startIndex;
  const blockLines = [lines[startIndex]];
  while (endIndex < lines.length - 1 && !lines[endIndex].includes("/>")) {
    endIndex += 1;
    blockLines.push(lines[endIndex]);
  }

  const block = blockLines.join("\n");
  const titleMatch = /title\s*=\s*(?:"([^"]+)"|'([^']+)')/.exec(block);
  const defaultTitle = match[1] === "Recap" ? "What you built" : "Test yourself";

  return {
    text: titleMatch?.[1] || titleMatch?.[2] || defaultTitle,
    level: 2,
    endIndex,
  };
}

function markdownHeadingText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type HastNode = {
  type?: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function rehypeSlugHeadings() {
  return (tree: HastNode) => {
    const slugger = new Slugger();

    const visit = (node: HastNode) => {
      if (node.type === "element" && /^h[1-6]$/.test(node.tagName || "")) {
        const text = hastText(node);
        if (text) {
          node.properties = {
            ...node.properties,
            id: node.properties?.id ?? slugger.slug(text),
          };
        }
      }

      for (const child of node.children || []) visit(child);
    };

    visit(tree);
  };
}

function hastText(node: HastNode): string {
  if (node.type === "text") return normalizeText(node.value || "");
  return normalizeText((node.children || []).map(hastText).join(" "));
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
