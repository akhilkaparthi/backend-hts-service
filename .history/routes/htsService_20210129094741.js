const { Client, PrivateKey, AccountCreateTransaction, AccountBalanceQuery, TokenCreateTransaction, Hbar, AccountInfoQuery, TokenMintTransaction, TokenAssociateTransaction, TransferTransaction } = require("@hashgraph/sdk");
const { constant } = require("async");
const router = require('express').Router();
const HederaClient = require('./hedera-client');
//This javascript is used to implement HTS service with various usecases.
//Implement a token service.
//First: create two user.
//Second: create a token either NFT or FT
//Third: Associate tokens with users
//Fourth: Transfer tokens from one user to another user.
//Transfer token between the users.
//H21:Create NFT token for the property by adding multiple property information such as documents, photos
//1: Upload a file into Hedera Network then new file id will be generated.
//2: Use this file id for adding in Token.
//3: Implement multiple file id and add into the token.
//4: (next case) add multiple files into single file service.
//


//create file
router.route('/create-file').post(async (req, res) => {
    console.log('in file create')
    try {


        const privateKey = await PrivateKey.generate();
        // create an immutable file with the token properties
        // let fileToSave = this.file;
        // console.log("this.model", this.file);

        // if (typeof imageBase64() !== "undefined") {
        //     fileToSave.photo = this.imageBase64();
        // }
        // const fileId = await fileCreate(JSON.stringify(fileToSave));
        let fileId = req.body.fileId;
        if (fileId !== "") {
            //const ownerAccount = getAccountDetails("Owner");
            const treasury_account_id = process.env.TREASURY_ACCOUNT_ID;
            const token = {
                name: "Scoin",
                symbol: "hedera://" + fileId,
                decimals: 0,
                initialSupply: 1,
                adminKey: undefined,
                kycKey: privateKey.toString(),
                freezeKey: privateKey.toString(),
                wipeKey: undefined,
                supplyKey: undefined,
                defaultFreezeStatus: undefined,
                autoRenewAccount: treasury_account_id,
                treasury: treasury_account_id,
                deleted: false,
                key: privateKey.toString(),
                memo: fileId
            };

            console.log("token private key" + privateKey.toString());
            const newToken = await tokenCreate(token);
            //console.log("newToken=" + newToken);
            res.json(newToken);
        }
    } catch (error) {
        console.log(error);
        res.json({"error": error});
    }
});

async function imageBase64() {
    this.photoSize = 0;
    if (typeof this.model.photo === "undefined") {
        return undefined;
    }
    if (typeof this.model.photo.type === "undefined") {
        return undefined;
    }
    if (typeof this.model.photo.data === "undefined") {
        return undefined;
    }
    this.photoSize = this.model.photo.size;
    return (
        "data:" + this.model.photo.type + ";base64," + this.model.photo.data
    );
}
async function fileCreate(fileData) {
    const privateKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);
    const client = hederaClient();
    let fileId = "";
    const fileChunk = 4000;
    const largeFile = fileData.length > fileChunk;
    let startIndex = 0;
    try {
        const keys = [];
        keys.push(privateKey);
        const fileCreateTransaction = new FileCreateTransaction();
        if (largeFile) {
            // if we have a large file (> 4000 bytes), create the file with keys
            // then run file append
            // then remove keys
            fileCreateTransaction.setContents(fileData.slice(0, fileChunk));
            fileCreateTransaction.setKeys(keys);
        } else {
            fileCreateTransaction.setContents(fileData);
        }

        let response = await fileCreateTransaction
            .setMaxTransactionFee(Hbar.from(10))
            .execute(client);
        let transactionReceipt = await response.getReceipt(client);

        // if (transactionReceipt.status !== Status.Success) {
        //     notifyError(transactionReceipt.status.toString());
        //     return "";
        // }

        fileId = transactionReceipt.fileId.toString();

        const transaction = {
            id: response.transactionId.toString(),
            type: "fileCreate",
            inputs: fileData.substr(0, 20),
            outputs: "fileId=" + fileId
        };

        startIndex = startIndex + fileChunk;
        let chunks = 1;
        while (startIndex <= fileData.length) {
            chunks += 1;
            // sleep 500ms to avoid duplicate tx errors
            await new Promise(r => setTimeout(r, 500));
            // append to file
            response = await new FileAppendTransaction()
                .setContents(fileData.slice(startIndex, startIndex + fileChunk))
                .setFileId(FileId.fromString(fileId))
                .setMaxTransactionFee(Hbar.from(10))
                .execute(client);
            let transactionReceipt = await response.getReceipt(client);

            // if (transactionReceipt.status !== Status.Success) {
            //     notifyError(transactionReceipt.status.toString());
            //     return "";
            // }
            startIndex = startIndex + fileChunk;
        }


        if (largeFile) {
            // remove keys
            response = await new FileUpdateTransaction()
                .setKeys([])
                .setFileId(FileId.fromString(fileId))
                .execute(client);
            transactionReceipt = await response.getReceipt(client);

            // if (transactionReceipt.status !== Status.Success) {
            //     notifyError(transactionReceipt.status.toString());
            //     return "";
            // }

            // notifySuccess("Token properties file created");
        }
    } catch (err) {
        // notifyError(err.message);
        console.error(err);

        return "";
    }
    return fileId;
}

//create fungible token
router.route('/create-token').post(async (req, res) => {
    const privateKey = await PrivateKey.generate();

    const treasury_account_id = process.env.TREASURY_ACCOUNT_ID;
    const treasury_private_key = process.env.TREASURY_PRIVATE_KEY;

    const token = {
        name: "Scoin",
        symbol: "S",
        decimals: 0,
        initialSupply: 20,
        adminKey: privateKey.toString(),
        kycKey: privateKey.toString(),
        freezeKey: privateKey.toString(),
        wipeKey: privateKey.toString(),
        supplyKey: privateKey.toString(),
        autoRenewAccount: treasury_account_id,
        treasury: treasury_account_id,
        deleted: false,
        key: privateKey.toString()
    };
    console.log("token private key" + privateKey.toString());
    const newToken = await tokenCreate(token);
    console.log("newToken=" + newToken);
    res.json(newToken);
});

async function tokenCreate(token) {
    let tokenResponse = {};
    
    console.log("in token create method");
    console.log("token" + token);
    const autoRenewPeriod = 7776000; // set to default 3 months
    //alert("in tokenCreate");
    try {
        let additionalSig = false;
        let sigKey;
        const tx = await new TokenCreateTransaction();
        tx.setTokenName(token.name);
        tx.setTokenSymbol(token.symbol.toUpperCase());
        tx.setDecimals(token.decimals);
        tx.setInitialSupply(token.initialSupply);
        tx.setTreasuryAccountId(token.treasury);
        tx.setAutoRenewAccountId(token.autoRenewAccount);
        tx.setMaxTransactionFee(new Hbar(100));
        tx.setAutoRenewPeriod(autoRenewPeriod);
        console.log('token.memo',token.memo)
      //  tx.transactionMemo(token.memo);
        
        if (token.adminKey) {
            console.log("token.adminKey=" + token.adminKey);
            sigKey = PrivateKey.fromString(token.key);
            tx.setAdminKey(sigKey.publicKey);
            additionalSig = true;
        }
        // alert("token.kycKey = " + token.kycKey);
        if (token.kycKey) {
            console.log("token.kycKey=" + token.kycKey);
            sigKey = PrivateKey.fromString(token.key);
            tx.setKycKey(sigKey.publicKey);
            additionalSig = true;
        }
        // alert("token.freezeKey = " + token.freezeKey);
        if (token.freezeKey) {
            console.log("token.freezeKey=" + token.freezeKey);
            sigKey = PrivateKey.fromString(token.key);
            tx.setFreezeKey(sigKey.publicKey);
            additionalSig = true;
            tx.setFreezeDefault(token.defaultFreezeStatus);
        } else {
            tx.setFreezeDefault(false);
        }
        // alert("token.wipeKey = " + token.wipeKey);
        if (token.wipeKey) {
            console.log("token.wipeKey=" + token.wipeKey);
            additionalSig = true;
            sigKey = PrivateKey.fromString(token.key);
            tx.setWipeKey(sigKey.publicKey);
        }
        // alert("token.supplyKey = " + token.supplyKey);
        if (token.supplyKey) {
            console.log("token.supplyKey=" + token.supplyKey);
            additionalSig = true;
            sigKey = PrivateKey.fromString(token.key);
            tx.setSupplyKey(sigKey.publicKey);
        }

        const client = hederaClientLocal(process.env.TREASURY_ACCOUNT_ID, process.env.TREASURY_PRIVATE_KEY);
        console.log("client=" + client);
        await tx.signWithOperator(client);

        if (additionalSig) {
            // TODO: should sign with every key (check docs)
            // since the admin/kyc/... keys are all the same, a single sig is sufficient
            await tx.sign(sigKey);
            console.log("sigKey=" + sigKey);
        }
        // alert("additionalSig = " + additionalSig);
        const response = await tx.execute(client);
        console.log("response=", response);
        const transactionId = response.transactionId;
        console.log("transactionId",transactionId)
        const transactionReceipt = await response.getReceipt(client);
        //console.log("transactionReceipt="+transactionReceipt);
        console.log(transactionReceipt.status.toString());
        console.log("token.tokenId=" + token.tokenId);
        console.log("response.transactionId.toString()=" + response.transactionId.toString());
        console.log("token_private_key=" + token.key);
        console.log("token_public_key=" + sigKey.publicKey);
        //  console.log("token.tokenId.toString()="+token.tokenId.toString());
        // alert("transactionReceipt= " + transactionReceipt);
        console.log("before if");
        {
            console.log("in else");
            token.tokenId = transactionReceipt.tokenId;
            console.log(transactionReceipt.status.toString());
            console.log("token.tokenId=" + token.tokenId);
            console.log("response.transactionId.toString()=" + response.transactionId.toString());
            sigKey = PrivateKey.fromString(token.key);
            console.log("token_private_key=" + token.key);
            console.log("token_public_key=" + sigKey.publicKey);
            const transaction = {
                id: response.transactionId.toString(),
                type: "tokenCreate",
                inputs:
                    "Name=" +
                    token.name +
                    ", Symbol=" +
                    token.symbol.toUpperCase() +
                    ", Decimals=" +
                    token.decimals +
                    ", Supply=" +
                    token.initialSupply +
                    ", ...",
                outputs: "tokenId=" + token.tokenId.toString()
            };

            console.log("before token info")
            const tokenInfo = await tokenGetInfo(token);
            if (token.kycKey) {
                const instruction = {
                    tokenId: token.tokenId,
                    accountId: marketAccountId
                };
                tokenGrantKYC(instruction);
            }
            if (token.freezeKey && token.defaultFreezeStatus) {
                const instruction = {
                    tokenId: token.tokenId,
                    accountId: marketAccountId
                };
                tokenUnFreeze(instruction);
            }

        }
        return tokenResponse;
    } catch (err) {
        return err;
    }
}
router.route('/create-account').post(async (req, res) => {
    try {
        const privateKey = await PrivateKey.generate();

        console.log(`private key = ${privateKey}`);
        console.log(`public key = ${privateKey.publicKey}`);

        const response = await new AccountCreateTransaction()
            .setKey(privateKey.publicKey)
            .setMaxTransactionFee(new Hbar(100))
            .setInitialBalance(new Hbar(100))
            .execute(HederaClient);

        const transactionReceipt = await response.getReceipt(HederaClient);
        const newAccountId = transactionReceipt.accountId;

        const accountDetails = {
            id: newAccountId.toString(),
            privateKey: privateKey.toString(),
            publicKey: privateKey.publicKey.toString()
        }

        res.json(accountDetails);

    } catch (error) {
        console.log(error);
        res.status(false);
    }
});

function hederaClientLocal(operatorAccount, operatorPrivateKey) {
    if (!checkProvided(process.env.HEDERA_NETWORK)) {
        throw new Error("HEDERA_NETWORK must be set in environment");
    }

    let client;
    switch (process.env.HEDERA_NETWORK.toUpperCase()) {
        case "TESTNET":
            client = Client.forTestnet();
            break;
        case "MAINNET":
            client = Client.forMainnet();
            break;
        default:
            throw new Error('VUE_APP_NETWORK must be "testnet" or "mainnet"');
    }
    client.setOperator(operatorAccount, operatorPrivateKey);
    return client;
}

function checkProvided(environmentVariable) {
    if (environmentVariable === null) {
        return false;
    }
    if (typeof environmentVariable === "undefined") {
        return false;
    }
    return true;
}

router.route('/associate').post(async (req, res) => {
    try {
        //console.log(req);
        const transaction = await new TokenAssociateTransaction();
        transaction.setTokenIds([process.env.TOKEN_ID]);
        transaction.setAccountId(req.body.id);
        transaction.setMaxTransactionFee(new Hbar(5));
        
        const client = hederaClientLocal(process.env.TREASURY_ACCOUNT_ID, process.env.TREASURY_PRIVATE_KEY);

        await transaction.signWithOperator(client);
        await transaction.sign(PrivateKey.fromString(req.body.privateKey));
  
        const response = await transaction.execute(client);
  
        const transactionReceipt = await response.getReceipt(client);

        const tx = await new TransferTransaction();
        tx.addTokenTransfer(process.env.TOKEN_ID, process.env.TREASURY_ACCOUNT_ID, -20);
        tx.addTokenTransfer(process.env.TOKEN_ID, req.body.id, 20);

        tx.setMaxTransactionFee(new Hbar(5));
        tx.freezeWith(client);
  
        const signTx = await tx.sign(PrivateKey.fromString(process.env.TREASURY_PRIVATE_KEY));

        const txResponse = await signTx.execute(client);

        const receipt = await txResponse.getReceipt(client);
        
        res.json({status: "successfully associated"});
        
      } catch (error) {
        console.log(error);
        res.json({"error": error});
      }
});



router.route('/account-info').post(async (req, res) => {
    try {
        // cycle token relationships
        let tokenRelationships = {};
        console.log('req.body.id',req.body.id);
        const info = await new AccountInfoQuery()
          .setAccountId(req.body.id)
          .execute(HederaClient);

        console.log("info="+info);
        const hBarBalance = info.balance;
        console.log("hBarBalance="+hBarBalance);
        for (let key of info.tokenRelationships.keys()) {
          const tokenRelationship = {
            tokenId: key.toString(),
            hbarBalance: hBarBalance.toString(),
            balance: info.tokenRelationships.get(key).balance.toString(),
            freezeStatus: info.tokenRelationships.get(key).isFrozen,
            kycStatus: info.tokenRelationships.get(key).isKycGranted
          };
          console.log("tokenId="+key.toString());
          console.log("hbarBalance="+hBarBalance.toString());
          console.log("balance="+info.tokenRelationships.get(key).balance.toString());
          tokenRelationships[key] = tokenRelationship;
          res.json(tokenRelationship);
        }
      } catch (err) {
      console.log(err);
      res.status(400).json('Error: ' + err);
      }
});

router.route('/topup150').post(async (req, res) => {
    try {
        console.log(req);
        let hBars = 150;
        const tx = await new TransferTransaction();
        // tx.addTokenTransfer(process.env.TOKEN_ID, req.body.sid, -req.body.amount);
        // tx.addTokenTransfer(process.env.TOKEN_ID, req.body.rid, req.body.amount);
        tx.addHbarTransfer(req.body.id, new Hbar(hBars));
        tx.addHbarTransfer(process.env.MY_ACCOUNT_ID, new Hbar(-hBars));
  
        tx.setMaxTransactionFee(new Hbar(500));
        tx.freezeWith(HederaClient);
  
        const signTx = await tx.sign(PrivateKey.fromString(req.body.PK));

        const txResponse = await signTx.execute(HederaClient);

        const receipt = await txResponse.getReceipt(HederaClient);

        const transactionStatus = receipt.status;
  
        console.log("The transaction consensus status " +transactionStatus.toString());
        res.json({"status": "Transfer Successfull"});
  
      } catch (error) {
        console.log(error);
        res.json({"error": error});
      }
});

module.exports = router;