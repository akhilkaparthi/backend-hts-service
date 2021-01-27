const express = require('express');
const cors = require('cors');
// const mongoose = require('mongoose');

// require('dotenv').config();

const app = express();
const port = process.env.PORT || 5080;

//app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
  });


// const userRouter = require('./routes/quiz.js');
const hederaRouter = require('./routes/fees.js')
const hederaRouterApi = require('./routes/feesApi.js')
const htsApi = require('./routes/hts-api');

app.use('/hedera',hederaRouter);
app.use('/hederaApi',hederaRouterApi);
app.use('/hts-api',htsApi);

app.listen(port, () => {
    console.log(`server is listning on port ${port}`);
});
