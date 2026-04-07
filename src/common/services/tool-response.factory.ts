import { Injectable } from "@nestjs/common";
import type { CommandResult, ToolPaths, ToolResponse } from "../../types/contracts.js";

@Injectable()
export class ToolResponseFactory {
  build(params: {
    ok: boolean;
    message: string;
    startedAt: Date;
    paths?: ToolPaths;
    commands?: CommandResult[];
    metadata?: Record<string, unknown>;
  }): ToolResponse {
    const finishedAt = new Date();
    const commandSummary = (params.commands ?? []).map(
      (cmd) => `${cmd.command} ${cmd.args.join(" ")} => ${cmd.exitCode}`
    );
    return {
      ok: params.ok,
      message: params.message,
      exitCode:
        params.commands && params.commands.length > 0
          ? params.commands[params.commands.length - 1]?.exitCode ?? null
          : null,
      paths: params.paths ?? {},
      stdout: (params.commands ?? []).map((c) => c.stdout).filter(Boolean).join("\n"),
      stderr: (params.commands ?? []).map((c) => c.stderr).filter(Boolean).join("\n"),
      timings: {
        startedAt: params.startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - params.startedAt.getTime()
      },
      platform: process.platform,
      commandSummary,
      metadata: params.metadata
    };
  }
}
