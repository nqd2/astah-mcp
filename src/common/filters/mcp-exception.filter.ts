import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class McpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    if (res.headersSent) {
      return;
    }
    const message = exception instanceof Error ? exception.message : "Unknown MCP error";
    res.status(500).json({
      jsonrpc: "2.0",
      error: { code: -32603, message },
      id: null
    });
  }
}
