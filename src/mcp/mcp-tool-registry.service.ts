import { Injectable } from "@nestjs/common";
import { McpServer, fromJsonSchema } from "@modelcontextprotocol/server";
import { ToolService } from "../tools/tool.service.js";

function textResult(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }]
  };
}

function objectSchema(properties: Record<string, unknown>, required: string[] = []) {
  return fromJsonSchema({
    type: "object",
    properties,
    required
  });
}

@Injectable()
export class McpToolRegistryService {
  constructor(private readonly tools: ToolService) {}

  createServer(): McpServer {
    const server = new McpServer({ name: "astah-mcp", version: "0.2.0" });

    server.registerTool(
      "import_puml",
      {
        description: "Import PlantUML file into Astah project file.",
        inputSchema: objectSchema(
          {
            pumlPath: { type: "string", minLength: 1 },
            astaPath: { type: "string", minLength: 1 },
            diagramType: { type: "string" }
          },
          ["pumlPath", "astaPath"]
        )
      },
      async (args: any) => textResult(await this.tools.importPuml(args))
    );
    server.registerTool(
      "export_png",
      {
        description: "Export diagrams from .asta to image files.",
        inputSchema: objectSchema(
          {
            astaPath: { type: "string", minLength: 1 },
            outputDir: { type: "string", minLength: 1 },
            imageType: { type: "string", default: "png" }
          },
          ["astaPath", "outputDir"]
        )
      },
      async (args: any) => textResult(await this.tools.exportPng(args))
    );
    server.registerTool(
      "convert_and_export",
      {
        description: "Run full pipeline from .puml to .asta and export image.",
        inputSchema: objectSchema(
          {
            pumlPath: { type: "string", minLength: 1 },
            astaPath: { type: "string" },
            pngOutDir: { type: "string", minLength: 1 },
            hostOutputDir: { type: "string" },
            diagramType: { type: "string" },
            imageType: { type: "string", default: "png" }
          },
          ["pumlPath", "pngOutDir"]
        )
      },
      async (args: any) => textResult(await this.tools.convertAndExport(args))
    );
    server.registerTool(
      "health",
      {
        description: "Return runtime diagnostics and command availability checks.",
        inputSchema: objectSchema({
          detail: { type: "string", enum: ["basic", "full"], default: "basic" }
        })
      },
      async (args: any) => textResult(await this.tools.health(args))
    );
    server.registerTool(
      "astah_api_catalog",
      {
        description: "List Astah API classes or inspect methods by class.",
        inputSchema: objectSchema({
          mode: { type: "string", enum: ["classes", "methods"], default: "classes" },
          className: { type: "string" },
          packagePrefix: { type: "string" }
        })
      },
      async (args: any) => textResult(await this.tools.astahApiCatalog(args))
    );
    server.registerTool(
      "astah_api_run",
      {
        description:
          "Compile and run user-provided Java code against local astah-api.jar and return logs.",
        inputSchema: objectSchema(
          {
            className: { type: "string", default: "AstahMcpRunner" },
            sourceCode: { type: "string", minLength: 1 },
            args: { type: "array", items: { type: "string" }, default: [] },
            includeSamples: { type: "boolean", default: false }
          },
          ["sourceCode"]
        )
      },
      async (args: any) => textResult(await this.tools.astahApiRun(args))
    );

    // Explicit Astah-CLI feature tools (Windows-first)
    server.registerTool(
      "astah_cli_info",
      {
        description: "Inspect Astah CLI version/help and capability matrix.",
        inputSchema: objectSchema({})
      },
      async () => textResult(await this.tools.astahCliInfo())
    );
    server.registerTool(
      "astah_export_image",
      {
        description: "Explicit export tool for Astah CLI image output.",
        inputSchema: objectSchema(
          {
            astaPath: { type: "string", minLength: 1 },
            outputDir: { type: "string", minLength: 1 },
            imageType: { type: "string", default: "png" }
          },
          ["astaPath", "outputDir"]
        )
      },
      async (args: any) => textResult(await this.tools.astahExportImage(args))
    );
    server.registerTool(
      "astah_batch_run",
      {
        description: "Run allowlisted Astah CLI batch operations.",
        inputSchema: objectSchema(
          {
            operation: { type: "string", enum: ["version", "help"] },
            timeoutMs: { type: "integer", minimum: 1, maximum: 120000 }
          },
          ["operation"]
        )
      },
      async (args: any) => textResult(await this.tools.astahBatchRun(args))
    );
    server.registerTool(
      "astah_validate_paths",
      {
        description: "Validate and normalize paths for Astah operations.",
        inputSchema: objectSchema({
          pumlPath: { type: "string" },
          astaPath: { type: "string" },
          outputDir: { type: "string" }
        })
      },
      async (args: any) => textResult(await this.tools.astahValidatePaths(args))
    );

    return server;
  }
}
