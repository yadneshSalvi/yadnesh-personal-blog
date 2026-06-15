"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";

type ZoomableImageProps = {
  src: string;
  srcDark?: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  frameClassName?: string;
  imageClassName?: string;
  sizes?: string;
  zoomLabel?: string;
};

type ImagePairProps = {
  src: string;
  srcDark?: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

type DialogSize = {
  width: number;
  height: number;
};

function isSvg(src: string) {
  return src.split("?")[0].toLowerCase().endsWith(".svg");
}

function ImageVariant({
  src,
  alt,
  width,
  height,
  priority,
  className,
  sizes,
}: Omit<ImagePairProps, "srcDark">) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes={sizes}
      unoptimized={isSvg(src)}
      className={className}
    />
  );
}

function ThemedImage({
  src,
  srcDark,
  alt,
  width,
  height,
  priority,
  className,
  sizes,
}: ImagePairProps) {
  if (!srcDark) {
    return (
      <ImageVariant
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={className}
        sizes={sizes}
      />
    );
  }

  return (
    <>
      <ImageVariant
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={clsx(className, "dark:hidden")}
        sizes={sizes}
      />
      <ImageVariant
        src={srcDark}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={clsx(className, "hidden dark:block")}
        sizes={sizes}
      />
    </>
  );
}

export default function ZoomableImage({
  src,
  srcDark,
  alt,
  width = 1280,
  height = 720,
  priority,
  frameClassName,
  imageClassName = "h-auto w-full",
  sizes = "(max-width: 1024px) calc(100vw - 3rem), 768px",
  zoomLabel,
}: ZoomableImageProps) {
  const [open, setOpen] = useState(false);
  const [dialogSize, setDialogSize] = useState<DialogSize | null>(null);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const accessibleLabel =
    zoomLabel || (alt ? `Enlarge image: ${alt}` : "Enlarge image");
  const aspectRatio = width / height;

  const calculateDialogSize = useCallback((): DialogSize => {
    const inlineWidth = triggerRef.current?.getBoundingClientRect().width ?? 0;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxViewportWidth = viewportWidth * (viewportWidth < 640 ? 0.92 : 0.88);
    const maxViewportHeight = viewportHeight * 0.9;
    const desiredWidth = Math.max(width, inlineWidth * 1.16);
    const maxWidth = Math.min(desiredWidth, maxViewportWidth);
    let nextWidth = maxWidth;
    let nextHeight = nextWidth / aspectRatio;

    if (nextHeight > maxViewportHeight) {
      nextHeight = maxViewportHeight;
      nextWidth = nextHeight * aspectRatio;
    }

    return {
      width: Math.round(nextWidth),
      height: Math.round(nextHeight),
    };
  }, [aspectRatio, width]);

  const openDialog = () => {
    setDialogSize(calculateDialogSize());
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleResize = () => {
      setDialogSize(calculateDialogSize());
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    window.requestAnimationFrame(() => dialogRef.current?.focus());

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, calculateDialogSize]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={accessibleLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openDialog}
        className={clsx(
          "block w-full cursor-zoom-in appearance-none bg-transparent p-0 text-left text-inherit transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
          frameClassName,
        )}
      >
        <ThemedImage
          src={src}
          srcDark={srcDark}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className={imageClassName}
          sizes={sizes}
        />
      </button>

      {open ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm sm:px-8"
          onClick={() => setOpen(false)}
        >
          <p id={titleId} className="sr-only">
            {accessibleLabel}
          </p>
          <div
            className="max-h-[90vh] max-w-[92vw] sm:max-w-[88vw]"
            style={{
              width: dialogSize ? `${dialogSize.width}px` : undefined,
              height: dialogSize ? `${dialogSize.height}px` : undefined,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-sm border border-line bg-paper shadow-2xl">
              <ThemedImage
                src={src}
                srcDark={srcDark}
                alt={alt}
                width={width}
                height={height}
                priority={priority}
                className="h-full w-full object-contain"
                sizes="(max-width: 768px) 92vw, 88vw"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
