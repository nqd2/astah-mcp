#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx < 0 || idx + 1 >= process.argv.length) return "";
  return process.argv[idx + 1];
}

const astaPath = getArg("-f");
const type = getArg("-t") || "png";
const outDir = getArg("-o");

if (!astaPath || !outDir) {
  console.error("mock-export.js requires -f <astaPath> and -o <outputDir>");
  process.exit(1);
}

if (!fs.existsSync(astaPath)) {
  console.error(`ASTA file not found: ${astaPath}`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${path.parse(astaPath).name}.${type}`);
// 1x1 valid PNG (transparent pixel) for mock export mode.
const oneByOnePngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlAbwAAAABJRU5ErkJggg==";
if (type.toLowerCase() === "png") {
  fs.writeFileSync(outFile, Buffer.from(oneByOnePngBase64, "base64"));
} else {
  fs.writeFileSync(outFile, "mock-image", "utf8");
}
console.log(`Created image: ${outFile}`);
