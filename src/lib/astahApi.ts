import { AstahApiService } from "../common/services/astah-api.service.js";
import { ProcessRunnerService } from "../common/services/process-runner.service.js";

const astahApi = new AstahApiService(new ProcessRunnerService());

export function resolveAstahClasspath(): string {
  return astahApi.resolveAstahClasspath();
}

export async function listApiClasses(prefix = "com/change_vision/jude/api/inf/"): Promise<string[]> {
  return await astahApi.listApiClasses(prefix);
}

export async function listClassMethods(className: string): Promise<string[]> {
  return await astahApi.listClassMethods(className);
}

export async function runUserJava(params: {
  className: string;
  sourceCode: string;
  args?: string[];
}): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return await astahApi.runUserJava(params);
}

export async function readSampleJavaFiles(): Promise<Record<string, string>> {
  return await astahApi.readSampleJavaFiles();
}
