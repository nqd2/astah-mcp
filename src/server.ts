#!/usr/bin/env node
import { bootstrap } from "./main.js";

bootstrap().catch((error) => {
  console.error("Failed to start astah-mcp:", error);
  process.exit(1);
});
