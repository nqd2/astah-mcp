import path from "node:path";
import { access } from "node:fs/promises";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { createPuml, createTempDir, cleanup } from "./helpers.js";
import { ToolService } from "../src/tools/tool.service.js";
import { PathService } from "../src/common/services/path.service.js";
import { ProcessRunnerService } from "../src/common/services/process-runner.service.js";
import { ToolResponseFactory } from "../src/common/services/tool-response.factory.js";
import { AstahApiService } from "../src/common/services/astah-api.service.js";
import { AstahCliCatalogService } from "../src/common/services/astah-cli-catalog.service.js";

function createToolService(): ToolService {
  const processRunner = new ProcessRunnerService();
  return new ToolService(
    new PathService(),
    processRunner,
    new ToolResponseFactory(),
    new AstahApiService(processRunner),
    new AstahCliCatalogService(processRunner)
  );
}

describe("tool contract + explicit astah-cli tools", () => {
  let tempDir = "";
  let oldBridge = "";
  let oldAstahCommand = "";
  let tools: ToolService;

  beforeEach(async () => {
    tempDir = await createTempDir("astah-mcp-contracts-");
    oldBridge = process.env.ASTAH_PLUGIN_BRIDGE_CMD ?? "";
    oldAstahCommand = process.env.ASTAH_COMMAND ?? "";
    process.env.ASTAH_PLUGIN_BRIDGE_CMD = `"${process.execPath}" "${path.join(process.cwd(), "tests/fixtures/mock-bridge.mjs")}" --puml {puml} --asta {asta} --diagramType {diagramType}`;
    process.env.ASTAH_COMMAND = `"${process.execPath}" "${path.join(process.cwd(), "tests/fixtures/mock-export.mjs")}"`;
    tools = createToolService();
  });

  afterEach(async () => {
    process.env.ASTAH_PLUGIN_BRIDGE_CMD = oldBridge;
    process.env.ASTAH_COMMAND = oldAstahCommand;
    await cleanup(tempDir);
  });

  it("returns baseline response contract for explicit export tool", async () => {
    const pumlPath = await createPuml(tempDir, "contract-case");
    const astaPath = path.join(tempDir, "contract-case.asta");
    await tools.importPuml({ pumlPath, astaPath });
    const outputDir = path.join(tempDir, "images");
    const response = await tools.astahExportImage({ astaPath, outputDir, imageType: "png" });
    await access(path.join(outputDir, "contract-case.png"));
    expect(response).toMatchObject({
      ok: true,
      message: expect.any(String),
      exitCode: expect.any(Number),
      paths: expect.any(Object),
      stdout: expect.any(String),
      stderr: expect.any(String),
      timings: expect.any(Object),
      platform: expect.any(String),
      commandSummary: expect.any(Array)
    });
  });

  it("returns cli capability catalog with explicit feature mapping", async () => {
    const response = await tools.astahCliInfo();
    const metadata = (response.metadata ?? {}) as Record<string, unknown>;
    const features = metadata.features as Array<Record<string, string>>;
    expect(response.ok).toBe(true);
    expect(Array.isArray(features)).toBe(true);
    expect(features.some((feature) => feature.toolName === "astah_export_image")).toBe(true);
  });

  it("runs allowlisted batch operation only", async () => {
    const response = await tools.astahBatchRun({ operation: "help" });
    expect(response.metadata).toMatchObject({ operation: "help" });
    expect(response.commandSummary.length).toBeGreaterThan(0);
    await expect(tools.astahBatchRun({ operation: "unknown" })).rejects.toThrow();
  });
});
