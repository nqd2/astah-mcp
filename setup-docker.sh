#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:-astah-mcp}"
CONTAINER_NAME="${CONTAINER_NAME:-astah-mcp}"
PORT="${PORT:-14405}"
HOST_PORT="${HOST_PORT:-$PORT}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-${ROOT_DIR}/tmp/output}"
mkdir -p "${OUTPUT_DIR}"

echo "[1/2] Building Docker image: ${IMAGE_NAME}"
docker build -t "${IMAGE_NAME}" "${ROOT_DIR}"

echo "[2/2] Running container: ${CONTAINER_NAME}"
docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p "${HOST_PORT}:${PORT}" \
  -v "${OUTPUT_DIR}:/host-output" \
  -e PORT="${PORT}" \
  -e HOST="0.0.0.0" \
  -e HOST_OUTPUT_DIR="/host-output" \
  -e ASTAH_PLUGIN_BRIDGE_CMD="${ASTAH_PLUGIN_BRIDGE_CMD:-}" \
  -e ASTAH_COMMAND="${ASTAH_COMMAND:-}" \
  "${IMAGE_NAME}"

echo "Done. MCP URL: http://127.0.0.1:${HOST_PORT}/mcp"
