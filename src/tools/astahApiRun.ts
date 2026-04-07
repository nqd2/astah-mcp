import { z } from "zod";
import { runUserJava, readSampleJavaFiles } from "../lib/astahApi.js";
import { buildToolResponse } from "../lib/responses.js";
import type { ToolResponse } from "../types/contracts.js";

const schema = z.object({
  className: z.string().default("AstahMcpRunner"),
  sourceCode: z.string().min(1),
  args: z.array(z.string()).default([]),
  includeSamples: z.boolean().default(false)
});

export async function astahApiRunTool(input: unknown): Promise<ToolResponse> {
  const startedAt = new Date();
  const parsed = schema.parse(input);
  const run = await runUserJava({
    className: parsed.className,
    sourceCode: parsed.sourceCode,
    args: parsed.args
  });

  return buildToolResponse({
    ok: run.exitCode === 0,
    message: run.exitCode === 0 ? "Java runner completed." : "Java runner failed.",
    startedAt,
    metadata: parsed.includeSamples ? { sampleFiles: await readSampleJavaFiles() } : undefined,
    commands: [
      {
        command: "java-runner",
        args: parsed.args,
        cwd: process.cwd(),
        exitCode: run.exitCode,
        timedOut: false,
        stdout: run.stdout,
        stderr: run.stderr,
        durationMs: 0
      }
    ]
  });
}
