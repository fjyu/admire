export PATH=$PATH:/home/john/tools/go/bin:/root/go/bin:/home/john/bcir/fabric/build/bin

export FABRIC_CFG_PATH="/home/john/bcir/fabric/testnetwork/org3/peer0"
# export CORE_PEER_ADDRESS=172.17.0.2:9051
export CORE_PEER_LOCALMSPID=Org3MSP
export CORE_PEER_MSPCONFIGPATH=/home/john/bcir/fabric/testnetwork/crypto-config/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp/
# export CORE_PEER_TLS_ENABLED=false
# export CORE_PEER_TLS_ROOTCERT_FILE=/home/john/bcir/fabric/testnetwork/crypto-config/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
peer node start
