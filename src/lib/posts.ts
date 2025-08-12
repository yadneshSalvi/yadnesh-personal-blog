import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import MDXComponents from "@/components/mdx/MDXComponents";

export type PostMeta = {
  slug: string;
  title: string;
  subtitle?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
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
      const { data } = matter(source);
      const title = String(data.title || slug);
      const subtitle = data.subtitle ? String(data.subtitle) : undefined;
      const image = data.image ? String(data.image) : undefined;
      const createdAt = String(data.createdAt || new Date().toISOString());
      const updatedAt = String(data.updatedAt || createdAt);
      const meta: PostMeta = { slug, title, subtitle, image, createdAt, updatedAt };
      return meta;
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return metas;
}

export async function getPostBySlug(slug: string): Promise<{ content: React.ReactNode; meta: PostMeta } | null> {
  ensurePostsDir();
  const mdxPath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(mdxPath)) return null;
  const source = fs.readFileSync(mdxPath, "utf8");
  const { content, frontmatter } = await compileMDX<{ title: string; subtitle?: string; image?: string; createdAt: string; updatedAt?: string }>({
    source,
    options: { parseFrontmatter: true },
    components: MDXComponents,
  });

  const meta: PostMeta = {
    slug,
    title: String(frontmatter.title || slug),
    subtitle: frontmatter.subtitle ? String(frontmatter.subtitle) : undefined,
    image: frontmatter.image ? String(frontmatter.image) : undefined,
    createdAt: String(frontmatter.createdAt || new Date().toISOString()),
    updatedAt: String(frontmatter.updatedAt || frontmatter.createdAt || new Date().toISOString()),
  };

  return { content, meta };
}

function ensurePostsDir() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }
}


