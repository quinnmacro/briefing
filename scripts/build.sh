#!/bin/bash
# Build wrapper: checks npm deps, then runs the generator
set -e
cd "$(dirname "$0")/.."

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

exec node src/index.js "$@"