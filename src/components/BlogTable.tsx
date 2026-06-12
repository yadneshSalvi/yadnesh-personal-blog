"use client";

import { useMemo, useState } from "react";
import type { PostMeta } from "@/lib/posts";
import PostList from "./PostList";

type BlogTableProps = {
  posts: PostMeta[];
};

export default function BlogTable({ posts }: BlogTableProps) {
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.tags ?? []) {
        if (tag) counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
  }, [posts]);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredPosts = useMemo(() => {
    if (selectedTags.length === 0) return posts;
    return posts.filter((p) => {
      const pTags = p.tags ?? [];
      return selectedTags.some((t) => pTags.includes(t));
    });
  }, [posts, selectedTags]);

  return (
    <div>
      {allTags.length > 0 ? (
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-line pb-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
            Filter
          </span>
          <button
            type="button"
            onClick={() => setSelectedTags([])}
            className={
              "font-mono text-xs transition-colors " +
              (selectedTags.length === 0
                ? "text-accent"
                : "text-muted hover:text-ink")
            }
          >
            All
          </button>
          {allTags.map(([tag, count]) => {
            const isActive = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={
                  "font-mono text-xs transition-colors " +
                  (isActive
                    ? "text-accent underline decoration-accent/50 underline-offset-4"
                    : "text-muted hover:text-ink")
                }
              >
                {tag}{" "}
                <span className="text-faint">
                  {String(count).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {filteredPosts.length > 0 ? (
        <PostList posts={filteredPosts} />
      ) : (
        <p className="border-b border-line py-12 text-center font-mono text-xs uppercase tracking-[0.2em] text-faint">
          No posts match the selected tags
        </p>
      )}

      {selectedTags.length > 0 ? (
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.15em] text-faint">
          Showing {filteredPosts.length} of {posts.length}
        </p>
      ) : null}
    </div>
  );
}
