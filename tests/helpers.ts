import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export async function createTempDir(prefix: string): Promise<string> {
  return await mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function createPuml(dir: string, name = "sample"): Promise<string> {
  const file = path.join(dir, `${name}.puml`);
  await writeFile(file, "@startuml\nAlice -> Bob: Hi\n@enduml\n", "utf8");
  return file;
}

export async function cleanup(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}
