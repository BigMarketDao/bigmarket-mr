#!/bin/bash -e
#
############################################################

SERVER=spinoza.brightblock.org;
DOCKER_NAME=bigmarket_api
DEPLOYMENT=$1
PORT=22

if [ "$DEPLOYMENT" == "testnet" ]; then
  SERVER=leibniz.brightblock.org;
fi
if [ "$DEPLOYMENT" == "devnet" ]; then
  SERVER=descartes.brightblock.org;
fi

DOCKER_ID_USER='mijoco'
DOCKER_CMD='docker'

$DOCKER_CMD build -t mijoco/bigmarket_api .
$DOCKER_CMD tag mijoco/bigmarket_api mijoco/bigmarket_api
$DOCKER_CMD push mijoco/bigmarket_api:latest

printf "\n\n===================================================="
printf "\nConnecting to: $SERVER:$PORT"
printf "\nDeploying docker container: $DOCKER_NAME"

printf "Finished....\n"
printf "\n-----------------------------------------------------------------------------------------------------\n";

exit 0;

