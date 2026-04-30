#!/bin/bash -e
set -e

DEPLOYMENT=$1
if [ -z "$DEPLOYMENT" ]; then
  echo "Usage: $0 <testnet|mainnet>"
  exit 1
fi

PORT=22
SERVER=euler.brightblock.org
REMOTE_PATH=""
PM2_NAME=""

case "$DEPLOYMENT" in
  testnet)
    REMOTE_PATH=/var/www/bigmarket-testnet
    PM2_NAME=bigmarket-testnet
    ;;
  mainnet)
    REMOTE_PATH=/var/www/bigmarket-mainnet
    PM2_NAME=bigmarket-mainnet
    ;;
  *)
    echo "Unknown deployment: $DEPLOYMENT"
    exit 1
    ;;
esac

echo "🚀 Deploying BigMarket UI to $DEPLOYMENT ($SERVER)... $PM2_NAME"


echo "Patching default network in config.ts to $DEPLOYMENT..."
sed -E "s/( : )'(testnet|mainnet)';/\1'$DEPLOYMENT';/" ../../packages/bm-common/src/lib/config.ts > ../../packages/bm-common/src/lib/config.ts.tmp \
  && mv ../../packages/bm-common/src/lib/config.ts.tmp ../../packages/bm-common/src/lib/config.ts

echo "Building app..."
pnpm run build

echo "Uploading build to $SERVER:$REMOTE_PATH..."
rsync -aP -e "ssh -p $PORT" \
  static/ \
  build/ \
  package.json \
  bob@$SERVER:$REMOTE_PATH

echo "Restarting app on server using PM2 ($PM2_NAME)..."
ssh -p $PORT bob@$SERVER <<EOF
  source ~/.nvm/nvm.sh
  nvm use default
  cd $REMOTE_PATH
  pnpm install --prod
  if pm2 jlist | grep -q '"name":"$PM2_NAME"'; then
    pm2 restart $PM2_NAME
  else
    pm2 start /home/bob/pm2/$PM2_NAME.config.js
  fi
EOF

echo "✅ Deployment to $DEPLOYMENT complete."
