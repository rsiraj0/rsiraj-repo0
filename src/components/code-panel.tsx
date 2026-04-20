"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { FileCode, Download } from "lucide-react";
import { buildTree, type FileTreeNode, type VFS } from "@/lib/vfs";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export function CodePanel({
  files,
  onChange,
}: {
  files: VFS;
  onChange: (path: string, content: string) => void;
}) {
  const paths = useMemo(() => Object.keys(files).sort(), [files]);
  const [active, setActive] = useState<string>(paths[0] ?? "/App.tsx");
  const activePath = paths.includes(active) ? active : paths[0];
  const tree = useMemo(() => buildTree(files), [files]);

  const downloadAll = () => {
    const blob = new Blob([JSON.stringify(files, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uigen-project.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid h-full grid-cols-[220px_1fr]">
      <div className="flex min-h-0 flex-col border-r border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Files
          </span>
          <button
            type="button"
            onClick={downloadAll}
            title="Export project JSON"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-white"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-1">
          <TreeView
            node={tree}
            activePath={activePath}
            onSelect={setActive}
          />
        </div>
      </div>
      <div className="min-h-0">
        {activePath ? (
          <MonacoEditor
            height="100%"
            language={languageFor(activePath)}
            theme="vs-light"
            path={activePath}
            value={files[activePath] ?? ""}
            onChange={(v) => onChange(activePath, v ?? "")}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              tabSize: 2,
            }}
          />
        ) : (
          <div className="p-4 text-sm text-slate-500">No files yet.</div>
        )}
      </div>
    </div>
  );
}

function TreeView({
  node,
  activePath,
  onSelect,
  depth = 0,
}: {
  node: FileTreeNode;
  activePath: string;
  onSelect: (p: string) => void;
  depth?: number;
}) {
  if (node.type === "file") {
    return (
      <button
        type="button"
        onClick={() => onSelect(node.path)}
        style={{ paddingLeft: 8 + depth * 12 }}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-xs",
          activePath === node.path
            ? "bg-white font-medium text-slate-900 shadow-sm"
            : "text-slate-600 hover:bg-white",
        )}
      >
        <FileCode className="h-3.5 w-3.5 text-slate-400" />
        {node.name}
      </button>
    );
  }
  return (
    <div>
      {node.name !== "/" && (
        <div
          style={{ paddingLeft: 8 + depth * 12 }}
          className="py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400"
        >
          {node.name}
        </div>
      )}
      <div>
        {node.children?.map((c) => (
          <TreeView
            key={c.path}
            node={c}
            activePath={activePath}
            onSelect={onSelect}
            depth={node.name === "/" ? depth : depth + 1}
          />
        ))}
      </div>
    </div>
  );
}

function languageFor(path: string): string {
  if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".jsx") || path.endsWith(".js")) return "javascript";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".json")) return "json";
  return "plaintext";
}
