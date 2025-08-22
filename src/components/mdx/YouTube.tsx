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
  const queryParams = new URLSearchParams();
  if (typeof start === "number" && start > 0) queryParams.set("start", String(start));
  if (params) {
    for (const part of params.split("&")) {
      const [k, v] = part.split("=");
      if (k) queryParams.set(k, v ?? "");
    }
  }

  const paramsString = queryParams.toString();

  useEffect(() => {
    if (!hostRef.current) return;
    hostRef.current.setAttribute("videoid", id);
    hostRef.current.setAttribute("playlabel", title || "Play video");
    hostRef.current.setAttribute("poster", poster);
    if (paramsString) hostRef.current.setAttribute("params", paramsString);
    // Also set explicit start attribute as supported by lite-youtube
    if (typeof start === "number" && start > 0) {
      hostRef.current.setAttribute("start", String(start));
    } else {
      hostRef.current.removeAttribute("start");
    }
  }, [id, title, poster, paramsString, start]);

  return React.createElement("lite-youtube", {
    ref: hostRef as unknown as React.Ref<HTMLElement>,
    style: { display: "block" },
    className: className,
    // Set attributes at creation so the web component sees them in connectedCallback
    videoid: id,
    playlabel: title || "Play video",
    poster: poster,
    ...(paramsString ? { params: paramsString } : {}),
    ...(typeof start === "number" && start > 0 ? { start: String(start) } : {}),
  }) as unknown as React.ReactElement;
}


