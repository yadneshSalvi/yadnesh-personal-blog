#!/usr/bin/env node
/**
 * Syncs companion-repo source files into content/code/<series>/ so the
 * FullFile code-block feature (repo= / lines= fence meta) can read them
 * at build time without network access.
 *
 * Usage: node scripts/sync-tutorial-code.mjs
 * Add new series by appending to SERIES below.
 */
import fs from "node:fs";
import path from "node:path";

const SERIES = [
  {
    // local checkout of https://github.com/yadneshSalvi/langgraph-from-scratch
    source: path.resolve(process.cwd(), "../langgraph-from-scratch"),
    dest: path.resolve(process.cwd(), "content/code/langgraph"),
  },
  {
    // local checkout of https://github.com/yadneshSalvi/claude-agent-sdk-in-production
    source: path.resolve(process.cwd(), "../claude-agent-sdk-in-production"),
    dest: path.resolve(process.cwd(), "content/code/agent-sdk"),
  },
];

// Only vendor text files a post might display.
const ALLOWED_FILES = new Set(["Dockerfile", ".dockerignore", ".gitignore", ".env.example", ".env.local.example", "requirements.txt"]);
const ALLOWED_EXTS = new Set([".py", ".ts", ".tsx", ".css", ".toml", ".json", ".md", ".txt"]);
const SKIP_DIRS = new Set(["node_modules", ".venv", ".next", ".git", "__pycache__", "public"]);
const SKIP_FILES = new Set(["package-lock.json", "next-env.d.ts", "tsconfig.tsbuildinfo"]);

function shouldCopy(name) {
  if (SKIP_FILES.has(name)) return false;
  if (ALLOWED_FILES.has(name)) return true;
  return ALLOWED_EXTS.has(path.extname(name));
}

function walk(src, dest, stats) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(from, to, stats);
    } else if (entry.isFile() && shouldCopy(entry.name)) {
      // Never vendor real env files, only *.example
      if (entry.name === ".env" || entry.name === ".env.local") continue;
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
      stats.copied++;
    }
  }
}

for (const { source, dest } of SERIES) {
  if (!fs.existsSync(source)) {
    console.error(`[sync-tutorial-code] source missing: ${source}`);
    process.exitCode = 1;
    continue;
  }
  fs.rmSync(dest, { recursive: true, force: true });
  const stats = { copied: 0 };
  walk(source, dest, stats);
  console.log(`[sync-tutorial-code] ${stats.copied} files -> ${path.relative(process.cwd(), dest)}`);
}
