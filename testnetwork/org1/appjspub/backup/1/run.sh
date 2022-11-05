# export FABRIC_CFG_PATH=/home/john/bcir/fabric/testnetwork/org1/peer0
# export CORE_PEER_LOCALMSPID=Org1MSP
# export CORE_PEER_MSPCONFIGPATH=/home/john/bcir/fabric/testnetwork/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/

CUR_DIR=$( dirname -- "$0"; )

rm -f ${CUR_DIR}/txidblocknum.sqlite3
node ${CUR_DIR}/app.js -u org1ifpublisher1 -s 110 -e 120
