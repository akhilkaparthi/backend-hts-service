const { Client, PrivateKey, AccountCreateTransaction, AccountBalanceQuery, TokenCreateTransaction,Hbar,AccountInfoQuery,TokenMintTransaction, TokenAssociateTransaction, TransferTransaction } = require("@hashgraph/sdk");
const router = require('express').Router();
const HederaClient = require('./hedera-client');

async function tokenCreate(token) {
    let tokenResponse = {};
    console.log("in token create method");
    console.log("token"+token);
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
     // alert("tx = " + tx);
     // alert("token.name = " + token.name);
     // alert("token.treasury = " + token.treasury);
     // alert("token.adminKey = " + token.adminKey);
      if (token.adminKey) {
        console.log("token.adminKey="+token.adminKey);
        sigKey = PrivateKey.fromString(token.key);
        tx.setAdminKey(sigKey.publicKey);
        additionalSig = true;
      }
     // alert("token.kycKey = " + token.kycKey);
      if (token.kycKey) {
        console.log("token.kycKey="+token.kycKey);
        sigKey = PrivateKey.fromString(token.key);
        tx.setKycKey(sigKey.publicKey);
        additionalSig = true;
      }
     // alert("token.freezeKey = " + token.freezeKey);
      if (token.freezeKey) {
        console.log("token.freezeKey="+token.freezeKey);
        sigKey = PrivateKey.fromString(token.key);
        tx.setFreezeKey(sigKey.publicKey);
        additionalSig = true;
        tx.setFreezeDefault(token.defaultFreezeStatus);
      } else {
        tx.setFreezeDefault(false);
      }
     // alert("token.wipeKey = " + token.wipeKey);
      if (token.wipeKey) {
        console.log("token.wipeKey="+token.wipeKey);
        additionalSig = true;
        sigKey = PrivateKey.fromString(token.key);
        tx.setWipeKey(sigKey.publicKey);
      }
     // alert("token.supplyKey = " + token.supplyKey);
      if (token.supplyKey) {
        console.log("token.supplyKey="+token.supplyKey);
        additionalSig = true;
        sigKey = PrivateKey.fromString(token.key);
        tx.setSupplyKey(sigKey.publicKey);
      }

     console.log("client="+HederaClient);
      await tx.signWithOperator(HederaClient);
  
      if (additionalSig) {
        // TODO: should sign with every key (check docs)
        // since the admin/kyc/... keys are all the same, a single sig is sufficient
        await tx.sign(sigKey);
        console.log("sigKey="+sigKey);
      }
     // alert("additionalSig = " + additionalSig);
      const response = await tx.execute(HederaClient);
      console.log("response="+response);
     // alert("response = " + response);
      const transactionReceipt = await response.getReceipt(HederaClient);
      //console.log("transactionReceipt="+transactionReceipt);
      console.log(transactionReceipt.status.toString());
      console.log("token.tokenId="+token.tokenId);
      console.log("response.transactionId.toString()="+response.transactionId.toString());
      console.log("token_private_key="+token.key);
      console.log("token_public_key="+sigKey.publicKey);
    //  console.log("token.tokenId.toString()="+token.tokenId.toString());
     // alert("transactionReceipt= " + transactionReceipt);
     console.log("before if");
    {
        console.log("in else");
        token.tokenId = transactionReceipt.tokenId;
        console.log(transactionReceipt.status.toString());
        console.log("token.tokenId="+token.tokenId);
        console.log("response.transactionId.toString()="+response.transactionId.toString());
        sigKey = PrivateKey.fromString(token.key);
        console.log("token_private_key="+token.key);
        console.log("token_public_key="+sigKey.publicKey);
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
        // const tokenInfo = await tokenGetInfo(token);
        // if (token.kycKey) {
        //   const instruction = {
        //     tokenId: token.tokenId,
        //     accountId: marketAccountId
        //   };
        //   tokenGrantKYC(instruction);
        // }
        // if (token.freezeKey && token.defaultFreefzeStatus) {
        //   const instruction = {
        //     tokenId: token.tokenId,
        //     accountId: marketAccountId
        //   };
        //   tokenUnFreeze(instruction);
        // }
      
      }
      return tokenResponse;
    } catch (err) {
      return {};
    }
  }

  async function tokenMint(instruction) {
    // const token = state.getters.getTokens[instruction.tokenId];
    console.log("instruction="+instruction);
     const supplyKey = PrivateKey.fromString(process.env.TOKEN_PRIVATE_KEY);
     const tx = await new TokenMintTransaction();
     const client = HederaClient;
     const result = await tokenTransactionWithAmount(
       client,
       tx,
       instruction,
       supplyKey
     );
     if (result.status) {
       const transaction = {
         id: result.transactionId,
         type: "tokenMint",
         inputs:
           "tokenId=" + instruction.tokenId + ", Amount=" + instruction.amount
       };
     }
     console.log("instruction.tokenId="+instruction.tokenId);
     console.log("instruction.amount="+instruction.amount);
     return result.status;
   }
   async function tokenTransactionWithAmount(
     client,
     transaction,
     instruction,
     key
   ) {
     console.log('inside');
     try {
       transaction.setTokenId(instruction.tokenId);
       if (typeof instruction.accountId !== "undefined") {
         console.log('setting');
         transaction.setAccountId(instruction.accountId);
       }
       transaction.setAmount(instruction.amount);
       transaction.setMaxTransactionFee(new Hbar(5));
   
       await transaction.signWithOperator(client);
       await transaction.sign(key);
   
       const response = await transaction.execute(client);
   
       const transactionReceipt = await response.getReceipt(client);
       return {
         status: true,
         transactionId: response.transactionId.toString()
       };
     } catch (err) {
     console.log(err);
       return {
         status: false
       };
     }
   }

  async function tokenGetInfo(token) {
    const tokenResponse = token;
    try {
      const info = await new TokenInfoQuery()
        .setTokenId(token.tokenId)
        .execute(HederaClient);
  
      tokenResponse.totalSupply = info.totalSupply;
      tokenResponse.expiry = info.expirationTime.toDate();
    } catch (err) {
        console.log(err);
    }
  
    return tokenResponse;
  }  

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

router.route('/create-token').post(async (req, res) => {
    const privateKey = await PrivateKey.generate();

    const treasury_account_id = process.env.TREASURY_ACCOUNT_ID;
    const treasury_private_key = process.env.TREASURY_PRIVATE_KEY;

    const token = {
      name: "Scoin",
      symbol: "S",
      decimals: 0,
      initialSupply: 20,
      adminKey:  privateKey.toString(),
      kycKey: privateKey.toString() ,
      freezeKey: privateKey.toString(),
      wipeKey: privateKey.toString(),
      supplyKey:  privateKey.toString(),
      autoRenewAccount: treasury_account_id,
      treasury: treasury_account_id,
      deleted: false,
      key: privateKey.toString()
    };
    console.log("token private key"+privateKey.toString());
    const newToken = await tokenCreate(token);
    console.log("newToken="+newToken);
    res.json(newToken);
});

router.route('/mint').post(async (req, res) => {
    const instruction = {
        tokenId: process.env.TOKEN_ID,
        amount: 100
      };
      const status = await tokenMint(instruction);
      console.log(status);
      res.json(status);
});

router.route('/associate').post(async (req, res) => {
    try {
        //console.log(req);
        const transaction = await new TokenAssociateTransaction();
        transaction.setTokenIds([process.env.TOKEN_ID]);
        transaction.setAccountId(req.body.id);
        transaction.setMaxTransactionFee(new Hbar(5));
  
        await transaction.signWithOperator(HederaClient);
        await transaction.sign(PrivateKey.fromString(req.body.privateKey));
  
        const response = await transaction.execute(HederaClient);
  
        const transactionReceipt = await response.getReceipt(HederaClient);

        const tx = await new TransferTransaction();
        tx.addTokenTransfer(process.env.TOKEN_ID, process.env.TREASURY_ACCOUNT_ID, -20);
        tx.addTokenTransfer(process.env.TOKEN_ID, req.body.id, 20);

        tx.setMaxTransactionFee(new Hbar(5));
        tx.freezeWith(HederaClient);
  
        const signTx = await tx.sign(PrivateKey.fromString(process.env.TREASURY_PRIVATE_KEY));

        const txResponse = await signTx.execute(HederaClient);

        const receipt = await txResponse.getReceipt(HederaClient);
        
        res.json({status: "successfully associated"});
        
      } catch (error) {
        //console.log(error);
        res.json({"error": error});
      }
});

router.route('/transfer').post(async (req, res) => {
    try {
        console.log(req);
        let hBars = 0;
        const tx = await new TransferTransaction();
        tx.addTokenTransfer(process.env.TOKEN_ID, req.body.sid, -req.body.amount);
        tx.addTokenTransfer(process.env.TOKEN_ID, req.body.rid, req.body.amount);
        if (hBars !== 0) {
          tx.addHbarTransfer(account.accountId, new Hbar(hBars));
          tx.addHbarTransfer(to, new Hbar(-hBars));
        }
  
        tx.setMaxTransactionFee(new Hbar(5));
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

router.route('/sell').post(async (req, res) => {
  try {
      console.log(req);
      let hBars = 0;
      
      const client = Client.forTestnet();
      client.setOperator(req.body.sid, req.body.PK);

      const tx = await new TransferTransaction();
      tx.addTokenTransfer(process.env.TOKEN_ID, req.body.sid, -req.body.amount);
      tx.addTokenTransfer(process.env.TOKEN_ID, process.env.TREASURY_ACCOUNT_ID, req.body.amount);
      hBars = req.body.sHbarFee;
      if (hBars !== 0) {
        tx.addHbarTransfer(req.body.sid, new Hbar(hBars));
        tx.addHbarTransfer(process.env.TREASURY_ACCOUNT_ID, new Hbar(-hBars));
      }

      tx.setMaxTransactionFee(new Hbar(5));
      tx.freezeWith(client);

      const signTx = await tx.sign(PrivateKey.fromString(process.env.TREASURY_PRIVATE_KEY));

      const txResponse = await signTx.execute(client);

      const receipt = await txResponse.getReceipt(client);

      const transactionStatus = receipt.status;

      console.log("The transaction consensus status " +transactionStatus.toString());
      res.json({"status": "Transfer Successfull"});

    } catch (error) {
      console.log(error);
      res.json({"error": error});
    }
});

router.route('/buy').post(async (req, res) => {
  try {
     // console.log(req);
      let hBars = 0;
      const tx = await new TransferTransaction();
      //======
      const client = Client.forTestnet();
      client.setOperator(process.env.TREASURY_ACCOUNT_ID, process.env.TREASURY_PRIVATE_KEY);
      //======
      tx.addTokenTransfer(process.env.TOKEN_ID, process.env.TREASURY_ACCOUNT_ID, -req.body.amount);
      tx.addTokenTransfer(process.env.TOKEN_ID, req.body.rid, req.body.amount);
      hBars = req.body.hbarFee;
      console.log('hBars',hBars);
      if (hBars !== 0) {
        tx.addHbarTransfer(process.env.TREASURY_ACCOUNT_ID, new Hbar(hBars));
        tx.addHbarTransfer(req.body.rid, new Hbar(-hBars));
      }

      tx.setMaxTransactionFee(new Hbar(5));
      tx.freezeWith(client);
      const signTx = await tx.sign(PrivateKey.fromString(req.body.PK));

      const txResponse = await signTx.execute(client);

      const receipt = await txResponse.getReceipt(client);

      const transactionStatus = receipt.status;

      console.log("The transaction consensus status " +transactionStatus.toString());
      res.json({"status": "Transfer Successfull"});

    } catch (error) {
      console.log(error);
      res.json({"error": error});
    }
});

router.route('/create-account').post(async (req, res) => {
  try {
    const privateKey = await PrivateKey.generate();
  
    console.log(`private key = ${privateKey}`);
    console.log(`public key = ${privateKey.publicKey}`);

    const response = await new AccountCreateTransaction()
      .setKey(privateKey.publicKey)
      .setMaxTransactionFee(new Hbar(1000))
      .setInitialBalance(new Hbar(50))
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

module.exports = router;