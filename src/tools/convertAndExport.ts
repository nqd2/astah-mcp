import { z } from "zod";
import { defaultAstaPathFromPuml, resolvePath } from "../lib/paths.js";
import { buildToolResponse } from "../lib/responses.js";
import { importPumlTool } from "./importPuml.js";
import { exportPngTool } from "./exportPng.js";
import type { ToolResponse } from "../types/contracts.js";

const pipelineSchema = z.object({
  pumlPath: z.string().min(1),
  astaPath: z.string().optional(),
  pngOutDir: z.string().min(1),
  diagramType: z.string().optional(),
  imageType: z.string().default("png")
});

export async function convertAndExportTool(input: unknown): Promise<ToolResponse> {
  const startedAt = new Date();
  const parsed = pipelineSchema.parse(input);

  const pumlPath = resolvePath(parsed.pumlPath);
  const astaPath = parsed.astaPath
    ? resolvePath(parsed.astaPath)
    : defaultAstaPathFromPuml(pumlPath);
  const pngOutDir = resolvePath(parsed.pngOutDir);

  const importResult = await importPumlTool({
    pumlPath,
    astaPath,
    diagramType: parsed.diagramType
  });

  if (!importResult.ok) {
    throw new Error("convert_and_export failed at import step.");
  }

  const exportResult = await exportPngTool({
    astaPath,
    outputDir: pngOutDir,
    imageType: parsed.imageType
  });

  if (!exportResult.ok) {
    throw new Error("convert_and_export failed at export step.");
  }

  return buildToolResponse({
    ok: true,
    message: "Pipeline completed successfully.",
    startedAt,
    paths: {
      input: pumlPath,
      asta: astaPath,
      outputDir: pngOutDir,
      images: exportResult.paths.images
    },
    metadata: {
      importTiming: importResult.timings,
      exportTiming: exportResult.timings
    }
  });
}
