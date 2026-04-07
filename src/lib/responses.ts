import type { CommandResult, ToolPaths, ToolResponse } from "../types/contracts.js";
import { ToolResponseFactory } from "../common/services/tool-response.factory.js";

const responseFactory = new ToolResponseFactory();

export function buildToolResponse(params: {
  ok: boolean;
  message: string;
  startedAt: Date;
  paths?: ToolPaths;
  commands?: CommandResult[];
  metadata?: Record<string, unknown>;
}): ToolResponse {
  return responseFactory.build(params);
}
