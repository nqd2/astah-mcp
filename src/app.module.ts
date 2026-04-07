import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { McpModule } from "./mcp/mcp.module.js";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), McpModule]
})
export class AppModule {}
