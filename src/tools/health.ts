import { z } from "zod";
import { runCommand, splitCommandLine } from "../lib/process.js";
import { buildToolResponse } from "../lib/responses.js";
import type { ToolResponse } from "../types/contracts.js";

const healthSchema = z.object({
  detail: z.enum(["basic", "full"]).default("basic")
});

function getAstahCommand(): { command: string; baseArgs: string[] } {
  if (process.env.ASTAH_COMMAND?.trim()) {
    const parsed = splitCommandLine(process.env.ASTAH_COMMAND.trim());
    return { command: parsed.command, baseArgs: parsed.args };
  }
  return {
    command: process.platform === "win32" ? "astah-command.bat" : "astah-command",
    baseArgs: []
  };
}

export async function healthTool(input: unknown): Promise<ToolResponse> {
  const startedAt = new Date();
  const parsed = healthSchema.parse(input ?? {});

  const checks: Record<string, unknown> = {
    nodeVersion: process.version,
    platform: process.platform,
    cwd: process.cwd(),
    bridgeCommandConfigured: Boolean(process.env.ASTAH_PLUGIN_BRIDGE_CMD),
    astahCommand: getAstahCommand().command
  };

  const commands = [];
  try {
    const astah = getAstahCommand();
    const versionResult = await runCommand(astah.command, [...astah.baseArgs, "-version"], {
      timeoutMs: 20000
    });
    commands.push(versionResult);
    checks.astahVersionExitCode = versionResult.exitCode;
  } catch (error) {
    checks.astahVersionError = (error as Error).message;
  }

  return buildToolResponse({
    ok: true,
    message: "Health check complete.",
    startedAt,
    commands,
    metadata: parsed.detail === "full" ? checks : { platform: checks.platform, nodeVersion: checks.nodeVersion }
  });
}
