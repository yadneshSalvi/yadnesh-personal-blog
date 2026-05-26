// Runtime-only loader for the pre-built search index JSON.
//
// This file is intentionally separate from ./indexer so the runtime API route
// (src/app/api/search/route.ts) doesn't pull in build-time deps like gray-matter
// and the top-level fs/path operations that confuse Turbopack's NFT analyzer.
// The build-time index generation (buildSearchIndex / generateSearchIndex) lives
// in ./indexer and is only loaded via dynamic import() as a fallback.

import fs from "node:fs";
import path from "node:path";
import type { SearchIndex } from "./types";

export function loadSearchIndex(inputPath?: string): SearchIndex | null {
  // NOTE: Turbopack still emits a "next.config.ts in NFT list" warning for this
  // route. The flagged chunk is Next.js framework plumbing (node:fs, node:path,
  // app-page-turbo runtime) — 1.3 KB of externals stubs, no user code or config
  // content. The /*turbopackIgnore: true*/ comment on process.cwd() doesn't
  // silence the warning, so we accept it as cosmetic noise.
  const defaultPath = path.join(process.cwd(), "public", "search-index.json");
  const filePath = inputPath || defaultPath;

  if (!fs.existsSync(filePath)) {
    console.warn(`Search index not found: ${filePath}`);
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content) as SearchIndex;
  } catch (error) {
    console.error(`Error loading search index:`, error);
    return null;
  }
}
