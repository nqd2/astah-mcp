#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx < 0 || idx + 1 >= process.argv.length) return "";
  return process.argv[idx + 1];
}

const puml = getArg("--puml");
const asta = getArg("--asta");
const diagramType = getArg("--diagramType");

if (!puml || !asta) {
  console.error("bridge.js requires --puml and --asta");
  process.exit(1);
}

if (!fs.existsSync(puml)) {
  console.error(`Input PUML not found: ${puml}`);
  process.exit(1);
}

const content = fs.readFileSync(puml, "utf8");
const outDir = path.dirname(asta);
fs.mkdirSync(outDir, { recursive: true });
// Mock bridge output. Real bridge can replace this file.
fs.writeFileSync(
  asta,
  `# mock-asta\nsource=${puml}\ndiagramType=${diagramType || ""}\n\n${content}\n`,
  "utf8"
);

console.log(`Created ASTA: ${asta}`);
