import { Module } from "@nestjs/common";
import { ToolsModule } from "../tools/tools.module.js";
import { McpController } from "./mcp.controller.js";
import { McpSessionService } from "./mcp-session.service.js";
import { McpToolRegistryService } from "./mcp-tool-registry.service.js";

@Module({
  imports: [ToolsModule],
  controllers: [McpController],
  providers: [McpSessionService, McpToolRegistryService]
})
export class McpModule {}
