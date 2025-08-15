"use client";

import React from 'react';

interface SearchErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface SearchErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export class SearchErrorBoundary extends React.Component<
  SearchErrorBoundaryProps,
  SearchErrorBoundaryState
> {
  constructor(props: SearchErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SearchErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Search Error Boundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultSearchErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

function DefaultSearchErrorFallback({ 
  error, 
  retry 
}: { 
  error?: Error; 
  retry: () => void; 
}) {
  return (
    <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg 
            className="w-5 h-5 text-red-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Search Error
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            Something went wrong with the search functionality.
          </p>
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                Error details
              </summary>
              <pre className="text-xs text-red-600 dark:text-red-400 mt-1 overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
          <div className="mt-3">
            <button
              onClick={retry}
              className="text-sm bg-red-100 dark:bg-red-800/30 text-red-800 dark:text-red-200 px-3 py-1 rounded hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchErrorBoundary;
