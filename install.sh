#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
command -v node >/dev/null || { echo "Node.js 20–24 is required"; exit 1; }
command -v npm >/dev/null || { echo "npm is required"; exit 1; }
NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 20 ] || [ "$NODE_MAJOR" -gt 24 ]; then echo "Node.js 20–24 is required; found $(node -v)"; exit 1; fi
npm ci
npm run verify
echo "Build verified. Copy .env.example to .env, replace demo secrets, then run: docker compose up --build"
echo "No global skills, credentials, or user configuration were modified."
