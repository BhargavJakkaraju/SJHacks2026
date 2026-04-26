"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspaceStore } from "@/store/workspace";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "What do you see in my sketch?",
  "What could I add to improve this?",
  "Suggest some scenery ideas",
  "How should I develop this further?",
];

export default function ChatSidebar() {
  const getCanvasDataURL = useWorkspaceStore((s) => s.getCanvasDataURL);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const sketchDataUrl = getCanvasDataURL?.() ?? null;
    const userMessage: Message = { role: "user", content: trimmed };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    setStreaming(true);

    // Placeholder for the streaming assistant reply
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, sketchDataUrl }),
      });

      if (!res.ok || !res.body) {
        const err = await res.text();
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: `Error: ${err}` },
        ]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: accumulated },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: `Failed to reach Bloom AI: ${String(e)}` },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-md backdrop-blur-md flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-wide text-white/70 uppercase">
        Bloom AI
      </h2>

      {/* Message thread */}
      <div className="h-48 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-3 flex flex-col gap-2 text-sm">
        {messages.length === 0 && (
          <p className="text-white/30 text-xs text-center mt-4">
            Ask me about your sketch or 3D scene
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "self-end max-w-[80%] rounded-2xl rounded-br-sm bg-blue-600/80 px-3 py-2 text-white"
                : "self-start max-w-[85%] rounded-2xl rounded-bl-sm bg-white/10 px-3 py-2 text-white/90 whitespace-pre-wrap"
            }
          >
            {m.content}
            {m.role === "assistant" && m.content === "" && (
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: "120ms" }}>·</span>
                <span className="animate-bounce" style={{ animationDelay: "240ms" }}>·</span>
              </span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestion chips */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              disabled={streaming}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder="Ask about your sketch…"
          disabled={streaming}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-500/50 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => send(input)}
          disabled={streaming || !input.trim()}
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-500 disabled:opacity-40"
          style={{ boxShadow: "0 0 10px 1px rgba(59,130,246,0.4)" }}
        >
          Send
        </button>
      </div>
    </aside>
  );
}
