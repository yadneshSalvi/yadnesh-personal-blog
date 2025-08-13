"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PostMeta } from "@/lib/posts";

type BlogTableProps = {
  posts: PostMeta[];
};

export default function BlogTable({ posts }: BlogTableProps) {
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const post of posts) {
      for (const tag of post.tags ?? []) {
        if (tag) tags.add(tag);
      }
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearTags = () => setSelectedTags([]);

  const filteredPosts = useMemo(() => {
    if (selectedTags.length === 0) return posts;
    return posts.filter((p) => {
      const pTags = p.tags ?? [];
      return selectedTags.every((t) => pTags.includes(t));
    });
  }, [posts, selectedTags]);

  return (
    <div className="space-y-3">
      {allTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <span className="mr-1 select-none text-xs font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            tags
          </span>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isActive = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={
                    "rounded-md border px-2 py-1 text-xs transition-colors " +
                    (isActive
                      ? "border-blue-500/60 bg-blue-500/10 text-blue-700 hover:bg-blue-500/15 dark:border-blue-400/60 dark:bg-blue-400/10 dark:text-blue-300 dark:hover:bg-blue-400/20"
                      : "border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800")
                  }
                >
                  <span className="font-mono">{tag}</span>
                </button>
              );
            })}
          </div>
          {selectedTags.length > 0 ? (
            <button
              type="button"
              onClick={clearTags}
              className="ml-auto rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              clear
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="border-b border-zinc-200 bg-zinc-50/70 px-4 py-2 text-xs uppercase tracking-wider text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
          <div className="grid grid-cols-[1fr_1fr_160px] items-center gap-3">
            <span className="font-mono">post</span>
            <span className="font-mono">tags</span>
            <span className="font-mono text-right">last modified</span>
          </div>
        </div>

        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {filteredPosts.map((post) => {
            const updated = new Date(post.updatedAt);
            const updatedLabel = updated.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "2-digit",
            });
            return (
              <li key={post.slug} className="group">
                <Link
                  href={`/blog/${post.slug}`}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                >
                  <div className="grid grid-cols-[1fr_1fr_160px] items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-900/60">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-4 w-1.5 rounded bg-gradient-to-b from-blue-500 to-cyan-400 opacity-60 transition-opacity group-hover:opacity-100" />
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-medium text-zinc-900 group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white">
                          {post.title}
                        </h2>
                        {post.subtitle ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">{post.subtitle}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(post.tags ?? []).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleTag(tag);
                          }}
                        >
                          <span className="font-mono">{tag}</span>
                        </span>
                      ))}
                    </div>
                    <div className="text-right">
                      <time
                        dateTime={post.updatedAt}
                        className="font-mono text-xs text-zinc-600 dark:text-zinc-400"
                        title={updated.toLocaleString()}
                      >
                        {updatedLabel}
                      </time>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
          {filteredPosts.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No posts match the selected tags.
            </li>
          ) : null}
        </ul>
      </div>

      {selectedTags.length > 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Showing {filteredPosts.length} of {posts.length} posts
        </p>
      ) : null}
    </div>
  );
}


