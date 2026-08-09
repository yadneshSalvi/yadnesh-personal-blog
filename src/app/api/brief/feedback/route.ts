// GET /api/brief/feedback?issue=&type=&vote=up|down&token=
//
// The two thumbs in every issue footer. It is a GET because it is a link in an
// email, and the token binds the vote to one reader and one issue, so the
// tally cannot be moved by anyone who did not get that issue.

import { getStore } from "@/lib/brief/store";
import { verifyBriefToken } from "@/lib/brief/tokens";
import { archiveUrl, issueWebUrl, siteBaseUrl } from "@/lib/brief/urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function page(input: { title: string; body: string; href: string; linkLabel: string }) {
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${input.title} · The Agentic Brief</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; background:#f1efe9; color:#1f1c19; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; line-height:1.6; }
  main { max-width:32rem; margin:0 auto; padding:4rem 1.5rem; }
  .kicker { font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; color:#8f887a; margin:0 0 1rem; }
  h1 { font-size:1.6rem; line-height:1.25; margin:0 0 1rem; font-weight:600; }
  p { margin:0 0 1rem; color:#5b554c; }
  a { color:#b3441a; }
  @media (prefers-color-scheme: dark) {
    body { background:#1d1a17; color:#ebe7df; }
    p { color:#a49c90; }
    a { color:#e5825a; }
  }
</style>
</head><body><main>
<p class="kicker">The Agentic Brief</p>
<h1>${input.title}</h1>
<p>${input.body}</p>
<p><a href="${input.href}">${input.linkLabel}</a></p>
</main></body></html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}

export async function GET(request: Request) {
  const base = siteBaseUrl(request);
  const params = new URL(request.url).searchParams;
  const id = params.get("issue") ?? "";
  const rawType = params.get("type");
  const vote = params.get("vote");
  const token = params.get("token");

  const type = rawType === "daily" || rawType === "weekly" ? rawType : null;
  const back = type && id ? issueWebUrl(base, type, id) : archiveUrl(base);

  if (!type || !id || (vote !== "up" && vote !== "down")) {
    return page({
      title: "That link is incomplete",
      body: "The vote didn't come through. The issue itself is still where you left it.",
      href: back,
      linkLabel: "Read the issue on the web",
    });
  }

  const verified = verifyBriefToken(token, { purpose: "feedback" });
  // The scope pins the token to one issue, so a link from Monday cannot vote on
  // Tuesday.
  if (!verified.ok || verified.payload.scope !== `${type}/${id}`) {
    return page({
      title: "That link isn't valid",
      body: "It may have expired, or it belongs to a different issue. Either way, nothing was recorded.",
      href: back,
      linkLabel: "Read the issue on the web",
    });
  }

  const store = getStore();
  if (!store) {
    return page({
      title: "Feedback isn't wired up yet",
      body: "Your vote didn't record. That's on me, not on you.",
      href: back,
      linkLabel: "Read the issue on the web",
    });
  }

  try {
    const result = await store.recordFeedbackVote({
      type,
      id,
      email: verified.payload.subject,
      vote,
    });
    return page({
      title: result.counted ? "Noted, thank you" : "You already voted on this one",
      body: result.counted
        ? vote === "up"
          ? "Logged as a good issue. This is the one signal about quality that open rates can't fake."
          : "Logged as a miss. If you have ten seconds, reply to the issue and tell me what was wrong."
        : "One vote per issue. The first one still counts.",
      href: back,
      linkLabel: "Read the issue on the web",
    });
  } catch (error) {
    console.error("[brief] feedback vote failed", error);
    return page({
      title: "That didn't record",
      body: "Something broke on my side. The issue is still on the web.",
      href: back,
      linkLabel: "Read the issue on the web",
    });
  }
}
