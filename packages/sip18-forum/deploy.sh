#!/bin/bash -e
set -e

DEPLOYMENT=$1
PORT=22
SERVER=spinoza.brightblock.org
if [ "$DEPLOYMENT" == "testnet" ]; then
  SERVER=leibniz.brightblock.org
fi

BUILD_DIR=build
REMOTE_PATH=/var/www/forum

echo "Building app..."
npm run build

echo "Uploading build to $SERVER..."
rsync -aP -e "ssh -p $PORT" \
  static/ \
  build/ \
  package.json \
  bob@$SERVER:/var/www/forum

# Optionally restart PM2 or systemd service here:
# ssh -p $PORT bob@$SERVER "pm2 restart forum" || true

echo "✅ Deployment complete."

echo "Restarting app on server using PM2..."
ssh -p $PORT bob@$SERVER <<EOF
	source ~/.nvm/nvm.sh
	nvm use default
	cd /var/www/forum
	npm install --omit=dev --no-audit --no-fund
	PORT=3004
	if pm2 jlist | grep -q '"name":"forum"'; then
		pm2 restart forum
	else
		pm2 start /home/bob/pm2/forum.config.js
	fi
EOF

echo "✅ Startup complete."
