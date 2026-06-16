import ZoomableImage from "@/components/ZoomableImage";
import { renderInlineText } from "./InlineText";

export type FigureProps = {
  src: string;
  /** Optional dark-mode variant, rendered via dark:hidden / hidden dark:block */
  srcDark?: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

export default function Figure({
  src,
  srcDark,
  alt,
  caption,
  width = 1280,
  height = 720,
  priority,
}: FigureProps) {
  const codeClass =
    "rounded bg-surface px-1 py-0.5 font-mono text-[0.85em] text-ink";
  const linkClass =
    "underline underline-offset-2 decoration-current transition-colors hover:text-muted";

  return (
    <figure className="not-prose my-10">
      <ZoomableImage
        src={src}
        srcDark={srcDark}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        frameClassName="overflow-hidden rounded-sm border border-line"
        imageClassName="h-auto w-full"
      />
      {caption ? (
        <figcaption className="mt-3 font-mono text-xs leading-relaxed text-faint">
          {renderInlineText(caption, { codeClassName: codeClass, linkClassName: linkClass })}
        </figcaption>
      ) : null}
    </figure>
  );
}
