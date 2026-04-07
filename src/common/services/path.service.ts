import { Injectable } from "@nestjs/common";
import path from "node:path";
import { access, mkdir } from "node:fs/promises";
import { constants } from "node:fs";

@Injectable()
export class PathService {
  resolvePath(inputPath: string, cwd = process.cwd()): string {
    if (!inputPath || !inputPath.trim()) {
      throw new Error("Path is required.");
    }
    return path.isAbsolute(inputPath)
      ? path.normalize(inputPath)
      : path.normalize(path.resolve(cwd, inputPath));
  }

  async ensureParentDir(filePath: string): Promise<void> {
    await mkdir(path.dirname(filePath), { recursive: true });
  }

  async ensureDir(dirPath: string): Promise<void> {
    await mkdir(dirPath, { recursive: true });
  }

  async assertFileReadable(filePath: string): Promise<void> {
    try {
      await access(filePath, constants.R_OK);
    } catch {
      throw new Error(`File is not readable: ${filePath}`);
    }
  }

  defaultAstaPathFromPuml(pumlPath: string): string {
    const ext = path.extname(pumlPath);
    return pumlPath.slice(0, pumlPath.length - ext.length) + ".asta";
  }
}
