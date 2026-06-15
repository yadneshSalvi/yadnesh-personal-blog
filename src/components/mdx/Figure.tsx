import ZoomableImage from "@/components/ZoomableImage";

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
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
