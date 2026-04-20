"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export function Chat({
  messages,
  onSend,
  busy,
}: {
  messages: ChatMessage[];
  onSend: (prompt: string) => void;
  busy: boolean;
}) {
  const [value, setValue] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [messages, busy]);

  const submit = () => {
    const prompt = value.trim();
    if (!prompt || busy) return;
    setValue("");
    onSend(prompt);
  };

  return (
    <aside className="flex min-h-0 flex-col bg-slate-50">
      <div ref={scrollerRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((m, i) => <Bubble key={i} message={m} />)
        )}
        {busy && <TypingIndicator />}
      </div>
      <div className="border-t border-slate-200 bg-white p-3">
        <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-indigo-400">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Describe a component, e.g. a pricing card with three tiers…"
            rows={2}
            className="flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={busy || !value.trim()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:bg-slate-300"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-slate-900 text-white" : "bg-indigo-100 text-indigo-700",
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
          isUser ? "bg-slate-900 text-white" : "bg-white text-slate-800 shadow-sm",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function EmptyState() {
  const suggestions = [
    "A pricing card with three tiers and a highlighted middle plan",
    "A login form with email, password, and a sign-in button",
    "A dashboard stat card with a title, value, and trend arrow",
  ];
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
      <p className="font-medium text-slate-900">Start a component</p>
      <p className="mt-1 text-slate-500">Try one of these prompts:</p>
      <ul className="mt-2 space-y-1">
        {suggestions.map((s) => (
          <li key={s} className="rounded-md bg-slate-50 px-2 py-1 text-xs">
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <Bot className="h-3.5 w-3.5" />
      <span className="inline-flex gap-1">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:240ms]" />
      </span>
      Generating…
    </div>
  );
}
