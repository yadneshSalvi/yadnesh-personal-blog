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
    default:
      return block.name;
  }
}
