import path from "node:path";
import { describe, expect, it } from "vitest";
import { healthTool } from "../src/tools/health.js";

describe("health tool", () => {
  it("returns diagnostics", async () => {
    process.env.ASTAH_COMMAND = `"${process.execPath}" "${path.join(process.cwd(), "tests/fixtures/mock-export.mjs")}"`;
    const response = await healthTool({ detail: "full" });
    expect(response.ok).toBe(true);
    expect(response.metadata).toBeTruthy();
  });
});
