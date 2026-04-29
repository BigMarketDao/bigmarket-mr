#!/bin/bash -e
#
# Build and run the API Docker image in a pnpm monorepo layout.
#
# Usage (from anywhere):
#   ./build-bm.sh testnet
#   ./build-bm.sh mainnet
#
# Optional: BIGMARKET_ROOT=/path/to/bigmarket-mr  (defaults: repo root inferred from this script)

NETWORK=$1
if [ -z "$NETWORK" ]; then
  echo "Usage: $0 [testnet|mainnet]"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${BIGMARKET_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

if [ ! -f "$REPO_ROOT/pnpm-lock.yaml" ] || [ ! -f "$REPO_ROOT/pnpm-workspace.yaml" ]; then
  echo "error: Monorepo root not found (expected pnpm-lock.yaml and pnpm-workspace.yaml)."
  echo "  Tried REPO_ROOT=$REPO_ROOT"
  echo "  Set BIGMARKET_ROOT to your bigmarket repo root, or run this script from apps/api-v1 in the repo."
  exit 1
fi

DOCKER_NAME="bigmarket_api_${NETWORK}"

printf "\n\n"
printf "====================================================\n"
printf "Monorepo root: %s\n" "$REPO_ROOT"
printf "Building Docker image: mijoco/bigmarket_api:%s\n" "$NETWORK"

source ~/.profile

cd "$REPO_ROOT"

docker login
docker build \
  -f apps/api-v1/Dockerfile \
  --build-arg NODE_ENV="$NETWORK" \
  -t "mijoco/bigmarket_api:$NETWORK" \
  .
docker push "mijoco/bigmarket_api:$NETWORK"
docker rm -f "$DOCKER_NAME" || true

# Use different ports if needed (e.g. 6090 for testnet, 6091 for mainnet)
PORT="6090"
if [ "$NETWORK" = "mainnet" ]; then
  PORT="6091"
fi

docker run -d -t -i \
  --network host \
  -e NODE_ENV="$NETWORK" \
  --env-file ~/.env \
  --name "$DOCKER_NAME" \
  -p "$PORT:6090" \
  "mijoco/bigmarket_api:$NETWORK"

docker logs -f "$DOCKER_NAME"

printf "Finished....\n"
printf "====================================================\n\n"

exit 0
