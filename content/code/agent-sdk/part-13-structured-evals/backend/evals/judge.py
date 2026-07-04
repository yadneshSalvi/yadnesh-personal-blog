"""The examiner. A second model call that grades an answer against the
expected facts and returns a STRUCTURED verdict, using the exact same
output_format mechanism the analyst itself uses. Structured outputs
eating their own dog food: a judge that returned prose would need a
judge of its own.

Independence notes, honestly: the judge is also claude-haiku-4-5 (it is
already the cheap model), so what makes it independent is not a
different brain but a different JOB: fresh context, no tools, no
knowledge of how the analyst worked, and a prompt that only compares.
It judges facts, never style. Whether the answer was elegant is not on
the test.
"""

from claude_agent_sdk import ClaudeAgentOptions, ResultMessage, query
from pydantic import BaseModel, Field

JUDGE_MODEL = "claude-haiku-4-5"

JUDGE_PROMPT = """You grade an AI data analyst's answer against known-correct facts.

Pass the answer only if EVERY expected fact is present and numerically
correct, in the prose or in the structured summary. Formatting never
matters: $51,319.60 and 51319.6 and "about $51.3K" all match 51,319.60,
and rounding to one decimal place is fine. A wrong number, a missing
fact, or a contradiction fails. Where an expected fact states its own
tolerance, apply exactly that tolerance.

Judge facts, not style. Extra detail, ordering, tone, length, and
chart choices are all irrelevant. You are checking arithmetic against
ground truth, not reviewing prose."""


class Verdict(BaseModel):
    """The grade, as a form. `failures` is the part you'll actually read."""

    passed: bool = Field(description="True only if every expected fact checks out.")
    failures: list[str] = Field(
        description="One entry per expected fact that is missing or wrong, "
        "quoting what the answer said instead. Empty when passed."
    )


async def judge(question: str, expected: list[str], prose: str, summary: dict | None):
    """Grade one attempt. Returns (Verdict, cost_usd)."""
    prompt = (
        f"QUESTION THE ANALYST WAS ASKED:\n{question}\n\n"
        f"EXPECTED FACTS (ground truth):\n"
        + "\n".join(f"- {fact}" for fact in expected)
        + f"\n\nANALYST'S PROSE ANSWER:\n{prose or '(no prose answer)'}\n\n"
        f"ANALYST'S STRUCTURED SUMMARY:\n{summary or '(none)'}"
    )
    options = ClaudeAgentOptions(
        tools=[],  # the judge compares text; it gets no hands on purpose
        model=JUDGE_MODEL,
        system_prompt=JUDGE_PROMPT,
        output_format={"type": "json_schema", "schema": Verdict.model_json_schema()},
    )
    async for message in query(prompt=prompt, options=options):
        if isinstance(message, ResultMessage):
            verdict = Verdict.model_validate(message.structured_output)
            return verdict, message.total_cost_usd or 0.0
    raise RuntimeError("The judge never returned a verdict.")
