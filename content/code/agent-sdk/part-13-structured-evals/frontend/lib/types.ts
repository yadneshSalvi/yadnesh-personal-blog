// The Part 2 wire vocabulary, as TypeScript sees it. One discriminated
// union: switch on `type`, and the compiler knows the payload's shape.
// New in Part 4: session_start carries the workspace id back, and a brand
// new parcel type, artifact_update, announces files the agent made.
// New in Part 7: approval_request pauses a tool call on a human decision,
// and approval_resolved reports which button was pressed (or that nobody
// pressed one in time).
// New in Part 10, three parcels for a negotiating analyst: thinking_delta
// streams the model's scratchpad, plan_proposed carries a plan the agent
// wants sign-off on, and question_request/question_resolved run the
// approval lifecycle with friendlier cargo: structured questions out,
// picked answers back.
// New in Part 11: not a new parcel, one new OPTIONAL field. A
// tool_use_start may carry parent_tool_id, the id of the delegation call
// whose subagent made it; clients that ignore it keep working.
// New in Part 13, and LAST: complete may carry structured_output (the
// machine-readable summary of the whole analysis) and stop_reason (why a
// capped run ended early). The vocabulary is finished; this union is the
// complete wire format of the product.
export type AgentEvent =
  | { type: "session_start"; session_id: string; workspace_id?: string }
  | { type: "text_delta"; text: string }
  | { type: "thinking_delta"; text: string }
  | {
      type: "tool_use_start";
      tool_id: string;
      tool_name: string;
      tool_input: Record<string, unknown>;
      parent_tool_id?: string;
    }
  | { type: "tool_result"; tool_id: string; content: string; is_error: boolean }
  | {
      type: "complete";
      usage: Record<string, unknown>;
      total_cost_usd: number | null;
      duration_ms: number;
      structured_output?: AnalysisSummary;
      stop_reason?: "max_budget" | "max_turns";
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
    }
  | { type: "plan_proposed"; plan_id: string; markdown: string }
  | {
      type: "question_request";
      question_id: string;
      tool_id: string | null;
      questions: Question[];
    }
  | {
      type: "question_resolved";
      question_id: string;
      answers: Answers | null;
      reason: "user" | "timeout";
    };

export type ArtifactKind = "image" | "markdown" | "file";

// Part 13: the analysis summary, mirroring backend/app/summary.py field
// for field. This is the shape other CODE consumes; the UI just happens
// to be the first consumer.
export type Metric = { label: string; value: number; unit: string };

export type AnalysisSummary = {
  headline: string;
  key_metrics: Metric[];
  caveats: string[];
  chart_paths: string[];
};

// One structured question, exactly as AskUserQuestion shapes it: the
// question text, a short header for the chip row, options with labels
// and one-line descriptions, and whether several picks are allowed.
export type Question = {
  question: string;
  header: string;
  options: { label: string; description?: string }[];
  multiSelect: boolean;
};

// Answers ride back keyed by the question text: one label, or a list of
// labels when multiSelect was true.
export type Answers = Record<string, string | string[]>;

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

// The scratchpad: rendered collapsed, expanded on click. It has no id
// because it never resolves; it just accumulates, then stops.
export type ThinkingBlock = { type: "thinking"; text: string };

export type ToolBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: string;
  isError?: boolean;
  done: boolean;
  // Part 11: set when this call was made by a subagent. parentId is the
  // delegation call's own tool id; agentName is the roster name looked up
  // from that call's input, so the badge can say who's working.
  parentId?: string;
  agentName?: string;
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

// The agent's question, waiting on your chips. Same lifecycle as an
// approval card; the resolution carries data instead of a verdict.
export type QuestionBlock = {
  type: "question";
  id: string;
  questions: Question[];
  status: "pending" | "answered" | "unanswered";
  answers?: Answers | null;
};

// A proposed plan. It arrives settled (the agent already stopped); the
// buttons under it write the NEXT message, they don't resolve this one.
export type PlanBlock = {
  type: "plan";
  id: string;
  markdown: string;
  settled?: boolean;
};

export type Block =
  | TextBlock
  | ThinkingBlock
  | ToolBlock
  | ApprovalBlock
  | QuestionBlock
  | PlanBlock;

export type ChatMessage =
  | { role: "user"; text: string }
  | {
      role: "assistant";
      blocks: Block[];
      status: "working" | "done" | "error" | "stopped";
      costUsd?: number;
      durationMs?: number;
      // Part 13: the turn's machine-readable summary, and the reason a
      // capped run stopped early (absent on a clean finish).
      summary?: AnalysisSummary;
      stopReason?: "max_budget" | "max_turns";
    };
