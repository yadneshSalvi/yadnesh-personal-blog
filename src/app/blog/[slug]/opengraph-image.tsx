import { ImageResponse } from "next/og";
import { getAllPostSlugs, getPostMetaBySlug } from "@/lib/posts";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Yadnesh Salvi — Notes on AI Engineering";

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

// Ink-and-paper brand tokens (from src/app/globals.css :root)
const PAPER = "#faf9f6";
const INK = "#1f1c19";
const MUTED = "#5b554c";
const FAINT = "#8f887a";
const LINE = "#e7e3d9";
const ACCENT = "#b3441a";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = getPostMetaBySlug(slug);
  const title = meta?.title ?? "Yadnesh Salvi";
  const subtitle = meta?.subtitle ?? meta?.description ?? "Notes on AI Engineering";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: PAPER,
          color: INK,
          borderTop: `12px solid ${ACCENT}`,
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: FAINT,
            fontWeight: 600,
          }}
        >
          Yadnesh Salvi · Notes on AI Engineering
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 64, lineHeight: 1.12, fontWeight: 700 }}>{title}</div>
          {subtitle ? (
            <div style={{ fontSize: 30, lineHeight: 1.3, color: MUTED }}>{subtitle}</div>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, color: FAINT }}>
          <div style={{ width: 14, height: 14, borderRadius: 9999, background: ACCENT }} />
          <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 0 }}>yadneshsalvi.com</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
