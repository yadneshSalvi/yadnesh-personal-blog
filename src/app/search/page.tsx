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
    <main className="mx-auto max-w-6xl p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Search
          </h1>
          
          {/* Search Input */}
          <div className="relative max-w-2xl">
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
                placeholder="Search posts..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch(query);
                  }
                }}
                className="w-full px-4 py-3 pl-12 pr-4 text-lg border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
              <div className="space-y-3">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Filter by Tags
                </h3>
                <div className="space-y-2">
                  {popularTags.slice(0, 10).map(({ tag, count }) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <span>{tag}</span>
                      <span className="text-xs opacity-60">({count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort Options */}
            <div className="space-y-3">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Sort by
              </h3>
              <div className="space-y-1">
                {[
                  { value: 'relevance', label: 'Relevance' },
                  { value: 'date', label: 'Date' },
                  { value: 'title', label: 'Title' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleSortChange(value as 'relevance' | 'date' | 'title')}
                    className={`block w-full px-3 py-2 text-sm text-left rounded-lg transition-colors ${
                      sortBy === value
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Posts */}
            {!query && recentPosts.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Recent Posts
                </h3>
                <div className="space-y-2">
                  {recentPosts.map((post) => (
                    <a
                      key={post.slug}
                      href={post.url}
                      className="block p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2">
                        {post.title}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {new Date(post.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: '2-digit' })} • {post.readingTime} min read
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
              <div className="mb-6 space-y-2">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Active filters:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      {tag}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ))}
                </div>
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
      <div className="mx-auto max-w-6xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-32"></div>
          <div className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded max-w-2xl"></div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
