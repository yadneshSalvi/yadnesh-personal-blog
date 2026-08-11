import Image from "next/image";
import Link from "next/link";
import type { BriefComic, BriefHedge, BriefMeme } from "@/lib/brief/schema";
import { publicImageSize } from "@/lib/brief/imageSize";
import { COMIC_LABEL, HEDGE_LABEL, memeLabel } from "@/lib/brief/humor";
import { Kicker } from "./IssueParts";
import { StoryLink } from "./StoryRow";

/**
 * The drawn frame both the meme and the comic sit in: hairline border, image at
 * the column's full width, mono caption underneath. `alt_joke` rides on the
 * title attribute, which is the xkcd convention and the reason it is a separate
 * field from the alt text.
 */
function DrawnFigure({
  anchor,
  kicker,
  image,
  alt,
  altJoke,
  caption,
  children,
}: {
  anchor: string;
  kicker: string;
  image: string;
  alt: string;
  altJoke: string | null;
  caption: string;
  children?: React.ReactNode;
}) {
  const { width, height } = publicImageSize(image);
  return (
    <figure id={anchor} className="scroll-mt-24">
      <Kicker>{kicker}</Kicker>
      <div className="mt-4 overflow-hidden rounded-sm border border-line">
        {/* The art is drawn on warm paper, which glares against a dark page.
            Knocking it back a notch is the same trick the comics use. */}
        <Image
          src={image}
          alt={alt}
          title={altJoke ?? undefined}
          width={width}
          height={height}
          sizes="(max-width: 1024px) calc(100vw - 3rem), 768px"
          className="h-auto w-full dark:brightness-[0.85]"
        />
      </div>
      <figcaption className="mt-3 font-mono text-xs leading-relaxed text-faint">
        {caption}
        {children}
      </figcaption>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
        Drawn by an image model.
      </p>
    </figure>
  );
}

export function MemeFigure({
  meme,
  type,
}: {
  meme: BriefMeme;
  type: "daily" | "weekly";
}) {
  return (
    <DrawnFigure
      anchor="meme"
      kicker={memeLabel(type)}
      image={meme.image}
      alt={meme.alt}
      altJoke={meme.alt_joke}
      caption={meme.caption}
    >
      {" "}
      <Link
        href="/newsletter/memes"
        className="text-accent transition-colors hover:text-ink"
      >
        More in the hall of fame
      </Link>
    </DrawnFigure>
  );
}

export function ComicFigure({ comic }: { comic: BriefComic }) {
  return (
    <DrawnFigure
      anchor="comic"
      kicker={COMIC_LABEL}
      image={comic.image}
      alt={comic.alt}
      altJoke={comic.alt_joke}
      caption={comic.caption}
    />
  );
}

/**
 * Hedge of the day. Boxed rather than ruled, so it reads as its own artifact
 * next to the `Y:` notes, which keep the left accent rule to themselves. The
 * quote is somebody else's sentence and is set as one; the dry line underneath
 * is the joke, and it stays one line.
 */
export function HedgeBlock({ hedge }: { hedge: BriefHedge }) {
  return (
    <section id="hedge" className="scroll-mt-24">
      <div className="rounded-sm border border-line bg-surface px-6 py-6 sm:px-8 sm:py-7">
        <Kicker>{HEDGE_LABEL}</Kicker>
        <blockquote className="mt-4 font-serif text-xl italic leading-relaxed text-ink sm:text-2xl">
          &ldquo;{hedge.quote}&rdquo;
        </blockquote>
        <p className="mt-4 text-sm leading-snug">
          <StoryLink story={hedge.story} />
        </p>
        <p className="mt-4 leading-relaxed text-muted">{hedge.note}</p>
      </div>
    </section>
  );
}
