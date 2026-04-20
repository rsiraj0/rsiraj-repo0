"use client";

import { useCallback, useMemo, useState } from "react";
import { Chat, type ChatMessage } from "@/components/chat";
import { Preview } from "@/components/preview";
import { CodePanel } from "@/components/code-panel";
import { Header } from "@/components/header";
import type { VFS } from "@/lib/vfs";

const INITIAL_FILES: VFS = {
  "/App.tsx": `import React from "react";

export default function App() {
  return (
    <div className="min-h-full flex items-center justify-center p-8 bg-slate-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Describe a component</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ask the chat on the left to build a React component and it will appear here.
        </p>
      </div>
    </div>
  );
}
`,
};

type View = "preview" | "code";

export function Workspace({
  user,
  anonId,
}: {
  user: { email: string } | null;
  anonId: string | null;
}) {
  const [files, setFiles] = useState<VFS>(INITIAL_FILES);
  const [entry, setEntry] = useState<string>("/App.tsx");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [view, setView] = useState<View>("preview");
  const [busy, setBusy] = useState(false);

  const handleSend = useCallback(
    async (prompt: string) => {
      setBusy(true);
      setMessages((m) => [...m, { role: "user", content: prompt }]);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            history: messages,
            currentFiles: files,
          }),
        });
        if (!res.ok) throw new Error("Generation failed");
        const data = (await res.json()) as {
          files: VFS;
          entry: string;
          explanation: string;
        };
        setFiles(data.files);
        setEntry(data.entry || "/App.tsx");
        setMessages((m) => [...m, { role: "assistant", content: data.explanation }]);
      } catch (err) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Sorry — generation failed. Try again." },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [files, messages],
  );

  const handleFileChange = useCallback((path: string, content: string) => {
    setFiles((f) => ({ ...f, [path]: content }));
  }, []);

  const subtitle = useMemo(() => {
    if (user) return `Signed in as ${user.email}`;
    if (anonId) return `Anonymous session · ${anonId}`;
    return "";
  }, [user, anonId]);

  return (
    <div className="flex h-screen flex-col">
      <Header
        user={user}
        subtitle={subtitle}
        view={view}
        onViewChange={setView}
      />
      <div className="grid min-h-0 flex-1 grid-cols-[380px_1fr]">
        <Chat messages={messages} onSend={handleSend} busy={busy} />
        <main className="min-h-0 border-l border-slate-200 bg-white">
          {view === "preview" ? (
            <Preview files={files} entry={entry} />
          ) : (
            <CodePanel files={files} onChange={handleFileChange} />
          )}
        </main>
      </div>
    </div>
  );
}
