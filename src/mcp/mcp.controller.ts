import { Controller, Delete, Get, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { McpSessionService } from "./mcp-session.service.js";

@Controller("mcp")
export class McpController {
  constructor(private readonly sessions: McpSessionService) {}

  @Post()
  async post(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.sessions.handlePost(req, res);
  }

  @Get()
  async get(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.sessions.handleGetOrDelete(req, res);
  }

  @Delete()
  async del(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.sessions.handleGetOrDelete(req, res);
  }
}
