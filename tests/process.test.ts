import { describe, expect, it } from "vitest";
import { runCommand } from "../src/lib/process.js";

describe("process wrapper", () => {
  it("captures stdout and exit code", async () => {
    const result = await runCommand(process.execPath, ["-e", "console.log('ok')"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("ok");
  });
});
