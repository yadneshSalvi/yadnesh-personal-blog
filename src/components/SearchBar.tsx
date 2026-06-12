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
                ? "bg-paper border-line shadow-sm"
                : "bg-transparent border-transparent hover:bg-surface"
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
                  ? "w-10 h-10 text-faint"
                  : "w-10 h-10 text-muted hover:text-ink"
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
                text-ink placeholder:text-faint
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
                className="absolute right-2 p-1 text-faint transition-colors duration-200 hover:text-ink"
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
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-paper border-b border-line shadow-lg">
          <div className="flex items-center p-4">
            <form onSubmit={handleSubmit} className="flex-1">
              <div className="relative flex items-center bg-surface rounded-full">
                <div className="flex items-center justify-center w-10 h-10 text-faint">
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
                  className="flex-1 bg-transparent border-none outline-none text-sm py-2 pr-10 text-ink placeholder:text-faint"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-10 p-1 text-faint hover:text-ink"
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
              className="ml-4 p-2 text-muted hover:text-ink"
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
        <div className="absolute top-full left-0 right-0 mt-2 bg-paper border border-line rounded-md shadow-lg max-h-96 overflow-y-auto z-50 hidden md:block">
          {/* Quick Suggestions */}
          {suggestions.length > 0 && !isLoading && !isLoadingSuggestions && (
            <div className="p-3 border-b border-line">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Suggestions</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {suggestions.slice(0, 5).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="font-mono text-xs text-muted transition-colors hover:text-accent"
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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto"></div>
                <p className="mt-2 font-mono text-xs text-faint">Searching…</p>
              </div>
            ) : searchResults && searchResults.results.length > 0 ? (
              <div className="p-2">
                {searchResults.results.slice(0, 5).map((result) => (
                  <div
                    key={result.item.slug}
                    onClick={handleResultClick}
                    className="group block cursor-pointer rounded p-3 transition-colors hover:bg-surface"
                  >
                    <a href={result.item.url} className="block">
                      <h4 className="line-clamp-1 font-serif text-base leading-snug text-ink transition-colors group-hover:text-accent">
                        {result.item.title}
                      </h4>
                      {result.item.subtitle && (
                        <p className="mt-1 line-clamp-1 text-xs text-muted">
                          {result.item.subtitle}
                        </p>
                      )}
                      <p className="mt-1 line-clamp-2 text-xs text-faint">
                        {result.item.excerpt}
                      </p>
                      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                        <span>{new Date(result.item.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: '2-digit' })}</span>
                        <span className="mx-1.5">·</span>
                        <span>{result.item.readingTime} min</span>
                        {result.item.tags.length > 0 && (
                          <>
                            <span className="mx-1.5">·</span>
                            <span>{result.item.tags.slice(0, 2).join(', ')}</span>
                          </>
                        )}
                      </div>
                    </a>
                  </div>
                ))}

                {searchResults.total > 5 && (
                  <div className="border-t border-line p-3">
                    <button
                      onClick={() => {
                        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                        handleResultClick();
                      }}
                      className="w-full text-center font-mono text-xs uppercase tracking-[0.15em] text-accent"
                    >
                      View all {searchResults.total} results →
                    </button>
                  </div>
                )}
              </div>
            ) : searchQuery.length >= 2 && (
              <div className="p-4 text-center">
                <p className="text-sm text-faint">
                  No results for &quot;{searchQuery}&quot;
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
