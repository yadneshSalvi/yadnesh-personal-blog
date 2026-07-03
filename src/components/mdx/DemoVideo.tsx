import { renderInlineText } from "./InlineText";

export type DemoVideoProps = {
  src: string;
  /** Poster frame shown before playback; the only asset loaded until the user presses play */
  poster?: string;
  caption?: string;
  /** Accessible label describing what the recording shows */
  label?: string;
};

/**
 * Screen-recording embed for tutorial demos. Deliberately NOT a GIF and NOT
 * autoplay: with preload="none" the browser downloads zero video bytes until
 * the reader presses play, so a post with a demo costs one poster JPEG.
 */
export default function DemoVideo({ src, poster, caption, label }: DemoVideoProps) {
  const codeClass =
    "rounded bg-surface px-1 py-0.5 font-mono text-[0.85em] text-ink";
  const linkClass =
    "underline underline-offset-2 decoration-current transition-colors hover:text-muted";

  return (
    <figure className="not-prose my-10">
      <div className="overflow-hidden rounded-sm border border-line">
        <video
          controls
          muted
          playsInline
          preload="none"
          poster={poster}
          aria-label={label}
          className="h-auto w-full"
        >
          <source src={src} type="video/mp4" />
          Your browser does not support embedded videos.{" "}
          <a href={src} className={linkClass}>
            Download the demo video
          </a>
          .
        </video>
      </div>
      {caption ? (
        <figcaption className="mt-3 font-mono text-xs leading-relaxed text-faint">
          {renderInlineText(caption, { codeClassName: codeClass, linkClassName: linkClass })}
        </figcaption>
      ) : null}
    </figure>
  );
}
