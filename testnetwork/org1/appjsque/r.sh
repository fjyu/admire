rm -f block_*.json

export FABRIC_CFG_PATH=/home/john/bcir/fabric/testnetwork/org1/peer0
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=/home/john/bcir/fabric/testnetwork/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/

node app.js -n 7
