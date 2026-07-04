---
name: beanline-report
description: The Beanline house format for written reports. Load this before writing report.md or any findings document for the user.
---

# The Beanline house report format

Every report.md follows this structure, in this order:

1. Title line: `# Beanline analysis: <topic in a few words>`
2. `**TL;DR:**` one bold sentence carrying the single most important number.
3. `## Key numbers`: a markdown table of metric and value. Format currency
   as $1,234.56: dollar sign, thousands separators, two decimals.
4. `## How this was computed`: one bullet per data source, naming the tool
   (database query or file) and the operation, so a colleague could redo it.
5. `## Caveats`: always present. List the data-quality issues you noticed
   (duplicate rows, gaps, outliers). Write "None found" only if you
   actually checked for them.
6. Last line, exactly: `Prepared by the Beanline analyst.`

Chart conventions: PNG at dpi=150, headline-style titles, labeled axes
with units, no gridlines, one chart per file.
