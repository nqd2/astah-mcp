import { Injectable } from "@nestjs/common";
import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { ToolService } from "../tools/tool.service.js";

function textResult(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }]
  };
}

@Injectable()
export class McpToolRegistryService {
  constructor(private readonly tools: ToolService) {}

  createServer(): McpServer {
    const server = new McpServer({ name: "astah-mcp", version: "0.2.0" });

    server.registerTool(
      "import_puml",
      { description: "Import PlantUML file into Astah project file.", inputSchema: z.object({ pumlPath: z.string().min(1), astaPath: z.string().min(1), diagramType: z.string().optional() }) as any },
      async (args: any) => textResult(await this.tools.importPuml(args))
    );
    server.registerTool(
      "export_png",
      { description: "Export diagrams from .asta to image files.", inputSchema: z.object({ astaPath: z.string().min(1), outputDir: z.string().min(1), imageType: z.string().default("png") }) as any },
      async (args: any) => textResult(await this.tools.exportPng(args))
    );
    server.registerTool(
      "convert_and_export",
      { description: "Run full pipeline from .puml to .asta and export image.", inputSchema: z.object({ pumlPath: z.string().min(1), astaPath: z.string().optional(), pngOutDir: z.string().min(1), diagramType: z.string().optional(), imageType: z.string().default("png") }) as any },
      async (args: any) => textResult(await this.tools.convertAndExport(args))
    );
    server.registerTool(
      "health",
      { description: "Return runtime diagnostics and command availability checks.", inputSchema: z.object({ detail: z.enum(["basic", "full"]).default("basic") }) as any },
      async (args: any) => textResult(await this.tools.health(args))
    );
    server.registerTool(
      "astah_api_catalog",
      { description: "List Astah API classes or inspect methods by class.", inputSchema: z.object({ mode: z.enum(["classes", "methods"]).default("classes"), className: z.string().optional(), packagePrefix: z.string().optional() }) as any },
      async (args: any) => textResult(await this.tools.astahApiCatalog(args))
    );
    server.registerTool(
      "astah_api_run",
      { description: "Compile and run user-provided Java code against local astah-api.jar and return logs.", inputSchema: z.object({ className: z.string().default("AstahMcpRunner"), sourceCode: z.string().min(1), args: z.array(z.string()).default([]), includeSamples: z.boolean().default(false) }) as any },
      async (args: any) => textResult(await this.tools.astahApiRun(args))
    );

    // Explicit Astah-CLI feature tools (Windows-first)
    server.registerTool("astah_cli_info", { description: "Inspect Astah CLI version/help and capability matrix.", inputSchema: z.object({}) as any }, async () => textResult(await this.tools.astahCliInfo()));
    server.registerTool("astah_export_image", { description: "Explicit export tool for Astah CLI image output.", inputSchema: z.object({ astaPath: z.string().min(1), outputDir: z.string().min(1), imageType: z.string().default("png") }) as any }, async (args: any) => textResult(await this.tools.astahExportImage(args)));
    server.registerTool("astah_batch_run", { description: "Run allowlisted Astah CLI batch operations.", inputSchema: z.object({ operation: z.enum(["version", "help"]), timeoutMs: z.number().int().positive().max(120000).optional() }) as any }, async (args: any) => textResult(await this.tools.astahBatchRun(args)));
    server.registerTool("astah_validate_paths", { description: "Validate and normalize paths for Astah operations.", inputSchema: z.object({ pumlPath: z.string().optional(), astaPath: z.string().optional(), outputDir: z.string().optional() }) as any }, async (args: any) => textResult(await this.tools.astahValidatePaths(args)));

    return server;
  }
}
