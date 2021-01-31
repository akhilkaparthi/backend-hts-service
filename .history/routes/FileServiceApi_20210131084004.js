const { Client, PrivateKey, AccountCreateTransaction, AccountBalanceQuery, TokenCreateTransaction, Hbar, AccountInfoQuery, TokenMintTransaction, TokenAssociateTransaction, TransferTransaction } = require("@hashgraph/sdk");
const {
    FileContentsQuery,
    FileCreateTransaction,
    FileUpdateTransaction,
    FileAppendTransaction,
    FileDeleteTransaction,
    TokenInfoQuery,
    FileInfoQuery,
    FileId,
    Status
  } = require("@hashgraph/sdk");
const router = require('express').Router();
const HederaClient = require('./hedera-client');
const multer = require('multer');
const upload = multer()
var fs = require('fs');
var buffer = require('buffer');
var path = require('path');
const getStream = require('get-stream')
const tokenCreateModule = require('./TokenService')


router.post('/update', upload.single('document'), async function (req, res){

      const fileId = "0.0.287697"
      //const result1 = await getFileInfo(fileId)
      //const result = await deleteFile(fileId)

      if(req.file) {
        try{
          const base64 = await encodeFileToBase64(req.file)
          const resultfileId = await fileUpdate(JSON.stringify(base64), fileId);
          res.json(resultfileId);
        }catch(err){
          console.log('error in upload',err)
        }
      }
      
      res.json("result1")

})

router.post('/upload', upload.single('document'), async function (req, res) {
    if(req.file) {
      try{
        const base64 = await encodeFileToBase64(req.file)
        const fileId = await fileCreate(JSON.stringify(base64));
        res.json(fileId);
      }catch(err){
        console.log('error in upload',err)
      }
    }
    else throw 'error';
});

router.get('/getFile', async function (req, res)  {


    const fileId = req.query.fileId

    const info = await fileGetContents(fileId)
    var base64 =  info.toString();
    var formattedBase64 = base64.substring(1, base64.length-1);
    const isCreated = await decode_base64(formattedBase64, 'result.png')
    res.json( "file created")

})

// function to encode file data to base64 encoded string
async function encodeFileToBase64(file) {
  //console.log(file);
  const base64 = file.buffer.toString('base64')
  const formattedBase64 =  "data:" + file.mimetype + ";base64," + base64
  return base64
}

async function decode_base64(base64str , filename){

  var buf = Buffer.from(base64str,'base64');
  //console.log(buf)
  fs.writeFile(path.join(__dirname,'/image/',filename), buf, async function(error){
    if(error){
      throw error;
    }else{
      console.log('File created from base64 string!');
      return "File created from base64 string!";
    }
  });

}

async function getFileInfo(fileId){
  //Create the query
    const query = new FileInfoQuery()
    .setFileId(FileId.fromString(fileId));

    //Sign the query with the client operator private key and submit to a Hedera network
    const getInfo = await query.execute(HederaClient);

    console.log("File info response: " +getInfo);

    return getInfo

    
}

async function fileGetContents(fileId) {
  const client = HederaClient;
  let info = {};
  try {
    info = await new FileContentsQuery()
      .setFileId(FileId.fromString(fileId))
      .execute(client);
  } catch (err) {
    console.log(err.message);
  }
  return info;
}


async function fileCreate(fileData) {
  const privateKey = PrivateKey.fromString(process.env.TREASURY_PRIVATE_KEY);
  const client = hederaClientLocal(process.env.TREASURY_ACCOUNT_ID, process.env.TREASURY_PRIVATE_KEY);
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

    if (transactionReceipt.status !== Status.Success) {
      console.log(transactionReceipt.status.toString());
      return "";
    }

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
      console.log("Saving token properties file chunk " + chunks);
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

      if (transactionReceipt.status !== Status.Success) {
        console.log(transactionReceipt.status.toString());
        return "";
      }
      startIndex = startIndex + fileChunk;
    }

   // EventBus.$emit("addTransaction", transaction);

    if (largeFile) {
      // remove keys
      console.log('its here 159')
      response = await new FileUpdateTransaction()
        
        .setFileId(FileId.fromString(fileId))
        .execute(client);
      transactionReceipt = await response.getReceipt(client);

      if (transactionReceipt.status !== Status.Success) {
        console.log(transactionReceipt.status.toString());
        return "";
      }

     // notifySuccess("Token properties file created");
    }
  } catch (err) {
    //notifyError(err.message);
    console.error(err);

    return "";
  }
  return fileId;
}


async function fileUpdate(fileData,fileId) {
  const privateKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);
  const client = HederaClient;
  //let fileId = "";
  const fileChunk = 4000;
  const largeFile = fileData.length > fileChunk;
  let startIndex = 0;
  try {
    const keys = [];
    keys.push(privateKey);
    const fileCreateTransaction = new FileUpdateTransaction()
    .setFileId(FileId.fromString(fileId))
    .setKeys(keys);
    if (largeFile) {
      // if we have a large file (> 4000 bytes), create the file with keys
      // then run file append
      // then remove keys
      fileCreateTransaction.setContents(fileData.slice(0, fileChunk));
      //fileCreateTransaction.setKeys(keys);
    } else {
      fileCreateTransaction.setContents(fileData);
    }

    console.log('234')
    let response = await fileCreateTransaction
      .setMaxTransactionFee(Hbar.from(10))
      .execute(client);
      console.log('238')
    let transactionReceipt = await response.getReceipt(client);

    if (transactionReceipt.status !== Status.Success) {
      console.log(transactionReceipt.status.toString());
      return "";
    }

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
      console.log("Saving token properties file chunk " + chunks);
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

      if (transactionReceipt.status !== Status.Success) {
        console.log(transactionReceipt.status.toString());
        return "";
      }
      startIndex = startIndex + fileChunk;
    }

   // EventBus.$emit("addTransaction", transaction);

    if (largeFile) {
      // remove keys
      console.log('its here 159')
      response = await new FileUpdateTransaction()
        
        .setFileId(FileId.fromString(fileId))
        .execute(client);
      transactionReceipt = await response.getReceipt(client);

      if (transactionReceipt.status !== Status.Success) {
        console.log(transactionReceipt.status.toString());
        return "";
      }

     // notifySuccess("Token properties file created");
    }
  } catch (err) {
    //notifyError(err.message);
    console.log('its here')
    console.error(err);

    return "";
  }
  return fileId;
}

async function deleteFile(fileId) {

  const client = HederaClient
  const privateKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);
      //Create the transaction
    
      try{
        const transaction = await new FileDeleteTransaction()
    .setFileId(FileId.fromString(fileId))
    .setMaxTransactionFee(new Hbar(10))
    .freezeWith(client);

    //Sign with the file private key
    const signTx = await transaction.sign(privateKey);

    //Sign with the client operator private key and submit to a Hedera network
    const submitTx = await transaction.execute(client);

    //Request the receipt
    const receipt = await submitTx.getReceipt(client);

    //Get the transaction consensus status
    const transactionStatus = receipt.status;

    console.log("The transaction consensus status " +transactionStatus.toString());
    return true

      }catch(err){
        console.log(err)
        return false
      }

    //v2.0.5

   



}



module.exports = router;