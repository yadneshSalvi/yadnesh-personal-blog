"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentEvent, Artifact, Block, ChatMessage } from "@/lib/types";
import { API_BASE, createWorkspace, loadSampleData, uploadFile } from "@/lib/api";
import { readSse } from "@/lib/readSse";
import { Markdown } from "@/components/Markdown";
import { ToolBadge } from "@/components/ToolBadge";
import { Toast } from "@/components/Toast";
import { ArtifactsPanel } from "@/components/ArtifactsPanel";
import { UploadZone } from "@/components/UploadZone";

const SAMPLE_QUESTIONS = [
  "Chart monthly revenue by store and write up what you see.",
  "Which store had the highest revenue in March?",
  "How did each store do in the second quarter?",
];

// One wire event goes in, a new block list comes out. text_delta appends to
// an open text block (or starts one), tool_use_start opens a tool block,
// tool_result completes it BY ID, never by position. Anything else falls
// through untouched; workspace and artifact events are the page's problem,
// not the transcript's.
function applyEvent(blocks: Block[], event: AgentEvent): Block[] {
  if (event.type === "text_delta") {
    const last = blocks[blocks.length - 1];
    if (last?.type === "text") {
      return [...blocks.slice(0, -1), { ...last, text: last.text + event.text }];
    }
    return [...blocks, { type: "text", text: event.text }];
  }
  if (event.type === "tool_use_start") {
    return [
      ...blocks,
      { type: "tool_use", id: event.tool_id, name: event.tool_name, input: event.tool_input, done: false },
    ];
  }
  if (event.type === "tool_result") {
    return blocks.map((b) =>
      b.type === "tool_use" && b.id === event.tool_id
        ? { ...b, result: event.content, isError: event.is_error, done: true }
        : b,
    );
  }
  return blocks;
}

function WorkingTimer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.max(0, Math.round((now - startedAt) / 1000));
  return (
    <div className="mt-2 flex items-center gap-2 text-[13px] text-stone-400 dark:text-stone-500">
      <span className="size-2 animate-pulse rounded-full bg-accent" />
      Working… {seconds}s
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [working, setWorking] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [toast, setToast] = useState<{ message: string; tone?: "error" | "success" } | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  // Follow the conversation as it grows, unless the reader scrolled up
  // to study something; then leave them alone.
  useEffect(() => {
    if (stickRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }
  }, [messages]);

  function patchLastTurn(patch: Partial<Extract<ChatMessage, { role: "assistant" }>>) {
    setMessages((all) => {
      const last = all[all.length - 1];
      if (last?.role !== "assistant") return all;
      return [...all.slice(0, -1), { ...last, ...patch }];
    });
  }

  // The desk is created lazily: the first upload (or the first message)
  // is what mints a workspace, so idle visitors never make folders.
  async function ensureWorkspace(): Promise<string> {
    if (workspaceId) return workspaceId;
    const id = await createWorkspace();
    setWorkspaceId(id);
    return id;
  }

  async function addFiles(list: File[]) {
    if (list.length === 0) return;
    const added: string[] = [];
    let failure: string | null = null;
    try {
      const id = await ensureWorkspace();
      for (const file of list) {
        try {
          added.push((await uploadFile(id, file)).filename);
        } catch (err) {
          failure = (err as Error).message;
        }
      }
    } catch (err) {
      failure = (err as Error).message;
    }
    if (added.length > 0) {
      setFiles((all) => [...new Set([...all, ...added])]);
    }
    setToast(
      failure
        ? { message: failure }
        : {
            message:
              added.length === 1
                ? `${added[0]} is on the analyst's desk.`
                : `${added.length} files are on the analyst's desk.`,
            tone: "success",
          },
    );
  }

  async function loadSample() {
    try {
      const id = await ensureWorkspace();
      const names = await loadSampleData(id);
      setFiles((all) => [...new Set([...all, ...names])]);
      setToast({ message: `Sample data loaded: ${names.join(", ")}.`, tone: "success" });
    } catch (err) {
      setToast({ message: (err as Error).message });
    }
  }

  function recordArtifact(event: Extract<AgentEvent, { type: "artifact_update" }>) {
    const updated: Artifact = {
      path: event.path,
      kind: event.kind,
      size: event.size,
      updatedAt: Date.now(),
    };
    setArtifacts((all) => {
      const i = all.findIndex((a) => a.path === event.path);
      if (i === -1) return [...all, updated];
      return all.map((a, j) => (j === i ? updated : a));
    });
    setSelectedArtifact(event.path); // the panel follows the newest deliverable
  }

  async function send(text: string) {
    const question = text.trim();
    if (!question || working) return;
    setInput("");
    setWorking(true);
    setStartedAt(Date.now());
    setMessages((all) => [
      ...all,
      { role: "user", text: question },
      { role: "assistant", blocks: [], status: "working" },
    ]);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, workspace_id: workspaceId }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`The server said ${res.status}.`);
      let gotReceipt = false;
      for await (const event of readSse(res)) {
        if (event.type === "complete") {
          patchLastTurn({
            status: "done",
            costUsd: event.total_cost_usd ?? undefined,
            durationMs: event.duration_ms,
          });
          setTotalCost((cost) => cost + (event.total_cost_usd ?? 0));
          setWorking(false); // the receipt is in; don't keep offering Stop
          setStartedAt(null);
          gotReceipt = true;
        } else if (event.type === "error") {
          patchLastTurn({ status: "error" });
          setToast({ message: event.message });
          setWorking(false);
          setStartedAt(null);
          gotReceipt = true;
        } else if (event.type === "session_start") {
          // Collect the echo: on a first message with no workspace, the
          // server minted a desk and this is how we learn its id.
          if (event.workspace_id) setWorkspaceId(event.workspace_id);
        } else if (event.type === "artifact_update") {
          recordArtifact(event);
        } else {
          setMessages((all) => {
            const last = all[all.length - 1];
            if (last?.role !== "assistant") return all;
            return [...all.slice(0, -1), { ...last, blocks: applyEvent(last.blocks, event) }];
          });
        }
      }
      // A stream that closes without complete or error is itself a failure.
      if (!gotReceipt) {
        patchLastTurn({ status: "error" });
        setToast({ message: "The stream ended before the agent finished." });
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        patchLastTurn({ status: "stopped" });
      } else {
        patchLastTurn({ status: "error" });
        setToast({ message: "Lost the connection to the server. Is the backend running?" });
      }
    } finally {
      setWorking(false);
      setStartedAt(null);
      abortRef.current = null;
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-stone-200 px-5 py-3 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <span className="size-2.5 rounded-full bg-accent" />
          <h1 className="text-[15px] font-semibold tracking-tight">Beanline Analyst</h1>
        </div>
        {totalCost > 0 && (
          <span className="font-mono text-xs text-stone-400 dark:text-stone-500">
            session cost ${totalCost.toFixed(4)}
          </span>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            ref={scrollRef}
            onScroll={() => {
              const el = scrollRef.current;
              if (el) stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            }}
            className="flex-1 overflow-y-auto"
          >
            <main className="mx-auto w-full max-w-3xl px-5 py-6">
              {messages.length === 0 && (
                <div className="mt-16 flex flex-col items-center text-center">
                  <span className="mb-4 size-3 rounded-full bg-accent" />
                  <h2 className="text-lg font-semibold">Ask the analyst</h2>
                  <p className="mt-1.5 max-w-sm text-sm text-stone-500 dark:text-stone-400">
                    Give it your CSVs, ask questions in plain English, and collect the charts and
                    reports it writes back.
                  </p>
                  <div className="mt-6 flex w-full flex-col items-center gap-3">
                    <UploadZone onFiles={addFiles} />
                    <button
                      type="button"
                      onClick={loadSample}
                      className="text-sm text-accent underline underline-offset-4 hover:opacity-80"
                    >
                      or load the Beanline sample data
                    </button>
                  </div>
                  {files.length > 0 && (
                    <div className="mt-8 flex flex-col gap-2">
                      {SAMPLE_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => send(q)}
                          className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 hover:border-accent hover:text-accent dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((message, i) =>
                message.role === "user" ? (
                  <div key={i} className="mb-5 flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-stone-900 px-4 py-2.5 text-[15px] text-stone-50 dark:bg-stone-100 dark:text-stone-900">
                      {message.text}
                    </p>
                  </div>
                ) : (
                  <div key={i} className="mb-6">
                    {message.blocks.map((block, j) =>
                      block.type === "text" ? (
                        <Markdown key={j} text={block.text} />
                      ) : (
                        <ToolBadge key={block.id} block={block} />
                      ),
                    )}
                    {message.status === "working" && startedAt !== null && (
                      <WorkingTimer startedAt={startedAt} />
                    )}
                    {message.status !== "working" && (
                      <p className="mt-2 font-mono text-xs text-stone-400 dark:text-stone-500">
                        {[
                          message.status === "stopped" ? "stopped" : null,
                          message.status === "error" ? "ended with an error" : null,
                          message.costUsd !== undefined ? `$${message.costUsd.toFixed(4)}` : null,
                          message.durationMs !== undefined
                            ? `${Math.round(message.durationMs / 1000)}s`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                ),
              )}
            </main>
          </div>

          <footer className="border-t border-stone-200 px-5 py-4 dark:border-stone-800">
            {files.length > 0 && (
              <div className="mx-auto mb-2.5 flex w-full max-w-3xl flex-wrap gap-1.5">
                {files.map((f) => (
                  <span
                    key={f}
                    className="rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 font-mono text-[11px] text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
            <form
              className="mx-auto flex w-full max-w-3xl gap-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <label
                title="Add files to the workspace"
                className="flex cursor-pointer items-center rounded-xl border border-stone-200 px-3.5 text-lg leading-none text-stone-400 hover:border-accent hover:text-accent dark:border-stone-800"
              >
                +
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addFiles([...(e.target.files ?? [])]);
                    e.target.value = "";
                  }}
                />
              </label>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your data…"
                className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-[15px] outline-none placeholder:text-stone-400 focus:border-accent dark:border-stone-800 dark:bg-stone-900"
              />
              {working ? (
                <button
                  type="button"
                  onClick={() => abortRef.current?.abort()}
                  className="rounded-xl border border-stone-300 px-5 text-sm font-medium text-stone-600 hover:border-red-400 hover:text-red-600 dark:border-stone-700 dark:text-stone-300"
                >
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="rounded-xl bg-accent px-5 text-sm font-medium text-white disabled:opacity-40"
                >
                  Send
                </button>
              )}
            </form>
          </footer>
        </div>

        {artifacts.length > 0 && workspaceId && (
          <ArtifactsPanel
            workspaceId={workspaceId}
            artifacts={artifacts}
            selected={selectedArtifact}
            onSelect={setSelectedArtifact}
          />
        )}
      </div>

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </div>
  );
}
