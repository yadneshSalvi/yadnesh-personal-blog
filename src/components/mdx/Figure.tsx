import Image from "next/image";
import clsx from "clsx";

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

function FrameImage({
  src,
  alt,
  width,
  height,
  priority,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      // SVGs skip the optimizer (it rejects them); raster formats keep it.
      unoptimized={src.endsWith(".svg")}
      className={clsx("h-auto w-full", className)}
    />
  );
}

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
      <div className="overflow-hidden rounded-sm border border-line">
        {srcDark ? (
          <>
            <FrameImage
              src={src}
              alt={alt}
              width={width}
              height={height}
              priority={priority}
              className="dark:hidden"
            />
            <FrameImage
              src={srcDark}
              alt={alt}
              width={width}
              height={height}
              priority={priority}
              className="hidden dark:block"
            />
          </>
        ) : (
          <FrameImage
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
          />
        )}
      </div>
      {caption ? (
        <figcaption className="mt-3 font-mono text-xs leading-relaxed text-faint">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
