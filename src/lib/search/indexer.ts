import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { SearchablePost, SearchIndex } from "./types";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

/**
 * Strips MDX syntax and components from content to get plain text
 */
function stripMDXSyntax(content: string): string {
  return content
    // Remove MDX components (e.g., <Tweet />, <Callout />)
    .replace(/<[^>]*>/g, ' ')
    // Remove code blocks but keep the content
    .replace(/```[\s\S]*?```/g, (match) => {
      // Extract code content without language identifier
      const codeContent = match.replace(/```\w*\n?/, '').replace(/```$/, '');
      return codeContent;
    })
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove markdown bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove markdown headers
    .replace(/^#+\s+/gm, '')
    // Remove horizontal rules
    .replace(/^---+$/gm, '')
    // Remove blockquotes
    .replace(/^>\s*/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Clean up multiple spaces and newlines
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Creates an excerpt from content
 */
function createExcerpt(content: string, maxLength: number = 160): string {
  const cleanContent = stripMDXSyntax(content);
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }
  
  // Try to break at a sentence boundary
  const sentences = cleanContent.split(/[.!?]+/);
  let excerpt = '';
  
  for (const sentence of sentences) {
    if ((excerpt + sentence).length > maxLength) {
      break;
    }
    excerpt += sentence + '.';
  }
  
  // If no good sentence break found, just truncate
  if (excerpt.length < maxLength / 2) {
    excerpt = cleanContent.substring(0, maxLength - 3) + '...';
  }
  
  return excerpt.trim();
}

/**
 * Calculates reading time based on word count
 */
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = stripMDXSyntax(content).split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * Counts words in content
 */
function countWords(content: string): number {
  return stripMDXSyntax(content).split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Processes a single MDX file into a searchable post
 */
function processPost(slug: string): SearchablePost | null {
  try {
    const fullPath = path.join(POSTS_DIR, `${slug}.mdx`);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`Post file not found: ${fullPath}`);
      return null;
    }

    const source = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(source);

    // Extract metadata with defaults
    const title = String(data.title || slug);
    const subtitle = data.subtitle ? String(data.subtitle) : undefined;
    const createdAt = String(data.createdAt || new Date().toISOString());
    const updatedAt = String(data.updatedAt || createdAt);
    const tags = Array.isArray(data.tags)
      ? data.tags.map((t: unknown) => String(t)).filter(Boolean)
      : [];

    // Process content
    const strippedContent = stripMDXSyntax(content);
    const excerpt = createExcerpt(content);
    const wordCount = countWords(content);
    const readingTime = calculateReadingTime(content);

    const searchablePost: SearchablePost = {
      slug,
      title,
      subtitle,
      excerpt,
      content: strippedContent,
      tags,
      createdAt,
      updatedAt,
      wordCount,
      readingTime,
      url: `/blog/${slug}`,
    };

    return searchablePost;
  } catch (error) {
    console.error(`Error processing post ${slug}:`, error);
    return null;
  }
}

/**
 * Gets all post slugs from the posts directory
 */
function getAllPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) {
    console.warn(`Posts directory not found: ${POSTS_DIR}`);
    return [];
  }

  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/i, ""));
}

/**
 * Builds the complete search index
 */
export function buildSearchIndex(): SearchIndex {
  console.log("Building search index...");
  
  const slugs = getAllPostSlugs();
  const posts: SearchablePost[] = [];

  for (const slug of slugs) {
    const post = processPost(slug);
    if (post) {
      posts.push(post);
    }
  }

  // Sort by creation date (newest first)
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const index: SearchIndex = {
    posts,
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
  };

  console.log(`Search index built with ${posts.length} posts`);
  return index;
}

/**
 * Saves search index to a JSON file
 */
export function saveSearchIndex(index: SearchIndex, outputPath?: string): void {
  const defaultPath = path.join(process.cwd(), "public", "search-index.json");
  const filePath = outputPath || defaultPath;
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(index, null, 2));
  console.log(`Search index saved to: ${filePath}`);
}

/**
 * Loads search index from JSON file
 */
export function loadSearchIndex(inputPath?: string): SearchIndex | null {
  const defaultPath = path.join(process.cwd(), "public", "search-index.json");
  const filePath = inputPath || defaultPath;

  if (!fs.existsSync(filePath)) {
    console.warn(`Search index not found: ${filePath}`);
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content) as SearchIndex;
  } catch (error) {
    console.error(`Error loading search index:`, error);
    return null;
  }
}

/**
 * Generates and saves search index (main function)
 */
export function generateSearchIndex(): SearchIndex {
  const index = buildSearchIndex();
  saveSearchIndex(index);
  return index;
}
