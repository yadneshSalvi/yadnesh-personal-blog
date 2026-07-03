// The Part 2 wire vocabulary, as TypeScript sees it. One discriminated
// union: switch on `type`, and the compiler knows the payload's shape.
export type AgentEvent =
  | { type: "session_start"; session_id: string }
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
  | { type: "error"; message: string };

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

export type Block = TextBlock | ToolBlock;

export type ChatMessage =
  | { role: "user"; text: string }
  | {
      role: "assistant";
      blocks: Block[];
      status: "working" | "done" | "error" | "stopped";
      costUsd?: number;
      durationMs?: number;
    };
