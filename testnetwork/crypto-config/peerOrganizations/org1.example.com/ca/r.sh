kill $(ps aux | grep fabric-ca-server | awk '{if (NR=1) {print $2}}')

CUR_DIR=$( dirname -- "$0"; )

# rm -f ${CUR_DIR}/fabric-ca-server.db
rm -f ./fabric-ca-server.db
${CUR_DIR}/fabric-ca-server init -b admin:adminpw
${CUR_DIR}/fabric-ca-server start &
