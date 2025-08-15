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
  onTagClick 
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SearchResultSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 dark:text-red-400 mb-2">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">Search Error</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
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
    <div className="space-y-6">
      {/* Search Stats */}
      <div className="text-sm text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <p>
          Found <span className="font-medium text-zinc-900 dark:text-zinc-100">{total}</span> result{total !== 1 ? 's' : ''} for 
          <span className="font-medium text-zinc-900 dark:text-zinc-100"> "{query}"</span>
          <span className="ml-2">({executionTime}ms)</span>
        </p>
      </div>

      {/* Search Results */}
      <div className="space-y-6">
        {results.map((result, index) => (
          <SearchResultItem 
            key={result.item.slug} 
            result={result} 
            query={query}
            onTagClick={onTagClick}
            index={index}
          />
        ))}
      </div>

      {/* Load More Button */}
      {searchResponse.hasMore && (
        <div className="text-center py-4">
          <button className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline">
            Load more results
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
  index 
}: { 
  result: SearchResult; 
  query: string; 
  onTagClick?: (tag: string) => void;
  index: number;
}) {
  const { item } = result;
  
  // Highlight search terms in title and excerpt
  const highlightText = (text: string, terms: string[]) => {
    if (!terms.length) return text;
    
    let highlightedText = text;
    terms.forEach(term => {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>');
    });
    
    return highlightedText;
  };

  const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
  const highlightedTitle = highlightText(item.title, searchTerms);
  const highlightedExcerpt = highlightText(item.excerpt, searchTerms);

  return (
    <article className="group">
      <Link 
        href={item.url}
        className="block p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all duration-200"
      >
        <div className="space-y-3">
          {/* Title */}
          <h3 
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
            dangerouslySetInnerHTML={{ __html: highlightedTitle }}
          />
          
          {/* Subtitle */}
          {item.subtitle && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {item.subtitle}
            </p>
          )}

          {/* Excerpt */}
          <p 
            className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: highlightedExcerpt }}
          />

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center space-x-4">
              <time dateTime={item.createdAt}>
                {new Date(item.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: '2-digit' })}
              </time>
              <span>{item.readingTime} min read</span>
              <span>{item.wordCount} words</span>
            </div>
            
            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex items-center space-x-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <button
                    key={tag}
                    onClick={(e) => {
                      e.preventDefault();
                      onTagClick?.(tag);
                    }}
                    className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
                {item.tags.length > 3 && (
                  <span className="text-zinc-400">+{item.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

function NoResultsFound({ 
  query, 
  suggestions, 
  onTagClick 
}: { 
  query: string; 
  suggestions?: string[];
  onTagClick?: (tag: string) => void;
}) {
  return (
    <div className="text-center py-12">
      <div className="mb-6">
        <svg className="w-16 h-16 mx-auto text-zinc-400 dark:text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          No results found
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400">
          No posts found for <span className="font-medium">"{query}"</span>
        </p>
      </div>

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
            Did you mean:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onTagClick?.(suggestion)}
                className="px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fallback suggestions */}
      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Try searching for:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {['React', 'TypeScript', 'Next.js', 'AI', 'JavaScript'].map((term) => (
            <button
              key={term}
              onClick={() => onTagClick?.(term)}
              className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
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
    <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 animate-pulse">
      <div className="space-y-3">
        <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
          <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6"></div>
        </div>
        <div className="flex justify-between">
          <div className="flex space-x-4">
            <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-20"></div>
            <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-16"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-12"></div>
            <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
