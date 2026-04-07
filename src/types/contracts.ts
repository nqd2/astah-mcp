export interface CommandResult {
  command: string;
  args: string[];
  cwd: string;
  exitCode: number | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface ToolPaths {
  input?: string;
  asta?: string;
  outputDir?: string;
  images?: string[];
}

export interface ToolResponse {
  ok: boolean;
  message: string;
  exitCode: number | null;
  paths: ToolPaths;
  stdout: string;
  stderr: string;
  timings: {
    startedAt: string;
    finishedAt: string;
    durationMs: number;
  };
  platform: NodeJS.Platform;
  commandSummary: string[];
  metadata?: Record<string, unknown>;
}

export interface BridgeInput {
  pumlPath: string;
  astaPath: string;
  diagramType?: string;
}
