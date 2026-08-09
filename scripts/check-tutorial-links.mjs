#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const localOnly = process.argv.includes("--local");
const sourceKey = "langgraph-prod";
const owner = "yadneshSalvi";
const repository = "langgraph-in-production";
const repositoryUrl = `https://github.com/${owner}/${repository}`;
const vendoredRoot = path.join(root, "content/code/langgraph-prod");
const companionRoot = path.resolve(root, "../langgraph-in-production");
const postsRoot = path.join(root, "content/posts");
const failures = [];
const referencedFiles = new Set();
const referencedFolders = new Set();
let fenceCount = 0;
let cloneCount = 0;

function fail(message) {
  failures.push(message);
}

function metaValue(info, key) {
  return new RegExp(`(?:^|\\s)${key}="([^"]+)"`).exec(info)?.[1];
}

function selectedLines(source, specification, label) {
  const sourceLines = source.split(/\r?\n/);
  const selected = [];
  for (const part of specification.split(",")) {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part.trim());
    if (!match) {
      fail(`${label}: invalid lines specification ${JSON.stringify(specification)}`);
      continue;
    }
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (start < 1 || end < start || end > sourceLines.length) {
      fail(`${label}: lines ${part} are outside a ${sourceLines.length}-line file`);
      continue;
    }
    selected.push(...sourceLines.slice(start - 1, end));
  }
  return selected.join("\n");
}

const posts = fs
  .readdirSync(postsRoot)
  .filter((name) => /^langgraph-prod-[1-5]-.*\.mdx$/.test(name))
  .sort();

// A tree without the series (Vercel builds while the langgraph posts are still
// local-only) has nothing to check; every assertion below assumes the five
// posts and the vendored companion code are present.
if (posts.length === 0) {
  console.warn("[tutorial-links] no langgraph-prod posts in this tree; skipping.");
  process.exit(0);
}

for (const post of posts) {
  const postPath = path.join(postsRoot, post);
  const markdown = fs.readFileSync(postPath, "utf8");
  if (markdown.includes(`${repositoryUrl}.git`)) {
    cloneCount += 1;
  } else {
    fail(`${post}: missing companion clone URL`);
  }
  for (const match of markdown.matchAll(/```([^\n]*)\n([\s\S]*?)\n```/g)) {
    const info = match[1];
    const repoPath = metaValue(info, "repo");
    if (!repoPath) continue;
    fenceCount += 1;
    const source = metaValue(info, "source");
    const lines = metaValue(info, "lines");
    const label = `${post}: ${repoPath}`;
    if (source !== sourceKey) fail(`${label}: expected source="${sourceKey}"`);
    if (!lines) fail(`${label}: missing lines metadata`);
    if (repoPath.startsWith("/") || repoPath.split("/").includes("..")) {
      fail(`${label}: repository path escapes its root`);
      continue;
    }
    const vendoredPath = path.join(vendoredRoot, repoPath);
    if (!fs.existsSync(vendoredPath)) {
      fail(`${label}: vendored source is missing`);
      continue;
    }
    referencedFiles.add(repoPath);
    if (lines) {
      const sourceText = fs.readFileSync(vendoredPath, "utf8");
      const expected = selectedLines(sourceText, lines, label);
      if (expected !== match[2]) fail(`${label}: fenced code does not match source lines ${lines}`);
      if (match[2].split("\n").length > 25) fail(`${label}: code fence exceeds 25 lines`);
    }
  }

  const explicitLinks = markdown.matchAll(
    /https:\/\/github\.com\/yadneshSalvi\/langgraph-in-production(?:\.git)?(?:\/(?:tree|blob)\/main\/([^\s)#]+))?/g,
  );
  for (const match of explicitLinks) {
    if (!match[1]) continue;
    const repoPath = decodeURIComponent(match[1]);
    const localPath = path.join(companionRoot, repoPath);
    if (!fs.existsSync(localPath)) fail(`${post}: explicit GitHub path is missing locally: ${repoPath}`);
    if (fs.existsSync(localPath) && fs.statSync(localPath).isDirectory()) {
      referencedFolders.add(repoPath.replace(/\/$/, ""));
    } else {
      referencedFiles.add(repoPath);
    }
  }
}

if (posts.length !== 5) fail(`expected 5 Act I posts, found ${posts.length}`);
if (fenceCount === 0) fail("no companion-repository code fences were found");
if (cloneCount !== posts.length) fail(`expected ${posts.length} clone URLs, found ${cloneCount}`);
if (referencedFolders.size !== posts.length) {
  fail(`expected ${posts.length} companion-folder links, found ${referencedFolders.size}`);
}
const seriesIndex = fs.readFileSync(
  path.join(root, "content/series/langgraph-in-production/index.mdx"),
  "utf8",
);
if (!seriesIndex.includes(repositoryUrl)) fail("series index is missing the companion repository URL");

async function verifyRemote() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "yadnesh-personal-blog-link-check",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repository}`, { headers });
  if (!repoResponse.ok) {
    fail(`${repositoryUrl}: GitHub repository lookup returned ${repoResponse.status}`);
    return;
  }
  const repo = await repoResponse.json();
  if (repo.private) fail(`${repositoryUrl}: repository must be public for tutorial links`);
  if (repo.default_branch !== "main") {
    fail(`${repositoryUrl}: expected default branch main, found ${repo.default_branch}`);
    return;
  }
  const treeResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repository}/git/trees/main?recursive=1`,
    { headers },
  );
  if (!treeResponse.ok) {
    fail(`${repositoryUrl}: main tree lookup returned ${treeResponse.status}`);
    return;
  }
  const tree = await treeResponse.json();
  if (tree.truncated) fail(`${repositoryUrl}: recursive tree response was truncated`);
  const remotePaths = new Set(tree.tree.map((entry) => entry.path));
  for (const repoPath of referencedFiles) {
    if (!remotePaths.has(repoPath)) fail(`${repositoryUrl}/blob/main/${repoPath}: remote file is missing`);
  }
  for (const repoPath of referencedFolders) {
    if (![...remotePaths].some((candidate) => candidate === repoPath || candidate.startsWith(`${repoPath}/`))) {
      fail(`${repositoryUrl}/tree/main/${repoPath}: remote folder is missing`);
    }
  }
}

if (!localOnly && failures.length === 0) await verifyRemote();

if (failures.length) {
  console.error(`[tutorial-links] ${failures.length} failure(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `[tutorial-links] ${fenceCount} code links, ${referencedFolders.size} folder links, and ${cloneCount} clone URLs passed ${
    localOnly ? "local" : "local + GitHub"
  } verification.`,
);
