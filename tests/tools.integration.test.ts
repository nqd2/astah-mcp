import path from "node:path";
import { access } from "node:fs/promises";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { importPumlTool } from "../src/tools/importPuml.js";
import { exportPngTool } from "../src/tools/exportPng.js";
import { convertAndExportTool } from "../src/tools/convertAndExport.js";
import { cleanup, createPuml, createTempDir } from "./helpers.js";

describe("tools integration", () => {
  let tempDir = "";
  let oldBridge = "";
  let oldAstahCommand = "";

  beforeEach(async () => {
    tempDir = await createTempDir("astah-mcp-tests-");
    oldBridge = process.env.ASTAH_PLUGIN_BRIDGE_CMD ?? "";
    oldAstahCommand = process.env.ASTAH_COMMAND ?? "";
    process.env.ASTAH_PLUGIN_BRIDGE_CMD = `"${process.execPath}" "${path.join(process.cwd(), "tests/fixtures/mock-bridge.mjs")}" --puml {puml} --asta {asta} --diagramType {diagramType}`;
    process.env.ASTAH_COMMAND = process.execPath;
  });

  afterEach(async () => {
    process.env.ASTAH_PLUGIN_BRIDGE_CMD = oldBridge;
    process.env.ASTAH_COMMAND = oldAstahCommand;
    await cleanup(tempDir);
  });

  it("import_puml writes asta file", async () => {
    const pumlPath = await createPuml(tempDir, "import-case");
    const astaPath = path.join(tempDir, "output", "import-case.asta");
    const response = await importPumlTool({ pumlPath, astaPath });
    await access(astaPath);
    expect(response.ok).toBe(true);
  });

  it("export_png writes image file", async () => {
    const pumlPath = await createPuml(tempDir, "export-case");
    const astaPath = path.join(tempDir, "export-case.asta");
    await importPumlTool({ pumlPath, astaPath });

    process.env.ASTAH_COMMAND = `"${process.execPath}" "${path.join(process.cwd(), "tests/fixtures/mock-export.mjs")}"`;
    const outDir = path.join(tempDir, "images");
    const response = await exportPngTool({ astaPath, outputDir: outDir, imageType: "png" });
    await access(path.join(outDir, "export-case.png"));
    expect(response.ok).toBe(true);
  });

  it("convert_and_export runs full pipeline", async () => {
    const pumlPath = await createPuml(tempDir, "pipeline-case");
    process.env.ASTAH_COMMAND = `"${process.execPath}" "${path.join(process.cwd(), "tests/fixtures/mock-export.mjs")}"`;

    const outDir = path.join(tempDir, "pipeline-images");
    const response = await convertAndExportTool({ pumlPath, pngOutDir: outDir });
    await access(path.join(outDir, "pipeline-case.png"));
    expect(response.ok).toBe(true);
  });

  it("fails strictly when bridge command fails", async () => {
    const pumlPath = await createPuml(tempDir, "negative-case");
    const astaPath = path.join(tempDir, "negative-case.asta");
    process.env.ASTAH_PLUGIN_BRIDGE_CMD = `"${process.execPath}" "${path.join(process.cwd(), "tests/fixtures/mock-fail.mjs")}"`;

    await expect(importPumlTool({ pumlPath, astaPath })).rejects.toThrow(/failed/);
  });

  it("fails when input puml does not exist", async () => {
    const missing = path.join(tempDir, "missing.puml");
    const astaPath = path.join(tempDir, "missing.asta");
    await expect(importPumlTool({ pumlPath: missing, astaPath })).rejects.toThrow(/not readable/);
  });
});
