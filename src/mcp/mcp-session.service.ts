import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { isInitializeRequest } from "@modelcontextprotocol/server";
import { McpToolRegistryService } from "./mcp-tool-registry.service.js";

@Injectable()
export class McpSessionService {
  private readonly transports: Record<string, NodeStreamableHTTPServerTransport> = {};

  constructor(private readonly toolRegistry: McpToolRegistryService) {}

  async handlePost(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: NodeStreamableHTTPServerTransport;

    if (sessionId && this.transports[sessionId]) {
      transport = this.transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new NodeStreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          this.transports[id] = transport;
        }
      });
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && this.transports[sid]) {
          delete this.transports[sid];
        }
      };
      await this.toolRegistry.createServer().connect(transport);
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Missing or invalid session initialization." },
        id: null
      });
      return;
    }
    await transport.handleRequest(req, res, req.body);
  }

  async handleGetOrDelete(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !this.transports[sessionId]) {
      res.status(400).send("Missing or invalid session ID.");
      return;
    }
    await this.transports[sessionId].handleRequest(req, res);
  }
}
