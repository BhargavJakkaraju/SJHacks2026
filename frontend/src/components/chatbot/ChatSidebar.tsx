"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Message = {
  id: number;
  from: "user" | "bot";
  text: string;
};

const HARDCODED_REPLY =
  "Got it! Looks like you're drawing a basketball — I'll use that as context for generation.";

const REPLY_DELAY_MS = 10000;

// Minimal local typings for the Web Speech API. The TS DOM lib only ships
// these in some configurations, and we only use a tiny subset.
type SpeechRecognitionAlternative = { transcript: string };
type SpeechRecognitionResult = {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
};
type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function ChatSidebar() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: "bot",
      text: "Hi! Describe what you're drawing so I can give better suggestions.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(1);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const speechSupported = useMemo(
    () => getSpeechRecognitionCtor() !== null,
    [],
  );

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Stop any running recognition on unmount so it doesn't keep listening.
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const startListening = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalChunk += result[0].transcript;
        else interimChunk += result[0].transcript;
      }
      if (finalChunk) {
        setInputValue((prev) => {
          const needsSpace = prev && !prev.endsWith(" ") ? " " : "";
          return prev + needsSpace + finalChunk.trim();
        });
      }
      setInterimText(interimChunk);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setInterimText("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    setInterimText("");
    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleMicClick = () => {
    if (!speechSupported) return;
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isTyping) return;
    if (isListening) stopListening();
    const userMsg: Message = { id: nextId.current++, from: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setInterimText("");
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

  const displayedValue =
    isListening && interimText
      ? `${inputValue}${inputValue && !inputValue.endsWith(" ") ? " " : ""}${interimText}`
      : inputValue;

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
          value={displayedValue}
          onChange={(e) => {
            if (isListening) return;
            setInputValue(e.target.value);
          }}
          onKeyDown={handleKey}
          readOnly={isListening}
          disabled={isTyping}
          placeholder={
            isTyping
              ? "Waiting for reply..."
              : isListening
                ? "Listening... speak now"
                : "e.g. I'm drawing a basketball..."
          }
          className="w-full rounded-lg border border-white/10 bg-zinc-950/70 px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/60 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleMicClick}
          disabled={isTyping || !speechSupported}
          title={
            !speechSupported
              ? "Voice input not supported in this browser"
              : isListening
                ? "Stop listening"
                : "Start voice input"
          }
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
          aria-pressed={isListening}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs transition disabled:cursor-not-allowed disabled:opacity-50 ${
            isListening
              ? "animate-pulse border-red-500/60 bg-red-500/20 text-red-200"
              : "border-white/10 bg-zinc-950/70 text-white/70 hover:bg-white/10"
          }`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        </button>
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
