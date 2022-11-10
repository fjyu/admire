export PATH=$PATH:/home/john/tools/go/bin:/root/go/bin:/home/john/bcir/fabric/build/bin

export FABRIC_CFG_PATH="/home/john/bcir/fabric/testnetwork/org1/peer0"
# export CORE_PEER_ADDRESS=172.17.0.2:7051
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=/home/john/bcir/fabric/testnetwork/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/
# export CORE_PEER_TLS_ENABLED=false
# export CORE_PEER_TLS_ROOTCERT_FILE=/home/john/bcir/fabric/testnetwork/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

peer channel create -t 50s -o orderer.example.com:7050 -c ch123 -f ./ch123.tx
peer channel join -b ./ch123.block
peer channel update -o orderer.example.com:7050 -c ch123 -f ./Org1MSPAnchors.tx
