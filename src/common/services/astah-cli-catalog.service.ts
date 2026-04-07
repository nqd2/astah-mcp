import { Injectable } from "@nestjs/common";
import { ProcessRunnerService } from "./process-runner.service.js";

export interface AstahCliFeature {
  key: string;
  description: string;
  toolName: string;
  supported: boolean;
}

@Injectable()
export class AstahCliCatalogService {
  constructor(private readonly processRunner: ProcessRunnerService) {}

  resolveAstahCommand(): { command: string; baseArgs: string[] } {
    if (process.env.ASTAH_COMMAND?.trim()) {
      const parsed = this.processRunner.splitCommandLine(process.env.ASTAH_COMMAND.trim());
      return { command: parsed.command, baseArgs: parsed.args };
    }
    return {
      command: process.platform === "win32" ? "astah-command.bat" : "astah-command",
      baseArgs: []
    };
  }

  async inspectCapabilities(): Promise<{
    command: string;
    versionProbe?: string;
    helpProbe?: string;
    features: AstahCliFeature[];
  }> {
    const resolved = this.resolveAstahCommand();
    const features: AstahCliFeature[] = [
      {
        key: "version",
        description: "Read Astah CLI version",
        toolName: "astah_cli_info",
        supported: true
      },
      {
        key: "export_image",
        description: "Export image from .asta project",
        toolName: "astah_export_image",
        supported: true
      },
      {
        key: "health_check",
        description: "CLI readiness and environment check",
        toolName: "health",
        supported: true
      },
      {
        key: "batch_with_allowlist",
        description: "Run curated Astah CLI operation set",
        toolName: "astah_batch_run",
        supported: true
      }
    ];

    let versionProbe: string | undefined;
    let helpProbe: string | undefined;
    try {
      const version = await this.processRunner.runCommand(resolved.command, [...resolved.baseArgs, "-version"], {
        timeoutMs: 20000
      });
      versionProbe = (version.stdout || version.stderr || "").trim();
    } catch (error) {
      versionProbe = `error: ${(error as Error).message}`;
    }
    try {
      const help = await this.processRunner.runCommand(resolved.command, [...resolved.baseArgs, "-help"], {
        timeoutMs: 20000
      });
      helpProbe = (help.stdout || help.stderr || "").trim();
    } catch (error) {
      helpProbe = `error: ${(error as Error).message}`;
    }

    return {
      command: resolved.command,
      versionProbe,
      helpProbe,
      features
    };
  }
}
