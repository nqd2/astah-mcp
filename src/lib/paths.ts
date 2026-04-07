import { PathService } from "../common/services/path.service.js";

const pathService = new PathService();

export function resolvePath(inputPath: string, cwd = process.cwd()): string {
  return pathService.resolvePath(inputPath, cwd);
}

export async function ensureParentDir(filePath: string): Promise<void> {
  await pathService.ensureParentDir(filePath);
}

export async function ensureDir(dirPath: string): Promise<void> {
  await pathService.ensureDir(dirPath);
}

export async function assertFileReadable(filePath: string): Promise<void> {
  await pathService.assertFileReadable(filePath);
}

export function defaultAstaPathFromPuml(pumlPath: string): string {
  return pathService.defaultAstaPathFromPuml(pumlPath);
}
