import { Injectable } from "@nestjs/common";
import path from "node:path";
import os from "node:os";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { ProcessRunnerService } from "./process-runner.service.js";

@Injectable()
export class AstahApiService {
  constructor(private readonly processRunner: ProcessRunnerService) {}

  private rootDir(): string {
    return path.resolve(process.cwd(), "..");
  }

  resolveAstahClasspath(): string {
    const root = process.env.ASTAH_HOME ? path.resolve(process.env.ASTAH_HOME) : this.rootDir();
    return [
      path.join(root, "astah-api.jar"),
      path.join(root, "astah-uml.jar"),
      path.join(root, "astah-pro.jar"),
      path.join(root, "astah-community.jar")
    ].join(path.delimiter);
  }

  async listApiClasses(prefix = "com/change_vision/jude/api/inf/"): Promise<string[]> {
    const root = process.env.ASTAH_HOME ? path.resolve(process.env.ASTAH_HOME) : this.rootDir();
    const jarPath = path.join(root, "astah-api.jar");
    const result = await this.processRunner.runCommand("jar", ["tf", jarPath], { timeoutMs: 60000 });
    if (result.exitCode !== 0) {
      throw new Error(`Failed to list astah-api classes: ${result.stderr}`);
    }
    return result.stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith(prefix) && line.endsWith(".class") && !line.includes("$"))
      .map((line) => line.replaceAll("/", ".").replace(/\.class$/, ""))
      .sort();
  }

  async listClassMethods(className: string): Promise<string[]> {
    const cp = this.resolveAstahClasspath();
    const result = await this.processRunner.runCommand("javap", ["-classpath", cp, className], {
      timeoutMs: 60000
    });
    if (result.exitCode !== 0) {
      throw new Error(`Failed to inspect class: ${result.stderr}`);
    }
    return result.stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("public") && line.includes("("));
  }

  async runUserJava(params: {
    className: string;
    sourceCode: string;
    args?: string[];
  }): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
    const workDir = await mkdtemp(path.join(os.tmpdir(), "astah-mcp-java-"));
    const javaFile = path.join(workDir, `${params.className}.java`);
    const cp = `${this.resolveAstahClasspath()}${path.delimiter}${workDir}`;
    try {
      await writeFile(javaFile, params.sourceCode, "utf8");
      const compile = await this.processRunner.runCommand("javac", ["-classpath", cp, javaFile], {
        cwd: workDir,
        timeoutMs: 120000
      });
      if (compile.exitCode !== 0) {
        throw new Error(`Java compile failed:\n${compile.stderr || compile.stdout}`);
      }
      const run = await this.processRunner.runCommand(
        "java",
        ["-classpath", cp, params.className, ...(params.args ?? [])],
        { cwd: workDir, timeoutMs: 180000 }
      );
      return { stdout: run.stdout, stderr: run.stderr, exitCode: run.exitCode };
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  async readSampleJavaFiles(): Promise<Record<string, string>> {
    const apiSampleDir = path.resolve(this.rootDir(), "api", "sample");
    const targets = [
      path.join(apiSampleDir, "simpleRead", "APIForReadingModelsSample.java"),
      path.join(apiSampleDir, "simpleEdit", "APIForEditingModelsSample.java"),
      path.join(apiSampleDir, "simpleDgmRead", "APIForReadingDgmModelsSample.java"),
      path.join(apiSampleDir, "simpleDgmEdit", "APIForCreatingPresentationsSample.java")
    ];
    const out: Record<string, string> = {};
    for (const file of targets) {
      try {
        out[path.basename(file)] = await readFile(file, "utf8");
      } catch {
        // Ignore missing sample files.
      }
    }
    const sampleFolders = await readdir(apiSampleDir, { withFileTypes: true }).catch(() => []);
    out.__sampleFolders = sampleFolders.filter((d) => d.isDirectory()).map((d) => d.name).join(", ");
    return out;
  }
}
