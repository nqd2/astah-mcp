import { z } from "zod";
import path from "node:path";
import { assertFileReadable, ensureDir, resolvePath } from "../lib/paths.js";
import { runCommand, splitCommandLine } from "../lib/process.js";
import { buildToolResponse } from "../lib/responses.js";
import type { ToolResponse } from "../types/contracts.js";

const exportSchema = z.object({
  astaPath: z.string().min(1),
  outputDir: z.string().min(1),
  imageType: z.string().default("png")
});

function resolveAstahCommand(): { command: string; baseArgs: string[] } {
  if (process.env.ASTAH_COMMAND?.trim()) {
    const parsed = splitCommandLine(process.env.ASTAH_COMMAND.trim());
    return { command: parsed.command, baseArgs: parsed.args };
  }
  return {
    command: process.platform === "win32" ? "astah-command.bat" : "astah-command",
    baseArgs: []
  };
}

export async function exportPngTool(input: unknown): Promise<ToolResponse> {
  const startedAt = new Date();
  const parsed = exportSchema.parse(input);
  const astaPath = resolvePath(parsed.astaPath);
  const outputDir = resolvePath(parsed.outputDir);
  const imageType = parsed.imageType || "png";

  await assertFileReadable(astaPath);
  await ensureDir(outputDir);

  const astah = resolveAstahCommand();
  const args = [...astah.baseArgs, "-f", astaPath, "-image", "-t", imageType, "-o", outputDir];
  const result = await runCommand(astah.command, args, {
    timeoutMs: Number(process.env.ASTAH_EXPORT_TIMEOUT_MS ?? 120000)
  });

  if (result.timedOut || result.exitCode !== 0) {
    throw new Error(
      `export_png failed (exit=${result.exitCode}, timedOut=${result.timedOut}): ${result.stderr || "unknown error"}`
    );
  }

  const expectedImage = path.join(outputDir, `${path.parse(astaPath).name}.${imageType}`);
  return buildToolResponse({
    ok: true,
    message: "Astah export completed successfully.",
    startedAt,
    paths: {
      asta: astaPath,
      outputDir,
      images: [expectedImage]
    },
    commands: [result]
  });
}
