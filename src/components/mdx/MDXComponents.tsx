import * as React from "react";
import CodeBlock from "@/components/CodeBlock";
import { readTutorialFile, githubFileUrl, parseLineRanges } from "@/lib/tutorialCode";
import Tweet from "@/components/mdx/Tweet";
import Callout from "@/components/mdx/Callout";
import YouTube from "@/components/mdx/YouTube";
import Mermaid from "@/components/mdx/Mermaid";
import Figure from "@/components/mdx/Figure";
import CodeTabs, { Tab } from "@/components/mdx/CodeTabs";
import Quiz from "@/components/mdx/Quiz";
import Recap from "@/components/mdx/Recap";
import type { FigureProps } from "@/components/mdx/Figure";
import type { TabProps } from "@/components/mdx/CodeTabs";
import type { QuizProps } from "@/components/mdx/Quiz";
import type { RecapProps } from "@/components/mdx/Recap";
import type { ReactNode } from "react";

type CodeChildProps = { className?: string; children?: ReactNode; mdxType?: string; originalType?: string };

function firstChild(node: ReactNode): ReactNode | null {
  if (Array.isArray(node)) return node[0] ?? null;
  return node ?? null;
}

function parseMeta(meta?: string): Record<string, string | boolean> {
  if (!meta) return {};
  // Split by whitespace while respecting quoted values
  const parts = meta.match(/([\w-]+\s*=\s*"[^"]*"|[\w-]+\s*=\s*'[^']*'|[\w-]+\s*=\s*[^\s"']+|[\w-]+)/g) || [];
  const out: Record<string, string | boolean> = {};
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) {
      out[part.trim()] = true;
    } else {
      const key = part.slice(0, eq).trim();
      let value = part.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      out[key] = value;
    }
  }
  return out;
}

const MDXComponents: Record<string, (props: unknown) => React.ReactNode> = {
  Tweet: (props) => <Tweet {...(props as Record<string, unknown>)} />,
  Callout: (props) => <Callout {...(props as Record<string, unknown>)} />,
  YouTube: (props) => <YouTube {...(props as { id: string })} />,
  Mermaid: (props) => <Mermaid {...(props as { chart: string })} />,
  Figure: (props) => <Figure {...(props as FigureProps)} />,
  CodeTabs: (props) => <CodeTabs {...(props as { children?: ReactNode })} />,
  Tab: (props) => <Tab {...(props as TabProps)} />,
  Quiz: (props) => <Quiz {...(props as QuizProps)} />,
  Recap: (props) => <Recap {...(props as RecapProps)} />,
  pre: (props) => {
    const p = props as { children?: ReactNode };
    const candidate = firstChild(p.children);
    if (React.isValidElement<CodeChildProps>(candidate)) {
      const isCode =
        candidate.type === "code" ||
        candidate.props?.mdxType === "code" ||
        candidate.props?.originalType === "code";
      if (isCode) {
        const className = candidate.props.className;
        const match = /language-([\w-]+)/.exec(className || "");
      const language = match?.[1] || "tsx";
      const code = String(candidate.props.children || "");
      // If mermaid fenced code block, render as diagram
      if (language.toLowerCase() === "mermaid") {
        const metastring: string | undefined = (candidate.props as { metastring?: string }).metastring;
        const meta = parseMeta(metastring);
        const title = (meta.title as string) || (meta.filename as string) || "Mermaid";
        const noCopy = meta.nocopy === true || meta.copy === "false";
        const noCollapse = meta.nocollapse === true || meta.collapsible === "false";
        const collapsed = meta.collapsed === true || meta.collapse === true;
        return (
          <Mermaid
            chart={code}
            title={title}
            showCopy={!noCopy}
            collapsible={!noCollapse}
            initialCollapsed={collapsed}
          />
        );
      }
        const metastring: string | undefined = (candidate.props as { metastring?: string }).metastring;
        const meta = parseMeta(metastring);
        const filename = (meta.filename as string) || (meta.title as string) || undefined;
        const noCopy = meta.nocopy === true || meta.copy === "false";
        const noCollapse = meta.nocollapse === true || meta.collapsible === "false";
        const collapsed = meta.collapsed === true || meta.collapse === true;
        const wrap = meta.wrap === "true" || meta.wrap === true ? true : meta.wrap === "false" ? false : undefined;

        // Companion-repo integration: repo="part-05-streaming/backend/app/main.py" lines="36-45"
        // adds a GitHub icon linking to the exact file and a "View full file" toggle that
        // shows the whole (vendored) file in place with the added lines highlighted.
        const repoPath = typeof meta.repo === "string" ? meta.repo : undefined;
        const repoLines = typeof meta.lines === "string" ? meta.lines : undefined;
        const fullCode = repoPath ? readTutorialFile(repoPath) ?? undefined : undefined;
        const githubUrl = repoPath ? githubFileUrl(repoPath, repoLines) : undefined;
        const highlightLines = repoPath ? parseLineRanges(repoLines) : undefined;

        return (
          <CodeBlock
            language={language}
            code={code}
            filename={filename}
            showCopy={!noCopy}
            collapsible={!noCollapse}
            initialCollapsed={collapsed}
            {...(wrap !== undefined ? { wrapLongLines: wrap } : {})}
            {...(fullCode !== undefined ? { fullCode } : {})}
            {...(repoPath !== undefined ? { repoPath, githubUrl } : {})}
            {...(highlightLines && highlightLines.length ? { highlightLines } : {})}
          />
        );
      }
    }
    return <pre {...(p as object)} />;
  },
} satisfies Record<string, React.ComponentType<unknown>>;

export default MDXComponents;


