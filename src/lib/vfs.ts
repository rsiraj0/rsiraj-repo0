/**
 * Virtual file system used to hold generated code entirely in memory.
 * Paths are POSIX-style, always beginning with "/".
 */
export type VFS = Record<string, string>;

function normalize(path: string): string {
  if (!path.startsWith("/")) path = "/" + path;
  return path.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

export function createVFS(initial: VFS = {}): VFS {
  const fs: VFS = {};
  for (const [p, c] of Object.entries(initial)) fs[normalize(p)] = c;
  return fs;
}

export function writeFile(fs: VFS, path: string, content: string): VFS {
  return { ...fs, [normalize(path)]: content };
}

export function deleteFile(fs: VFS, path: string): VFS {
  const key = normalize(path);
  const { [key]: _removed, ...rest } = fs;
  return rest;
}

export function readFile(fs: VFS, path: string): string | undefined {
  return fs[normalize(path)];
}

export function listFiles(fs: VFS): string[] {
  return Object.keys(fs).sort();
}

export type FileTreeNode = {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: FileTreeNode[];
};

export function buildTree(fs: VFS): FileTreeNode {
  const root: FileTreeNode = { name: "/", path: "/", type: "dir", children: [] };
  for (const fullPath of listFiles(fs)) {
    const parts = fullPath.split("/").filter(Boolean);
    let cursor = root;
    let accum = "";
    parts.forEach((part, idx) => {
      accum += "/" + part;
      const isLeaf = idx === parts.length - 1;
      cursor.children ??= [];
      let child = cursor.children.find((c) => c.name === part);
      if (!child) {
        child = {
          name: part,
          path: accum,
          type: isLeaf ? "file" : "dir",
          children: isLeaf ? undefined : [],
        };
        cursor.children.push(child);
      }
      cursor = child;
    });
  }
  const sort = (n: FileTreeNode) => {
    if (!n.children) return;
    n.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    n.children.forEach(sort);
  };
  sort(root);
  return root;
}

export function serialize(fs: VFS): string {
  return JSON.stringify(fs);
}

export function deserialize(input: string | null | undefined): VFS {
  if (!input) return {};
  try {
    const parsed = JSON.parse(input);
    return typeof parsed === "object" && parsed ? (parsed as VFS) : {};
  } catch {
    return {};
  }
}
