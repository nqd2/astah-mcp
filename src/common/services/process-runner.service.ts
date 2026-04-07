import { Injectable } from "@nestjs/common";
import { spawn } from "node:child_process";
import type { CommandResult } from "../../types/contracts.js";

export interface RunCommandOptions {
  cwd?: string;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

@Injectable()
export class ProcessRunnerService {
  private isWindowsBatchCommand(command: string): boolean {
    if (process.platform !== "win32") {
      return false;
    }
    const normalized = command.toLowerCase().trim();
    return normalized.endsWith(".bat") || normalized.endsWith(".cmd");
  }

  splitCommandLine(commandLine: string): { command: string; args: string[] } {
    const parts = commandLine.match(/"[^"]*"|'[^']*'|\S+/g)?.map((part) => {
      if (
        (part.startsWith("\"") && part.endsWith("\"")) ||
        (part.startsWith("'") && part.endsWith("'"))
      ) {
        return part.slice(1, -1);
      }
      return part;
    }) ?? [];
    const [command, ...args] = parts;
    if (!command) {
      throw new Error("Command line is empty.");
    }
    return { command, args };
  }

  async runCommand(command: string, args: string[], options: RunCommandOptions = {}): Promise<CommandResult> {
    const startedAt = Date.now();
    const timeoutMs = options.timeoutMs ?? 120000;

    return await new Promise<CommandResult>((resolve, reject) => {
      const isBatch = this.isWindowsBatchCommand(command);
      const child = isBatch
        ? spawn("cmd.exe", ["/d", "/s", "/c", command, ...args], {
            cwd: options.cwd ?? process.cwd(),
            env: { ...process.env, ...options.env },
            shell: false,
            windowsHide: true
          })
        : spawn(command, args, {
            cwd: options.cwd ?? process.cwd(),
            env: { ...process.env, ...options.env },
            shell: false,
            windowsHide: true
          });

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
      }, timeoutMs);

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.on("close", (exitCode) => {
        clearTimeout(timer);
        resolve({
          command,
          args,
          cwd: options.cwd ?? process.cwd(),
          exitCode,
          timedOut,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          durationMs: Date.now() - startedAt
        });
      });
    });
  }
}
