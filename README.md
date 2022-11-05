## Description

基于fabric v2.2.5，在`fabric`目录下使用`patch`命令打上补丁`fabric.patch`即可整合默克尔山脉树（MMR）。

core下`config`包含一些必要的配置文件，如configtx、crypto-config、orderer；`ccpubque`包含提交和查询交易的链码；`ProofPathRoot`有求取默克尔山脉树的验证路径和生成根值的完整实现；`appjspub`与`appjsque` 分别包含提交和查询交易的示例代码；data包含可信基准值文件；`testnetwork`包含上述所有的信息以及额外的内容。

Based on Hyperledger Fabricv2.2.5, patch `fabric. patch`with the `patch` command in the `fabric` directory to integrate the Merkel Mountain Range(MMR).
 `config` contains some necessary configuration files, such as configtx, crypto config, and orderer.` ccpubque ` contains the chain code for submitting and querying transactions.` ProofPathRoot ` has a complete implementation of obtaining the proof path and generating root value of MMR. ` appjspub`and ` appjsque `contain sample codes for submitting and querying transactions respectively.`data` contains test data.` testnetwork ` contains all the above information and additional content.

## Use

按序运行`testnetwork`目录下`01.sh~ 09.sh`的bash文件，三个`runorg`需要分别打开命令行窗口运行。上述执行完毕后，进入`testnetwork/org1/appjspub`执行p.sh提交交易。p.sh可设置并发交易的数量，这需要该目录下数字序号目录的支持，如目录`1`，更多的目录可以复制目录`1`并按序编号。提交完交易后，进入`testnetwork/org1/appjsque`运行r.sh执行查询操作。

Run the bash files of `01. sh~09. sh` in the `testnetwork` directory in sequence. The three `runorg` files need to be run independently. After the above execution, enter `testnetwork/org1/appjspub`to execute p.sh to submit the transaction. P.sh can set the number of concurrent transactions, which requires the support of numerical serial number directories under this directory, such as directory `1`. More directories can copy directory `1` and number them sequentially. After submitting the transaction, enter `testnetwork/org1/appjsque` and run r.sh to query.

