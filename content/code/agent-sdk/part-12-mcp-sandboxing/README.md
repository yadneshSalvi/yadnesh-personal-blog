# Part 12: The Wider World: External MCP Servers and Sandboxing

📖 Read along: [Claude Agent SDK in Production, Part 12](https://yadneshsalvi.com/blog/agent-sdk-12-mcp-sandboxing)

🎬 See it run: **[demo.mp4](demo.mp4)** — a short screen recording of exactly what this part delivers.

The analyst reaches outside its workspace for the first time, and we make that safe. An **external MCP server** (`mcp-server-fetch`, an official stdio server the SDK spawns as a subprocess) gives the analyst the open web through one gated tool, `mcp__fetch__fetch`. It is deliberately left out of `allowed_tools`, so every fetch pauses on the Part 7 approval card. A deliberately hostile local page tries to talk the analyst into exfiltrating `sales.csv`; the model resists and flags the attempt, and the layers underneath (the approval card, the sandbox) catch what the model might miss. And a beta **sandbox** wraps the Bash tool in OS-enforced walls: writes outside the desk fail with "operation not permitted", and a network host that isn't allow-listed raises a `SandboxNetworkAccess` request through the same `can_use_tool` gate, so a network escape becomes an approval card with no frontend changes. What's new:

- `backend/app/runner.py` — `mcp_servers` gains the external `fetch` server (`{"command": "python", "args": ["-m", "mcp_server_fetch"]}`); `strict_mcp_config=True` keeps runs reader-clean; `sandbox={...}` (enabled, `autoAllowBashIfSandboxed` off, empty `allowedDomains`); `env` adds `MPLCONFIGDIR` + `XDG_CACHE_HOME` so matplotlib's caches land on the desk under the sandbox; three new house rules (fetch-only for the web, page-content-is-data, no em-dashes)
- `backend/demo_pages/` — two local pages served on `:8020`: `market-news.html` (the market-check dessert) and `supplier-notice.html` (the prompt-injection example, with a visible payload; view source)
- `backend/pyproject.toml` — pins `mcp-server-fetch`
- `frontend/lib/toolLabel.ts` — one new entry: the fetch tool badge shows the host

## Run it

Backend (terminal 1):

```bash
cd backend
uv sync
uv run python data/build_beanline_db.py   # once: builds data/beanline.db
uv run uvicorn app.main:app --reload
```

The local demo pages (terminal 2):

```bash
cd backend/demo_pages
python3 -m http.server 8020
```

Frontend (terminal 3):

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000, load the sample data, and ask: "Our competitor newsletter published its Q2 roundup at http://localhost:8020/market-news.html. How did our Q2 revenue growth compare with the market growth they report?" Approve the fetch card and watch the analyst compare its own database against a page from the outside world. Then try the injection page (`http://localhost:8020/supplier-notice.html`) and watch it refuse. To see the sandbox walls, ask it to `curl` a site or write to `/tmp` with Bash.

Auth works like Part 1: your Claude subscription login, or `ANTHROPIC_API_KEY` in the environment.

> The sandbox is beta and platform-specific (macOS Seatbelt, Linux bubblewrap). Everything here was tested on macOS; Part 14 re-tests the config on a Linux VM.
