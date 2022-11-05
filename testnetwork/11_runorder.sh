pkill orderer
pkill peer


export PATH=$PATH:/home/john/tools/go/bin:/root/go/bin:/home/john/bcir/fabric/build/bin


export FABRIC_CFG_PATH="/home/john/bcir/fabric/testnetwork"
orderer start
