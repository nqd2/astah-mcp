import { Module } from "@nestjs/common";
import { ProcessRunnerService } from "./services/process-runner.service.js";
import { PathService } from "./services/path.service.js";
import { ToolResponseFactory } from "./services/tool-response.factory.js";
import { AstahApiService } from "./services/astah-api.service.js";
import { AstahCliCatalogService } from "./services/astah-cli-catalog.service.js";

@Module({
  providers: [
    ProcessRunnerService,
    PathService,
    ToolResponseFactory,
    AstahApiService,
    AstahCliCatalogService
  ],
  exports: [
    ProcessRunnerService,
    PathService,
    ToolResponseFactory,
    AstahApiService,
    AstahCliCatalogService
  ]
})
export class CommonModule {}
