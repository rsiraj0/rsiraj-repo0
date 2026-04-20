import { describe, expect, it } from "vitest";
import {
  buildTree,
  createVFS,
  deleteFile,
  deserialize,
  listFiles,
  readFile,
  serialize,
  writeFile,
} from "./vfs";

describe("vfs", () => {
  it("creates, reads, writes and deletes files", () => {
    let fs = createVFS({ "/App.tsx": "hello" });
    expect(readFile(fs, "/App.tsx")).toBe("hello");
    fs = writeFile(fs, "/components/Button.tsx", "btn");
    expect(listFiles(fs)).toEqual(["/App.tsx", "/components/Button.tsx"]);
    fs = deleteFile(fs, "/App.tsx");
    expect(readFile(fs, "/App.tsx")).toBeUndefined();
  });

  it("normalizes paths without a leading slash", () => {
    const fs = writeFile({}, "App.tsx", "x");
    expect(readFile(fs, "/App.tsx")).toBe("x");
  });

  it("round-trips through serialize/deserialize", () => {
    const fs = createVFS({ "/a.ts": "1", "/b.ts": "2" });
    expect(deserialize(serialize(fs))).toEqual(fs);
    expect(deserialize(null)).toEqual({});
    expect(deserialize("not-json")).toEqual({});
  });

  it("builds a sorted tree from flat paths", () => {
    const fs = createVFS({
      "/App.tsx": "",
      "/components/Button.tsx": "",
      "/components/Card.tsx": "",
    });
    const tree = buildTree(fs);
    expect(tree.children?.map((c) => c.name)).toEqual(["components", "App.tsx"]);
  });
});
