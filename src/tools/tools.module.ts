import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module.js";
import { ToolService } from "./tool.service.js";

@Module({
  imports: [CommonModule],
  providers: [ToolService],
  exports: [ToolService]
})
export class ToolsModule {}
