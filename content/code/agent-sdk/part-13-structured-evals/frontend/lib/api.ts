// The workspace API, client side: four small calls and a URL builder.
// Every function throws an Error with the server's own words on failure,
// so the caller can put them straight into a toast.

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function fail(res: Response, fallback: string): Promise<never> {
  const detail = (await res.json().catch(() => null))?.detail;
  throw new Error(typeof detail === "string" ? detail : fallback);
}

export async function createWorkspace(): Promise<string> {
  const res = await fetch(`${API_BASE}/workspaces`, { method: "POST" });
  if (!res.ok) await fail(res, "Could not create a workspace.");
  return (await res.json()).workspace_id;
}

export async function uploadFile(
  workspaceId: string,
  file: File,
): Promise<{ filename: string; size: number }> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/files`, {
    method: "POST",
    body,
  });
  if (!res.ok) await fail(res, `Upload of ${file.name} failed.`);
  return res.json();
}

export async function loadSampleData(workspaceId: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/sample-data`, {
    method: "POST",
  });
  if (!res.ok) await fail(res, "Could not load the sample data.");
  return (await res.json()).filenames;
}

// Where a workspace file lives, for <img> tags and fetches. The t query
// param is a cache-buster: report.md keeps its name across rewrites.
export function fileUrl(workspaceId: string, path: string, t?: number): string {
  const stamp = t ? `?t=${t}` : "";
  return `${API_BASE}/workspaces/${workspaceId}/files/${path}${stamp}`;
}

// --- Part 5: conversations, straight from the SDK's session store ---

export type Conversation = {
  session_id: string;
  workspace_id: string;
  title: string;
  last_modified: number; // epoch milliseconds
};

export type WorkspaceFile = {
  path: string;
  kind: "image" | "markdown" | "file";
  size: number;
};

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/conversations`);
  if (!res.ok) await fail(res, "Could not load conversations.");
  return (await res.json()).conversations;
}

export async function fetchConversation(
  workspaceId: string,
  sessionId: string,
): Promise<{ messages: unknown[]; files: WorkspaceFile[] }> {
  const res = await fetch(`${API_BASE}/conversations/${workspaceId}/${sessionId}`);
  if (!res.ok) await fail(res, "Could not load that conversation.");
  return res.json();
}

export async function renameConversation(
  workspaceId: string,
  sessionId: string,
  title: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/conversations/${workspaceId}/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) await fail(res, "Rename failed.");
}

export async function forkConversation(
  workspaceId: string,
  sessionId: string,
): Promise<{ session_id: string; workspace_id: string }> {
  const res = await fetch(`${API_BASE}/conversations/${workspaceId}/${sessionId}/fork`, {
    method: "POST",
  });
  if (!res.ok) await fail(res, "Could not duplicate the conversation.");
  return res.json();
}

// --- Part 9: the decoupled chat flow ---

// POST /chat no longer streams; it returns a claim ticket. The stream
// itself is a plain GET, which is exactly what lets EventSource own it.
export type ChatTicket = {
  request_id: string;
  workspace_id: string;
  stream_url: string;
};

export async function startChat(
  message: string,
  workspaceId: string | null,
  sessionId: string | null,
  mode: "ask" | "plan" = "ask",
  thinking = false,
  budgetUsd: number | null = null, // Part 13: the prepaid meter, per request
): Promise<ChatTicket> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      workspace_id: workspaceId,
      session_id: sessionId,
      mode,
      thinking,
      budget_usd: budgetUsd,
    }),
  });
  if (!res.ok) await fail(res, "Could not start the analysis.");
  return res.json();
}

// The real Stop button: asks the SERVER to interrupt the worker. The
// stream stays open; the receipt for the stopped turn arrives on it.
export async function cancelChat(requestId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/chat/${requestId}/cancel`, {
    method: "POST",
  });
  if (!res.ok) await fail(res, "That run is not running anymore.");
}

export async function decideApproval(
  approvalId: string,
  decision: "allow" | "deny",
  always: boolean,
): Promise<void> {
  const res = await fetch(`${API_BASE}/approvals/${approvalId}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, always }),
  });
  if (!res.ok) await fail(res, "That approval is no longer pending.");
}

// --- Part 10: the question bridge's human half ---

// Answers keyed by question text, exactly what AskUserQuestion wants back.
export async function answerQuestion(
  questionId: string,
  answers: Record<string, string | string[]>,
): Promise<void> {
  const res = await fetch(`${API_BASE}/questions/${questionId}/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) await fail(res, "That question is no longer waiting.");
}
