#!/usr/bin/env bash
cd "$(dirname "$0")"
PORT=8765
URL="http://localhost:$PORT"

echo "Starting at $URL"
echo "Press Ctrl+C to stop"
open "$URL" 2>/dev/null || true
python3 -m http.server "$PORT"
