pkill orderer
pkill peer

rm -fr *.log

cd ./ordererdatastore
rm -fr *
cd ../

cd ./org1/peer0/peerdatastore
rm -fr *
cd ../../../

cd ./org2/peer0/peerdatastore
rm -fr *
cd ../../../

cd ./org3/peer0/peerdatastore
rm -fr *
cd ../../../

rm -f ./orderer.genesis.block
rm -f ./ch123.tx
rm -f ./Org1MSPAnchors.tx
rm -f ./Org2MSPAnchors.tx
rm -f ./Org3MSPAnchors.tx
rm -f ./ch123.block

docker rmi -f $(docker images | grep "^dev-peer" | awk '{print $3}')
docker container rm -f $(docker container list --all | awk '$2~/^dev-peer/ {print $1}')

export PATH=$PATH:/home/john/tools/go/bin:/root/go/bin:/home/john/bcir/fabric/build/bin

# cryptogen generate –config=crypto-config.yaml –output ./crypto-config

configtxgen -profile OrgsOrdererGenesis123 -outputBlock ./orderer.genesis.block -channelID sc
configtxgen -profile Channel123 -outputCreateChannelTx ./ch123.tx -channelID ch123
configtxgen -profile Channel123 -outputAnchorPeersUpdate ./Org1MSPAnchors.tx -channelID ch123 -asOrg Org1MSP
configtxgen -profile Channel123 -outputAnchorPeersUpdate ./Org2MSPAnchors.tx -channelID ch123 -asOrg Org2MSP
configtxgen -profile Channel123 -outputAnchorPeersUpdate ./Org3MSPAnchors.tx -channelID ch123 -asOrg Org3MSP
