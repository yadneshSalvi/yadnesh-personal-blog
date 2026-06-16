import * as React from "react";

type InlineTextOptions = {
  codeClassName: string;
  linkClassName: string;
  allowLinks?: boolean;
};

export function renderInlineText(
  text: string,
  { codeClassName, linkClassName, allowLinks = true }: InlineTextOptions
): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let index = 0;

  const pushText = (value: string) => {
    if (value) nodes.push(<React.Fragment key={nodes.length}>{value}</React.Fragment>);
  };

  while (index < text.length) {
    const codeStart = text.indexOf("`", index);
    const linkStart = allowLinks ? text.indexOf("[", index) : -1;
    const nextStarts = [codeStart, linkStart].filter((n) => n >= 0);

    if (nextStarts.length === 0) {
      pushText(text.slice(index));
      break;
    }

    const next = Math.min(...nextStarts);
    pushText(text.slice(index, next));

    if (next === codeStart) {
      const codeEnd = text.indexOf("`", codeStart + 1);
      if (codeEnd === -1) {
        pushText(text.slice(codeStart));
        break;
      }
      nodes.push(
        <code key={nodes.length} className={codeClassName}>
          {text.slice(codeStart + 1, codeEnd)}
        </code>
      );
      index = codeEnd + 1;
      continue;
    }

    const linkMatch = text.slice(linkStart).match(/^\[([^\]]+)\]\(([^)\s]+)\)/);
    if (!linkMatch) {
      pushText(text[linkStart]);
      index = linkStart + 1;
      continue;
    }

    nodes.push(
      <a key={nodes.length} href={linkMatch[2]} className={linkClassName}>
        {linkMatch[1]}
      </a>
    );
    index = linkStart + linkMatch[0].length;
  }

  return nodes;
}

export function plainInlineText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}
