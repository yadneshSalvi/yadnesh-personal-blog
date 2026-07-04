"""The driving test. Runs every case in cases.yaml against the REAL
analyst: same build_options the app ships, same system prompt, same
tools, same sandbox. The only substitutions are a robot at the approval
gate (the suite runs unattended on a desk it can burn down) and a
throwaway workspace per attempt.

Run it from backend/:  uv run python -m evals.run --attempts 3

What production adds on top of this shape: suites and cases as database
rows, per-attempt timeouts and heartbeats, stored judge transcripts,
and trend lines across runs. Same skeleton, more furniture.
"""

import argparse
import asyncio
import json
import shutil
import time
from dataclasses import asdict, dataclass
from pathlib import Path

import yaml
from claude_agent_sdk import (
    AssistantMessage,
    ClaudeSDKClient,
    PermissionResultAllow,
    ResultMessage,
    TextBlock,
)

from app.runner import build_options
from app.workspaces import create_workspace, workspace_path
from evals.judge import judge

# The prepaid meter, doing eval duty: an attempt that spends more than
# this is a failure in itself, and the cap keeps a misbehaving prompt
# from turning a suite run into a bill.
ATTEMPT_BUDGET_USD = 0.15

RUNS_DIR = Path(__file__).parent / "runs"


async def robot_approver(tool_name, tool_input, context):
    """The suite's stand-in for your Approve click. It can say yes to
    everything because eval cases are known questions on deterministic
    data, in throwaway workspaces, with the sandbox still on."""
    return PermissionResultAllow()


@dataclass
class Attempt:
    case_id: str
    passed: bool
    failures: list[str]
    agent_cost_usd: float
    judge_cost_usd: float
    duration_s: float
    stop: str  # ResultMessage.subtype: success, error_max_budget_usd, ...


async def run_attempt(case: dict, semaphore: asyncio.Semaphore) -> Attempt:
    """One case, one fresh desk, one real agent run, one graded verdict."""
    async with semaphore:
        workspace = workspace_path(create_workspace())
        client = ClaudeSDKClient(
            options=build_options(
                workspace, None, robot_approver, budget_usd=ATTEMPT_BUDGET_USD
            )
        )
        prose: list[str] = []
        summary, cost, stop = None, 0.0, "unknown"
        started = time.monotonic()
        try:
            await client.connect()
            await client.query(case["question"])
            async for message in client.receive_response():
                # Main-agent text only: a subagent's words carry
                # parent_tool_use_id, and the judge grades the answer
                # the user would have seen.
                if isinstance(message, AssistantMessage) and not message.parent_tool_use_id:
                    prose += [b.text for b in message.content if isinstance(b, TextBlock)]
                elif isinstance(message, ResultMessage):
                    summary = message.structured_output
                    cost = message.total_cost_usd or 0.0
                    stop = message.subtype
        finally:
            await client.disconnect()
            shutil.rmtree(workspace, ignore_errors=True)
        duration = time.monotonic() - started
        verdict, judge_cost = await judge(
            case["question"], case["expected"], "\n".join(prose), summary
        )
        return Attempt(
            case_id=case["id"],
            passed=verdict.passed,
            failures=verdict.failures,
            agent_cost_usd=cost,
            judge_cost_usd=judge_cost,
            duration_s=round(duration, 1),
            stop=stop,
        )


def report(attempts: list[Attempt], wall_s: float, label: str) -> None:
    """The pass-rate table, plus a JSON copy in evals/runs/ for trends."""
    by_case: dict[str, list[Attempt]] = {}
    for attempt in attempts:
        by_case.setdefault(attempt.case_id, []).append(attempt)
    width = max(len(case_id) for case_id in by_case)
    print(f"\n{'case'.ljust(width)}  pass   agent $  notes")
    for case_id, tries in by_case.items():
        passed = sum(t.passed for t in tries)
        cost = sum(t.agent_cost_usd for t in tries)
        note = next((t.failures[0] for t in tries if t.failures), "")
        note = note if len(note) <= 72 else note[:69] + "..."
        print(f"{case_id.ljust(width)}  {passed}/{len(tries)}    {cost:.4f}   {note}")
    total_passed = sum(a.passed for a in attempts)
    agent_cost = sum(a.agent_cost_usd for a in attempts)
    judge_cost = sum(a.judge_cost_usd for a in attempts)
    rate = 100 * total_passed / len(attempts)
    print(
        f"\nsuite  {total_passed}/{len(attempts)} passed ({rate:.0f}%)"
        f" · agent ${agent_cost:.4f} · judge ${judge_cost:.4f}"
        f" · {wall_s:.0f}s wall"
    )
    RUNS_DIR.mkdir(exist_ok=True)
    out = RUNS_DIR / f"{label or time.strftime('%Y%m%d-%H%M%S')}.json"
    out.write_text(json.dumps([asdict(a) for a in attempts], indent=2))
    print(f"written: {out}")


async def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Beanline eval suite.")
    parser.add_argument("--attempts", type=int, default=3, help="attempts per case")
    parser.add_argument("--concurrency", type=int, default=3, help="parallel agents")
    parser.add_argument("--label", default="", help="name for the saved results file")
    args = parser.parse_args()
    cases = yaml.safe_load((Path(__file__).parent / "cases.yaml").read_text())
    semaphore = asyncio.Semaphore(args.concurrency)
    started = time.monotonic()
    attempts = await asyncio.gather(
        *[run_attempt(case, semaphore) for case in cases for _ in range(args.attempts)]
    )
    report(list(attempts), time.monotonic() - started, args.label)


if __name__ == "__main__":
    asyncio.run(main())
