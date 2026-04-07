import type { CommandResult } from "../types/contracts.js";
import { ProcessRunnerService } from "../common/services/process-runner.service.js";

export interface RunCommandOptions {
  cwd?: string;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

const processRunner = new ProcessRunnerService();

export function splitCommandLine(commandLine: string): { command: string; args: string[] } {
  return processRunner.splitCommandLine(commandLine);
}

export async function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {}
): Promise<CommandResult> {
  return await processRunner.runCommand(command, args, options);
}
