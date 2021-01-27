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
      return {};
    }
  }