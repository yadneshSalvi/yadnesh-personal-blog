"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearch, usePopularTags, useRecentPosts } from "@/hooks/useSearch";
import SearchResults from "@/components/SearchResults";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance');

  const { searchResults, isLoading, error, search, clearResults } = useSearch({
    debounceMs: 100, // Faster for dedicated search page
    minQueryLength: 1,
    autoSearch: false, // Manual search on this page
  });

  const { tags: popularTags } = usePopularTags();
  const { posts: recentPosts } = useRecentPosts(6);

  // Get initial query from URL
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlTags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const urlSort = (searchParams.get('sort') as 'relevance' | 'date' | 'title') || 'relevance';

    setQuery(urlQuery);
    setSelectedTags(urlTags);
    setSortBy(urlSort);

    if (urlQuery) {
      search(urlQuery, {
        tags: urlTags.length > 0 ? urlTags : undefined,
        sortBy: urlSort,
        limit: 20,
      });
    }
  }, [searchParams, search]);

  // Update URL when search parameters change
  const updateURL = (newQuery: string, newTags: string[] = selectedTags, newSort: string = sortBy) => {
    const params = new URLSearchParams();
    
    if (newQuery) params.set('q', newQuery);
    if (newTags.length > 0) params.set('tags', newTags.join(','));
    if (newSort !== 'relevance') params.set('sort', newSort);

    const newURL = params.toString() ? `/search?${params.toString()}` : '/search';
    router.push(newURL, { scroll: false });
  };

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    updateURL(newQuery);
    
    if (newQuery.trim()) {
      search(newQuery, {
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        sortBy,
        limit: 20,
      });
    } else {
      clearResults();
    }
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    updateURL(query, newTags);

    if (query.trim()) {
      search(query, {
        tags: newTags.length > 0 ? newTags : undefined,
        sortBy,
        limit: 20,
      });
    }
  };

  const handleSortChange = (newSort: 'relevance' | 'date' | 'title') => {
    setSortBy(newSort);
    updateURL(query, selectedTags, newSort);

    if (query.trim()) {
      search(query, {
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        sortBy: newSort,
        limit: 20,
      });
    }
  };

  const handleTagClick = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      handleTagToggle(tag);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="space-y-10">
        {/* Header */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
            Archive
          </p>
          <h1 className="mt-4 font-serif text-5xl tracking-tight text-ink">
            Search
          </h1>

          {/* Search Input */}
          <div className="relative mt-8 max-w-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const searchQuery = formData.get('query') as string;
                handleSearch(searchQuery);
              }}
              className="relative"
            >
              <input
                name="query"
                type="text"
                placeholder="Search the writing…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch(query);
                  }
                }}
                className="w-full border-b-2 border-line bg-transparent py-3 pl-9 pr-4 font-serif text-2xl text-ink placeholder:text-faint focus:border-accent focus:outline-none"
              />
              <div className="absolute left-0 top-1/2 -translate-y-1/2">
                <svg className="h-5 w-5 text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Filter by Tags */}
            {popularTags.length > 0 && (
              <div className="border-t border-line pt-5">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                  Filter by tag
                </h3>
                <div className="mt-3 space-y-1">
                  {popularTags.slice(0, 10).map(({ tag, count }) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`flex w-full items-baseline justify-between py-1 text-left font-mono text-xs transition-colors ${
                        selectedTags.includes(tag)
                          ? 'text-accent'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      <span>{tag}</span>
                      <span className="tabular-nums text-faint">{String(count).padStart(2, '0')}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort Options */}
            <div className="border-t border-line pt-5">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                Sort by
              </h3>
              <div className="mt-3 space-y-1">
                {[
                  { value: 'relevance', label: 'Relevance' },
                  { value: 'date', label: 'Date' },
                  { value: 'title', label: 'Title' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleSortChange(value as 'relevance' | 'date' | 'title')}
                    className={`block w-full py-1 text-left font-mono text-xs transition-colors ${
                      sortBy === value
                        ? 'text-accent'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Posts */}
            {!query && recentPosts.length > 0 && (
              <div className="border-t border-line pt-5">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                  Recent
                </h3>
                <div className="mt-3 space-y-4">
                  {recentPosts.map((post) => (
                    <a key={post.slug} href={post.url} className="group block">
                      <h4 className="line-clamp-2 font-serif text-base leading-snug text-ink transition-colors group-hover:text-accent">
                        {post.title}
                      </h4>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-faint">
                        {new Date(post.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: '2-digit' })} · {post.readingTime} min
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Active Filters */}
            {selectedTags.length > 0 && (
              <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">Filtering</p>
                {selectedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-line px-2.5 py-1 font-mono text-xs text-accent transition-colors hover:border-accent"
                  >
                    {tag}
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Search Results */}
            <SearchResults
              searchResponse={searchResults}
              isLoading={isLoading}
              error={error}
              onTagClick={handleTagClick}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-40 rounded bg-surface"></div>
          <div className="h-12 max-w-2xl rounded bg-surface"></div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
