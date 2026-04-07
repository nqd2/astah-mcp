export interface RuntimeConfig {
  host: string;
  port: number;
  astahCommand?: string;
  astahPluginBridgeCmd?: string;
  astahImportTimeoutMs: number;
  astahExportTimeoutMs: number;
  astahHome?: string;
}

function numberEnv(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (!raw?.trim()) {
    return defaultValue;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid numeric env ${name}: ${raw}`);
  }
  return parsed;
}

export function readRuntimeConfig(): RuntimeConfig {
  return {
    host: process.env.HOST ?? "0.0.0.0",
    port: Number(process.env.PORT ?? 14405),
    astahCommand: process.env.ASTAH_COMMAND?.trim() || undefined,
    astahPluginBridgeCmd: process.env.ASTAH_PLUGIN_BRIDGE_CMD?.trim() || undefined,
    astahImportTimeoutMs: numberEnv("ASTAH_IMPORT_TIMEOUT_MS", 120000),
    astahExportTimeoutMs: numberEnv("ASTAH_EXPORT_TIMEOUT_MS", 120000),
    astahHome: process.env.ASTAH_HOME?.trim() || undefined
  };
}
