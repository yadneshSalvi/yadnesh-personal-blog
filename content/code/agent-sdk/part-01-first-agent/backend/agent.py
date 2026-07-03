"""Part 1: a terminal data analyst. Ask it a question, watch it work."""

import asyncio
import sys

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ResultMessage,
    SystemMessage,
    TextBlock,
    ToolResultBlock,
    ToolUseBlock,
    UserMessage,
    query,
)

MODEL = "claude-haiku-4-5"

OPTIONS = ClaudeAgentOptions(
    cwd="workspace",
    tools=["Read", "Glob", "Grep", "Bash", "Write"],
    permission_mode="bypassPermissions",
    model=MODEL,
)


def first_value(tool_input: dict) -> str:
    """One short line describing a tool call, e.g. the command or file path."""
    return next((str(v) for v in tool_input.values() if v), "")[:90]


async def main(prompt: str) -> None:
    async for message in query(prompt=prompt, options=OPTIONS):
        if isinstance(message, SystemMessage) and message.subtype == "init":
            print(f"[session {message.data['session_id']}]\n")
        elif isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    print(block.text)
                elif isinstance(block, ToolUseBlock):
                    print(f"  -> {block.name}  {first_value(block.input)}")
        elif isinstance(message, UserMessage) and isinstance(message.content, list):
            for block in message.content:
                if isinstance(block, ToolResultBlock) and block.is_error:
                    print(f"  !! {str(block.content)[:120]}")
        elif isinstance(message, ResultMessage):
            print(f"\n[{message.num_turns} turns · ${message.total_cost_usd:.4f}]")


if __name__ == "__main__":
    question = " ".join(sys.argv[1:]) or (
        "Which store had the highest total revenue in March? Give the store's "
        "name, and how much it beat the runner-up by."
    )
    asyncio.run(main(question))
