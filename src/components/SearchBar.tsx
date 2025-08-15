"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/hooks/useSearch";
import { useSearchShortcut } from "@/hooks/useKeyboardShortcut";
import SearchErrorBoundary from "./SearchErrorBoundary";

interface SearchBarProps {
  className?: string;
  showResults?: boolean;
  onResultClick?: () => void;
}

export default function SearchBar({ 
  className = "", 
  showResults = true, 
  onResultClick 
}: SearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const { 
    searchResults, 
    isLoading, 
    getSuggestions,
    search, 
    clearResults,
    suggestions,
    isLoadingSuggestions,
  } = useSearch({ 
    debounceMs: 300, 
    minQueryLength: 2,
    autoSearch: true 
  });

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Handle search when query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      search(searchQuery);
      setShowSuggestions(true);
      getSuggestions(searchQuery);
    } else {
      clearResults();
      setShowSuggestions(false);
    }
  }, [searchQuery, search, clearResults, getSuggestions]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setSearchQuery("");
        setShowSuggestions(false);
        clearResults();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [clearResults]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExpanded(false);
        setSearchQuery("");
        setShowSuggestions(false);
        clearResults();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [clearResults]);

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  useSearchShortcut(() => {
    setIsExpanded(true);
  }, []);

  const handleSearchClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setIsExpanded(false);
    setShowSuggestions(false);
    clearResults();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsExpanded(false);
      setShowSuggestions(false);
      onResultClick?.();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    search(suggestion);
  };

  // Removed unused handleTagClick

  const handleResultClick = () => {
    setIsExpanded(false);
    setShowSuggestions(false);
    onResultClick?.();
  };

  return (
    <SearchErrorBoundary>
      <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Container */}
      <div
        className={`
          relative flex items-center transition-all duration-300 ease-in-out
          ${isExpanded 
            ? "w-64 md:w-80" 
            : "w-10 md:w-10"
          }
        `}
      >
        {/* Search Form */}
        <form onSubmit={handleSubmit} className="relative w-full">
          <div
            className={`
              relative flex items-center overflow-hidden rounded-full border transition-all duration-300 ease-in-out
              ${isExpanded
                ? "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-lg"
                : "bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }
            `}
          >
            {/* Search Icon */}
            <button
              type="button"
              onClick={handleSearchClick}
              className={`
                flex items-center justify-center transition-all duration-300 ease-in-out
                ${isExpanded 
                  ? "w-10 h-10 text-zinc-500 dark:text-zinc-400" 
                  : "w-10 h-10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                }
              `}
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Search Input */}
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className={`
                bg-transparent border-none outline-none text-sm transition-all duration-300 ease-in-out
                text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400
                ${isExpanded 
                  ? "w-full pr-10 py-2 opacity-100" 
                  : "w-0 pr-0 py-0 opacity-0"
                }
              `}
            />

            {/* Clear Button */}
            {isExpanded && searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 p-1 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors duration-200"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search Overlay for Mobile */}
      {isExpanded && (
        <div className="md:hidden fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40" />
      )}

      {/* Mobile Search Modal */}
      {isExpanded && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 shadow-lg">
          <div className="flex items-center p-4">
            <form onSubmit={handleSubmit} className="flex-1">
              <div className="relative flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-full">
                <div className="flex items-center justify-center w-10 h-10 text-zinc-500 dark:text-zinc-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 bg-transparent border-none outline-none text-sm py-2 pr-10 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-10 p-1 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                    aria-label="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                  </button>
                )}
              </div>
            </form>
            <button
              onClick={handleClear}
              className="ml-4 p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              aria-label="Close search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {isExpanded && showResults && showSuggestions && (searchResults || isLoading || suggestions.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50 hidden md:block">
          {/* Quick Suggestions */}
          {suggestions.length > 0 && !isLoading && !isLoadingSuggestions && (
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Suggestions</p>
              <div className="flex flex-wrap gap-1">
                {suggestions.slice(0, 5).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Searching...</p>
              </div>
            ) : searchResults && searchResults.results.length > 0 ? (
              <div className="p-2">
                {searchResults.results.slice(0, 5).map((result) => (
                  <div
                    key={result.item.slug}
                    onClick={handleResultClick}
                    className="block p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded cursor-pointer"
                  >
                    <a href={result.item.url} className="block">
                      <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {result.item.title}
                      </h4>
                      {result.item.subtitle && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-1">
                          {result.item.subtitle}
                        </p>
                      )}
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 line-clamp-2">
                        {result.item.excerpt}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-zinc-400">
                        <span>{new Date(result.item.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: '2-digit' })}</span>
                        <span className="mx-2">•</span>
                        <span>{result.item.readingTime} min read</span>
                        {result.item.tags.length > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="truncate">{result.item.tags.slice(0, 2).join(', ')}</span>
                          </>
                        )}
                      </div>
                    </a>
                  </div>
                ))}
                
                {searchResults.total > 5 && (
                  <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={() => {
                        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                        handleResultClick();
                      }}
                      className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      View all {searchResults.total} results
                    </button>
                  </div>
                )}
              </div>
            ) : searchQuery.length >= 2 && (
              <div className="p-4 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No results found for &quot;{searchQuery}&quot;
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </SearchErrorBoundary>
  );
}
