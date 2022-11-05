/*
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { isIn, buildCAClient, registerAndEnrollUser, enrollAdmin } = require('./CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('./AppUtil.js');

const fs = require('fs');
const { execSync } = require("child_process");
const { BlockDecoder } = require("fabric-common");
const commonProto = require('fabric-protos').common;

const channelName = 'ch123';
const chaincodeName = 'ccpubque';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'org1ifquer1';

const Database = require('better-sqlite3');


function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


// pre-requisites:
// - fabric-sample two organization test-network setup with two peers, ordering service,
//   and 2 certificate authorities
//         ===> from directory /fabric-samples/test-network
//         ./network.sh up createChannel -ca
// - Use any of the asset-transfer-basic chaincodes deployed on the channel "mychannel"
//   with the chaincode name of "basic". The following deploy command will package,
//   install, approve, and commit the javascript chaincode, all the actions it takes
//   to deploy a chaincode to a channel.
//         ===> from directory /fabric-samples/test-network
//         ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript
// - Be sure that node.js is installed
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         node -v
// - npm installed code dependencies
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         npm install
// - to run this test application
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         node app.js

// NOTE: If you see  kind an error like these:
/*
    2020-08-07T20:23:17.590Z - error: [DiscoveryService]: send[mychannel] - Channel:mychannel received discovery error:access denied
    ******** FAILED to run the application: Error: DiscoveryService: mychannel error: access denied

   OR

   Failed to register user : Error: fabric-ca request register failed with errors [[ { code: 20, message: 'Authentication failure' } ]]
   ******** FAILED to run the application: Error: Identity not found in wallet: appUser
*/
// Delete the /fabric-samples/asset-transfer-basic/application-javascript/wallet directory
// and retry this application.
//
// The certificate authority must have been restarted and the saved certificates for the
// admin and application user are not valid. Deleting the wallet store will force these to be reset
// with the new certificate authority.
//

/**
 *  A test application to show basic queries operations with any of the asset-transfer-basic chaincodes
 *   -- How to submit a transaction
 *   -- How to query and check the results
 *
 * To see the SDK workings, try setting the logging to show on the console before running
 *        export HFC_LOGGING='{"debug":"console"}'
 */
async function main() {
	try {
                var argv = require('yargs/yargs')(process.argv.slice(2))
                    .usage('Usage: $0 [options]')
                    .alias('n', 'num')
                    .nargs('n', 1)
                    .describe('n', 'the number of if publisher clients')
                    .demandOption(['n'])
                    .help('h')
                    .alias('h', 'help')
                    .epilog('copyright fjyu@qq.com 2022')
                    .argv;

		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

                const exs = await isIn(wallet, org1UserId);
                if (!exs) 
		{
	          /*		
                  await enrollAdmin(caClient, wallet, mspOrg1);
                  //await enrollAdmin(caClient, wallet, mspOrg3);
                  const secret = await getSecret(caClient, wallet, org1UserId, 'org1.department1');
                  //const secret = await getSecret(caClient, wallet, org3UserId, 'org3.department1');
                  console.log(`*** Result: ${secret.toString()}`);
                  //await enrollUser(caClient, wallet, mspOrg3,org3UserId,'123456')
                  await enrollUser(caClient, wallet, mspOrg1,org1UserId,'123456')
                   */

		  // in a real application this would be done on an administrative flow, and only once
		  await enrollAdmin(caClient, wallet, mspOrg1);

		  // in a real application this would be done only when a new user was required to be added
		  // and would be part of an administrative flow
		  await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department2');
                }	


		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {
		       /*	
                       let db = new sqlite3.Database('../appjspub/1/txidblocknum.sqlite3', sqlite.OPEN_READ, (err) => {
                          if (err && err.code == "SQLITE_CANTOPEN") {
                             console.log("sqlite.Database() getting error: " + err);
                             process.exit(1);
                          } else if (err) {
                             console.log("sqlite.Database() getting error: " + err);
                             process.exit(1);
                          }
                       });
		        */

			
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: false } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

		       // Build a network instance based on the channel where the smart contract is deployed
		       const network = await gateway.getNetwork(channelName);
		       // const contract = network.getContract('qscc');
		       let contract = await network.getContract('qscc');

		       /*	
		       const txids = [];	
                       let sql = `SELECT ifind_id, swid, ifindex, txid FROM ifind`;
                       await db.all(sql, [], (err, rows) => {
                           if (err) {
                              console.log("sqlite db.all() getting error: " + err);
                              process.exit(1);
                           }
                           rows.forEach((row) => {
                              console.log("ifind_id    ： " + row.ifind_id);
                              console.log("*** swid    ： " + row.swid);
                              console.log("*** infindex： " + row.ifindex);
                              console.log("*** txid    ： " + row.txid);

			      txids.push(row.txid);	   
                           });
                        });
	
                        const stmt = db.prepare('SELECT ifind_id, swid, ifindex, txid FROM ifind');


			console.log('*** txids.length = ' + txids.length);
			for (let idind = 0; idind < txids.length; idind ++)
		        {
		              const blockByte = await contract.evaluateTransaction(
                                                 'GetBlockByTxID',
                                                 channelName,
                                                 txids[idind]
                                                );
                              // const blockjsonstr = JSON.stringify(BlockDecoder.decode(blockByte));
                              const blockjsonstr = JSON.stringify(commonProto.Block.decode(new Uint8Array(blockByte)));
                              const peerblockjson = JSON.parse(blockjsonstr);
			      // console.log('*** in block:  ' + peerblockjson.header.number);
			      console.log('*** in block:  ' + blockjsonstr);
                        }
			 */

			/*
			db.each( sql, (err, row) => {
                           if (err) {
                              console.log("sqlite db.each() getting error: " + err);
                              process.exit(1);
                           }
                              console.log("ifind_id    ： " + row.ifind_id);
                              console.log("*** swid    ： " + row.swid);
                              console.log("*** infindex： " + row.ifindex);
                              console.log("*** txid    ： " + row.txid);
                        });
			 */

		        // db.close();

		        const blocknums = [];	

			for (let indPub = 1; indPub <= argv.n; indPub ++ )
			{	
				const db = new Database('../appjspub/' + indPub + '/txidblocknum.sqlite3', { verbose: console.log });
				// let allrows = await db.prepare('SELECT ifind_id, swid, ifindex, txid FROM ifind');
				let allrows = await db.prepare('SELECT txid FROM ifind');
				const allrowsjsonstr = JSON.stringify(allrows.all());
				console.log("query ifind results： " + allrowsjsonstr);
				const allrowsjson = JSON.parse(allrowsjsonstr);
				db.close();

				for (var rowEleIndex in allrowsjson)
				{
				   console.log("query ifind txid: " + allrowsjson[rowEleIndex].txid);

				      const blockByte = await contract.evaluateTransaction(
							 'GetBlockByTxID',
							 channelName,
							 allrowsjson[rowEleIndex].txid
							);
				      // const blockjsonstr = JSON.stringify(BlockDecoder.decode(blockByte));
				      // const blockjsonstr = JSON.stringify(commonProto.Block.decode(new Uint8Array(blockByte)));
				      const blockjsonstr = JSON.stringify(commonProto.Block.decode(blockByte));
				      const peerblockjson = JSON.parse(blockjsonstr);
				      console.log('*** in block:  ' + peerblockjson.header.number);
				      // console.log('*** in block:  ' + blockjsonstr);
					//
				      blocknums.push(peerblockjson.header.number);	   
				}		
                        }

			// Get the contract from the network.
			// let contract = network.getContract(chaincodeName);
			contract = network.getContract(chaincodeName);

                        /*
                        // Try a query type operation (function).
                        // This will be sent to just one peer and the results will be shown.
                        console.log('\n--> Evaluate Transaction: IfAll, function returns all the current swid-indexies on the ledger');
                        let result = await contract.evaluateTransaction('IfAll');
                        // console.log(`*** Result: ${prettyJSONString(result.toString())}`);			
			console.log(`*** Result: ${result.toString()}`);
			 */

			/*
			for (let ifInd = 10; ifInd < 99 ; ifInd++) 
		        {		
			   console.log('\n--> Evaluate Transaction: IfQuery, returns an integrity reference file index with a given SWID');
			   result = await contract.evaluateTransaction(
				             'IfQuery', 
				             // '572cafd6a972a9b6aa3fa4f6a944efb6648d363c0ba4602f56bc8b3f9e66f4' + ifInd 
				             '572cafd6a972a9b6aa3fa4f6a944efb6648d363c0ba4602f56bc8b3f9e66f470'
			                     );
			   // console.log(`*** Result: ${prettyJSONString(result.toString())}`);
			   console.log(`*** Result: ${result.toString()}`);

			}
			 */

                        /*
		        execSync("/home/john/bcir/fabric/build/bin/peer channel fetch newest block.tmp -c ch123 --orderer orderer.example.com:7050", 
	                     (error, stdout, stderr) => {
                           if (error) {
                              console.log(`error: ${error.message}`);
                              return;
                           }
                           if (stderr) {
                              console.log(`stderr: ${stderr}`);
                              return;
                           }
                           console.log(`stdout: ${stdout}`);
                        });
		        execSync("/home/john/bcir/fabric/build/bin/configtxgen -inspectBlock block.tmp > block_newest.json", (error, stdout, stderr) => {
                           if (error) {
                              console.log(`error: ${error.message}`);
                              return;
                           }
                           if (stderr) {
                              console.log(`stderr: ${stderr}`);
                              return;
                           }
                           console.log(`stdout: ${stdout}`);
                        });

                        await fs.unlink('block.tmp',function(err) {
                           if(err) console.log(err);
                           // console.log('file deleted successfully');
                        });

			var blockjson = require('./block_newest.json');
			var blockNumAll = blockjson.header.number;
			// console.log('the newest block number: ' + blockjson.header.number);
			console.log('the newest block number: ' + blockNumAll);
                         */

			// const contract = network.getContract('qscc');
			contract = network.getContract('qscc');
                        const resultByte = await contract.evaluateTransaction(
                                                    'GetChainInfo',
                                                    channelName
                                                 );
			// const commonProto = require('fabric-protos').common;
                        const resultJsonstr = JSON.stringify(commonProto.BlockchainInfo.decode(resultByte));
                        const resultJson = JSON.parse(resultJsonstr);
		        let blockNumAll = resultJson.height;
			console.log('block height: ' + blockNumAll);

			/*
                        for (let blockInd = blockNumAll - 1; blockInd >= 0; blockInd--) 
			{
                           blocknums.push(blockInd);	   
		        }
			 */

                        // for (let blockInd = blockNumAll - 1; blockInd >= blockNumAll; blockInd--) 
                        for (let blockInd = 0; blockInd < blocknums.length; blockInd++) 
			{
		           /*		
		           const blockByte = await contract.evaluateTransaction(
                                                 'GetBlockByNumber',
                                                 channelName,
                                                 String(blocknums[blockInd])
                                              );
                           // const blockjsonstr = JSON.stringify(BlockDecoder.decode(blockByte));
                           const blockjsonstr = JSON.stringify(commonProto.Block.decode(blockByte));
                           const blockjson = JSON.parse(blockjsonstr);
			    */

                           execSync("/home/john/bcir/fabric/build/bin/peer channel fetch " + blocknums[blockInd] + " block.tmp -c ch123 --orderer orderer.example.com:7050",
                             (error, stdout, stderr) => {
                              if (error) {
                                 console.log(`error: ${error.message}`);
                                 return;
                              }
                              if (stderr) {
                                 console.log(`stderr: ${stderr}`);
                                 return;
                              }
                              console.log(`stdout: ${stdout}`);
                           });
				
			console.log(blocknums[blockInd])
                           execSync("/home/john/bcir/fabric/build/bin/configtxgen -inspectBlock block.tmp > block_" + blocknums[blockInd] + ".json", (error, stdout, stderr) => {
                              if (error) {
                                 console.log(`error: ${error.message}`);
                                 return;
                              }
                              if (stderr) {
                                 console.log(`stderr: ${stderr}`);
                                 return;
                              }
                              console.log(`stdout: ${stdout}`);
                           });

                          // await fs.unlink('block.tmp',function(err) {
                          //    if(err) console.log(err);
                              // console.log('file deleted successfully');
                          // });

                           const blockjson = require('./block_' + blocknums[blockInd] + '.json');

			   var base64string;
			   var bufferObj;
			   var decodedString;

                           console.log('block ' + blocknums[blockInd] + ', preveious_hash (base64): ' + blockjson.header.previous_hash);
		           if ( blocknums[blockInd] > 0 )
			   {	
			      base64string = blockjson.header.previous_hash;
			      bufferObj = Buffer.from(base64string, "base64");
			      decodedString = bufferObj.toString("hex");
                              console.log('block ' + blocknums[blockInd] + ', preveious_hash    (hex): ' + decodedString);
		           }		   

                           console.log('block ' + blocknums[blockInd] + ',      data_hash (base64): ' + blockjson.header.data_hash);
			   base64string = blockjson.header.data_hash;
			   bufferObj = Buffer.from(base64string, "base64");
			   decodedString = bufferObj.toString("hex");
                           console.log('block ' + blocknums[blockInd] + ',      data_hash    (hex): ' + decodedString);

                           console.log('block ' + blocknums[blockInd] + ',       mmr_root (base64): ' + blockjson.header.mmr_root);
		           if ( blocknums[blockInd] > 0 )
			   {	
			      base64string = blockjson.header.mmr_root;
			      bufferObj = Buffer.from(base64string, "base64");
			      decodedString = bufferObj.toString("hex");
                              console.log('block ' + blocknums[blockInd] + ',       mmr_root    (hex): ' + decodedString);
			   }	   
			
			   for (var dataEleIndex in blockjson.data.data) 
		           {
			      for (var key in blockjson.data.data[dataEleIndex].payload.data) 
			      {
				 console.log('block ' + blocknums[blockInd] + ', data.data[' + dataEleIndex + '].payload.data key name: ' + key);  
			         
				 if ( key === 'actions') 
				 {     
				    console.log('block ' + blocknums[blockInd] + ', data.data[' + dataEleIndex + '].payload.header.channel_header.tx_id: ' + 
				                blockjson.data.data[dataEleIndex].payload.header.channel_header.tx_id
				               );  
			            for (var actInd in blockjson.data.data[dataEleIndex].payload.data.actions) 
			            {
				       for (var rwsetInd in blockjson.data.data[dataEleIndex].payload.data.actions[actInd].payload.action.proposal_response_payload.extension.results.ns_rwset)
				       {
					  if (rwsetInd == 0) 
					  {
                                             continue;
					  }

				          for (var writesInd in 
						   blockjson.data.data[dataEleIndex].payload.data.actions[actInd].payload.action.proposal_response_payload.extension.results.ns_rwset[rwsetInd].rwset.writes)
				          {
				             console.log('if  swid: ' + 
						         blockjson.data.data[dataEleIndex].payload.data.actions[actInd].payload.action.proposal_response_payload.extension.results.ns_rwset[rwsetInd].rwset.writes[writesInd].key);
			                     console.log('if index (base64): ' + 
						         blockjson.data.data[dataEleIndex].payload.data.actions[actInd].payload.action.proposal_response_payload.extension.results.ns_rwset[rwsetInd].rwset.writes[writesInd].value);
			                     base64string = 
						            blockjson.data.data[dataEleIndex].payload.data.actions[actInd].payload.action.proposal_response_payload.extension.results.ns_rwset[rwsetInd].rwset.writes[writesInd].value;
			                     bufferObj = Buffer.from(base64string, "base64");
			                     decodedString = bufferObj.toString("utf8");
			                     console.log('if index   (utf8): ' + decodedString);

				          }	       
				       }	       
				    }	    
			         }
                              }
		   	   }

			}	

		} finally {

			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}
}


function createDbConnection(filename) {
    return open({
        filename,
        driver: sqlite3.Database
    });
}


main();
