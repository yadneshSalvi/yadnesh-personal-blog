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
