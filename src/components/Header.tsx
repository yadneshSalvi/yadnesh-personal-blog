"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import SearchBar from "./SearchBar";

export default function Header() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = (mounted ? resolvedTheme : theme) === "dark";

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header data-is-dark={isDark ? 'true' : 'false'} className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:border-zinc-800/80 dark:bg-zinc-950/70 dark:supports-[backdrop-filter]:bg-zinc-950/50">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="select-none text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          YS
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/blog" className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">
              Blog
            </Link>
            <Link href="/about" className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">
              About
            </Link>
            <Link href="/contact" className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">
              Contact
            </Link>
          </nav>
          
          {/* Search Bar */}
          <SearchBar />
          
          {/* <button
            type="button"
            aria-label="Toggle theme"
            className="ml-2 rounded border border-zinc-300 bg-zinc-100 px-2 py-1 text-xs text-zinc-800 hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {mounted ? (isDark ? "Dark" : "Light") : "Theme"}
          </button> */}
        </div>

        {/* Mobile Search and Menu */}
        <div className="md:hidden flex items-center gap-2">
          <SearchBar />
          <button
            type="button"
            className="flex flex-col items-center justify-center w-6 h-6 space-y-1"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <span className={`block w-5 h-0.5 bg-zinc-700 dark:bg-zinc-300 transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
            <span className={`block w-5 h-0.5 bg-zinc-700 dark:bg-zinc-300 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-5 h-0.5 bg-zinc-700 dark:bg-zinc-300 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur">
          <nav className="flex flex-col px-4 py-4 space-y-4">
            <Link 
              href="/blog" 
              className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link 
              href="/about" 
              className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              href="/contact" 
              className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}


