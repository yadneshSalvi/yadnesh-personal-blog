"""Part 6: prove the tool's full name is load-bearing.

Runs the same question twice in default permission mode: once with a
misspelled allowed_tools entry (watch the wall), once spelled right.

    uv run python probe_naming.py
"""

import asyncio

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ResultMessage,
    TextBlock,
    ToolResultBlock,
    UserMessage,
    query,
)

from app.tools import beanline_server

QUESTION = (
    "Use the query_database tool: total revenue in March 2026, all stores, "
    "one number. If the tool is refused twice, stop and say WALL."
)


async def run(label: str, allowed: list[str]) -> None:
    print(f"\n--- allowed_tools={allowed}  ({label}) ---")
    options = ClaudeAgentOptions(
        mcp_servers={"beanline": beanline_server},
        tools=["Read"],
        allowed_tools=allowed,
        permission_mode="default",  # no bypass: the allow list does the work
        model="claude-haiku-4-5",
    )
    async for message in query(prompt=QUESTION, options=options):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    print(block.text)
        elif isinstance(message, UserMessage) and isinstance(message.content, list):
            for block in message.content:
                if isinstance(block, ToolResultBlock) and block.is_error:
                    print(f"  !! {str(block.content)[:100]}")
        elif isinstance(message, ResultMessage):
            print(f"[${message.total_cost_usd:.4f}, {len(message.permission_denials)} denials]")


async def main() -> None:
    await run("one letter missing", ["mcp__beanline__query_databse"])
    await run("spelled right", ["mcp__beanline__query_database"])


asyncio.run(main())
