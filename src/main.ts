import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { json } from "express";
import { AppModule } from "./app.module.js";
import { readRuntimeConfig } from "./common/config/runtime-config.js";
import { McpExceptionFilter } from "./common/filters/mcp-exception.filter.js";

export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: "2mb" }));
  app.useGlobalFilters(new McpExceptionFilter());
  const config = readRuntimeConfig();
  await app.listen(config.port, config.host);
  console.log(`astah-mcp listening on http://${config.host}:${config.port}/mcp`);
}
