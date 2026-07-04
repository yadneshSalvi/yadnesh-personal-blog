# Part 11: Subagents and Skills: The Analyst Grows a Team

📖 Read along: [Claude Agent SDK in Production, Part 11](https://yadneshsalvi.com/blog/agent-sdk-11-subagents-skills)

🎬 See it run: **[demo.mp4](demo.mp4)** — a short screen recording of exactly what this part delivers.

The analyst is confident, fast, and occasionally decorates correct tables with wrong prose numbers. This part hires it a colleague and hands it the employee handbook. A **reviewer subagent** (`agents={"reviewer": AgentDefinition(...)}` plus the `Task` tool) re-derives key figures in a fresh context with a strictly read-only toolbox: desk searches plus the read-only database tools, no Bash, no Write, so nothing it does needs an approval card. Its work renders as **nested badges** in the transcript via one new optional wire field (`parent_tool_id` on `tool_use_start`). A **skill** (`.claude/skills/beanline-report/SKILL.md`, installed on every desk and discovered via `setting_sources=["project"]` plus the `Skill` tool) carries the house report format, loaded on demand instead of stuffed into every prompt. And yes: the reviewer catches the duplicated March row that has been hiding in the sample data since Part 1. What's new:

- `backend/app/runner.py` — the `REVIEWER` `AgentDefinition` (fresh context, read-only tools, its own grounding rule); `Task` and `Skill` join `tools=`; `agents=`, `setting_sources=["project"]`, and `env={"CLAUDE_CODE_DISABLE_BACKGROUND_TASKS": "1"}` (current CLIs launch subagents in the background by default; a chat turn wants synchronous delegation)
- `backend/app/events.py` — `tool_use_start` forwards `parent_tool_use_id` as `parent_tool_id`; not a new event type, one optional field
- `backend/app/workspaces.py` — every new desk gets `backend/skills/` copied to `.claude/skills/`; the artifact snapshot learns to skip dotted directories
- `backend/skills/beanline-report/SKILL.md` — the house report format: TL;DR, key numbers table, how-it-was-computed, mandatory caveats, sign-off
- `frontend` — nested badges: indent, hairline, and a name tag on any tool call carrying `parent_tool_id`; friendly labels for `Agent` and `Skill` calls

## Run it

Backend (terminal 1):

```bash
cd backend
uv sync
uv run python data/build_beanline_db.py   # once: builds data/beanline.db
uv run uvicorn app.main:app --reload
```

Frontend (terminal 2):

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000, load the sample data, and ask: "How did each store do in March 2026? Write up a report." Watch the `Skill` badge load the house playbook before the report lands in the panel. Then send: "Have the reviewer double-check that report before I send it out." The delegation badge opens, the reviewer's queries nest under it with name tags, and the reply comes back with what an independent set of eyes found, a duplicated sales row included. Refresh mid-review: the nested badges rebuild from Part 9's log.

Auth works like Part 1: your Claude subscription login, or `ANTHROPIC_API_KEY` in the environment.
