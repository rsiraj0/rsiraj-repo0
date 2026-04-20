import Anthropic from "@anthropic-ai/sdk";

export const SYSTEM_PROMPT = `You are UIGen, an expert React + TypeScript component generator.
You produce self-contained components that render in a sandboxed preview
with React 19 and Tailwind CSS v4 available globally.

OUTPUT FORMAT — strict JSON, no prose, no markdown fences:
{
  "files": { "/App.tsx": "<full file contents>", "/Component.tsx": "..." },
  "entry": "/App.tsx",
  "explanation": "<1-3 sentence summary>"
}

Rules:
- Always include "/App.tsx" as the entry that default-exports a component named App.
- Use only React + Tailwind. No external npm packages, no fetches, no side effects.
- Keep styling in Tailwind utility classes. No external CSS imports.
- Every file must be valid TypeScript (.tsx) that can be transpiled in-browser.
- Keep responses minimal: one entry file plus optional small helper files.
`;

export type GenerationResult = {
  files: Record<string, string>;
  entry: string;
  explanation: string;
};

const FALLBACK: GenerationResult = {
  entry: "/App.tsx",
  explanation:
    "Static scaffold returned because ANTHROPIC_API_KEY is not set. Add a key to .env to enable AI generation.",
  files: {
    "/App.tsx": `import React from "react";

export default function App() {
  return (
    <div className="min-h-full w-full flex items-center justify-center bg-slate-50 p-8">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
          UIGen preview
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">Hello from UIGen</h1>
        <p className="mt-2 text-sm text-slate-600">
          This is the static preview shown when no Anthropic API key is configured.
          Set <code className="rounded bg-slate-100 px-1">ANTHROPIC_API_KEY</code> in
          your <code className="rounded bg-slate-100 px-1">.env</code> file and
          describe a component in the chat to generate real code.
        </p>
        <button
          type="button"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Get started
        </button>
      </div>
    </div>
  );
}
`,
  },
};

function extractJson(text: string): GenerationResult | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const obj = JSON.parse(trimmed.slice(start, end + 1));
    if (!obj || typeof obj !== "object") return null;
    if (typeof obj.files !== "object" || !obj.files) return null;
    const entry = typeof obj.entry === "string" ? obj.entry : "/App.tsx";
    const explanation = typeof obj.explanation === "string" ? obj.explanation : "";
    return { files: obj.files, entry, explanation };
  } catch {
    return null;
  }
}

export async function generateComponent(params: {
  prompt: string;
  history?: { role: "user" | "assistant"; content: string }[];
  currentFiles?: Record<string, string>;
}): Promise<GenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return FALLBACK;

  const client = new Anthropic({ apiKey });
  const history = params.history ?? [];
  const currentFilesNote =
    params.currentFiles && Object.keys(params.currentFiles).length > 0
      ? `\n\nCurrent virtual files (modify or replace as needed):\n` +
        Object.entries(params.currentFiles)
          .map(([p, c]) => `--- ${p} ---\n${c}`)
          .join("\n\n")
      : "";

  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: params.prompt + currentFilesNote },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages,
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return extractJson(text) ?? FALLBACK;
}
