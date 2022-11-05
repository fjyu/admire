// 用来查询的脚本
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
const { randomInt } = require('crypto');

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}



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


		const ccp = buildCCPOrg1();


		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');


		const wallet = await buildWallet(Wallets, walletPath);

		const exs = await isIn(wallet, org1UserId);
		if (!exs) {

			await enrollAdmin(caClient, wallet, mspOrg1);


			await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department2');
		}


		const gateway = new Gateway();

		try {

			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: false } // using asLocalhost as this gateway is using a fabric network deployed locally
			});
				

			const network = await gateway.getNetwork(channelName);
			// const contract = network.getContract('qscc');
			let contract = await network.getContract('qscc');

			//contract = network.getContract(chaincodeName);
			// 获取最大块号
			//contract = network.getContract('qscc');
			const resultByte = await contract.evaluateTransaction(
				'GetChainInfo',
				channelName
			);
			// const commonProto = require('fabric-protos').common;
			const resultJsonstr = JSON.stringify(commonProto.BlockchainInfo.decode(resultByte));
			const resultJson = JSON.parse(resultJsonstr);
			let blockNumAll = resultJson.height;
			


			var Numberblocksverified = []
			var Mtime = []
			var Stime = []
			for (let x = 1; x < 2; x++) {
				//定义一些列表，保存执行时间的信息
				var templength=0
				var tempmtime=0
				var tempstime=0
				//10次循环取平均
				for (let y = 0; y < 1; y++) {
					//var MAXSTEP=x*500/20
					var MAXSTEP=1
					blockNumAll=15
					//最大块数(块号应减1)
					console.log('block height: ' + blockNumAll);
	
		
					console.time("timer")
					const blocknums = [];
					var blocknumsmap=new Map()
					var blocknumshash=new Map()
				
					console.time("randblocktime")
					//随机找一些块[0,maxblocknum-1]
					var numlist=randlist(blockNumAll-2,MAXSTEP)
					if (numlist.indexOf(0)==-1){
						numlist.push(0)//0号块
					}
					//获取块号对应的哈希值
				
					var blocknumsOBJ = {}
					var blockHashOBJ = {}
					for (let index = 0; index < numlist.length; index++) {
						blocknums.push(numlist[index])
						blocknumsmap.set(numlist[index],numlist[index])
						blocknumsOBJ[numlist[index]] = numlist[index]
						const blockbyte = await contract.evaluateTransaction(
							'GetBlockByNumber',
							channelName,
							Number(numlist[index]) + 1
						);
	
						const blockJSON = JSON.stringify(commonProto.Block.decode(blockbyte));
						const blockOBJ = JSON.parse(blockJSON);
						blocknumshash.set(numlist[index], blockOBJ.header.previous_hash)
						blockHashOBJ[numlist[index]] = blockOBJ.header.previous_hash
					}

					blocknumsOBJ[0] = 0
					blockHashOBJ[0] = blocknumshash.get(0)
	
		
					console.log("带查询交易在", blocknums.length, "块中")
					//console.log("块号集合：", blocknumsmap)
					//console.log("块号哈希集合:", blocknumshash)	
					//console.timeEnd("randblocktime")
					var Mt1=process.uptime()
					console.time("Multiway query")
					//保存块号集合到JSON文件
					var blocknumsSTR = JSON.stringify(blocknumsOBJ)
					fs.writeFileSync("/home/john/bcir/fabric/testnetwork/ProofPathRoot/blocknums.json",blocknumsSTR)

					// 保存块号哈希集合到JSON文件
					var blockHashSTR = JSON.stringify(blockHashOBJ)
					fs.writeFileSync("/home/john/bcir/fabric/testnetwork/ProofPathRoot/blockHash.json",blockHashSTR)
			
					console.time("proofroottime")
					//获取ProofPath
					execSync("/home/john/bcir/fabric/testnetwork/ProofPathRoot/main -p /home/john/bcir/fabric/testnetwork/ProofPathRoot/blocknums.json /home/john/bcir/fabric/testnetwork/ProofPathRoot/proofpath.json /home/john/bcir/fabric/testnetwork/test.db "+String(blockNumAll - 1))

					//end

					//获取proofRoot
					execSync("/home/john/bcir/fabric/testnetwork/ProofPathRoot/main -r /home/john/bcir/fabric/testnetwork/ProofPathRoot/blockHash.json /home/john/bcir/fabric/testnetwork/ProofPathRoot/proofpath.json "+String(blockNumAll-1))
					console.timeEnd("proofroottime")
		
					//end
	
	

					// 获取最后一块的mmrroot
	
					console.log("最后一块mmrroot")
					await getlatestmmrroot(blockNumAll-1)
	
	
				
					//比较保存的mmrroot与proofpathroot是否一致
					const mroot=fs.readFileSync("./mmr_root.json")
					const proot=fs.readFileSync("./ProofROOT.json")
					var mr=JSON.parse(mroot)
					var pr=JSON.parse(proot)
					console.log("mr:",mr,"pr",pr)
					if(mr.mmrroot==pr.ProofRoot){
						console.log("多路验证成功！")
					}else{
						console.log("多路验证失败！")
					}
					console.timeEnd("Multiway query")
					console.timeEnd("timer")
					var Mt2=process.uptime()
					tempmtime+=Mt2-Mt1
					
					//单路查询
					var St1=process.uptime()
					console.log("单路查询")
					console.time("Single query")
					/*
					for (let index = 0; index < blocknums.length; index++) {
						var num = blocknums[index]
						var numOBJ = {}
						var bhashOBJ = {}
						numOBJ[num] = num
						numOBJ[0] = 0
						//console.log(num,numOBJ)
						bhashOBJ[num] = blocknumshash.get(num)
						bhashOBJ[0] = blocknumshash.get(0)
						var numsSTR = JSON.stringify(numOBJ)
						//console.log(numsSTR)
						//console.log("bH",bhashOBJ)
						fs.writeFileSync("/home/john/bcir/fabric/testnetwork/ProofPathRoot/blocknums.json", numsSTR)
						var bHashSTR = JSON.stringify(bhashOBJ)
						//console.log(bHashSTR)
						fs.writeFileSync("/home/john/bcir/fabric/testnetwork/ProofPathRoot/blockHash.json", bHashSTR)
						//获取ProofPath
						execSync("/home/john/bcir/fabric/testnetwork/ProofPathRoot/main -p /home/john/bcir/fabric/testnetwork/ProofPathRoot/blocknums.json /home/john/bcir/fabric/testnetwork/ProofPathRoot/proofpath.json /home/john/bcir/fabric/testnetwork/test.db "+String(blockNumAll - 1))
						//end
						//获取proofRoot
						execSync("/home/john/bcir/fabric/testnetwork/ProofPathRoot/main -r /home/john/bcir/fabric/testnetwork/ProofPathRoot/blockHash.json /home/john/bcir/fabric/testnetwork/ProofPathRoot/proofpath.json " + String(blockNumAll - 1))
						const mroot = fs.readFileSync("./mmr_root.json")
						const proot = fs.readFileSync("./ProofROOT.json")
						var mr = JSON.parse(mroot)
						var pr = JSON.parse(proot)
					//	console.log("mr:", mr, "pr", pr)
						if(mr.mmrroot==pr.ProofRoot){
							//console.log("单路验证成功！")
						}else{
							console.log("单路验证失败！")
						}
				
					}
					*/
					console.timeEnd("Single query")
					templength = numlist.length
					var St2=process.uptime()
					tempstime+=St2-St1

				}
				Numberblocksverified.push(templength)
				Mtime.push(tempmtime/10)
				Stime.push(tempstime/10)

			}
			console.log(Numberblocksverified)
			console.log(Mtime)
			console.log(Stime)
			fs.writeFileSync("./NUMBERdata",String(Numberblocksverified))
			fs.writeFileSync("./MTIMEdata",String(Mtime))
			fs.writeFileSync("./STIMEdata",String(Stime))




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



function getlatestmmrroot(latestblocknum) {
	execSync("/home/john/bcir/fabric/build/bin/peer channel fetch " + latestblocknum + " block.tmp -c ch123 --orderer orderer.example.com:7050",
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
	execSync("/home/john/bcir/fabric/build/bin/configtxgen -inspectBlock block.tmp > block_" + latestblocknum + ".json", (error, stdout, stderr) => {
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

	fs.unlink('block.tmp', function (err) {
		if (err) console.log(err);
	});

	const blockjson = require('./block_' + latestblocknum + '.json');

	var base64string;
	var bufferObj;
	var decodedString;

	console.log('block ' + latestblocknum + ',       mmr_root (base64): ' + blockjson.header.mmr_root);
	if (latestblocknum > 0) {
		base64string = blockjson.header.mmr_root;
		bufferObj = Buffer.from(base64string, "base64");
		decodedString = bufferObj.toString("hex");
		console.log('block ' + latestblocknum + ',       mmr_root    (hex): ' + decodedString);
	}

	var mroot={}
	mroot["mmrroot"]=blockjson.header.mmr_root
	var jsstr=JSON.stringify(mroot)
	fs.writeFileSync("./mmr_root.json",jsstr)


}

function randlist(MAXNUM,STEP) {
	const min = 1;                            //最小值
	const max = MAXNUM;                            //最大值
	const range = max - min;                         //取值范围差
	var numlist = Array()
	for (let index = 0; numlist.length < STEP; index++) {
		var num = min + Math.round(Math.random() * range)
		if (numlist.indexOf(num) == -1) {
				numlist.push(num)//num号块
		}

	}
	return numlist
}



main();

