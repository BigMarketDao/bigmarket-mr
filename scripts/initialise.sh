#!/usr/bin/env bash

set -e

echo "🚀 Initialising BigMarket monorepo..."

# Root directories
mkdir -p apps/backend-api
mkdir -p apps/frontend-c1/src

mkdir -p contracts/stacks

mkdir -p docs/contracts
mkdir -p docs/flows
mkdir -p docs/invariants
mkdir -p docs/use-cases

mkdir -p packages/sdk/src
mkdir -p packages/types
mkdir -p packages/ui

mkdir -p scripts

# Create placeholder files if they don't exist
touch_if_missing () {
  if [ ! -f "$1" ]; then
    touch "$1"
    echo "Created $1"
  fi
}

echo "📄 Creating placeholder files..."

# Apps
touch_if_missing apps/frontend-c1/src/main.ts
touch_if_missing apps/backend-api/README.md

# Packages
touch_if_missing packages/sdk/src/index.ts
touch_if_missing packages/types/index.ts
touch_if_missing packages/ui/README.md

# Docs
touch_if_missing docs/use-cases/README.md
touch_if_missing docs/contracts/README.md
touch_if_missing docs/flows/README.md
touch_if_missing docs/invariants/README.md

# Root files
touch_if_missing README.md
touch_if_missing .gitignore

# Basic .gitignore if empty
if [ ! -s .gitignore ]; then
  cat <<EOL > .gitignore
node_modules
dist
.env
.DS_Store
coverage
.clarity
EOL
  echo "Created default .gitignore"
fi

echo "✅ Initialisation complete."