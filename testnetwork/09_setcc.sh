export PATH=$PATH:/home/john/tools/go/bin:/root/go/bin:/home/john/bcir/fabric/build/bin

export FABRIC_CFG_PATH="/home/john/bcir/fabric/testnetwork/org1/peer0"
# export CORE_PEER_ADDRESS=172.17.0.2:7051
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=/home/john/bcir/fabric/testnetwork/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/
# export CORE_PEER_TLS_ENABLED=false
# export CORE_PEER_TLS_ROOTCERT_FILE=/home/john/bcir/fabric/testnetwork/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

rm -f ./ccpubque_1.0.tar.gz
peer lifecycle chaincode package ./ccpubque_1.0.tar.gz --path ./org1/ccpubque/ --lang golang --label ccpubque_1.0
peer lifecycle chaincode install ./ccpubque_1.0.tar.gz > output.tmp 2>&1
pubqueid1=$(awk '{if (NR>1) {print $NF}}' output.tmp)
rm -f output.tmp
peer lifecycle chaincode queryinstalled
peer lifecycle chaincode approveformyorg -o orderer.example.com:7050 --channelID ch123 --name ccpubque --version 1.0 --package-id $pubqueid1 --sequence 1


export FABRIC_CFG_PATH="/home/john/bcir/fabric/testnetwork/org2/peer0"
# export CORE_PEER_ADDRESS=172.17.0.2:8051
export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_MSPCONFIGPATH=/home/john/bcir/fabric/testnetwork/crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/
# export CORE_PEER_TLS_ENABLED=false
# export CORE_PEER_TLS_ROOTCERT_FILE=/home/john/bcir/fabric/testnetwork/crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

peer lifecycle chaincode install ./ccpubque_1.0.tar.gz > output.tmp 2>&1
pubqueid2=$(awk '{if (NR>1) {print $NF}}' output.tmp)
rm -f output.tmp
peer lifecycle chaincode queryinstalled
peer lifecycle chaincode approveformyorg -o orderer.example.com:7050 --channelID ch123 --name ccpubque --version 1.0 --package-id $pubqueid2 --sequence 1


export FABRIC_CFG_PATH="/home/john/bcir/fabric/testnetwork/org3/peer0"
# export CORE_PEER_ADDRESS=172.17.0.2:9051
export CORE_PEER_LOCALMSPID=Org3MSP
export CORE_PEER_MSPCONFIGPATH=/home/john/bcir/fabric/testnetwork/crypto-config/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp/
# export CORE_PEER_TLS_ENABLED=false
# export CORE_PEER_TLS_ROOTCERT_FILE=/home/john/bcir/fabric/testnetwork/crypto-config/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt

peer lifecycle chaincode install ./ccpubque_1.0.tar.gz > output.tmp 2>&1
pubqueid3=$(awk '{if (NR>1) {print $NF}}' output.tmp)
rm -f output.tmp
peer lifecycle chaincode queryinstalled
peer lifecycle chaincode approveformyorg -o orderer.example.com:7050 --channelID ch123 --name ccpubque --version 1.0 --package-id $pubqueid3 --sequence 1


export FABRIC_CFG_PATH="/home/john/bcir/fabric/testnetwork/org1/peer0"
# export CORE_PEER_ADDRESS=172.17.0.2:7051
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=/home/john/bcir/fabric/testnetwork/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/
# export CORE_PEER_TLS_ENABLED=false
# export CORE_PEER_TLS_ROOTCERT_FILE=/home/john/bcir/fabric/testnetwork/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

peer lifecycle chaincode checkcommitreadiness --channelID ch123 --name ccpubque --version 1.0 --sequence 1 --output json
peer lifecycle chaincode commit -o orderer.example.com:7050 --channelID ch123 --name ccpubque --version 1.0 --sequence 1 --peerAddresses peer0.org1.example.com:7051 --peerAddresses peer0.org2.example.com:8051 --peerAddresses peer0.org3.example.com:9051
