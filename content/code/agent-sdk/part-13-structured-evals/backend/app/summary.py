"""Part 13: the contract. A machine-consumable summary of every analysis.

The chat reply is for humans. This model is for code: the /summary
surface another service could consume without parsing prose. The SDK
enforces the schema at generation time (output_format json_schema), and
model_validate turns the raw dict back into typed Python on arrival,
so a malformed summary fails loudly at the boundary instead of quietly
downstream.

One lesson carries over from Part 6 verbatim: descriptions are prompts.
The model reads every Field description below while filling the form,
so write them like instructions, not documentation.
"""

from pydantic import BaseModel, Field


class Metric(BaseModel):
    label: str = Field(description="What this number is, e.g. 'March revenue, Downtown'.")
    value: float = Field(
        description="The number itself, from a query result or script output. "
        "Plain digits: no currency symbols, no thousands separators."
    )
    unit: str = Field(description="The unit, e.g. 'USD', '%', 'units'.")


class AnalysisSummary(BaseModel):
    """What every analysis boils down to, as a form instead of an essay."""

    headline: str = Field(description="The finding in one sentence, numbers included.")
    key_metrics: list[Metric] = Field(
        description="Every number the answer depends on, one metric each."
    )
    caveats: list[str] = Field(
        description="Data-quality flags, assumptions made, questions not answered. "
        "Empty list if there are none; never invent one to fill space."
    )
    chart_paths: list[str] = Field(
        description="Workspace-relative paths of chart files created this turn, if any."
    )
