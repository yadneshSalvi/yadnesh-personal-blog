import asyncio

from claude_agent_sdk import query


async def main():
    async for message in query(prompt="What's 144 * 89?"):
        print(message)


asyncio.run(main())
