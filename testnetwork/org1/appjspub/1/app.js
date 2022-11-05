#!/usr/bin/env node
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

const channelName = 'ch123';
const chaincodeName = 'ccpubque';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
// const org1UserId = 'org1ifpublisher1';
		
var sqlite3 = require('sqlite3').verbose();




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
		    .alias('u', 'uid')
		    .nargs('u', 1)
		    .describe('u', 'the client user id in org1')
		    .alias('s', 'sid')
		    .nargs('s', 1)
		    .describe('s', 'the start swid for test')
		    .alias('e', 'eid')
		    .nargs('e', 1)
		    .describe('e', 'the end swid for test')
		    .demandOption(['u', 's', 'e'])
		    .help('h')
		    .alias('h', 'help')
		    .epilog('copyright fjyu@qq.com 2022')
		    .argv;

                // const org1UserId = 'org1ifpublisher1';
                const org1UserId = argv.u;

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

		  // await sleep(argv.s);	
		  // in a real application this would be done on an administrative flow, and only once
		  await enrollAdmin(caClient, wallet, mspOrg1);

		  // await sleep(argv.s);	
		  // in a real application this would be done only when a new user was required to be added
		  // and would be part of an administrative flow
		  await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');
                }

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {

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

			// Get the contract from the network.
			const contract = network.getContract(chaincodeName);

			// for (let ifInd = 100; ifInd < 110; ifInd++) 
			for (let ifInd = argv.s; ifInd < argv.e; ifInd++) 
		        {		
			   console.log('\n--> Submit Transaction: IfPublish, publish an integrity reference file index record');
		           /*		
			   let result = await contract.submitTransaction(
				                 'IfPublish', 
				                 '572cafd6a972a9b6aa3fa4f6a944efb6648d363c0ba4602f56bc8b3f9e66f5' + ifInd, 
			    	                 '69c9e3e44ed18cafd1e58de37a70e2ec54cd49c7da0cd461fbd5e333de3288' + ifInd );
                            */ 
			   const transaction = contract.createTransaction('IfPublish');
                           let result = await transaction.submit(
				                 '572cafd6a972a9b6aa3fa4f6a944efb6648d363c0ba4602f56bc8b3f9e66f' + ifInd,
                                                 '69c9e3e44ed18cafd1e58de37a70e2ec54cd49c7da0cd461fbd5e333de328' + ifInd);
			   console.log('*** Result: one integrity reference pub tran committed');
			   if (`${result}` !== '') {
				// console.log(`*** Result: ${prettyJSONString(result.toString())}`);
				console.log(`*** Result: ${result.toString()}`);
		   	   }
                           console.log("*** TxID:", transaction.getTransactionId());

			   // let db = new sqlite3.Database('./txidblocknum.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                           let db = new sqlite3.Database(path.resolve(__dirname, 'txidblocknum.sqlite3'), sqlite3.OPEN_READWRITE, (err) => {
                              if (err && err.code == "SQLITE_CANTOPEN") {
                                 // console.log("sqlite3 create database and table");
                                 createDatabase(db);
                              } else if (err) {
                                 console.log("sqlite3.Databbase() getting error: " + err);
                                 process.exit(1);
                              }
                           });

			   const sqlstr = 
                              `
                              insert into ifind ( swid, ifindex, txid )
                              values 
			      (
			       '572cafd6a972a9b6aa3fa4f6a944efb6648d363c0ba4602f56bc8b3f9e66f` + ifInd + `', 
			       '69c9e3e44ed18cafd1e58de37a70e2ec54cd49c7da0cd461fbd5e333de328` + ifInd + `', 
			       '` + transaction.getTransactionId() + `'	   
                              )`;
                           // console.log("sqlite3 db.exec() insert into ifind, sqlstr: " + sqlstr);

                           await db.run(
			      sqlstr	   
                              , 
                              (err) => {
                                 if (err) {
                                    console.log("sqlite3 db.run() insert into ifind getting error: " + err);
                                    process.exit(1);
	                         } 
				 console.log(`sqlite3 db.run(), a row has been inserted`);     
                              }
                           );
	                   await db.close();	

		           /*		
			   console.log('\n--> Evaluate Transaction: IfQuery, returns an integrity reference file index with a given SWID');
			   result = await contract.evaluateTransaction(
				             'IfQuery', 
				             '572cafd6a972a9b6aa3fa4f6a944efb6648d363c0ba4602f56bc8b3f9e66f5' + ifInd 
			                     );
			   // console.log(`*** Result: ${prettyJSONString(result.toString())}`);
			   console.log(`*** Result: ${result.toString()}`);
			    */
			}

			/*
                        // Try a query type operation (function).
                        // This will be sent to just one peer and the results will be shown.
                        console.log('\n--> Evaluate Transaction: IfAll, function returns all the current swid-indexies on the ledger');
                        let result = await contract.evaluateTransaction('IfAll');
                        // console.log(`*** Result: ${prettyJSONString(result.toString())}`);			
			console.log(`*** Result: ${result.toString()}`);
			 */

			/*
			const contract = network.getContract('qscc');
                        const resultByte = await contract.evaluateTransaction(
                                                    'GetChainInfo',
                                                    channelName
                                                 );
			const commonProto = require('fabric-protos').common;
                        const resultJsonstr = JSON.stringify(commonProto.BlockchainInfo.decode(resultByte));
                        const resultJson = JSON.parse(resultJsonstr);
		        let blockNumAll = resultJson.height;
			console.log('block height: ' + blockNumAll);

                        for (let blockInd = blockNumAll - 1; blockInd >= 0; blockInd--) 
			{
		           // const blockByte = await contract.evaluateTransaction(
                           //                       'GetBlockByNumber',
                           //                       channelName,
                           //                       String(blockInd)
                           //                    );
                           // const blockjsonstr = JSON.stringify(BlockDecoder.decode(blockByte));
                           // const blockjsonstr = JSON.stringify(commonProto.Block.decode(blockByte));
                           // const blockjson = JSON.parse(blockjsonstr);
			    
                           execSync("/home/john/bcir/fabric/build/bin/peer channel fetch " + blockInd + " block.tmp -c ch123 --orderer orderer.example.com:7050",
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
                           execSync("/home/john/bcir/fabric/build/bin/configtxgen -inspectBlock block.tmp > block_" + blockInd + ".json", (error, stdout, stderr) => {
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

                           const blockjson = require('./block_' + blockInd + '.json');

			   var base64string;
			   var bufferObj;
			   var decodedString;

                           console.log('block ' + blockInd + ', preveious_hash (base64): ' + blockjson.header.previous_hash);
		           if ( blockInd > 0 )
			   {	
			      base64string = blockjson.header.previous_hash;
			      bufferObj = Buffer.from(base64string, "base64");
			      decodedString = bufferObj.toString("hex");
                              console.log('block ' + blockInd + ', preveious_hash    (hex): ' + decodedString);
		           }		   

                           console.log('block ' + blockInd + ',      data_hash (base64): ' + blockjson.header.data_hash);
			   base64string = blockjson.header.data_hash;
			   bufferObj = Buffer.from(base64string, "base64");
			   decodedString = bufferObj.toString("hex");
                           console.log('block ' + blockInd + ',      data_hash    (hex): ' + decodedString);

                           console.log('block ' + blockInd + ',       mmr_root (base64): ' + blockjson.header.mmr_root);
		           if ( blockInd > 0 )
			   {	
			      base64string = blockjson.header.mmr_root;
			      bufferObj = Buffer.from(base64string, "base64");
			      decodedString = bufferObj.toString("hex");
                              console.log('block ' + blockInd + ',       mmr_root    (hex): ' + decodedString);
			   }	   
			
			   for (var dataEleIndex in blockjson.data.data) 
		           {
			      for (var key in blockjson.data.data[dataEleIndex].payload.data) 
			      {
				 console.log('block ' + blockInd + ', data.data[' + dataEleIndex + '].payload.data key name: ' + key);  
			         
				 if ( key === 'actions') 
				 {     
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
                        */

		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();

		}
	

	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}
}


function createDatabase(db) {
    db = new sqlite3.Database(path.resolve(__dirname, 'txidblocknum.sqlite3'), sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
            console.log("sqlite3.Database() in createDatabase() getting error: " + err);
            process.exit(1);
        }
        // console.log("sqlite3 create table");
        createTable(db);
    });
}


function createTable(db) {
    // console.log("sqlite3 drop table");

    /*	
    db.exec(
      `
      DROP TABLE ifind; 
      `
      , 
      (err) => {
         if (err) {
            console.log("sqlite3 db.exec() DROP TABLE ifind getting error: " + err);
            process.exit(1);
	 }     
      }
    );

    console.log("sqlite3 create table");
     */

    db.exec(
      `
      create table IF NOT EXISTS ifind (
        ifind_id INTEGER PRIMARY KEY AUTOINCREMENT,
        swid text not null,
        ifindex text not null,
        txid text not null
      );
      `
      , 
      (err) => {
         if (err) {
            console.log("sqlite3 db.exec() create table ifind getting error: " + err);
            process.exit(1);
	 }     
      }
    );	
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


main();
