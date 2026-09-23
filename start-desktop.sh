#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=== Open Generative AI - Lancement Desktop Local ==="

# Build Vite frontend si dist est absent
if [ ! -f "dist/index.html" ]; then
    echo ">> Compilation du bundle Vite..."
    npm run vite:build
fi

ELECTRON_START_URL="http://localhost:58101/studio" npx electron --no-sandbox --disable-gpu-sandbox . "$@"
