import { Injectable } from "@nestjs/common";
import path from "node:path";
import { z } from "zod";
import { PathService } from "../common/services/path.service.js";
import { ProcessRunnerService } from "../common/services/process-runner.service.js";
import { ToolResponseFactory } from "../common/services/tool-response.factory.js";
import { AstahApiService } from "../common/services/astah-api.service.js";
import { AstahCliCatalogService } from "../common/services/astah-cli-catalog.service.js";
import { readRuntimeConfig } from "../common/config/runtime-config.js";
import type { ToolResponse } from "../types/contracts.js";

@Injectable()
export class ToolService {
  constructor(
    private readonly paths: PathService,
    private readonly processRunner: ProcessRunnerService,
    private readonly responseFactory: ToolResponseFactory,
    private readonly astahApi: AstahApiService,
    private readonly cliCatalog: AstahCliCatalogService
  ) {}

  private resolveAstahCommand(): { command: string; baseArgs: string[] } {
    const configured = readRuntimeConfig().astahCommand;
    if (configured) {
      const parsed = this.processRunner.splitCommandLine(configured);
      return { command: parsed.command, baseArgs: parsed.args };
    }
    return {
      command: process.platform === "win32" ? "astah-command.bat" : "astah-command",
      baseArgs: []
    };
  }

  private getBridgeCommand(): { command: string; argsTemplate: string[] } {
    const configured = readRuntimeConfig().astahPluginBridgeCmd;
    if (!configured) {
      throw new Error(
        "ASTAH_PLUGIN_BRIDGE_CMD is not set. Example: \"node bridge.js --in {puml} --out {asta}\"."
      );
    }
    const parsed = this.processRunner.splitCommandLine(configured);
    return { command: parsed.command, argsTemplate: parsed.args };
  }

  private applyTemplate(argsTemplate: string[], values: Record<string, string>): string[] {
    return argsTemplate.map((arg) =>
      arg
        .replaceAll("{puml}", values.puml)
        .replaceAll("{asta}", values.asta)
        .replaceAll("{diagramType}", values.diagramType ?? "")
    );
  }

  async importPuml(input: unknown): Promise<ToolResponse> {
    const schema = z.object({
      pumlPath: z.string().min(1),
      astaPath: z.string().min(1),
      diagramType: z.string().optional()
    });
    const startedAt = new Date();
    const parsed = schema.parse(input);
    const pumlPath = this.paths.resolvePath(parsed.pumlPath);
    const astaPath = this.paths.resolvePath(parsed.astaPath);
    await this.paths.assertFileReadable(pumlPath);
    await this.paths.ensureParentDir(astaPath);

    const bridge = this.getBridgeCommand();
    const result = await this.processRunner.runCommand(
      bridge.command,
      this.applyTemplate(bridge.argsTemplate, {
        puml: pumlPath,
        asta: astaPath,
        diagramType: parsed.diagramType ?? ""
      }),
      { timeoutMs: readRuntimeConfig().astahImportTimeoutMs }
    );
    if (result.timedOut || result.exitCode !== 0) {
      throw new Error(
        `import_puml failed (exit=${result.exitCode}, timedOut=${result.timedOut}): ${result.stderr || "unknown error"}`
      );
    }
    return this.responseFactory.build({
      ok: true,
      message: "PlantUML imported to Astah successfully.",
      startedAt,
      paths: { input: pumlPath, asta: astaPath },
      commands: [result]
    });
  }

  async exportPng(input: unknown): Promise<ToolResponse> {
    const schema = z.object({
      astaPath: z.string().min(1),
      outputDir: z.string().min(1),
      imageType: z.string().default("png")
    });
    const startedAt = new Date();
    const parsed = schema.parse(input);
    const astaPath = this.paths.resolvePath(parsed.astaPath);
    const outputDir = this.paths.resolvePath(parsed.outputDir);
    await this.paths.assertFileReadable(astaPath);
    await this.paths.ensureDir(outputDir);
    const astah = this.resolveAstahCommand();
    const args = [...astah.baseArgs, "-f", astaPath, "-image", "-t", parsed.imageType, "-o", outputDir];
    const result = await this.processRunner.runCommand(astah.command, args, {
      timeoutMs: readRuntimeConfig().astahExportTimeoutMs
    });
    if (result.timedOut || result.exitCode !== 0) {
      throw new Error(
        `export_png failed (exit=${result.exitCode}, timedOut=${result.timedOut}): ${result.stderr || "unknown error"}`
      );
    }
    const expectedImage = path.join(outputDir, `${path.parse(astaPath).name}.${parsed.imageType}`);
    return this.responseFactory.build({
      ok: true,
      message: "Astah export completed successfully.",
      startedAt,
      paths: { asta: astaPath, outputDir, images: [expectedImage] },
      commands: [result]
    });
  }

  async convertAndExport(input: unknown): Promise<ToolResponse> {
    const schema = z.object({
      pumlPath: z.string().min(1),
      astaPath: z.string().optional(),
      pngOutDir: z.string().min(1),
      hostOutputDir: z.string().optional(),
      diagramType: z.string().optional(),
      imageType: z.string().default("png")
    });
    const startedAt = new Date();
    const parsed = schema.parse(input);
    const pumlPath = this.paths.resolvePath(parsed.pumlPath);
    const astaPath = parsed.astaPath
      ? this.paths.resolvePath(parsed.astaPath)
      : this.paths.defaultAstaPathFromPuml(pumlPath);
    const targetOutput = parsed.hostOutputDir && parsed.hostOutputDir.trim()
      ? parsed.hostOutputDir
      : parsed.pngOutDir;
    const pngOutDir = this.paths.resolvePath(targetOutput);
    const importResult = await this.importPuml({ pumlPath, astaPath, diagramType: parsed.diagramType });
    const exportResult = await this.exportPng({ astaPath, outputDir: pngOutDir, imageType: parsed.imageType });
    return this.responseFactory.build({
      ok: importResult.ok && exportResult.ok,
      message: "Pipeline completed successfully.",
      startedAt,
      paths: { input: pumlPath, asta: astaPath, outputDir: pngOutDir, images: exportResult.paths.images },
      metadata: { importTiming: importResult.timings, exportTiming: exportResult.timings }
    });
  }

  async health(input: unknown): Promise<ToolResponse> {
    const schema = z.object({ detail: z.enum(["basic", "full"]).default("basic") });
    const startedAt = new Date();
    const parsed = schema.parse(input ?? {});
    const checks: Record<string, unknown> = {
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      bridgeCommandConfigured: Boolean(readRuntimeConfig().astahPluginBridgeCmd),
      astahCommand: this.resolveAstahCommand().command
    };
    const commands = [];
    try {
      const astah = this.resolveAstahCommand();
      const versionResult = await this.processRunner.runCommand(astah.command, [...astah.baseArgs, "-version"], {
        timeoutMs: 20000
      });
      commands.push(versionResult);
      checks.astahVersionExitCode = versionResult.exitCode;
    } catch (error) {
      checks.astahVersionError = (error as Error).message;
    }
    return this.responseFactory.build({
      ok: true,
      message: "Health check complete.",
      startedAt,
      commands,
      metadata: parsed.detail === "full" ? checks : { platform: checks.platform, nodeVersion: checks.nodeVersion }
    });
  }

  async astahApiCatalog(input: unknown): Promise<ToolResponse> {
    const schema = z.object({
      mode: z.enum(["classes", "methods"]).default("classes"),
      className: z.string().optional(),
      packagePrefix: z.string().default("com/change_vision/jude/api/inf/")
    });
    const startedAt = new Date();
    const parsed = schema.parse(input ?? {});
    if (parsed.mode === "methods") {
      if (!parsed.className) {
        throw new Error("className is required for mode=methods.");
      }
      const methods = await this.astahApi.listClassMethods(parsed.className);
      return this.responseFactory.build({
        ok: true,
        message: `Listed methods for ${parsed.className}.`,
        startedAt,
        metadata: { className: parsed.className, methods }
      });
    }
    const classes = await this.astahApi.listApiClasses(parsed.packagePrefix);
    return this.responseFactory.build({
      ok: true,
      message: `Listed ${classes.length} API classes.`,
      startedAt,
      metadata: { packagePrefix: parsed.packagePrefix, classes }
    });
  }

  async astahApiRun(input: unknown): Promise<ToolResponse> {
    const schema = z.object({
      className: z.string().default("AstahMcpRunner"),
      sourceCode: z.string().min(1),
      args: z.array(z.string()).default([]),
      includeSamples: z.boolean().default(false)
    });
    const startedAt = new Date();
    const parsed = schema.parse(input);
    const run = await this.astahApi.runUserJava({
      className: parsed.className,
      sourceCode: parsed.sourceCode,
      args: parsed.args
    });
    return this.responseFactory.build({
      ok: run.exitCode === 0,
      message: run.exitCode === 0 ? "Java runner completed." : "Java runner failed.",
      startedAt,
      metadata: parsed.includeSamples ? { sampleFiles: await this.astahApi.readSampleJavaFiles() } : undefined,
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

  async astahCliInfo(): Promise<ToolResponse> {
    const startedAt = new Date();
    const catalog = await this.cliCatalog.inspectCapabilities();
    return this.responseFactory.build({
      ok: true,
      message: "Astah CLI capability catalog generated.",
      startedAt,
      metadata: catalog
    });
  }

  async astahExportImage(input: unknown): Promise<ToolResponse> {
    return await this.exportPng(input);
  }

  async astahBatchRun(input: unknown): Promise<ToolResponse> {
    const schema = z.object({
      operation: z.enum(["version", "help"]),
      timeoutMs: z.number().int().positive().max(120000).optional()
    });
    const startedAt = new Date();
    const parsed = schema.parse(input ?? {});
    const astah = this.resolveAstahCommand();
    const opFlag = parsed.operation === "help" ? "-help" : "-version";
    const result = await this.processRunner.runCommand(astah.command, [...astah.baseArgs, opFlag], {
      timeoutMs: parsed.timeoutMs ?? 20000
    });
    return this.responseFactory.build({
      ok: result.exitCode === 0 && !result.timedOut,
      message: `Batch operation '${parsed.operation}' completed.`,
      startedAt,
      commands: [result],
      metadata: { operation: parsed.operation }
    });
  }

  async astahValidatePaths(input: unknown): Promise<ToolResponse> {
    const schema = z.object({
      pumlPath: z.string().optional(),
      astaPath: z.string().optional(),
      outputDir: z.string().optional()
    });
    const startedAt = new Date();
    const parsed = schema.parse(input ?? {});
    const validated: Record<string, string> = {};
    if (parsed.pumlPath) {
      const resolved = this.paths.resolvePath(parsed.pumlPath);
      await this.paths.assertFileReadable(resolved);
      validated.pumlPath = resolved;
    }
    if (parsed.astaPath) {
      const resolved = this.paths.resolvePath(parsed.astaPath);
      await this.paths.ensureParentDir(resolved);
      validated.astaPath = resolved;
    }
    if (parsed.outputDir) {
      const resolved = this.paths.resolvePath(parsed.outputDir);
      await this.paths.ensureDir(resolved);
      validated.outputDir = resolved;
    }
    return this.responseFactory.build({
      ok: true,
      message: "Path validation complete.",
      startedAt,
      metadata: validated
    });
  }
}
