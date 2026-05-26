"use client";

import { useEffect, useRef } from "react";
import * as React from "react";

type YouTubeProps = {
  id: string; // YouTube video id
  title?: string;
  start?: number;
  params?: string; // additional URL params, e.g., "t=30s"
  poster?: "hqdefault" | "mqdefault" | "sddefault" | "maxresdefault";
  className?: string;
};

export default function YouTube({ id, title, start, params, poster = "hqdefault", className }: YouTubeProps) {
  useEffect(() => {
    // Import once on client
    import("@justinribeiro/lite-youtube");
  }, []);

  const hostRef = useRef<HTMLElement | null>(null);

  // lite-youtube prepends `start=${videoStartAt}` to its params getter, so if we
  // also include `start=` in `params` the resulting iframe URL has two `start`
  // keys and YouTube honors the first one (the default `0`). Strip any caller-
  // supplied `start` and pass the time via the `videoStartAt` attribute instead.
  const queryParams = new URLSearchParams();
  if (params) {
    for (const part of params.split("&")) {
      const [k, v] = part.split("=");
      if (!k || k.toLowerCase() === "start") continue;
      queryParams.set(k, v ?? "");
    }
  }

  const paramsString = queryParams.toString();
  const startSeconds = typeof start === "number" && start > 0 ? String(start) : undefined;

  useEffect(() => {
    if (!hostRef.current) return;
    hostRef.current.setAttribute("videoid", id);
    hostRef.current.setAttribute("playlabel", title || "Play video");
    hostRef.current.setAttribute("poster", poster);
    if (paramsString) hostRef.current.setAttribute("params", paramsString);
    else hostRef.current.removeAttribute("params");
    // lite-youtube reads this exact attribute name (case-insensitive in HTML)
    // via getAttribute('videoStartAt') and uses it to set the YT `start` param.
    if (startSeconds) {
      hostRef.current.setAttribute("videoStartAt", startSeconds);
    } else {
      hostRef.current.removeAttribute("videoStartAt");
    }
  }, [id, title, poster, paramsString, startSeconds]);

  return React.createElement("lite-youtube", {
    ref: hostRef as unknown as React.Ref<HTMLElement>,
    style: { display: "block" },
    className: className,
    // Set attributes at creation so the web component sees them in connectedCallback.
    // NOTE: do NOT pass `videoStartAt` here — LiteYTEmbed defines it as a getter-only
    // property on its prototype, so React 19's setPropOnCustomElement tries to assign
    // via `element.videoStartAt = …` and throws "only has a getter". The useEffect
    // below sets it via setAttribute, which is what the component reads anyway.
    videoid: id,
    playlabel: title || "Play video",
    poster: poster,
    ...(paramsString ? { params: paramsString } : {}),
  }) as unknown as React.ReactElement;
}


