import fs from "node:fs";
import path from "node:path";

/**
 * Server-side reader for companion-repo files vendored by
 * scripts/sync-tutorial-code.mjs into content/code/<series>/.
 *
 * Code fences opt in with meta:  repo="part-05-streaming/backend/app/main.py" lines="36-45"
 * The path before the first "/" is resolved against content/code/<series> of the
 * series the repo belongs to; today there is one series, so paths resolve
 * against content/code/langgraph.
 */

export const TUTORIAL_REPOS: Record<string, { github: string; localDir: string }> = {
  langgraph: {
    github: "https://github.com/yadneshSalvi/langgraph-from-scratch",
    localDir: path.join(process.cwd(), "content/code/langgraph"),
  },
};

const DEFAULT_REPO = "langgraph";
const cache = new Map<string, string | null>();

export function readTutorialFile(repoPath: string, repo: string = DEFAULT_REPO): string | null {
  const key = `${repo}:${repoPath}`;
  if (cache.has(key)) return cache.get(key) ?? null;

  const conf = TUTORIAL_REPOS[repo];
  let result: string | null = null;
  if (conf) {
    const abs = path.join(conf.localDir, repoPath);
    // stay inside the vendored dir
    if (abs.startsWith(conf.localDir) && fs.existsSync(abs)) {
      result = fs.readFileSync(abs, "utf8");
    }
  }
  if (result === null) {
    console.warn(`[tutorialCode] missing vendored file: ${key} (run: node scripts/sync-tutorial-code.mjs)`);
  }
  cache.set(key, result);
  return result;
}

export function githubFileUrl(repoPath: string, lines?: string, repo: string = DEFAULT_REPO): string {
  const conf = TUTORIAL_REPOS[repo] ?? TUTORIAL_REPOS[DEFAULT_REPO];
  let anchor = "";
  const first = (lines ?? "").split(",")[0]?.trim();
  const m = first?.match(/^(\d+)(?:-(\d+))?$/);
  if (m) anchor = m[2] ? `#L${m[1]}-L${m[2]}` : `#L${m[1]}`;
  return `${conf.github}/blob/main/${repoPath}${anchor}`;
}

/** "1-2,36-45" -> Set of line numbers (1-based) */
export function parseLineRanges(lines?: string): number[] {
  if (!lines) return [];
  const out: number[] = [];
  for (const part of lines.split(",")) {
    const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!m) continue;
    const start = parseInt(m[1], 10);
    const end = m[2] ? parseInt(m[2], 10) : start;
    for (let i = start; i <= end; i++) out.push(i);
  }
  return out;
}
