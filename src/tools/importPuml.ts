import { z } from "zod";
import { assertFileReadable, ensureParentDir, resolvePath } from "../lib/paths.js";
import { runCommand, splitCommandLine } from "../lib/process.js";
import { buildToolResponse } from "../lib/responses.js";
import type { ToolResponse } from "../types/contracts.js";

const importSchema = z.object({
  pumlPath: z.string().min(1),
  astaPath: z.string().min(1),
  diagramType: z.string().optional()
});

function getBridgeCommand(): { command: string; argsTemplate: string[] } {
  const configured = process.env.ASTAH_PLUGIN_BRIDGE_CMD;
  if (!configured) {
    throw new Error(
      "ASTAH_PLUGIN_BRIDGE_CMD is not set. Example: \"node bridge.js --in {puml} --out {asta}\"."
    );
  }

  const parsed = splitCommandLine(configured);
  return { command: parsed.command, argsTemplate: parsed.args };
}

function applyTemplate(argsTemplate: string[], values: Record<string, string>): string[] {
  return argsTemplate.map((arg) =>
    arg
      .replaceAll("{puml}", values.puml)
      .replaceAll("{asta}", values.asta)
      .replaceAll("{diagramType}", values.diagramType ?? "")
  );
}

export async function importPumlTool(input: unknown): Promise<ToolResponse> {
  const startedAt = new Date();
  const parsed = importSchema.parse(input);
  const pumlPath = resolvePath(parsed.pumlPath);
  const astaPath = resolvePath(parsed.astaPath);

  await assertFileReadable(pumlPath);
  await ensureParentDir(astaPath);

  const bridge = getBridgeCommand();
  const args = applyTemplate(bridge.argsTemplate, {
    puml: pumlPath,
    asta: astaPath,
    diagramType: parsed.diagramType ?? ""
  });

  const result = await runCommand(bridge.command, args, {
    timeoutMs: Number(process.env.ASTAH_IMPORT_TIMEOUT_MS ?? 120000)
  });

  if (result.timedOut || result.exitCode !== 0) {
    throw new Error(
      `import_puml failed (exit=${result.exitCode}, timedOut=${result.timedOut}): ${result.stderr || "unknown error"}`
    );
  }

  return buildToolResponse({
    ok: true,
    message: "PlantUML imported to Astah successfully.",
    startedAt,
    paths: {
      input: pumlPath,
      asta: astaPath
    },
    commands: [result]
  });
}
