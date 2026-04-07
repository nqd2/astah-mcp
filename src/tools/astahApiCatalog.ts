import { z } from "zod";
import { listApiClasses, listClassMethods } from "../lib/astahApi.js";
import { buildToolResponse } from "../lib/responses.js";
import type { ToolResponse } from "../types/contracts.js";

const schema = z.object({
  mode: z.enum(["classes", "methods"]).default("classes"),
  className: z.string().optional(),
  packagePrefix: z.string().default("com/change_vision/jude/api/inf/")
});

export async function astahApiCatalogTool(input: unknown): Promise<ToolResponse> {
  const startedAt = new Date();
  const parsed = schema.parse(input ?? {});

  if (parsed.mode === "methods") {
    if (!parsed.className) {
      throw new Error("className is required for mode=methods.");
    }
    const methods = await listClassMethods(parsed.className);
    return buildToolResponse({
      ok: true,
      message: `Listed methods for ${parsed.className}.`,
      startedAt,
      metadata: { className: parsed.className, methods }
    });
  }

  const classes = await listApiClasses(parsed.packagePrefix);
  return buildToolResponse({
    ok: true,
    message: `Listed ${classes.length} API classes.`,
    startedAt,
    metadata: { packagePrefix: parsed.packagePrefix, classes }
  });
}
