// The Part 2 wire vocabulary, as TypeScript sees it. One discriminated
// union: switch on `type`, and the compiler knows the payload's shape.
// New in Part 4: session_start carries the workspace id back, and a brand
// new parcel type, artifact_update, announces files the agent made.
// New in Part 7: approval_request pauses a tool call on a human decision,
// and approval_resolved reports which button was pressed (or that nobody
// pressed one in time).
export type AgentEvent =
  | { type: "session_start"; session_id: string; workspace_id?: string }
  | { type: "text_delta"; text: string }
  | {
      type: "tool_use_start";
      tool_id: string;
      tool_name: string;
      tool_input: Record<string, unknown>;
    }
  | { type: "tool_result"; tool_id: string; content: string; is_error: boolean }
  | {
      type: "complete";
      usage: Record<string, unknown>;
      total_cost_usd: number | null;
      duration_ms: number;
    }
  | { type: "error"; message: string }
  | { type: "artifact_update"; path: string; kind: ArtifactKind; size: number }
  | {
      type: "approval_request";
      approval_id: string;
      tool_id: string | null;
      tool_name: string;
      tool_input: Record<string, unknown>;
    }
  | {
      type: "approval_resolved";
      approval_id: string;
      decision: "allow" | "deny";
      reason: "user" | "timeout";
    };

export type ArtifactKind = "image" | "markdown" | "file";

// One deliverable on the desk, as the panel tracks it. updatedAt is client
// time, kept so an overwritten report.md re-fetches instead of caching.
export type Artifact = {
  path: string;
  kind: ArtifactKind;
  size: number;
  updatedAt: number;
};

// What the UI renders. An assistant turn is a SEQUENCE OF BLOCKS, prose and
// tool calls interleaved in the order they happened, same as the SDK's own
// content blocks.
export type TextBlock = { type: "text"; text: string };

export type ToolBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: string;
  isError?: boolean;
  done: boolean;
};

// A paused tool call waiting for a human verdict. Born pending, resolved
// in place when approval_resolved arrives, exactly like a ToolBlock's
// spinner-to-verdict lifecycle.
export type ApprovalBlock = {
  type: "approval";
  id: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  status: "pending" | "allowed" | "denied";
  reason?: "user" | "timeout";
};

export type Block = TextBlock | ToolBlock | ApprovalBlock;

export type ChatMessage =
  | { role: "user"; text: string }
  | {
      role: "assistant";
      blocks: Block[];
      status: "working" | "done" | "error" | "stopped";
      costUsd?: number;
      durationMs?: number;
    };
