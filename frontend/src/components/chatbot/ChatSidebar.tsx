"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  id: number;
  from: "user" | "bot";
  text: string;
};

const HARDCODED_REPLY =
  "Got it! Looks like you're drawing a basketball — I'll use that as context for generation.";

const REPLY_DELAY_MS = 10000;

export default function ChatSidebar() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: "bot",
      text: "Hi! Describe what you're drawing so I can give better suggestions.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(1);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isTyping) return;
    const userMsg: Message = { id: nextId.current++, from: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, from: "bot", text: HARDCODED_REPLY },
      ]);
      setIsTyping(false);
    }, REPLY_DELAY_MS);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <h3 className="mb-2 text-xs font-semibold tracking-[0.2em] text-white/70 uppercase">
        Context Chat
      </h3>
      <div
        ref={scrollRef}
        className="mb-2 h-28 space-y-1.5 overflow-y-auto rounded-lg border border-white/5 bg-zinc-950/80 p-2"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
          >
            <span
              className={`max-w-[80%] rounded-lg px-2.5 py-1 text-xs leading-relaxed ${
                msg.from === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white/10 text-white/90"
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <span className="flex max-w-[80%] items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-white/70">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/70 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/70 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/70" />
              <span className="ml-1">thinking...</span>
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKey}
          disabled={isTyping}
          placeholder={
            isTyping
              ? "Waiting for reply..."
              : "e.g. I'm drawing a basketball..."
          }
          className="w-full rounded-lg border border-white/10 bg-zinc-950/70 px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/60 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isTyping}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isTyping ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
