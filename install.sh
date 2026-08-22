#!/usr/bin/env bash
set -e

echo "==============================================================="
echo " Installing RenWork Export Enterprise AI Knowledge Base Suite V3.0"
echo "==============================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Build MCP Server
echo "📦 Building MCP Server (mcp/export-kb-mcp)..."
cd "$SCRIPT_DIR/mcp/export-kb-mcp"
npm install
npm run build

# 2. Build Cloud API
echo "🚀 Building Cloud API (cloud-api)..."
cd "$SCRIPT_DIR/cloud-api"
npm install
npm run build

# 3. Link/Install Skills to global antigravity directory if available
GLOBAL_SKILLS_DIR="$HOME/.gemini/config/skills"
if [ -d "$GLOBAL_SKILLS_DIR" ]; then
  echo "🔗 Linking skills to $GLOBAL_SKILLS_DIR..."
  for skill_path in "$SCRIPT_DIR"/skills/*; do
    if [ -d "$skill_path" ]; then
      skill_name="$(basename "$skill_path")"
      rm -rf "$GLOBAL_SKILLS_DIR/$skill_name"
      ln -sf "$skill_path" "$GLOBAL_SKILLS_DIR/$skill_name"
      echo "  -> Linked $skill_name"
    fi
  done
fi

echo "==============================================================="
echo " ✅ RenWork Export KB Suite V3.0 installed successfully!"
echo " 🌐 Start Cloud API: cd cloud-api && npm start"
echo " 💻 Open Web Portal: open portal/index.html"
echo "==============================================================="
