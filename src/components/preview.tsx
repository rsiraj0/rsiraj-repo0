"use client";

import { useMemo } from "react";
import type { VFS } from "@/lib/vfs";

/**
 * Renders the VFS into an isolated iframe using Babel (in-browser) and an
 * esm.sh-backed React runtime. The entry module is the one exported as App.
 *
 * We bundle all VFS files into a single <script type="text/babel"> by
 * rewriting imports: `import X from "./Foo"` becomes a reference into a
 * shared module registry populated as files evaluate in dependency order.
 */
export function Preview({ files, entry }: { files: VFS; entry: string }) {
  const srcDoc = useMemo(() => buildSrcDoc(files, entry), [files, entry]);
  return (
    <iframe
      key={srcDoc.length}
      title="preview"
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      className="h-full w-full border-0 bg-white"
    />
  );
}

function buildSrcDoc(files: VFS, entry: string): string {
  const normalizedEntry = entry in files ? entry : "/App.tsx";
  const fileTable = JSON.stringify(files);
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script src="https://cdn.tailwindcss.com"></script>
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@19.0.0",
    "react-dom": "https://esm.sh/react-dom@19.0.0",
    "react-dom/client": "https://esm.sh/react-dom@19.0.0/client"
  }
}
</script>
<script src="https://unpkg.com/@babel/standalone@7.25.6/babel.min.js"></script>
<style>html,body,#root{height:100%;margin:0}</style>
</head>
<body>
<div id="root"></div>
<script type="module">
import React from "react";
import { createRoot } from "react-dom/client";

const FILES = ${fileTable};
const ENTRY = ${JSON.stringify(normalizedEntry)};
const registry = Object.create(null);

function resolvePath(from, spec) {
  if (!spec.startsWith(".")) return null;
  const base = from.split("/").slice(0, -1).join("/");
  const parts = (base + "/" + spec).split("/");
  const stack = [];
  for (const p of parts) {
    if (!p || p === ".") continue;
    if (p === "..") stack.pop();
    else stack.push(p);
  }
  const joined = "/" + stack.join("/");
  for (const candidate of [joined, joined + ".tsx", joined + ".ts", joined + "/index.tsx"]) {
    if (candidate in FILES) return candidate;
  }
  return null;
}

function transform(path, source) {
  const rewritten = source
    // Named import: import { a, b } from "./x"
    .replace(/import\\s+(\\{[^}]+\\})\\s+from\\s+["']([^"']+)["'];?/g, (m, names, spec) => {
      if (spec === "react" || spec.startsWith("http")) return m;
      const resolved = resolvePath(path, spec);
      return resolved ? "const " + names + " = __require(" + JSON.stringify(resolved) + ");" : m;
    })
    // Default import: import Foo from "./x"
    .replace(/import\\s+(\\w+)\\s+from\\s+["']([^"']+)["'];?/g, (m, name, spec) => {
      if (spec === "react" || spec.startsWith("http")) return m;
      const resolved = resolvePath(path, spec);
      return resolved ? "const " + name + " = __require(" + JSON.stringify(resolved) + ").default;" : m;
    })
    .replace(/export\\s+default\\s+function\\s+(\\w+)/g, "module.exports.default = function $1")
    .replace(/export\\s+default\\s+/g, "module.exports.default = ")
    .replace(/export\\s+function\\s+(\\w+)/g, "module.exports.$1 = function $1")
    .replace(/export\\s+const\\s+(\\w+)\\s*=/g, "const $1 = module.exports.$1 =");
  return Babel.transform(rewritten, {
    presets: [["typescript", { allExtensions: true, isTSX: true }], "react"],
    filename: path,
  }).code;
}

function __require(path) {
  if (registry[path]) return registry[path].exports;
  if (!(path in FILES)) throw new Error("Module not found: " + path);
  const module = { exports: {} };
  registry[path] = module;
  const code = transform(path, FILES[path]);
  const fn = new Function("module", "React", "__require", code);
  fn(module, React, __require);
  return module.exports;
}

try {
  const mod = __require(ENTRY);
  const Component = mod.default || mod.App || (() => React.createElement("div", null, "No default export in " + ENTRY));
  createRoot(document.getElementById("root")).render(React.createElement(Component));
} catch (err) {
  const root = document.getElementById("root");
  root.innerHTML = '<pre style="padding:16px;color:#b91c1c;font:12px ui-monospace,monospace;white-space:pre-wrap">' +
    String(err && err.stack || err) + '</pre>';
}
</script>
</body>
</html>`;
}
