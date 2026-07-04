import type { ToolBlock } from "./types";

function str(input: Record<string, unknown>, key: string): string {
  return typeof input[key] === "string" ? (input[key] as string) : "";
}

function basename(path: string): string {
  return path.split("/").pop() || path;
}

// One friendly line per tool call for the collapsed badge. The default
// branch matters most: a tool this map has never heard of still renders
// as its name, so new tools in later parts appear here without edits.
export function toolLabel(block: ToolBlock): string {
  const { input } = block;
  switch (block.name) {
    case "Read":
      return `Reading ${basename(str(input, "file_path"))}`;
    case "Write":
      return `Writing ${basename(str(input, "file_path"))}`;
    case "Glob":
      return `Finding files: ${str(input, "pattern")}`;
    case "Grep":
      return `Searching for "${str(input, "pattern")}"`;
    case "Bash":
      return str(input, "description") || `Running: ${str(input, "command")}`;
    // Part 11: the delegation call (the SDK's tool_use for Task arrives
    // named "Agent") and the skill loader get friendly lines too.
    case "Agent":
    case "Task":
      return `Delegating to the ${str(input, "subagent_type")}: ${str(input, "description")}`;
    case "Skill":
      return `Reading the ${str(input, "skill") || "house"} playbook`;
    default: {
      // Custom tools arrive as mcp__<server>__<tool>. Give ours real
      // labels; any future MCP tool still gets a readable fallback.
      const mcp = block.name.match(/^mcp__(.+?)__(.+)$/);
      if (mcp?.[2] === "query_database") return `Querying the ${mcp[1]} database`;
      if (mcp?.[2] === "get_schema") return `Reading the ${mcp[1]} schema`;
      if (mcp) return `${mcp[1]}: ${mcp[2].replaceAll("_", " ")}`;
      return block.name;
    }
  }
}
