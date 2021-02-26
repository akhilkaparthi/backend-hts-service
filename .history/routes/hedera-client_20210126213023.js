require('dotenv').config();
const { Client } = require('@hashgraph/sdk');

const myAccountId = process.env.MY_ACCOUNT_ID;
const myPrivateKey = process.env.MY_PRIVATE_KEY;

//If we weren't able to grab it, we should throw a new error
if (myAccountId == null ||
    myPrivateKey == null ) {
    throw new Error("Environment variables myAccountId and myPrivateKey must be present");
}

const HederaClient = Client.forTestnet();
HederaClient.setOperator(myAccountId, myPrivateKey);
module.exports = HederaClient;