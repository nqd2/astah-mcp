import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const fileIndex = args.indexOf("-f");
const outIndex = args.indexOf("-o");
const typeIndex = args.indexOf("-t");

const asta = fileIndex >= 0 ? args[fileIndex + 1] : undefined;
const outDir = outIndex >= 0 ? args[outIndex + 1] : undefined;
const imageType = typeIndex >= 0 ? args[typeIndex + 1] : "png";

if (!asta || !outDir) {
  console.error("Missing -f or -o");
  process.exit(2);
}

await mkdir(outDir, { recursive: true });
const fileName = `${path.parse(asta).name}.${imageType}`;
await writeFile(path.join(outDir, fileName), "mock image", "utf8");
console.log(`exported ${fileName}`);
