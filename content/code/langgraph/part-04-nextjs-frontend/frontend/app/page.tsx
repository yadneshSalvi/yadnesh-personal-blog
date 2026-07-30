"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, CircleAlert, Send, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const STARTER_PROMPTS = [
  "Explain recursion in one sentence",
  "Give me a small Python project idea",
  "What makes LangGraph useful?",
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
          <Bot className="size-7 text-primary" aria-hidden="true" />
        </div>
      </div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
        Your first conversation
      </p>
      <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        What can we figure out together?
      </h1>
      <p className="mt-3 max-w-lg text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
        Ask a question and your message will travel through FastAPI to the LangGraph workflow you built.
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

function ChatBubble({ message }: { message: Message }) {
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
              : "rounded-[1.35rem] rounded-bl-md border bg-card px-4 py-3 text-sm leading-6 shadow-sm"
          }
        >
          {message.content}
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

function ThinkingBubble() {
  return (
    <div className="flex items-end gap-3" aria-label="Lattice is thinking">
      <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Bot className="size-4" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-1.5 rounded-[1.35rem] rounded-bl-md border bg-card px-4 py-4 shadow-sm">
        <span className="typing-dot size-1.5 rounded-full bg-primary" />
        <span className="typing-dot size-1.5 rounded-full bg-primary" />
        <span className="typing-dot size-1.5 rounded-full bg-primary" />
      </div>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Could not reach the backend. Is it running on :8000?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden p-3 sm:p-5 lg:p-7">
      <Card className="relative mx-auto flex h-[calc(100dvh-1.5rem)] min-h-[34rem] max-w-6xl flex-col gap-0 overflow-hidden rounded-[1.75rem] border-foreground/10 bg-card/95 py-0 shadow-2xl shadow-slate-950/10 ring-1 ring-foreground/10 backdrop-blur-xl sm:h-[calc(100dvh-2.5rem)] lg:h-[calc(100dvh-3.5rem)]">
        <header className="flex h-20 shrink-0 items-center justify-between border-b px-4 sm:px-7">
          <Brand />
          <div className="flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="size-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15" />
            <span className="hidden sm:inline">Local workspace</span>
            <span className="sm:hidden">Local</span>
          </div>
        </header>

        <div
          className="chat-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {messages.length === 0 && !loading ? (
            <EmptyState onPick={setInput} />
          ) : (
            <div className="mx-auto w-full max-w-3xl space-y-6">
              {messages.map((message, index) => (
                <ChatBubble key={`${message.role}-${index}`} message={message} />
              ))}
              {loading ? <ThinkingBubble /> : null}
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
              placeholder="Message Lattice…"
              autoComplete="off"
              disabled={loading}
              className="h-11 flex-1 border-0 bg-transparent px-3 text-sm shadow-none focus-visible:ring-0"
            />
            <Button
              type="submit"
              aria-label="Send message"
              disabled={loading || !input.trim()}
              className="h-11 rounded-xl px-4 shadow-md shadow-primary/20"
            >
              <span className="hidden sm:inline">Send</span>
              <Send className="size-4" aria-hidden="true" />
            </Button>
          </form>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Answers are generated by your local LangGraph workflow.
          </p>
        </div>
      </Card>
    </main>
  );
}
