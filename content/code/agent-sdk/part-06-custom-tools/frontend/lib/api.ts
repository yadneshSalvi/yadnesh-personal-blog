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
