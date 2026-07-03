# Part 7: Conversation Memory

📖 Read along: [LangGraph from Scratch, Part 7](https://yadneshsalvi.com/blog/langgraph-7-memory)

What changed since Part 6:

- `graph.py` — `builder.compile(checkpointer=InMemorySaver())`: the graph saves and reloads its own state per thread
- `main.py` — `ChatRequest` gains `thread_id`; the id is passed to the graph as `config={"configurable": {"thread_id": ...}}`; plus a stretch endpoint `GET /threads/{id}/messages` that reads a conversation back out of the checkpointer
- `page.tsx` — a `thread_id` minted with `crypto.randomUUID()` and kept in `localStorage`, a "+ New chat" button, and a sidebar of past chats you can reopen

## Run it

Same setup as Part 6 (both keys). Then:

1. Tell it *"My name is Alex."*
2. Ask *"What's my name?"* — it remembers.
3. Click **+ New chat** and ask again — the fresh thread has no idea. Two separate notebooks.

Heads-up from the post: `InMemorySaver` lives in the process's RAM. Restart the server and every conversation is gone — that's Part 8's closing lesson.
