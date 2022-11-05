# ! /bin/bash

# set maximal number of parallel jobs
START_NUM_LCOUNT=0
MAX_NUM_LCOUNT=2
MAX_NUM_CCA=9
# END_NUM=$(($MAX_NUM_CCA-1))
END_NUM=$MAX_NUM_CCA


# if true; then
if [ $START_NUM_LCOUNT -eq 0 ] 
then
   echo -e "\n"remove ./{} ::: $(eval echo "{2..$END_NUM}")
   parallel -j $MAX_NUM_CCA rm "-fr" ./{} ::: $(eval echo "{2..$END_NUM}")

   echo -e "\n"copy appjspub 1 to {} ::: $(eval echo "{2..$END_NUM}")
   parallel -j $(($MAX_NUM_CCA-1)) cp 1 ./{} "-r" ::: $(eval echo "{2..$END_NUM}")
fi


# if true; then
if [ $START_NUM_LCOUNT -eq 0 ] 
then
   echo -e "\n"remove the contents in ./{}/wallet ::: $(eval echo "{1..$END_NUM}")
   parallel -j $MAX_NUM_CCA rm "-f" ./{}/wallet/* ::: $(eval echo "{1..$END_NUM}")

   bash /home/john/bcir/fabric/testnetwork/crypto-config/peerOrganizations/org1.example.com/ca/r.sh
fi


# if true; then
if [ $START_NUM_LCOUNT -eq 0 ] 
then
   echo -e "\n"remove ./{}/txidblocknum.sqlite3 ::: $(eval echo "{1..$END_NUM}")
   parallel -j $MAX_NUM_CCA rm "-f" ./{}/txidblocknum.sqlite3 ::: $(eval echo "{1..$END_NUM}")
fi


if true; then
for ((LCOUNT = $START_NUM_LCOUNT; LCOUNT < $MAX_NUM_LCOUNT; LCOUNT++))
do
   echo -e "\n"remove {}_$LCOUNT.log ::: $(eval echo "{1..$END_NUM}")
   parallel -j $MAX_NUM_CCA rm "-f" {}_$LCOUNT.log ::: $(eval echo "{1..$END_NUM}")

   if [ $LCOUNT -eq 0 ] 
   then
      for ((INDAPP = 1; INDAPP <= $MAX_NUM_CCA; INDAPP++))
      do
         cmdstr="./${INDAPP}/app.js -u org1ifpublisher${INDAPP} -s 10 -e 10 | tee ${INDAPP}_$LCOUNT.log"
	 echo ${cmdstr}
	 node ${cmdstr}
	 sleep 2
      done
   else	
      # parallel -j $MAX_NUM_CCA --ungroup bash ./{}/run.sh "| tee" {}_$LCOUNT.log ::: $(eval echo "{1..$END_NUM}")
      parallel -j $MAX_NUM_CCA --ungroup node ./{}/app.js -u org1ifpublisher{} -s {}$(eval echo "$((10 + 10 * ($LCOUNT - 1)))") -e {}$(eval echo "$((20 + 10 * ($LCOUNT - 1)))") "| tee" {}_$LCOUNT.log ::: $(eval echo "{1..$END_NUM}")
   fi

done
fi
