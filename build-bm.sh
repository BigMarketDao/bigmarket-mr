#!/bin/bash -e
#
############################################################

SERVER=spinoza.brightblock.org;
DOCKER_NAME=bigmarket_api


printf "\n\n"
printf "====================================================\n"
printf "Building on: $SERVER as docker container: $DOCKER_NAME \n"

source ~/.profile;
#cd ~/hubgit/bigmarket/bigmarket-api
#git pull https://github.com/radicleart/bigmarket-api.git daoless
docker login;
docker build --build-arg NODE_ENV=testnet -t mijoco/bigmarket_api:latest .
docker push mijoco/bigmarket_api:latest
docker rm -f bigmarket_api
docker run -d -t -i --network host -e NODE_ENV=testnet --env-file ~/.env --name $DOCKER_NAME -p 6090:6090 mijoco/bigmarket_api:latest
docker logs -f $DOCKER_NAME

printf "Finished....\n"
printf "====================================================\n\n"

exit 0;


