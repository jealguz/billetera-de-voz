#!/usr/bin/env bash
set -euo pipefail

ROOT=$(pwd)
SRC1="wallet-voice-app - copia/frontend"
SRC2="wallet-voice-app - copia/backend"

echo "[MOVE] Creating base folders..."
mkdir -p "$ROOT/frontend"
mkdir -p "$ROOT/backend"

echo "[MOVE] Copying frontend files..."
if [ -d "$SRC1" ]; then
  cp -a "$SRC1/." "$ROOT/frontend/" || true
else
  echo "Warning: $SRC1 not found"
fi

echo "[MOVE] Copying backend files..."
if [ -d "$SRC2" ]; then
  cp -a "$SRC2/." "$ROOT/backend/" || true
else
  echo "Warning: $SRC2 not found"
fi

echo "[MOVE] Cleaning original folders..."
rm -rf "$SRC1" "$SRC2" || true

echo "Monorepo structure created at: $ROOT/frontend and $ROOT/backend"
