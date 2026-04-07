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

const outDir = path.dirname(asta);
fs.mkdirSync(outDir, { recursive: true });

const rootDir = path.resolve(process.cwd(), "..");
const templateAsta = path.join(rootDir, "Sample.asta");

if (fs.existsSync(templateAsta)) {
  fs.copyFileSync(templateAsta, asta);
  console.log(
    `Created ASTA from template: ${asta} (source=${puml}, diagramType=${diagramType || ""})`
  );
  process.exit(0);
}

console.error(
  `Cannot create ASTA: missing template project at ${templateAsta}. Provide real bridge command via ASTAH_PLUGIN_BRIDGE_CMD.`
);
process.exit(1);
