# astah-mcp

MCP server for Astah CLI and Astah Java API, built with NestJS.

You get two layers:

- legacy tools for existing clients
- explicit Astah-CLI tools for clearer automation

## Available Tools

### Legacy compatibility

- `import_puml`
- `export_png`
- `convert_and_export`
- `health`
- `astah_api_catalog`
- `astah_api_run`

### Explicit Astah-CLI tools

- `astah_cli_info` - checks command path, `-version`, `-help`, and capability list
- `astah_export_image` - exports diagrams from `.asta` to image files
- `astah_batch_run` - runs allowlisted batch ops (`version`, `help`)
- `astah_validate_paths` - validates and normalizes input/output paths

## Capability Mapping

| Capability | MCP tool |
|---|---|
| CLI version (`-version`) | `health`, `astah_cli_info`, `astah_batch_run` |
| CLI help (`-help`) | `astah_cli_info`, `astah_batch_run` |
| Image export (`-f ... -image -t ... -o ...`) | `export_png`, `astah_export_image` |
| PUML -> ASTA bridge flow | `import_puml` |
| End-to-end PUML -> ASTA -> image | `convert_and_export` |
| API class/method inspection (`jar`, `javap`) | `astah_api_catalog` |
| API compile/run (`javac`, `java`) | `astah_api_run` |

## Response Shape

All tools return:

- `ok`
- `message`
- `exitCode`
- `paths`
- `stdout`
- `stderr`
- `timings`
- `platform`
- `commandSummary`
- `metadata` (optional)

## Requirements

- Node.js `>=20.10.0`
- Install Astah UML to `C:/Program Files/astah-uml/`
- Astah CLI command in PATH, or `ASTAH_COMMAND` set
- `ASTAH_PLUGIN_BRIDGE_CMD` set for `import_puml`
- `java`, `javac`, `jar`, `javap` in PATH for API tools

## Environment Variables

Use `.env.example` as baseline:

- `PORT` (default `14405`)
- `HOST` (default `0.0.0.0`)
- `ASTAH_COMMAND`
- `ASTAH_PLUGIN_BRIDGE_CMD`
- `ASTAH_IMPORT_TIMEOUT_MS`
- `ASTAH_EXPORT_TIMEOUT_MS`
- `ASTAH_HOME` (optional)

Bridge template supports:

- `{puml}`
- `{asta}`
- `{diagramType}`

Example:

```bash
ASTAH_PLUGIN_BRIDGE_CMD="node bridge.js --puml {puml} --asta {asta} --diagramType {diagramType}"
```

## Run Local

```bash
pnpm install --no-frozen-lockfile
pnpm run build
pnpm start
```

### Global CLI / NPX

Install globally from this folder:

```bash
npm i -g .
```

Run via npx:

```bash
npx astah-mcp
```

Dev:

```bash
pnpm run dev
```

Server endpoint:

- `http://127.0.0.1:14405/mcp`

## Docker

From repo root:

```bash
docker build -t astah-mcp ./astah-mcp
docker run --rm -p 14405:14405 astah-mcp
```

## MCP Client Config

```json
{
  "name": "astah-mcp",
  "transport": {
    "type": "streamable-http",
    "url": "http://127.0.0.1:14405/mcp"
  }
}
```

## Validate

```bash
pnpm run typecheck
pnpm run lint
pnpm test
```
