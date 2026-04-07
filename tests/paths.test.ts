import { describe, expect, it } from "vitest";
import path from "node:path";
import { defaultAstaPathFromPuml, resolvePath } from "../src/lib/paths.js";

describe("paths library", () => {
  it("resolves relative paths", () => {
    const resolved = resolvePath("abc/test.puml", "C:/work");
    expect(resolved).toContain(path.normalize("C:/work/abc/test.puml"));
  });

  it("creates default asta path from puml", () => {
    const asta = defaultAstaPathFromPuml("/tmp/sample.puml");
    expect(asta.replaceAll("\\", "/")).toBe(path.normalize("/tmp/sample.asta").replaceAll("\\", "/"));
  });
});
