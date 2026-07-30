"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, CircleAlert, Send, Sparkles, Square, UserRound, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Message =
  | { role: "user" | "assistant"; content: string }
  | { role: "tool"; name: string; args: Record<string, unknown>; result: string | null };

type ChatMessage = Extract<Message, { role: "user" | "assistant" }>;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const STARTER_PROMPTS = [
  "What is 23 × 17?",
  "Search for the latest LangGraph release",
  "Find the population of Tokyo",
];

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
        <Sparkles className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-base font-semibold tracking-tight">Lattice</p>
        <p className="truncate text-xs text-muted-foreground">A LangGraph assistant</p>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center px-2 py-10 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 scale-150 rounded-full bg-primary/15 blur-2xl" />
        <div className="relative grid size-16 place-items-center rounded-3xl border border-primary/20 bg-card shadow-xl shadow-primary/10">
          <Wrench className="size-7 text-primary" aria-hidden="true" />
        </div>
      </div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
        Tools connected
      </p>
      <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        Ask for facts, calculations, and more.
      </h1>
      <p className="mt-3 max-w-lg text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
        Watch Lattice choose a tool, show its work, and fold the result into a clear response.
      </p>
      <div className="mt-8 grid w-full gap-2 sm:grid-cols-3">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPick(prompt)}
            className="rounded-2xl border bg-card/70 px-4 py-3 text-left text-sm leading-5 text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatBubble({ message, streaming }: { message: ChatMessage; streaming: boolean }) {
  const isUser = message.role === "user";

  return (
    <article className={`flex items-end gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Bot className="size-4" aria-hidden="true" />
        </div>
      ) : null}
      <div className={`flex max-w-[82%] flex-col sm:max-w-[72%] ${isUser ? "items-end" : "items-start"}`}>
        <p className={`mb-1.5 px-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground ${isUser ? "text-right" : "text-left"}`}>
          {isUser ? "You" : "Lattice"}
        </p>
        <div
          className={
            isUser
              ? "rounded-[1.35rem] rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground shadow-lg shadow-primary/15"
              : "min-h-12 rounded-[1.35rem] rounded-bl-md border bg-card px-4 py-3 text-sm leading-6 shadow-sm"
          }
        >
          {message.content}
          {streaming ? (
            <span className="ml-1 inline-block h-4 w-0.5 animate-pulse rounded-full bg-primary align-middle" aria-hidden="true" />
          ) : null}
        </div>
      </div>
      {isUser ? (
        <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
          <UserRound className="size-4" aria-hidden="true" />
        </div>
      ) : null}
    </article>
  );
}

function ToolCallBubble({ name, args, result }: {
  name: string;
  args: Record<string, unknown>;
  result: string | null;
}) {
  const argText = Object.values(args).join(", ");
  const running = result === null;

  return (
    <article className="flex items-start gap-3">
      <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-amber-500/[0.12] text-amber-600">
        <Wrench className="size-4" aria-hidden="true" />
      </div>
      <div className="w-full max-w-[82%] rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 shadow-sm sm:max-w-[72%]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-600">
            Tool activity
          </p>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={`size-1.5 rounded-full ${running ? "animate-pulse bg-amber-500" : "bg-emerald-500"}`} />
            {running ? "Running" : "Complete"}
          </span>
        </div>
        <code className="block break-all text-xs font-semibold text-foreground">
          {name}({argText})
        </code>
        <p className="mt-2 line-clamp-3 break-all text-xs leading-5 text-muted-foreground" aria-live="polite">
          {running ? "Waiting for the tool result…" : result}
        </p>
      </div>
    </article>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [controller, setController] = useState<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function appendToken(token: string) {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === "assistant") {
        const next = [...prev];
        next[next.length - 1] = { ...last, content: last.content + token };
        return next;
      }
      return [...prev, { role: "assistant", content: token }];
    });
  }

  function startTool(name: string, args: Record<string, unknown>) {
    setMessages((prev) => [...prev, { role: "tool", name, args, result: null }]);
  }

  function endTool(result: string) {
    setMessages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        const message = next[i];
        if (message.role === "tool" && message.result === null) {
          next[i] = { ...message, result };
          break;
        }
      }
      return next;
    });
  }

  function stop() {
    controller?.abort();
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    setController(controller);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const envelope = JSON.parse(part.slice(6));
          if (envelope.type === "token") appendToken(envelope.content);
          else if (envelope.type === "tool_start") startTool(envelope.name, envelope.args);
          else if (envelope.type === "tool_end") endTool(envelope.result);
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Could not reach the backend. Is it running on :8000?");
      }
    } finally {
      setLoading(false);
      setController(null);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden p-3 sm:p-5 lg:p-7">
      <Card className="relative mx-auto flex h-[calc(100dvh-1.5rem)] min-h-[34rem] max-w-6xl flex-col gap-0 overflow-hidden rounded-[1.75rem] border-foreground/10 bg-card/95 py-0 shadow-2xl shadow-slate-950/10 ring-1 ring-foreground/10 backdrop-blur-xl sm:h-[calc(100dvh-2.5rem)] lg:h-[calc(100dvh-3.5rem)]">
        <header className="flex h-20 shrink-0 items-center justify-between border-b px-4 sm:px-7">
          <Brand />
          <div className="flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="size-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15" />
            <span className="hidden sm:inline">2 tools connected</span>
            <span className="sm:hidden">Tools</span>
          </div>
        </header>

        <div
          className="chat-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {messages.length === 0 ? (
            <EmptyState onPick={setInput} />
          ) : (
            <div className="mx-auto w-full max-w-3xl space-y-6">
              {messages.map((message, index) =>
                message.role === "tool" ? (
                  <ToolCallBubble
                    key={`tool-${index}`}
                    name={message.name}
                    args={message.args}
                    result={message.result}
                  />
                ) : (
                  <ChatBubble
                    key={`${message.role}-${index}`}
                    message={message}
                    streaming={loading && message.role === "assistant" && index === messages.length - 1}
                  />
                )
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t bg-card/80 p-3 sm:p-5">
          {error ? (
            <div
              role="alert"
              className="mx-auto mb-3 flex max-w-3xl items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          ) : null}
          <form
            onSubmit={sendMessage}
            className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border bg-background/85 p-2 shadow-lg shadow-slate-950/5 transition focus-within:border-primary/45 focus-within:ring-4 focus-within:ring-primary/10"
          >
            <label htmlFor="chat-message" className="sr-only">
              Message Lattice
            </label>
            <Input
              id="chat-message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Lattice to calculate or search…"
              autoComplete="off"
              disabled={loading}
              className="h-11 flex-1 border-0 bg-transparent px-3 text-sm shadow-none focus-visible:ring-0"
            />
            {loading ? (
              <Button type="button" variant="outline" onClick={stop} aria-label="Stop response" className="h-11 rounded-xl px-4">
                <Square className="size-3.5 fill-current" aria-hidden="true" />
                <span className="hidden sm:inline">Stop</span>
              </Button>
            ) : (
              <Button
                type="submit"
                aria-label="Send message"
                disabled={!input.trim()}
                className="h-11 rounded-xl px-4 shadow-md shadow-primary/20"
              >
                <span className="hidden sm:inline">Send</span>
                <Send className="size-4" aria-hidden="true" />
              </Button>
            )}
          </form>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Tool activity appears inline while your LangGraph workflow runs.
          </p>
        </div>
      </Card>
    </main>
  );
}
