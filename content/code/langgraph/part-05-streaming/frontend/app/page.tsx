"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

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
      const next = [...prev];
      const last = next[next.length - 1];
      next[next.length - 1] = { ...last, content: last.content + token };
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

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);
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
          {messages.map((m, i) => (
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
          ))}
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
