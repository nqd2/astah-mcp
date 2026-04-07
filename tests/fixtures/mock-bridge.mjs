import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const pumlIndex = args.indexOf("--puml");
const astaIndex = args.indexOf("--asta");
const diagramTypeIndex = args.indexOf("--diagramType");
const puml = pumlIndex >= 0 ? args[pumlIndex + 1] : undefined;
const asta = astaIndex >= 0 ? args[astaIndex + 1] : undefined;
const diagramType = diagramTypeIndex >= 0 ? args[diagramTypeIndex + 1] : "unknown";

if (!puml || !asta) {
  console.error("Missing --puml or --asta");
  process.exit(2);
}

await mkdir(path.dirname(asta), { recursive: true });
await writeFile(asta, `mock asta for ${puml}, diagramType=${diagramType}\n`, "utf8");
console.log(`created ${asta}`);
