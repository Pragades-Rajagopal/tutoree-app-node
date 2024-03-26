const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '../app.env')
});
const express = require('express');
const router = require('./routes/common');

const app = express();
const HOSTNAME = process.env.HOSTNAME || 'localhost';
const PORT = process.env.PORT || 8080;
app.use(express.json());
app.use('/api', router)

app.listen(PORT, () => { console.log(`App is running > http://${HOSTNAME}:${PORT}`) });