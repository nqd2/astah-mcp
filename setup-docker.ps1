$ErrorActionPreference = "Stop"

$ImageName = if ($env:IMAGE_NAME) { $env:IMAGE_NAME } else { "astah-mcp" }
$ContainerName = if ($env:CONTAINER_NAME) { $env:CONTAINER_NAME } else { "astah-mcp" }
$Port = if ($env:PORT) { $env:PORT } else { "14405" }
$HostPort = if ($env:HOST_PORT) { $env:HOST_PORT } else { $Port }
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$OutputDir = if ($env:OUTPUT_DIR) { $env:OUTPUT_DIR } else { Join-Path $RootDir "tmp/output" }
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

Write-Host "[1/2] Building Docker image: $ImageName"
docker build -t $ImageName $RootDir

Write-Host "[2/2] Running container: $ContainerName"
docker rm -f $ContainerName 2>$null | Out-Null
docker run -d `
  --name $ContainerName `
  -p "${HostPort}:${Port}" `
  -v "${OutputDir}:/host-output" `
  -e "PORT=$Port" `
  -e "HOST=0.0.0.0" `
  -e "HOST_OUTPUT_DIR=/host-output" `
  -e "ASTAH_PLUGIN_BRIDGE_CMD=$env:ASTAH_PLUGIN_BRIDGE_CMD" `
  -e "ASTAH_COMMAND=$env:ASTAH_COMMAND" `
  $ImageName | Out-Null

Write-Host "Done. MCP URL: http://127.0.0.1:$HostPort/mcp"
