"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Message =
  | { role: "user" | "assistant"; content: string }
  | { role: "tool"; name: string; args: Record<string, unknown>; result: string | null };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

function ToolCallBubble({ name, args, result }: {
  name: string;
  args: Record<string, unknown>;
  result: string | null;
}) {
  const argText = Object.values(args).join(", ");
  return (
    <div className="text-left">
      <span className="inline-flex max-w-[75%] flex-col gap-0.5 rounded-xl border border-dashed px-3 py-2 font-mono text-xs text-muted-foreground">
        <span className="text-foreground">
          <span className="font-semibold">{name}</span>({argText})
        </span>
        <span className="line-clamp-3 break-all">{result === null ? "running…" : `→ ${result}`}</span>
      </span>
    </div>
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
        const m = next[i];
        if (m.role === "tool" && m.result === null) {
          next[i] = { ...m, result };
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
    <main className="mx-auto flex h-dvh max-w-2xl flex-col p-4">
      <Card className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b px-5 py-4 font-semibold">Chatbot</div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) =>
            m.role === "tool" ? (
              <ToolCallBubble key={i} name={m.name} args={m.args} result={m.result} />
            ) : (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <span className={`inline-block max-w-[75%] rounded-2xl px-4 py-2 ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  {m.content}
                  {loading && m.role === "assistant" && i === messages.length - 1 && (
                    <span className="ml-0.5 animate-pulse">▍</span>
                  )}
                </span>
              </div>
            )
          )}
          <div ref={bottomRef} />
        </div>
        {error && (
          <p className="mx-5 mb-2 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <form onSubmit={sendMessage} className="flex gap-2 border-t p-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={loading}
          />
          {loading ? (
            <Button type="button" variant="outline" onClick={stop}>
              Stop
            </Button>
          ) : (
            <Button type="submit">Send</Button>
          )}
        </form>
      </Card>
    </main>
  );
}
