#!/usr/bin/env node

/**
 * Build script to generate search index at build time
 * This ensures the search index is always up-to-date with the latest content
 */

const fs = require('fs');
const path = require('path');

// Since this is a build script, we need to use CommonJS require
// The actual search modules use ES modules, so we'll implement a simplified version here

const matter = require('gray-matter');

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const BRIEF_DIR = path.join(process.cwd(), 'content', 'brief');
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'search-index.json');

/**
 * Strips MDX syntax and components from content to get plain text
 */
function stripMDXSyntax(content) {
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
function createExcerpt(content, maxLength = 160) {
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
function calculateReadingTime(content) {
  const wordsPerMinute = 200;
  const wordCount = stripMDXSyntax(content).split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * Counts words in content
 */
function countWords(content) {
  return stripMDXSyntax(content).split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Processes a single MDX file into a searchable post
 */
function processPost(slug) {
  try {
    const fullPath = path.join(POSTS_DIR, `${slug}.mdx`);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`Post file not found: ${fullPath}`);
      return null;
    }

    const source = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(source);

    // Extract metadata with defaults
    const title = String(data.title || slug);
    const subtitle = data.subtitle ? String(data.subtitle) : undefined;
    const createdAt = String(data.createdAt || new Date().toISOString());
    const updatedAt = String(data.updatedAt || createdAt);
    const tags = Array.isArray(data.tags)
      ? data.tags.map((t) => String(t)).filter(Boolean)
      : [];

    // Process content
    const strippedContent = stripMDXSyntax(content);
    const excerpt = createExcerpt(content);
    const wordCount = countWords(content);
    const readingTime = data.readingTime 
      ? Number(data.readingTime) 
      : calculateReadingTime(content);

    const searchablePost = {
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
function getAllPostSlugs() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.warn(`Posts directory not found: ${POSTS_DIR}`);
    return [];
  }

  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/i, ''));
}

/**
 * Collects the prose out of a brief issue: the labeled lead skeleton, every
 * story headline and summary, the weekly's five lines and through-line, and the
 * editor notes. Deliberately duplicated rather than imported from
 * src/lib/brief/text.ts, which is ESM TypeScript; this script stays CommonJS
 * and self-contained, the same tradeoff the post indexing above already makes.
 */
function briefIssueText(issue) {
  const parts = [issue.title, issue.subject, issue.preheader];
  const pushStories = (stories) => {
    for (const story of stories || []) {
      parts.push(story.title, story.summary, story.source_name);
    }
  };

  if (issue.lead) {
    parts.push(issue.lead.what, issue.lead.details, issue.lead.yes_but, issue.lead.why);
    pushStories([issue.lead.story]);
  }
  for (const section of issue.sections || []) pushStories(section.items);

  const weekly = issue.weekly;
  if (weekly) {
    parts.push(...(weekly.week_in_five || []));
    parts.push(weekly.through_line?.title, weekly.through_line?.body_md);
    for (const pick of weekly.what_mattered || []) {
      parts.push(pick.what, pick.yes_but, pick.why);
      pushStories([pick.story]);
    }
    for (const pick of weekly.quietly_important || []) {
      parts.push(pick.note);
      pushStories([pick.story]);
    }
    parts.push(weekly.thread_to_watch?.title, weekly.thread_to_watch?.body);
    if (weekly.thread_to_watch?.story) pushStories([weekly.thread_to_watch.story]);
    pushStories(weekly.deep_cuts);
  }

  pushStories(issue.from_x);
  pushStories(issue.quick_links);
  for (const note of issue.editor_notes || []) parts.push(note.text);
  for (const correction of issue.corrections || []) {
    parts.push(correction.we_said, correction.whats_true);
  }

  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function collectTopics(issue) {
  const topics = new Set();
  const walk = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const entry of value) walk(entry);
      return;
    }
    if (Array.isArray(value.topics)) {
      for (const topic of value.topics) topics.add(topic);
    }
    for (const entry of Object.values(value)) walk(entry);
  };
  walk(issue);
  return [...topics];
}

/**
 * Brief issues join the same `posts` array so the existing search UI needs no
 * change: it keys on `slug` and links on `url`, both of which these carry. The
 * extra `type: "brief"` field lets a future UI tell the two apart; post entries
 * are left exactly as they were.
 */
function processBriefIssues() {
  if (!fs.existsSync(BRIEF_DIR)) return [];

  const entries = [];
  for (const type of ['daily', 'weekly']) {
    const dir = path.join(BRIEF_DIR, type);
    if (!fs.existsSync(dir)) continue;

    for (const file of fs.readdirSync(dir).sort()) {
      if (!file.endsWith('.json')) continue;
      const fullPath = path.join(dir, file);
      try {
        const issue = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        if (issue.status !== 'published') continue;
        if (!issue.id || !issue.title) {
          console.warn(`Skipping brief issue without id/title: ${fullPath}`);
          continue;
        }

        const content = briefIssueText(issue);
        const words = content.split(/\s+/).filter(Boolean);
        const createdAt = String(issue.generated_at || new Date().toISOString());

        entries.push({
          slug: `brief-${type}-${issue.id}`,
          title: issue.title,
          subtitle: issue.preheader,
          excerpt: createExcerpt(content),
          content,
          tags: collectTopics(issue),
          createdAt,
          updatedAt: createdAt,
          wordCount: words.length,
          readingTime: Number(issue.read_minutes) || 1,
          url: `/newsletter/${type}/${issue.id}`,
          type: 'brief',
        });
      } catch (error) {
        console.warn(`Skipping unreadable brief issue ${fullPath}: ${error.message}`);
      }
    }
  }
  return entries;
}

/**
 * Main function to build the search index
 */
function buildSearchIndex() {
  console.log('🔍 Building search index...');

  const slugs = getAllPostSlugs();
  const posts = [];

  for (const slug of slugs) {
    const post = processPost(slug);
    if (post) {
      posts.push(post);
    }
  }

  const briefIssues = processBriefIssues();
  posts.push(...briefIssues);

  // Sort by creation date (newest first)
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const index = {
    posts,
    lastUpdated: new Date().toISOString(),
    version: '1.0.0',
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the index
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(index, null, 2));
  
  console.log(`✅ Search index built successfully!`);
  console.log(`   📄 ${posts.length - briefIssues.length} posts indexed`);
  console.log(`   📰 ${briefIssues.length} brief issues indexed`);
  console.log(`   📁 Output: ${OUTPUT_PATH}`);
  console.log(`   📊 Total words: ${posts.reduce((sum, post) => sum + post.wordCount, 0)}`);
  console.log(`   🏷️  Unique tags: ${new Set(posts.flatMap(post => post.tags)).size}`);

  return index;
}

// Run the build if this script is executed directly
if (require.main === module) {
  try {
    buildSearchIndex();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to build search index:', error);
    process.exit(1);
  }
}

module.exports = { buildSearchIndex };
