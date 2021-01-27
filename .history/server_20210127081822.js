const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5085;

//app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
  });


// const userRouter = require('./routes/quiz.js');
const hederaRouter = require('./routes/fees.js')
const htsApi = require('./routes/hts-api');
const testApi = require('./routes/test');

app.use('/hedera',hederaRouter);
app.use('/hts-api',htsApi);
app.use()

app.listen(port, () => {
    console.log(`server is listning on port ${port}`);
});
