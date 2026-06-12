"use client";

import Link from "next/link";
import { SearchResult, SearchResponse } from "@/lib/search/types";

interface SearchResultsProps {
  searchResponse: SearchResponse | null;
  isLoading: boolean;
  error: string | null;
  onTagClick?: (tag: string) => void;
}

export default function SearchResults({
  searchResponse,
  isLoading,
  error,
  onTagClick,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="divide-y divide-line border-y border-line">
        {Array.from({ length: 3 }).map((_, i) => (
          <SearchResultSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="font-serif text-2xl italic text-ink">
          Something went sideways.
        </p>
        <p className="mt-2 text-sm text-muted">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-accent"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!searchResponse) {
    return null;
  }

  const { results, total, query, suggestions, executionTime } = searchResponse;

  if (results.length === 0) {
    return (
      <NoResultsFound
        query={query}
        suggestions={suggestions}
        onTagClick={onTagClick}
      />
    );
  }

  return (
    <div>
      {/* Search Stats */}
      <p className="border-b border-line pb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-faint">
        {total} result{total !== 1 ? "s" : ""} for &ldquo;{query}&rdquo; ·{" "}
        {executionTime}ms
      </p>

      {/* Search Results */}
      <div className="divide-y divide-line border-b border-line">
        {results.map((result) => (
          <SearchResultItem
            key={result.item.slug}
            result={result}
            query={query}
            onTagClick={onTagClick}
          />
        ))}
      </div>

      {/* Load More Button */}
      {searchResponse.hasMore && (
        <div className="py-6 text-center">
          <button className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            Load more →
          </button>
        </div>
      )}
    </div>
  );
}

function SearchResultItem({
  result,
  query,
  onTagClick,
}: {
  result: SearchResult;
  query: string;
  onTagClick?: (tag: string) => void;
}) {
  const { item } = result;

  // Highlight search terms in title and excerpt (mark styling lives in globals.css)
  const highlightText = (text: string, terms: string[]) => {
    if (!terms.length) return text;

    let highlightedText = text;
    terms.forEach((term) => {
      const regex = new RegExp(
        `(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi"
      );
      highlightedText = highlightedText.replace(regex, "<mark>$1</mark>");
    });

    return highlightedText;
  };

  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 1);
  const highlightedTitle = highlightText(item.title, searchTerms);
  const highlightedExcerpt = highlightText(item.excerpt, searchTerms);

  return (
    <article className="group">
      <Link href={item.url} className="block py-7">
        <h3
          className="font-serif text-2xl leading-snug tracking-tight text-ink transition-colors group-hover:text-accent"
          dangerouslySetInnerHTML={{ __html: highlightedTitle }}
        />

        {item.subtitle && (
          <p className="mt-2 text-sm text-muted">{item.subtitle}</p>
        )}

        <p
          className="mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-muted"
          dangerouslySetInnerHTML={{ __html: highlightedExcerpt }}
        />

        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
          <span>
            <time dateTime={item.createdAt}>
              {new Date(item.createdAt).toLocaleDateString("en-US", {
                timeZone: "UTC",
                year: "numeric",
                month: "short",
                day: "2-digit",
              })}
            </time>
            {" · "}
            {item.readingTime} min{" · "}
            {item.wordCount} words
          </span>

          {item.tags.length > 0 && (
            <span className="flex items-baseline gap-3 normal-case">
              {item.tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.preventDefault();
                    onTagClick?.(tag);
                  }}
                  className="text-muted transition-colors hover:text-accent"
                >
                  {tag}
                </button>
              ))}
              {item.tags.length > 3 && <span>+{item.tags.length - 3}</span>}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}

function NoResultsFound({
  query,
  suggestions,
  onTagClick,
}: {
  query: string;
  suggestions?: string[];
  onTagClick?: (tag: string) => void;
}) {
  return (
    <div className="border-y border-line py-16 text-center">
      <p className="font-serif text-2xl italic text-ink">
        Nothing for &ldquo;{query}&rdquo;.
      </p>
      <p className="mt-2 text-sm text-muted">
        Try a different phrase, or browse by topic.
      </p>

      {suggestions && suggestions.length > 0 && (
        <div className="mt-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            Did you mean
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onTagClick?.(suggestion)}
                className="font-mono text-xs text-muted transition-colors hover:text-accent"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
          Try searching for
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2">
          {["Agents", "RAG", "Fine-tuning", "AI", "Next.js"].map((term) => (
            <button
              key={term}
              onClick={() => onTagClick?.(term)}
              className="font-mono text-xs text-accent"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchResultSkeleton() {
  return (
    <div className="animate-pulse py-7">
      <div className="space-y-3">
        <div className="h-7 w-3/4 rounded bg-surface"></div>
        <div className="h-4 w-1/2 rounded bg-surface"></div>
        <div className="space-y-2">
          <div className="h-3 rounded bg-surface"></div>
          <div className="h-3 w-5/6 rounded bg-surface"></div>
        </div>
        <div className="h-3 w-40 rounded bg-surface"></div>
      </div>
    </div>
  );
}
