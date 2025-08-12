import * as React from "react";
import CodeBlock from "@/components/CodeBlock";
import Tweet from "@/components/mdx/Tweet";
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
        const metastring: string | undefined = (candidate.props as { metastring?: string }).metastring;
        const meta = parseMeta(metastring);
        const filename = (meta.filename as string) || (meta.title as string) || undefined;
        const noCopy = meta.nocopy === true || meta.copy === "false";
        const noCollapse = meta.nocollapse === true || meta.collapsible === "false";
        const collapsed = meta.collapsed === true || meta.collapse === true;
        const wrap = meta.wrap === "true" || meta.wrap === true ? true : meta.wrap === "false" ? false : undefined;

        return (
          <CodeBlock
            language={language}
            code={code}
            filename={filename}
            showCopy={!noCopy}
            collapsible={!noCollapse}
            initialCollapsed={collapsed}
            {...(wrap !== undefined ? { wrapLongLines: wrap } : {})}
          />
        );
      }
    }
    return <pre {...(p as object)} />;
  },
} satisfies Record<string, React.ComponentType<unknown>>;

export default MDXComponents;


