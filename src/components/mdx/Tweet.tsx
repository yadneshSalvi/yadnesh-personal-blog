"use client";

import { useEffect, useMemo, useRef } from "react";
import Script from "next/script";

type TweetProps = {
  id?: string;
  url?: string;
  theme?: "light" | "dark";
  align?: "left" | "center" | "right";
  className?: string;
};

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (el?: HTMLElement) => void;
        createTweet?: (
          id: string,
          element: HTMLElement,
          options?: { theme?: "light" | "dark"; align?: "left" | "center" | "right"; dnt?: boolean }
        ) => Promise<void>;
      };
    };
  }
}

export default function Tweet({ id, url, theme = "dark", align = "center", className }: TweetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const tweetId = useMemo(() => {
    if (id) return id;
    if (!url) return undefined;
    const m = url.match(/status\/(\d+)/) || url.match(/statuses\/(\d+)/);
    return m?.[1];
  }, [id, url]);

  useEffect(() => {
    if (!tweetId) return;
    let canceled = false;
    const render = () => {
      if (canceled || !containerRef.current) return;
      containerRef.current.innerHTML = "";
      const create = window.twttr?.widgets?.createTweet;
      if (create) {
        create(tweetId, containerRef.current, { theme, align, dnt: true }).catch(() => {});
      }
    };
    const waitForTwitter = () => {
      if (canceled) return;
      if (window.twttr?.widgets?.createTweet) render();
      else setTimeout(waitForTwitter, 250);
    };
    waitForTwitter();
    return () => {
      canceled = true;
    };
  }, [tweetId, theme, align]);

  if (!tweetId) return null;

  return (
    <div ref={containerRef} className={className} data-tweet-container>
      <Script id="twitter-wjs" src="https://platform.twitter.com/widgets.js" strategy="afterInteractive" />
    </div>
  );
}


