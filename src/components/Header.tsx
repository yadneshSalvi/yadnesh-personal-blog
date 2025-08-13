"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = (mounted ? resolvedTheme : theme) === "dark";

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:border-zinc-800/80 dark:bg-zinc-950/70 dark:supports-[backdrop-filter]:bg-zinc-950/50">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="select-none text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          YS
        </Link>
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
          <button
            type="button"
            aria-label="Toggle theme"
            className="ml-2 rounded border border-zinc-300 bg-zinc-100 px-2 py-1 text-xs text-zinc-800 hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {mounted ? (isDark ? "Dark" : "Light") : "Theme"}
          </button>
        </nav>
      </div>
    </header>
  );
}


